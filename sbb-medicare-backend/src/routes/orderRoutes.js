const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const orderController = require('../controllers/orderController');
const { authenticateToken, authorizeRoles, checkStoreAccess } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes require authentication
router.use(authenticateToken);

// Get all orders
router.get('/', checkStoreAccess, orderController.getAllOrders);

// Get today's orders
router.get('/today', checkStoreAccess, orderController.getTodayOrders);

// Get ongoing orders
router.get('/ongoing', checkStoreAccess, orderController.getOngoingOrders);

// Dashboard statistics for date range
router.get('/dashboard', checkStoreAccess, orderController.getDashboardStats);

// Get order by ID
router.get('/:id', checkStoreAccess, orderController.getOrderById);

// Create order (simplified - no items, only total amount)
router.post(
    '/',
    checkStoreAccess,
    authorizeRoles('admin', 'store_manager'),
    [
        body('orderNumber').notEmpty().trim().withMessage('Order number is required'),
        body('customerId').notEmpty().withMessage('Customer ID is required'),
        body('deliveryBoyId').notEmpty().withMessage('Delivery boy ID is required'),
        body('totalAmount').isFloat({ min: 0.01 }).withMessage('Total amount is required and must be greater than 0'),
        body('paidAmount').optional().isFloat({ min: 0 }).withMessage('Paid amount must be a positive number'),
        body('paymentMode').optional().isIn(['CASH', 'CARD', 'UPI', 'BANK_TRANSFER']).withMessage('Payment mode must be CASH, CARD, UPI, or BANK_TRANSFER'),
        body('transactionReference').optional().isString().withMessage('Transaction reference must be a string'),
    ],
    orderController.createOrder
);

// Assign order to delivery boy
router.post(
    '/:id/assign',
    checkStoreAccess,
    authorizeRoles('admin', 'store_manager'),
    [
        body('deliveryBoyId').notEmpty().withMessage('Delivery boy ID is required'),
    ],
    orderController.assignOrder
);

// Accept order (delivery boy only)
router.post(
    '/:id/accept',
    orderController.acceptOrder
);

// Reject order (delivery boy only)
router.post(
    '/:id/reject',
    orderController.rejectOrder
);

// Update order status
router.put(
    '/:id/status',
    [
        body('status').isIn(['ASSIGNED', 'ACCEPTED', 'REJECTED', 'PICKED_UP', 'IN_TRANSIT', 'PAYMENT_COLLECTION', 'DELIVERED', 'CANCELLED'])
            .withMessage('Invalid status'),
    ],
    orderController.updateOrderStatus
);

// Update order location
router.post(
    '/:id/location',
    [
        body('latitude').isFloat().withMessage('Valid latitude is required'),
        body('longitude').isFloat().withMessage('Valid longitude is required'),
        body('source').optional().isIn(['AUTO', 'MANUAL']).withMessage('Source must be AUTO or MANUAL'),
    ],
    orderController.updateLocation
);

// Get orders by customer mobile
router.get('/customer/:mobile', checkStoreAccess, orderController.getOrdersByCustomerMobile);

// Upload delivery/payment proof photo
router.post(
    '/:id/delivery-photo',
    upload.single('photo'),
    orderController.uploadDeliveryPhoto
);

module.exports = router;
