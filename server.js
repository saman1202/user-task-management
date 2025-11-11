import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

import connectDB from './config/database.js';
import { getRegister, postRegister, getLogin, postLogin, logout } from './controllers/authController.js';
import { getDashboard, createTask, updateTaskStatus, deleteTask } from './controllers/dashboardController.js';

connectDB();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions',
        ttl: 24 * 60 * 60
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    res.redirect('/auth/login');
});

// Auth Routes
app.get('/auth/register', getRegister);
app.post('/auth/register', postRegister);
app.get('/auth/login', getLogin);
app.post('/auth/login', postLogin);
app.post('/auth/logout', logout);

// Dashboard Routes
app.get('/dashboard', getDashboard);
app.post('/dashboard/tasks', createTask);
app.post('/dashboard/tasks/:id/status', updateTaskStatus);
app.post('/dashboard/tasks/:id/delete', deleteTask);

// Error Handlers
app.use((req, res) => {
    res.status(404).render('error', {
        title: '404 - Not Found',
        error: 'Page not found'
    });
});

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).render('error', {
        title: 'Server Error',
        error: 'Internal server error occurred'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});