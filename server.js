import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import authRoutes from './routes/authRoute.js';
import dashboardRoutes from './routes/dashboardRoute.js';

dotenv.config();

await connectDB();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dev logger
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log('--- incoming request ---');
        console.log('Method:', req.method, 'URL:', req.originalUrl);
        console.log('Content-Type:', req.get('Content-Type'));
        console.log('Body:', req.body);
        console.log('Cookies:', req.headers.cookie);
        console.log('------------------------');
        next();
    });
}

app.use(session({
    secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions'
    }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
    res.json({ ok: true, message: 'API running', authenticated: !!req.session.userId });
});

app.use((req, res) => res.status(404).json({ ok: false, error: 'Not found' }));
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ ok: false, error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
