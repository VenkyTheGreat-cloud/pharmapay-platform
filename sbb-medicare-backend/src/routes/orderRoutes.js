const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const orderController = require('../controllers/orderController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Validation middleware
const orderValidation = [
    body('customer_id').isUUID(),
    body('items').isArray(),
    body('total_amount').isNumeric(),
];

// Get all orders (admin and store staff get all, delivery boys get their own)
router.get('/', orderController.getAllOrders);

// Get my orders (delivery boy only)
router.get('/my-orders', authorizeRoles('delivery_boy'), orderController.getMyOrders);

// Get orders by date range with statistics (admin and store staff only)
router.get('/statistics', authorizeRoles('admin', 'store_staff'), orderController.getOrdersByDateRange);

// Get order by ID
router.get('/:id', orderController.getOrderById);

// Create order (store staff only)
router.post('/', authorizeRoles('store_staff'), orderValidation, orderController.createOrder);

// Assign order to delivery boy (store staff only)
router.patch('/:id/assign', authorizeRoles('store_staff'), orderController.assignOrder);

// Update order status (delivery boys and store staff)
router.patch('/:id/status', authorizeRoles('store_staff', 'delivery_boy'), orderController.updateOrderStatus);

// Get order history
router.get('/:id/history', orderController.getOrderHistory);

// Delete order (store staff only, only if status is 'new')
router.delete('/:id', authorizeRoles('store_staff'), orderController.deleteOrder);

module.exports = router;
