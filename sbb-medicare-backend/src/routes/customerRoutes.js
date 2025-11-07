const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const customerController = require('../controllers/customerController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Validation middleware
const customerValidation = [
    body('full_name').trim().notEmpty(),
    body('mobile_number').trim().notEmpty(),
    body('address').trim().notEmpty(),
];

// Get all customers
router.get('/', customerController.getAllCustomers);

// Search customers
router.get('/search', customerController.searchCustomers);

// Get customer by ID
router.get('/:id', customerController.getCustomerById);

// Create customer (store staff and delivery boys)
router.post('/', authorizeRoles('store_staff', 'delivery_boy'), customerValidation, customerController.createCustomer);

// Update customer (store staff and delivery boys)
router.put('/:id', authorizeRoles('store_staff', 'delivery_boy'), customerController.updateCustomer);

// Delete customer (store staff only)
router.delete('/:id', authorizeRoles('store_staff'), customerController.deleteCustomer);

module.exports = router;
