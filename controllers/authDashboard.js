import Task from '../models/Task.js';

export const getDashboard = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect('/auth/login');
        }

        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        const tasks = await Task.find({ user: req.session.userId })
            .sort({ dueDate: 1 })
            .lean();

        res.render('dashboard/index', {
            title: 'Dashboard',
            username: req.session.username || 'User',
            tasks: tasks,
            error: null
        });
    } catch (error) {
        res.render('dashboard/index', {
            title: 'Dashboard',
            username: req.session.username || 'User',
            tasks: [],
            error: 'Failed to load dashboard'
        });
    }
};

export const createTask = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect('/auth/login');
        }

        const { title, description, dueDate, priority, category, tags } = req.body;

        const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '') : [];

        const task = new Task({
            title,
            description,
            dueDate,
            priority: priority || 'medium',
            category: category || '',
            tags: tagsArray,
            user: req.session.userId
        });

        await task.save();
        res.redirect('/dashboard');
    } catch (error) {
        const tasks = await Task.find({ user: req.session.userId }).sort({ dueDate: 1 }).lean();
        
        res.render('dashboard/index', {
            title: 'Dashboard',
            username: req.session.username || 'User',
            tasks: tasks || [],
            error: 'Failed to create task. Please try again.'
        });
    }
};

export const updateTaskStatus = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect('/auth/login');
        }

        const taskId = req.params.id;
        const { status } = req.body;

        await Task.findOneAndUpdate(
            { _id: taskId, user: req.session.userId },
            { status },
            { new: true }
        );
        
        res.redirect('/dashboard');
    } catch (error) {
        res.redirect('/dashboard');
    }
};

export const deleteTask = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect('/auth/login');
        }

        const taskId = req.params.id;
        
        await Task.findOneAndDelete({ 
            _id: taskId, 
            user: req.session.userId 
        });
        
        res.redirect('/dashboard');
    } catch (error) {
        res.redirect('/dashboard');
    }
};