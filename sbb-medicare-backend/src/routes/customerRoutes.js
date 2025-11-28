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

// Get customer orders (must be before /:id to avoid route conflict)
router.get('/:id/orders', customerController.getCustomerOrders);

// Get customer by ID
router.get('/:id', customerController.getCustomerById);

// Get customer orders
router.get('/:id/orders', customerController.getCustomerOrders);

// Create customer (admin and store managers can create)
router.post('/', authorizeRoles('admin', 'store_manager'), customerController.createCustomer);

// Update customer (admin and store managers can update)
router.put('/:id', authorizeRoles('admin', 'store_manager'), customerController.updateCustomer);

// Delete customer (admin and store managers can delete)
router.delete('/:id', authorizeRoles('admin', 'store_manager'), customerController.deleteCustomer);

module.exports = router;
