const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

// Verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            logger.warn('Invalid token attempt', { error: err.message });
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Check user role
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            logger.warn('Unauthorized access attempt', {
                userId: req.user.id,
                role: req.user.role,
                requiredRoles: roles
            });
            return res.status(403).json({
                error: 'You do not have permission to access this resource'
            });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    authorizeRoles,
};
