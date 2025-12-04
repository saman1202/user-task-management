export const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) return next();
    return res.status(401).json({ ok: false, error: 'Not authenticated' });
};

export const redirectIfAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return res.json({ ok: true, redirect: '/dashboard' });
    }
    next();
};
