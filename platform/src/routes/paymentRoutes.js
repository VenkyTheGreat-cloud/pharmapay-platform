const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes require authentication
router.use(authenticateToken);

// Validation middleware
const paymentValidation = [
    body('order_id').isUUID(),
    body('payment_mode').isIn(['cash', 'bank', 'credit']),
    body('total_amount').isNumeric(),
];

// Get all payments (admin and store staff only)
router.get('/', authorizeRoles('admin', 'store_staff'), paymentController.getAllPayments);

// Get my payments (delivery boy only)
router.get('/my-payments', authorizeRoles('delivery_boy'), paymentController.getMyPayments);

// Get payment statistics
router.get('/statistics', authorizeRoles('admin', 'store_staff', 'store_manager'), paymentController.getPaymentStatistics);

// Collect payment (delivery boys only) - MUST come before /order/:orderId to avoid route conflicts
router.post(
    '/collect',
    authorizeRoles('delivery_boy'),
    upload.single('receipt'),
    paymentController.collectPayment
);

// Split payment (delivery boys only)
router.post(
    '/split',
    authorizeRoles('delivery_boy'),
    upload.single('receipt'),
    paymentController.splitPayment
);

// Get payment by order ID (must be after specific routes)
router.get('/order/:orderId', paymentController.getPaymentByOrderId);

// Create payment with receipt upload (delivery boys only)
router.post(
    '/',
    authorizeRoles('delivery_boy'),
    upload.single('receipt'),
    paymentValidation,
    paymentController.createPayment
);

module.exports = router;
