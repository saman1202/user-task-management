import Task from '../models/Task.js';

export const getDashboard = async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.session.userId })
            .sort({ dueDate: 1 })
            .lean();

        res.render('dashboard/index', {
            title: 'Dashboard',
            username: req.session.username,
            tasks,
            currentUrl: req.originalUrl
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).render('error', { 
            title: 'Error',
            error: 'Failed to load dashboard' 
        });
    }
};

export const createTask = async (req, res) => {
    try {
        const { title, description, dueDate, priority, category, tags } = req.body;

        const task = new Task({
            title,
            description,
            dueDate,
            priority: priority || 'medium',
            category: category || '',
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            user: req.session.userId
        });

        await task.save();
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).render('error', {
            title: 'Error',
            error: 'Failed to create task'
        });
    }
};

export const updateTaskStatus = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status } = req.body;

        await Task.findOneAndUpdate(
            { _id: taskId, user: req.session.userId },
            { status }
        );

        res.redirect('/dashboard');
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).render('error', {
            title: 'Error',
            error: 'Failed to update task'
        });
    }
};

export const deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        await Task.findOneAndDelete({ _id: taskId, user: req.session.userId });
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).render('error', {
            title: 'Error',
            error: 'Failed to delete task'
        });
    }
};