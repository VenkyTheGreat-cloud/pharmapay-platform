const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const User = require('../models/User');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Access token required'
                }
            });
        }

        jwt.verify(token, process.env.JWT_SECRET || 'changeme-in-production', (err, decoded) => {
            if (err) {
                logger.warn('Invalid token attempt', { error: err.message });
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'INVALID_TOKEN',
                        message: 'Invalid or expired token'
                    }
                });
            }

            req.user = decoded;
            next();
        });
    } catch (error) {
        logger.error('Authentication error', { error: error.message });
        return res.status(500).json({
            success: false,
            error: {
                code: 'AUTH_ERROR',
                message: 'Authentication failed'
            }
        });
    }
};

// Check user role
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Authentication required'
                }
            });
        }

        if (!roles.includes(req.user.role)) {
            logger.warn('Unauthorized access attempt', {
                userId: req.user.userId,
                role: req.user.role,
                requiredRoles: roles
            });
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'You do not have permission to access this resource'
                }
            });
        }

        next();
    };
};

// Check if user owns the resource (store-based access)
const checkStoreAccess = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Authentication required'
                }
            });
        }

        // Admin has access to all stores
        if (req.user.role === 'admin') {
            return next();
        }

        // Store managers can only access their own store
        if (req.user.role === 'store_manager') {
            req.storeId = req.user.userId; // Store manager's user ID is their store ID
            return next();
        }

        return res.status(403).json({
            success: false,
            error: {
                code: 'FORBIDDEN',
                message: 'Insufficient permissions'
            }
        });
    } catch (error) {
        logger.error('Store access check error', { error: error.message });
        return res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Internal server error'
            }
        });
    }
};

// Check if delivery boy owns the order
const checkDeliveryBoyOrder = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'delivery_boy') {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Only delivery boys can access this resource'
                }
            });
        }

        // For delivery boy, userId should be delivery_boy_id
        req.deliveryBoyId = req.user.userId;
        next();
    } catch (error) {
        logger.error('Delivery boy check error', { error: error.message });
        return res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Internal server error'
            }
        });
    }
};

module.exports = {
    authenticateToken,
    authorizeRoles,
    checkStoreAccess,
    checkDeliveryBoyOrder,
};
