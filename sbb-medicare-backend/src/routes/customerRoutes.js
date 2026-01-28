const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const customerController = require('../controllers/customerController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Validation middleware (commented out - validation handled in controller)
// const customerValidation = [
//     body('full_name').trim().notEmpty(),
//     body('mobile_number').trim().notEmpty(),
//     body('address').trim().notEmpty(),
// ];

// Get all customers
router.get('/', customerController.getAllCustomers);

// Search customers
router.get('/search', customerController.searchCustomers);

// Get customers with order registration status by date
// Supports both GET (date in query) and POST (date in body)
router.get('/order-status-by-date', customerController.getCustomersWithOrderStatusByDate);
router.post(
    '/order-status-by-date',
    [
        body('date').notEmpty().isISO8601().withMessage('Date is required and must be in YYYY-MM-DD format')
    ],
    customerController.getCustomersWithOrderStatusByDate
);

// Get customer orders (must be before /:id to avoid route conflict)
router.get('/:id/orders', customerController.getCustomerOrders);

// Get customer by ID
router.get('/:id', customerController.getCustomerById);

// Get customer orders
router.get('/:id/orders', customerController.getCustomerOrders);

// Create customer (simplified - only name, mobile, and date)
router.post(
    '/simple',
    authorizeRoles('admin', 'store_manager'),
    [
        body('name').notEmpty().trim().withMessage('Name is required'),
        body('mobile').notEmpty().trim().withMessage('Mobile number is required'),
        body('date').notEmpty().isISO8601().withMessage('Date is required and must be in YYYY-MM-DD format')
    ],
    customerController.createCustomerSimple
);

// Create customer (admin and store managers can create)
router.post('/', authorizeRoles('admin', 'store_manager'), customerController.createCustomer);

// Update customer (admin and store managers can update)
router.put('/:id', authorizeRoles('admin', 'store_manager'), customerController.updateCustomer);

// Delete customer (admin and store managers can delete)
router.delete('/:id', authorizeRoles('admin', 'store_manager'), customerController.deleteCustomer);

module.exports = router;
