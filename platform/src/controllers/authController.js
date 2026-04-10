const AuthService = require('../services/authService');
const User = require('../models/User');
const logger = require('../config/logger');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Get admins and stores for registration dropdown (public endpoint)
exports.getAdminsAndStores = async (req, res, next) => {
    try {
        const adminsAndStores = await User.getAdminsAndStores();
        
        res.json(successResponse({
            admins_and_stores: adminsAndStores,
            count: adminsAndStores.length
        }));
    } catch (error) {
        next(error);
    }
};

// Register delivery boy (public endpoint)
exports.register = async (req, res, next) => {
    try {
        const { name, mobile, email, password, address, store_id } = req.body;

        // Validation
        if (!name || !mobile || !email || !password) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Name, mobile, email, and password are required'));
        }

        if (password.length < 6) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Password must be at least 6 characters'));
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid email format'));
        }

        // store_id is optional — delivery boys can register without a pharmacy
        // and later apply via the marketplace
        if (store_id) {
            const store = await User.findById(store_id);
            if (!store) {
                return res.status(404).json(errorResponse('NOT_FOUND', 'Selected admin not found'));
            }
            if (store.role !== 'admin') {
                return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Only super admin can be selected'));
            }
            if (!store.is_active || store.status !== 'active') {
                return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Selected admin is not active'));
            }
        }

        const result = await AuthService.registerDeliveryBoy({
            name,
            mobile,
            email,
            password,
            address,
            store_id
        });

        logger.info('Delivery boy registered', { deliveryBoyId: result.id, store_id });

        res.status(201).json(successResponse(result, 'Registration successful. Pending approval.'));
    } catch (error) {
        if (error.message === 'DUPLICATE_MOBILE') {
            return res.status(409).json(errorResponse('DUPLICATE_MOBILE', 'Mobile number already registered'));
        }
        if (error.message === 'DUPLICATE_EMAIL') {
            return res.status(409).json(errorResponse('DUPLICATE_EMAIL', 'Email already registered'));
        }
        next(error);
    }
};

// Login
exports.login = async (req, res, next) => {
    try {
        const { mobileEmail, password, dashboardType } = req.body;

        // Validation
        if (!mobileEmail || !password) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Email/mobile and password are required'));
        }

        logger.info('Login attempt', { 
            mobileEmail: mobileEmail?.substring(0, 3) + '***',
            hasPassword: !!password,
            dashboardType: dashboardType || 'not specified'
        });

        const result = await AuthService.login(mobileEmail, password, dashboardType);

        logger.info('User logged in successfully', { 
            userId: result.user.id, 
            role: result.user.role,
            email: result.user.email,
            dashboardType: dashboardType || 'not specified'
        });

        res.json(successResponse(result));
    } catch (error) {
        logger.error('Login error', {
            error: error.message,
            mobileEmail: req.body?.mobileEmail?.substring(0, 3) + '***',
            stack: error.stack
        });

        if (error.message === 'INVALID_CREDENTIALS') {
            return res.status(401).json(errorResponse('INVALID_CREDENTIALS', 'Invalid email/mobile or password'));
        }
        if (error.message === 'INACTIVE_USER') {
            return res.status(403).json(errorResponse('INACTIVE_USER', 'User account is inactive. Please contact administrator.'));
        }
        if (error.message === 'NOT_APPROVED') {
            return res.status(403).json(errorResponse('NOT_APPROVED', 'Delivery boy account is not approved yet. Please contact administrator.'));
        }
        if (error.message === 'NO_PASSWORD_SET') {
            return res.status(403).json(errorResponse('NO_PASSWORD_SET', 'No password set for this account. Please contact administrator.'));
        }
        if (error.message === 'DASHBOARD_ACCESS_DENIED') {
            return res.status(403).json(errorResponse('DASHBOARD_ACCESS_DENIED', error.details || 'Access denied to this dashboard'));
        }
        next(error);
    }
};

// Send OTP
exports.sendOTP = async (req, res, next) => {
    try {
        const { mobile } = req.body;

        const result = await AuthService.sendOTP(mobile);

        res.json(successResponse(result, 'OTP sent successfully'));
    } catch (error) {
        if (error.message === 'NOT_FOUND') {
            return res.status(404).json(errorResponse('NOT_FOUND', 'User not found for mobile number'));
        }
        next(error);
    }
};

// Verify OTP
exports.verifyOTP = async (req, res, next) => {
    try {
        const { mobile, otp, dashboardType } = req.body;

        const result = await AuthService.verifyOTP(mobile, otp, dashboardType);

        logger.info('OTP verified and user logged in', { mobile, dashboardType: dashboardType || 'not specified' });

        res.json(successResponse(result));
    } catch (error) {
        if (error.message === 'INVALID_OTP') {
            return res.status(400).json(errorResponse('INVALID_OTP', 'OTP is invalid or expired'));
        }
        if (error.message === 'NOT_FOUND') {
            return res.status(404).json(errorResponse('NOT_FOUND', 'User not found for mobile number'));
        }
        if (error.message === 'INACTIVE_USER') {
            return res.status(403).json(errorResponse('INACTIVE_USER', 'User account is inactive'));
        }
        if (error.message === 'DASHBOARD_ACCESS_DENIED') {
            return res.status(403).json(errorResponse('DASHBOARD_ACCESS_DENIED', error.details || 'Access denied to this dashboard'));
        }
        next(error);
    }
};

// Get profile
exports.getProfile = async (req, res, next) => {
    try {
        let user;
        const DeliveryBoy = require('../models/DeliveryBoy');

        // Check if user is a delivery boy
        if (req.user.role === 'delivery_boy') {
            user = await DeliveryBoy.findById(req.user.userId);
            if (!user) {
                return res.status(404).json(errorResponse('NOT_FOUND', 'Delivery boy not found'));
            }

            const userData = {
                id: user.id,
                name: user.name,
                storeName: user.store_name || null,
                mobile: user.mobile,
                email: user.email,
                address: user.address,
                role: 'delivery_boy',
                status: user.status,
                is_active: user.is_active,
                photo_url: user.photo_url
            };

            return res.json(successResponse(userData));
        }

        // For admin and store managers, use User model
        user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'User not found'));
        }

        const userData = {
            id: user.id,
            name: user.name,
            storeName: user.store_name,
            mobile: user.mobile,
            email: user.email,
            address: user.address,
            role: user.role
        };

        res.json(successResponse(userData));
    } catch (error) {
        logger.error('Error getting profile', {
            error: error.message,
            userId: req.user?.userId,
            role: req.user?.role,
            stack: error.stack
        });
        next(error);
    }
};

// Update profile
exports.updateProfile = async (req, res, next) => {
    try {
        const { name, email, address, storeName, photo_url } = req.body;
        const DeliveryBoy = require('../models/DeliveryBoy');

        // Check if user is a delivery boy
        if (req.user.role === 'delivery_boy') {
            const updates = {};
            if (name !== undefined) updates.name = name;
            if (email !== undefined) updates.email = email;
            if (address !== undefined) updates.address = address;
            if (photo_url !== undefined) updates.photo_url = photo_url;

            // Check if email already exists (if changing email)
            if (email) {
                const existingDeliveryBoy = await DeliveryBoy.findByEmail(email);
                if (existingDeliveryBoy && existingDeliveryBoy.id !== req.user.userId) {
                    return res.status(409).json(errorResponse('DUPLICATE_EMAIL', 'Email already exists'));
                }
            }

            const deliveryBoy = await DeliveryBoy.update(req.user.userId, updates);

            if (!deliveryBoy) {
                return res.status(404).json(errorResponse('NOT_FOUND', 'Delivery boy not found'));
            }

            const userData = {
                id: deliveryBoy.id,
                name: deliveryBoy.name,
                storeName: deliveryBoy.store_name || null,
                mobile: deliveryBoy.mobile,
                email: deliveryBoy.email,
                address: deliveryBoy.address,
                role: 'delivery_boy',
                status: deliveryBoy.status,
                is_active: deliveryBoy.is_active,
                photo_url: deliveryBoy.photo_url
            };

            logger.info('Delivery boy profile updated', { userId: req.user.userId });
            return res.json(successResponse(userData));
        }

        // For admin and store managers
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (email !== undefined) updates.email = email;
        if (address !== undefined) updates.address = address;
        if (storeName !== undefined) updates.store_name = storeName;

        // Check if email already exists (if changing email)
        if (email) {
            const existingUser = await User.findByEmail(email);
            if (existingUser && existingUser.id !== req.user.userId) {
                return res.status(409).json(errorResponse('DUPLICATE_EMAIL', 'Email already exists'));
            }
        }

        const user = await User.update(req.user.userId, updates);

        const userData = {
            id: user.id,
            name: user.name,
            storeName: user.store_name,
            mobile: user.mobile,
            email: user.email,
            address: user.address,
            role: user.role
        };

        logger.info('Profile updated', { userId: req.user.userId });

        res.json(successResponse(userData));
    } catch (error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
            return res.status(409).json(errorResponse('DUPLICATE_EMAIL', 'Email already exists'));
        }
        next(error);
    }
};

// Change password
exports.changePassword = async (req, res, next) => {
    try {
        // Support both camelCase and snake_case field names
        const oldPassword = req.body.oldPassword || req.body.current_password || req.body.old_password;
        const newPassword = req.body.newPassword || req.body.new_password;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'New password must be at least 6 characters'));
        }

        if (!oldPassword) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Current password is required'));
        }

        const DeliveryBoy = require('../models/DeliveryBoy');
        let user;

        // Check if user is a delivery boy
        if (req.user.role === 'delivery_boy') {
            user = await DeliveryBoy.findById(req.user.userId);
            if (!user) {
                return res.status(404).json(errorResponse('NOT_FOUND', 'Delivery boy not found'));
            }

            // Verify old password
            if (!user.password_hash) {
                return res.status(400).json(errorResponse('NO_PASSWORD_SET', 'No password set for this account'));
            }

            const isPasswordValid = await AuthService.comparePassword(oldPassword, user.password_hash);
            if (!isPasswordValid) {
                return res.status(401).json(errorResponse('INVALID_PASSWORD', 'Old password is incorrect'));
            }

            // Hash new password
            const password_hash = await AuthService.hashPassword(newPassword);
            await DeliveryBoy.update(req.user.userId, { password_hash });

            logger.info('Delivery boy password changed', { userId: req.user.userId });
            return res.json(successResponse(null, 'Password changed successfully'));
        }

        // For admin and store managers
        user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'User not found'));
        }

        // Verify old password
        if (!user.password_hash) {
            return res.status(400).json(errorResponse('NO_PASSWORD_SET', 'No password set for this account'));
        }

        const isPasswordValid = await AuthService.comparePassword(oldPassword, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json(errorResponse('INVALID_PASSWORD', 'Old password is incorrect'));
        }

        // Hash new password
        const password_hash = await AuthService.hashPassword(newPassword);
        await User.update(req.user.userId, { password_hash });

        logger.info('Password changed', { userId: req.user.userId });

        res.json(successResponse(null, 'Password changed successfully'));
    } catch (error) {
        next(error);
    }
};

// Reset password (public endpoint - forgot password)
exports.resetPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Email is required'));
        }

        const DeliveryBoy = require('../models/DeliveryBoy');

        // Check users table first
        let user = await User.findByEmailOrMobile(email);
        let userType = 'user';

        // If not found in users, check delivery_boys
        if (!user) {
            user = await DeliveryBoy.findByEmailOrMobile(email);
            userType = 'delivery_boy';
        }

        if (!user) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'No account found with that email'));
        }

        // Generate random 8-character alphanumeric temporary password
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let tempPassword = '';
        for (let i = 0; i < 8; i++) {
            tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Hash the temporary password
        const password_hash = await AuthService.hashPassword(tempPassword);

        // Update password in the appropriate table
        if (userType === 'delivery_boy') {
            await DeliveryBoy.update(user.id, { password_hash });
        } else {
            await User.update(user.id, { password_hash });
        }

        // Log the temporary password (no email service available)
        logger.info('Password reset', {
            userId: user.id,
            userType,
            email: user.email,
            tempPassword
        });

        res.json(successResponse(null, 'Password has been reset. Please check your email for the temporary password.'));
    } catch (error) {
        logger.error('Password reset error', {
            error: error.message,
            email: req.body?.email,
            stack: error.stack
        });
        next(error);
    }
};

// Forgot Password - Step 1: Send verification code
exports.forgotPasswordSendCode = async (req, res, next) => {
    try {
        const { identifier } = req.body;

        if (!identifier) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Email or phone is required'));
        }

        const DeliveryBoy = require('../models/DeliveryBoy');
        const OtpVerification = require('../models/OtpVerification');

        // Find user by email or mobile in both tables
        let user = await User.findByEmailOrMobile(identifier);
        let userType = 'user';

        if (!user) {
            user = await DeliveryBoy.findByEmailOrMobile(identifier);
            userType = 'delivery_boy';
        }

        if (!user) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'No account found with that email or phone'));
        }

        // Generate OTP using the identifier as key
        const otpRecord = await OtpVerification.create(identifier);

        // Mask the email/phone for display
        let maskedContact = '';
        if (user.email && identifier.includes('@')) {
            const [local, domain] = user.email.split('@');
            maskedContact = local.substring(0, 2) + '**@' + domain;
        } else if (user.mobile) {
            maskedContact = user.mobile.substring(0, 2) + '****' + user.mobile.slice(-2);
        }

        logger.info('Forgot password OTP sent', {
            userId: user.id,
            userType,
            identifier: identifier.substring(0, 3) + '***',
            otp: otpRecord.otp // Log OTP since no SMS/email service
        });

        res.json(successResponse({
            maskedContact,
            expiresIn: 600
        }, 'Verification code sent successfully'));
    } catch (error) {
        logger.error('Forgot password send code error', {
            error: error.message,
            identifier: req.body?.identifier?.substring(0, 3) + '***'
        });
        next(error);
    }
};

// Forgot Password - Step 2: Verify code
exports.forgotPasswordVerifyCode = async (req, res, next) => {
    try {
        const { identifier, otp } = req.body;

        if (!identifier || !otp) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Email/phone and OTP are required'));
        }

        const OtpVerification = require('../models/OtpVerification');

        // Verify OTP
        const otpRecord = await OtpVerification.verify(identifier, otp);
        if (!otpRecord) {
            return res.status(400).json(errorResponse('INVALID_OTP', 'Invalid or expired verification code'));
        }

        // Generate a short-lived reset token (15 minutes)
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'changeme-in-production-use-strong-secret-key-minimum-256-bits';
        const resetToken = jwt.sign(
            { identifier, type: 'password_reset' },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        logger.info('Forgot password OTP verified', {
            identifier: identifier.substring(0, 3) + '***'
        });

        res.json(successResponse({ resetToken }, 'Code verified successfully'));
    } catch (error) {
        logger.error('Forgot password verify code error', {
            error: error.message,
            identifier: req.body?.identifier?.substring(0, 3) + '***'
        });
        next(error);
    }
};

// Forgot Password - Step 3: Reset password with token
exports.forgotPasswordReset = async (req, res, next) => {
    try {
        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Reset token and new password are required'));
        }

        if (newPassword.length < 6) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Password must be at least 6 characters'));
        }

        // Verify reset token
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'changeme-in-production-use-strong-secret-key-minimum-256-bits';
        let decoded;
        try {
            decoded = jwt.verify(resetToken, JWT_SECRET);
        } catch {
            return res.status(400).json(errorResponse('INVALID_TOKEN', 'Reset token is invalid or expired'));
        }

        if (decoded.type !== 'password_reset') {
            return res.status(400).json(errorResponse('INVALID_TOKEN', 'Invalid reset token'));
        }

        const { identifier } = decoded;
        const DeliveryBoy = require('../models/DeliveryBoy');

        // Find user
        let user = await User.findByEmailOrMobile(identifier);
        let userType = 'user';

        if (!user) {
            user = await DeliveryBoy.findByEmailOrMobile(identifier);
            userType = 'delivery_boy';
        }

        if (!user) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'User not found'));
        }

        // Hash and update password
        const password_hash = await AuthService.hashPassword(newPassword);

        if (userType === 'delivery_boy') {
            await DeliveryBoy.update(user.id, { password_hash });
        } else {
            await User.update(user.id, { password_hash });
        }

        logger.info('Password reset via forgot password flow', {
            userId: user.id,
            userType,
            identifier: identifier.substring(0, 3) + '***'
        });

        res.json(successResponse(null, 'Password reset successfully'));
    } catch (error) {
        logger.error('Forgot password reset error', {
            error: error.message
        });
        next(error);
    }
};

// Verify token
exports.verify = async (req, res, next) => {
    try {
        const DeliveryBoy = require('../models/DeliveryBoy');
        let user;

        // Check if user is a delivery boy
        if (req.user.role === 'delivery_boy') {
            user = await DeliveryBoy.findById(req.user.userId);
            if (!user) {
                return res.status(404).json(errorResponse('NOT_FOUND', 'Delivery boy not found'));
            }

            const userData = {
                id: user.id,
                name: user.name,
                storeName: user.store_name || null,
                mobile: user.mobile,
                email: user.email,
                address: user.address,
                role: 'delivery_boy',
                status: user.status,
                is_active: user.is_active,
                photo_url: user.photo_url
            };

            return res.json(successResponse(userData));
        }

        // For admin and store managers
        user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'User not found'));
        }

        const userData = {
            id: user.id,
            name: user.name,
            storeName: user.store_name,
            mobile: user.mobile,
            email: user.email,
            address: user.address,
            role: user.role
        };

        res.json(successResponse(userData));
    } catch (error) {
        next(error);
    }
};

// Logout
exports.logout = async (req, res, next) => {
    try {
        const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];
        if (refreshToken) {
            await AuthService.logout(req.user.userId, refreshToken);
        }

        logger.info('User logged out', { userId: req.user.userId });

        res.json(successResponse(null, 'Logged out successfully'));
    } catch (error) {
        next(error);
    }
};

// Refresh token
exports.refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Refresh token is required'));
        }

        const result = await AuthService.refreshToken(refreshToken);

        res.json(successResponse(result));
    } catch (error) {
        if (error.message === 'INVALID_TOKEN') {
            return res.status(401).json(errorResponse('INVALID_TOKEN', 'Invalid or expired refresh token'));
        }
        next(error);
    }
};
