const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Validation middleware
const registerValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('mobile').trim().notEmpty().withMessage('Mobile is required'),
    body('email').trim().notEmpty().withMessage('Email is required').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('store_id').notEmpty().withMessage('Store/Admin selection is required'),
];

const loginValidation = [
    body('mobileEmail').trim().notEmpty().withMessage('Email or mobile is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

const otpSendValidation = [
    body('mobile').trim().notEmpty().withMessage('Mobile is required'),
];

const otpVerifyValidation = [
    body('mobile').trim().notEmpty().withMessage('Mobile is required'),
    body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
];

const resetPasswordValidation = [
    body('email').trim().notEmpty().withMessage('Email is required').isEmail().normalizeEmail().withMessage('Valid email is required'),
];

const forgotPasswordSendValidation = [
    body('identifier').trim().notEmpty().withMessage('Email or phone is required'),
];

const forgotPasswordVerifyValidation = [
    body('identifier').trim().notEmpty().withMessage('Email or phone is required'),
    body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
];

const forgotPasswordResetValidation = [
    body('resetToken').trim().notEmpty().withMessage('Reset token is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

// Public routes
router.get('/admins-stores', authController.getAdminsAndStores);
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);
router.post('/forgot-password/send-code', forgotPasswordSendValidation, authController.forgotPasswordSendCode);
router.post('/forgot-password/verify-code', forgotPasswordVerifyValidation, authController.forgotPasswordVerifyCode);
router.post('/forgot-password/reset', forgotPasswordResetValidation, authController.forgotPasswordReset);
router.post('/otp/send', otpSendValidation, authController.sendOTP);
router.post('/otp/verify', otpVerifyValidation, authController.verifyOTP);
router.post('/refresh', authController.refreshToken);

// Protected routes
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);
router.post('/change-password', authenticateToken, authController.changePassword);
router.get('/verify', authenticateToken, authController.verify);
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;
