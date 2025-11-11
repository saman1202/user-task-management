import User from '../models/User.js';

export const getRegister = (req, res) => {
    res.render('auth/register', { 
        title: 'Register',
        error: null 
    });
};

export const postRegister = async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;

        // Validation
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

        // Check if user exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.render('auth/register', {
                title: 'Register',
                error: 'User with this email or username already exists'
            });
        }

        // Create new user
        const user = new User({ username, email, password });
        await user.save();

        // Set session
        req.session.userId = user._id;
        req.session.username = user.username;

        res.redirect('/dashboard');
    } catch (error) {
        console.error('Registration error:', error);
        res.render('auth/register', {
            title: 'Register',
            error: 'An error occurred during registration'
        });
    }
};

export const getLogin = (req, res) => {
    res.render('auth/login', { 
        title: 'Login',
        error: null 
    });
};

export const postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Invalid email or password'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Invalid email or password'
            });
        }

        // Set session
        req.session.userId = user._id;
        req.session.username = user.username;

        res.redirect('/dashboard');
    } catch (error) {
        console.error('Login error:', error);
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