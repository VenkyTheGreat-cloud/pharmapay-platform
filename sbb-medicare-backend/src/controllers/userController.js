const bcrypt = require('bcryptjs');
const User = require('../models/User');
const logger = require('../config/logger');

// Get all users (admin only)
exports.getAllUsers = async (req, res, next) => {
    try {
        const { role, status } = req.query;
        const users = await User.findByRole(role || 'delivery_boy', status);

        res.json({ users, count: users.length });
    } catch (error) {
        next(error);
    }
};

// Get delivery boys
exports.getDeliveryBoys = async (req, res, next) => {
    try {
        const { status } = req.query;
        const deliveryBoys = await User.getDeliveryBoys(status);

        res.json({ delivery_boys: deliveryBoys, count: deliveryBoys.length });
    } catch (error) {
        next(error);
    }
};

// Get pending delivery boy requests (admin only)
exports.getPendingRequests = async (req, res, next) => {
    try {
        const pendingUsers = await User.getPendingDeliveryBoys();

        res.json({ pending_requests: pendingUsers, count: pendingUsers.length });
    } catch (error) {
        next(error);
    }
};

// Create user (admin/store staff)
exports.createUser = async (req, res, next) => {
    try {
        const { email, password, full_name, mobile_number, role, profile_image, address } = req.body;

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Create user (admin/store_staff are active by default)
        const user = await User.create({
            email,
            password_hash,
            full_name,
            mobile_number,
            role,
            profile_image,
            address
        });

        // Set status to active if created by admin
        if (role === 'admin' || role === 'store_staff') {
            await User.updateStatus(user.id, 'active');
        }

        logger.info('User created', { userId: user.id, role: user.role, createdBy: req.user.id });

        res.status(201).json({
            message: 'User created successfully',
            user
        });
    } catch (error) {
        next(error);
    }
};

// Get user by ID
exports.getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        next(error);
    }
};

// Update user
exports.updateUser = async (req, res, next) => {
    try {
        const { full_name, mobile_number, address, profile_image, status } = req.body;

        const user = await User.update(req.params.id, {
            full_name,
            mobile_number,
            address,
            profile_image,
            status
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        logger.info('User updated', { userId: req.params.id, updatedBy: req.user.id });

        res.json({
            message: 'User updated successfully',
            user
        });
    } catch (error) {
        next(error);
    }
};

// Delete user
exports.deleteUser = async (req, res, next) => {
    try {
        const deleted = await User.delete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ error: 'User not found' });
        }

        logger.info('User deleted', { userId: req.params.id, deletedBy: req.user.id });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// Approve/reject delivery boy (admin only)
exports.updateUserStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        if (!['active', 'inactive', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        const user = await User.updateStatus(req.params.id, status);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        logger.info('User status updated', {
            userId: req.params.id,
            status,
            updatedBy: req.user.id
        });

        res.json({
            message: `User ${status === 'active' ? 'approved' : status === 'rejected' ? 'rejected' : 'updated'} successfully`,
            user
        });
    } catch (error) {
        next(error);
    }
};
