import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

// Import models
import User from './models/User.js';
import Task from './models/Task.js';

// Import database connection
import connectDB from './config/database.js';

// Connect to MongoDB
connectDB();

const app = express();

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration with MongoDB store
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions',
        ttl: 24 * 60 * 60 // 1 day
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ==================== ROUTES ====================

// Home route
app.get('/', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    res.redirect('/auth/login');
});

// ==================== AUTH ROUTES ====================

// Login page
app.get('/auth/login', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    res.render('auth/login', { 
        title: 'Login', 
        error: null 
    });
});

// Register page
app.get('/auth/register', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    res.render('auth/register', { 
        title: 'Register', 
        error: null 
    });
});

// Register user
app.post('/auth/register', async (req, res) => {
    try {
        console.log('📝 Registration attempt:', req.body);
        
        const { username, email, password, confirmPassword } = req.body;

        // Validation
        if (password !== confirmPassword) {
            console.log('❌ Password mismatch');
            return res.render('auth/register', {
                title: 'Register',
                error: 'Passwords do not match'
            });
        }

        if (password.length < 6) {
            console.log('❌ Password too short');
            return res.render('auth/register', {
                title: 'Register',
                error: 'Password must be at least 6 characters long'
            });
        }

        // Check if user already exists
        console.log('🔍 Checking for existing user...');
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            console.log('❌ User already exists');
            return res.render('auth/register', {
                title: 'Register',
                error: 'User with this email or username already exists'
            });
        }

        // Create new user
        console.log('👤 Creating new user...');
        const user = new User({
            username,
            email,
            password
        });

        await user.save();
        console.log('✅ User saved to MongoDB:', user.username);

        // Set session
        req.session.userId = user._id;
        req.session.username = user.username;

        console.log('✅ Registration successful, redirecting to dashboard');
        res.redirect('/dashboard');
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        
        // Handle MongoDB duplicate key errors
        if (error.code === 11000) {
            return res.render('auth/register', {
                title: 'Register',
                error: 'User with this email or username already exists'
            });
        }
        
        res.render('auth/register', {
            title: 'Register',
            error: 'An error occurred during registration'
        });
    }
});

// Login user
app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('🔐 Login attempt for email:', email);

        // Find user in MongoDB
        const user = await User.findOne({ email });
        if (!user) {
            console.log('❌ User not found');
            return res.render('auth/login', {
                title: 'Login',
                error: 'Invalid email or password'
            });
        }

        // Check password using bcrypt
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            console.log('❌ Invalid password');
            return res.render('auth/login', {
                title: 'Login',
                error: 'Invalid email or password'
            });
        }

        // Set session
        req.session.userId = user._id;
        req.session.username = user.username;

        console.log('✅ User logged in:', user.username);
        res.redirect('/dashboard');
        
    } catch (error) {
        console.error('❌ Login error:', error);
        res.render('auth/login', {
            title: 'Login',
            error: 'An error occurred during login'
        });
    }
});

// Logout
app.post('/auth/logout', (req, res) => {
    console.log('🚪 User logging out');
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/auth/login');
    });
});

// ==================== DASHBOARD ROUTES ====================

// Dashboard route with debugging
app.get('/dashboard', async (req, res) => {
    try {
        console.log('🔄 Loading dashboard for user:', req.session.userId);
        
        if (!req.session.userId) {
            console.log('❌ No user session, redirecting to login');
            return res.redirect('/auth/login');
        }

        // Set no-cache headers
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        // Fetch tasks from database for this user
        console.log('🔍 Fetching tasks for user ID:', req.session.userId);
        
        // Convert session userId to ObjectId for proper comparison
        const userId = new mongoose.Types.ObjectId(req.session.userId);
        const tasks = await Task.find({ user: userId })
            .sort({ dueDate: 1 })
            .lean();

        console.log(`📋 Found ${tasks.length} tasks in database`);
        
        // Log each task for debugging
        tasks.forEach((task, index) => {
            console.log(`   Task ${index + 1}:`, {
                id: task._id,
                title: task.title,
                user: task.user,
                dueDate: task.dueDate
            });
        });

        res.render('dashboard/index', {
            title: 'Dashboard',
            username: req.session.username || 'User',
            tasks: tasks,
            error: null
        });
        
    } catch (error) {
        console.error('❌ Dashboard route error:', error);
        res.render('dashboard/index', {
            title: 'Dashboard',
            username: req.session.username || 'User',
            tasks: [],
            error: 'Failed to load dashboard'
        });
    }
});

// Create new task
app.post('/dashboard/tasks', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect('/auth/login');
        }

        const { title, description, dueDate, priority, category, tags } = req.body;
        
        console.log('📝 Creating new task for user:', req.session.userId);
        console.log('📦 Task data:', { title, description, dueDate, priority, category, tags });

        // Convert tags string to array
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

        console.log('💾 Saving task to database...');
        await task.save();
        console.log('✅ Task created successfully:', {
            id: task._id,
            title: task.title,
            user: task.user
        });
        
        res.redirect('/dashboard');
        
    } catch (error) {
        console.error('❌ Task creation error:', error);
        
        // Fetch tasks again to render the page properly
        const tasks = await Task.find({ user: req.session.userId }).sort({ dueDate: 1 }).lean();
        
        res.render('dashboard/index', {
            title: 'Dashboard',
            username: req.session.username || 'User',
            tasks: tasks || [],
            error: 'Failed to create task. Please try again.'
        });
    }
});

// ==================== TASK EDIT ROUTES ====================

// Show edit task form
app.get('/dashboard/tasks/:id/edit', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect('/auth/login');
        }

        const taskId = req.params.id;
        console.log('📝 Loading edit form for task:', taskId);

        const task = await Task.findOne({ 
            _id: taskId, 
            user: req.session.userId 
        });

        if (!task) {
            console.log('❌ Task not found for editing:', taskId);
            return res.redirect('/dashboard');
        }

        // Format dueDate for datetime-local input
        const dueDateLocal = task.dueDate.toISOString().slice(0, 16);
        
        res.render('dashboard/edit-task', {
            title: 'Edit Task',
            username: req.session.username || 'User',
            task: task,
            dueDateLocal: dueDateLocal,
            error: null
        });

    } catch (error) {
        console.error('❌ Edit task form error:', error);
        res.redirect('/dashboard');
    }
});

// Update task
app.post('/dashboard/tasks/:id/update', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect('/auth/login');
        }

        const taskId = req.params.id;
        const { title, description, dueDate, priority, category, tags, status } = req.body;
        
        console.log('🔄 Updating task:', taskId);
        console.log('📦 Update data:', { title, description, dueDate, priority, category, tags, status });

        // Convert tags string to array
        const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '') : [];

        const updatedTask = await Task.findOneAndUpdate(
            { _id: taskId, user: req.session.userId },
            {
                title,
                description,
                dueDate,
                priority: priority || 'medium',
                category: category || '',
                tags: tagsArray,
                status: status || 'pending'
            },
            { new: true, runValidators: true }
        );

        if (!updatedTask) {
            console.log('❌ Task not found for update:', taskId);
            return res.redirect('/dashboard');
        }

        console.log('✅ Task updated successfully:', updatedTask.title);
        res.redirect('/dashboard');
        
    } catch (error) {
        console.error('❌ Task update error:', error);
        
        // Reload edit form with error
        const task = await Task.findOne({ _id: req.params.id, user: req.session.userId });
        const dueDateLocal = task ? task.dueDate.toISOString().slice(0, 16) : '';
        
        res.render('dashboard/edit-task', {
            title: 'Edit Task',
            username: req.session.username || 'User',
            task: task,
            dueDateLocal: dueDateLocal,
            error: 'Failed to update task. Please try again.'
        });
    }
});

// Update task status (quick update)
app.post('/dashboard/tasks/:id/status', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect('/auth/login');
        }

        const taskId = req.params.id;
        const { status } = req.body;
        
        console.log('🔄 Quick updating task status:', { taskId, status });

        const updatedTask = await Task.findOneAndUpdate(
            { _id: taskId, user: req.session.userId },
            { status },
            { new: true }
        );

        if (!updatedTask) {
            console.log('❌ Task not found for status update:', taskId);
        } else {
            console.log('✅ Task status updated to:', status);
        }
        
        res.redirect('/dashboard');
        
    } catch (error) {
        console.error('❌ Task status update error:', error);
        res.redirect('/dashboard');
    }
});

// Delete task
app.post('/dashboard/tasks/:id/delete', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect('/auth/login');
        }

        const taskId = req.params.id;
        console.log('🗑️ Attempting to delete task:', taskId);
        
        const result = await Task.findOneAndDelete({ 
            _id: taskId, 
            user: req.session.userId 
        });
        
        if (result) {
            console.log('✅ Task deleted successfully:', taskId);
        } else {
            console.log('❌ Task not found or access denied:', taskId);
        }
        
        res.redirect('/dashboard');
        
    } catch (error) {
        console.error('❌ Task deletion error:', error);
        res.redirect('/dashboard');
    }
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
    res.status(404).render('error', {
        title: '404 - Not Found',
        error: 'Page not found'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('🔥 Server error:', err);
    res.status(500).render('error', {
        title: 'Server Error',
        error: 'Internal server error occurred'
    });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  Database: ${process.env.MONGODB_URI}`);
});