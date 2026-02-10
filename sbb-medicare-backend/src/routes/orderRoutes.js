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

// Get pending orders created till yesterday (status != DELIVERED)
router.get('/pending-till-yesterday', checkStoreAccess, orderController.getPendingOrdersTillYesterday);

// Get today's orders
router.get('/today', checkStoreAccess, orderController.getTodayOrders);

// Get ongoing orders
router.get('/ongoing', checkStoreAccess, orderController.getOngoingOrders);

// Dashboard statistics for date range
router.get('/dashboard', checkStoreAccess, orderController.getDashboardStats);

// Export orders to Excel (date range)
router.get('/export/excel', checkStoreAccess, authorizeRoles('admin', 'store_manager'), orderController.exportOrdersToExcel);

// Get order by ID
router.get('/:id', checkStoreAccess, orderController.getOrderById);

// Update order (store manager can edit order details)
router.put(
    '/:id',
    checkStoreAccess,
    authorizeRoles('admin', 'store_manager'),
    [
        body('orderNumber').optional().notEmpty().trim().withMessage('Order number cannot be empty'),
        body('customerId').optional().notEmpty().withMessage('Customer ID cannot be empty'),
        body('customerName').optional().notEmpty().trim().withMessage('Customer name cannot be empty'),
        body('customerPhone').optional().notEmpty().trim().withMessage('Customer phone cannot be empty'),
        body('totalAmount').optional().isFloat({ min: 0.01 }).withMessage('Total amount must be greater than 0'),
        body('customerLat').optional().isFloat().withMessage('Customer latitude must be a valid number'),
        body('customerLng').optional().isFloat().withMessage('Customer longitude must be a valid number'),
        body('returnItems').optional().isBoolean().withMessage('Return items must be a boolean'),
        body('returnItemsList').optional().isArray().withMessage('Return items list must be an array'),
        body('returnItemsList.*.name').optional().notEmpty().trim().withMessage('Return item name is required'),
        body('returnItemsList.*.quantity').optional().isInt({ min: 1 }).withMessage('Return item quantity must be a positive integer'),
        body('returnAdjustAmount').optional().isFloat({ min: 0 }).withMessage('Return adjust amount must be a non-negative number'),
    ],
    orderController.updateOrder
);

// Create order (simplified - no items, only total amount)
// Note: deliveryBoyId is no longer required - order will be assigned to all delivery boys under admin
router.post(
    '/',
    checkStoreAccess,
    authorizeRoles('admin', 'store_manager'),
    [
        body('orderNumber').notEmpty().trim().withMessage('Order number is required'),
        body('customerId').notEmpty().withMessage('Customer ID is required'),
        body('totalAmount').isFloat({ min: 0.01 }).withMessage('Total amount is required and must be greater than 0'),
        body('paidAmount').optional().isFloat({ min: 0 }).withMessage('Paid amount must be a positive number'),
        body('paymentMode').optional().isIn(['CASH', 'CARD', 'UPI', 'BANK_TRANSFER']).withMessage('Payment mode must be CASH, CARD, UPI, or BANK_TRANSFER'),
        body('transactionReference').optional().isString().withMessage('Transaction reference must be a string'),
        body('returnItems').optional().isBoolean().withMessage('Return items must be a boolean'),
        body('returnItemsList').optional().isArray().withMessage('Return items list must be an array'),
        body('returnItemsList.*.name').optional().notEmpty().trim().withMessage('Return item name is required'),
        body('returnItemsList.*.quantity').optional().isInt({ min: 1 }).withMessage('Return item quantity must be a positive integer'),
        body('returnAdjustAmount').optional().isFloat({ min: 0 }).withMessage('Return adjust amount must be a non-negative number'),
    ],
    orderController.createOrder
);

// Assign order to delivery boy or mark as received at store
router.post(
    '/:id/assign',
    checkStoreAccess,
    authorizeRoles('admin', 'store_manager'),
    [
        // Either deliveryBoyId OR customerReceivedAtStore must be provided
        body('deliveryBoyId')
            .optional()
            .notEmpty()
            .withMessage('Delivery boy ID cannot be empty'),
        body('customerReceivedAtStore')
            .optional()
            .isBoolean()
            .withMessage('customerReceivedAtStore must be a boolean'),
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
