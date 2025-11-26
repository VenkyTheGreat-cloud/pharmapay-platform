const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const orderController = require('../controllers/orderController');
const { authenticateToken, authorizeRoles, checkStoreAccess } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all orders
router.get('/', checkStoreAccess, orderController.getAllOrders);

// Get today's orders
router.get('/today', checkStoreAccess, orderController.getTodayOrders);

// Get ongoing orders
router.get('/ongoing', checkStoreAccess, orderController.getOngoingOrders);

// Get order by ID
router.get('/:id', checkStoreAccess, orderController.getOrderById);

// Create order
router.post(
    '/',
    checkStoreAccess,
    authorizeRoles('admin', 'store_manager'),
    [
        body('customerId').notEmpty().withMessage('Customer ID is required'),
        body('deliveryBoyId').notEmpty().withMessage('Delivery boy ID is required'),
        body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
        body('items.*.name').notEmpty().withMessage('Item name is required'),
        body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
        body('items.*.price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
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

// Update order status
router.put(
    '/:id/status',
    [
        body('status').isIn(['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'PAYMENT_COLLECTION', 'DELIVERED', 'CANCELLED'])
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

module.exports = router;
