import mongoose from 'mongoose';
import User from '../models/User.js';

export const getRegister = (req, res) => res.json({ ok: true, message: 'POST /auth/register with username,email,password,confirmPassword' });

export const postRegister = async (req, res) => {
    try {
        const body = req.body ?? {};
        const { username, email, password, confirmPassword } = body;

        if (!username || !email || !password || !confirmPassword) {
            return res.status(400).json({ ok: false, error: 'Missing required fields. Ensure Content-Type is set and body includes username,email,password,confirmPassword.', receivedBody: process.env.NODE_ENV !== 'production' ? body : undefined });
        }

        if (password !== confirmPassword) return res.status(400).json({ ok: false, error: 'Passwords do not match' });
        if (password.length < 6) return res.status(400).json({ ok: false, error: 'Password must be at least 6 characters long' });

        const existing = await User.findOne({ $or: [{ email }, { username }] });
        if (existing) return res.status(409).json({ ok: false, error: 'User with this email or username already exists' });

        const user = new User({ username, email, password });
        await user.save();

        req.session.userId = user._id;
        req.session.username = user.username;

        return res.status(201).json({ ok: true, user: { id: user._id, username: user.username, email: user.email } });
    } catch (error) {
        console.error('postRegister error:', error);
        if (error && error.code === 11000) return res.status(409).json({ ok: false, error: 'Duplicate key' });
        return res.status(500).json({ ok: false, error: 'An error occurred during registration', message: error.message });
    }
};

export const getLogin = (req, res) => res.json({ ok: true, message: 'POST /auth/login with email,password' });

export const postLogin = async (req, res) => {
    try {
        const body = req.body ?? {};
        const { email, password } = body;
        if (!email || !password) return res.status(400).json({ ok: false, error: 'Email and password required', receivedBody: process.env.NODE_ENV !== 'production' ? body : undefined });

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ ok: false, error: 'Invalid email or password' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ ok: false, error: 'Invalid email or password' });

        req.session.userId = user._id;
        req.session.username = user.username;

        return res.json({ ok: true, user: { id: user._id, username: user.username, email: user.email } });
    } catch (error) {
        console.error('postLogin error:', error);
        return res.status(500).json({ ok: false, error: 'An error occurred during login' });
    }
};

export const logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ ok: false, error: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        return res.json({ ok: true, message: 'Logged out' });
    });
};
