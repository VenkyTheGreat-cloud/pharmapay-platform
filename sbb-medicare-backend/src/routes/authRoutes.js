const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Validation middleware
const registerValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('mobile').trim().notEmpty().withMessage('Mobile is required'),
    body('email').optional().isEmail().normalizeEmail(),
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

// Public routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
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
