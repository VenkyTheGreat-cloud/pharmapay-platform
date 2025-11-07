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
    body('payment_mode').isIn(['cash', 'bank', 'split']),
    body('total_amount').isNumeric(),
];

// Get all payments (admin and store staff only)
router.get('/', authorizeRoles('admin', 'store_staff'), paymentController.getAllPayments);

// Get my payments (delivery boy only)
router.get('/my-payments', authorizeRoles('delivery_boy'), paymentController.getMyPayments);

// Get payment statistics (admin and store staff only)
router.get('/statistics', authorizeRoles('admin', 'store_staff'), paymentController.getPaymentStatistics);

// Get payment by order ID
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
