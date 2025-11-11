import User from '../models/User.js';

export const getRegister = (req, res) => {
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    res.render('auth/register', { 
        title: 'Register',
        error: null 
    });
};

export const postRegister = async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.render('auth/register', {
                title: 'Register',
                error: 'Passwords do not match'
            });
        }

        if (password.length < 6) {
            return res.render('auth/register', {
                title: 'Register',
                error: 'Password must be at least 6 characters long'
            });
        }

        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.render('auth/register', {
                title: 'Register',
                error: 'User with this email or username already exists'
            });
        }

        const user = new User({ username, email, password });
        await user.save();

        req.session.userId = user._id;
        req.session.username = user.username;

        res.redirect('/dashboard');
    } catch (error) {
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
};

export const getLogin = (req, res) => {
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    res.render('auth/login', { 
        title: 'Login',
        error: null 
    });
};

export const postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Invalid email or password'
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Invalid email or password'
            });
        }

        req.session.userId = user._id;
        req.session.username = user.username;

        res.redirect('/dashboard');
    } catch (error) {
        res.render('auth/login', {
            title: 'Login',
            error: 'An error occurred during login'
        });
    }
};

export const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/auth/login');
    });
};