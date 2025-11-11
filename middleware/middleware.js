export const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/auth/login');
};

export const redirectIfAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return res.redirect('/dashboard');
    }
    next();
};