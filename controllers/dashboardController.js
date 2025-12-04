import mongoose from 'mongoose';
import Task from '../models/Task.js';

const ensureAuth = (req, res) => {
    if (!req.session || !req.session.userId) {
        res.status(401).json({ ok: false, error: 'Not authenticated' });
        return false;
    }
    return true;
};

export const getDashboard = async (req, res) => {
    if (!ensureAuth(req, res)) return;
    try {
        const tasks = await Task.find({ user: req.session.userId }).sort({ dueDate: 1 }).lean();
        return res.json({ ok: true, user: { id: req.session.userId, username: req.session.username }, tasks });
    } catch (error) {
        console.error('getDashboard error:', error);
        return res.status(500).json({ ok: false, error: 'Failed to load dashboard' });
    }
};

export const createTask = async (req, res) => {
    if (!ensureAuth(req, res)) return;
    try {
        const { title, description, dueDate, priority, category, tags } = req.body ?? {};
        if (!title || !description || !dueDate) return res.status(400).json({ ok: false, error: 'title, description and dueDate required' });

        const tagsArray = typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : (Array.isArray(tags) ? tags : []);
        const task = new Task({ title, description, dueDate, priority: priority || 'medium', category: category || '', tags: tagsArray, user: req.session.userId });
        await task.save();
        return res.status(201).json({ ok: true, task });
    } catch (error) {
        console.error('createTask error:', error);
        return res.status(500).json({ ok: false, error: 'Failed to create task' });
    }
};

export const updateTaskStatus = async (req, res) => {
    if (!ensureAuth(req, res)) return;
    try {
        const taskId = req.params.taskId;
        const { status } = req.body ?? {};
        if (!status) return res.status(400).json({ ok: false, error: 'status required' });

        const updated = await Task.findOneAndUpdate({ _id: taskId, user: req.session.userId }, { status }, { new: true }).lean();
        if (!updated) return res.status(404).json({ ok: false, error: 'Task not found' });
        return res.json({ ok: true, task: updated });
    } catch (error) {
        console.error('updateTaskStatus error:', error);
        return res.status(500).json({ ok: false, error: 'Failed to update task' });
    }
};

export const updateTask = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ ok: false, error: 'Not authenticated' });
        }

        const taskId = req.params.taskId;
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ ok: false, error: 'Invalid task id' });
        }

        const body = req.body || {};

        const allowed = ['title', 'description', 'dueDate', 'priority', 'category', 'tags', 'status'];
        const updates = {};

        allowed.forEach((field) => {
            if (Object.prototype.hasOwnProperty.call(body, field) && body[field] !== undefined) {
                updates[field] = body[field];
            }
        });

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ ok: false, error: 'No valid fields provided to update' });
        }

        if (updates.tags && typeof updates.tags === 'string') {
            updates.tags = updates.tags.split(',').map(t => t.trim()).filter(Boolean);
        }

        const updated = await Task.findOneAndUpdate(
            { _id: taskId, user: req.session.userId },
            updates,
            { new: true, runValidators: true }
        ).lean();

        if (!updated) return res.status(404).json({ ok: false, error: 'Task not found' });

        return res.json({ ok: true, task: updated });
    } catch (err) {
        console.error('updateTask error:', err);
        return res.status(500).json({ ok: false, error: 'Failed to update task' });
    }
};



export const deleteTask = async (req, res) => {
    if (!ensureAuth(req, res)) return;
    try {
        const taskId = req.params.taskId;
        const removed = await Task.findOneAndDelete({ _id: taskId, user: req.session.userId });
        if (!removed) return res.status(404).json({ ok: false, error: 'Task not found' });
        return res.json({ ok: true, message: 'Task deleted' });
    } catch (error) {
        console.error('deleteTask error:', error);
        return res.status(500).json({ ok: false, error: 'Failed to delete task' });
    }
};
