const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

// Register new user (mainly for delivery boys)
exports.register = async (req, res, next) => {
    try {
        const { email, password, full_name, mobile_number, role, profile_image, address } = req.body;

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Create user (status will be 'pending' by default for delivery boys)
        const user = await User.create({
            email,
            password_hash,
            full_name,
            mobile_number,
            role: role || 'delivery_boy',
            profile_image,
            address
        });

        logger.info('User registered', { userId: user.id, role: user.role });

        res.status(201).json({
            message: 'Registration successful. Your account is pending approval.',
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                status: user.status
            }
        });
    } catch (error) {
        next(error);
    }
};

// Login
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check if user is active
        if (user.status !== 'active') {
            return res.status(403).json({
                error: 'Your account is not active. Please contact administrator.',
                status: user.status
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        logger.info('User logged in', { userId: user.id, role: user.role });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                mobile_number: user.mobile_number,
                role: user.role,
                profile_image: user.profile_image
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get current user profile
exports.getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        next(error);
    }
};

// Update profile
exports.updateProfile = async (req, res, next) => {
    try {
        const { full_name, mobile_number, address, profile_image } = req.body;

        const user = await User.update(req.user.id, {
            full_name,
            mobile_number,
            address,
            profile_image
        });

        logger.info('Profile updated', { userId: req.user.id });

        res.json({
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        next(error);
    }
};

// Change password
exports.changePassword = async (req, res, next) => {
    try {
        const { current_password, new_password } = req.body;

        const user = await User.findByEmail(req.user.email);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(current_password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const password_hash = await bcrypt.hash(new_password, 10);

        await User.update(req.user.id, { password_hash });

        logger.info('Password changed', { userId: req.user.id });

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        next(error);
    }
};
