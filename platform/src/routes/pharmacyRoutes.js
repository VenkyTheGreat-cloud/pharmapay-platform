const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { body } = require('express-validator');
const pharmacyController = require('../controllers/pharmacyController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const upload = multer({
    dest: path.join(__dirname, '../../uploads'),
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Validation middleware
const signupValidation = [
    body('ownerName').trim().notEmpty().withMessage('Owner name is required'),
    body('email').trim().notEmpty().withMessage('Email is required').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('mobile').trim().notEmpty().withMessage('Mobile is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('pharmacyName').trim().notEmpty().withMessage('Pharmacy name is required'),
    body('slug').trim().notEmpty().withMessage('Slug is required'),
];

const loginValidation = [
    body('mobileEmail').trim().notEmpty().withMessage('Email or mobile is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

// Public routes
router.post('/signup', signupValidation, pharmacyController.signup);
router.post('/login', loginValidation, pharmacyController.login);
router.get('/check-slug/:slug', pharmacyController.checkSlug);

// Pharmacy owner routes
router.get('/mine', authenticateToken, authorizeRoles('admin'), pharmacyController.getMyPharmacy);
router.put('/mine/config', authenticateToken, authorizeRoles('admin'), pharmacyController.updateConfig);
router.put('/mine/branding', authenticateToken, authorizeRoles('admin'), pharmacyController.updateBranding);
router.post('/mine/branding/logo', authenticateToken, authorizeRoles('admin'), upload.single('logo'), pharmacyController.uploadLogo);
router.put('/mine/submit', authenticateToken, authorizeRoles('admin'), pharmacyController.submitForApproval);
router.get('/mine/build-status', authenticateToken, authorizeRoles('admin'), pharmacyController.getBuildStatus);

// Admin routes
router.get('/', authenticateToken, authorizeRoles('admin'), pharmacyController.listPharmacies);
router.get('/:id', authenticateToken, authorizeRoles('admin'), pharmacyController.getPharmacy);
router.put('/:id/approve', authenticateToken, authorizeRoles('admin'), pharmacyController.approvePharmacy);
router.put('/:id/reject', authenticateToken, authorizeRoles('admin'), pharmacyController.rejectPharmacy);

module.exports = router;
