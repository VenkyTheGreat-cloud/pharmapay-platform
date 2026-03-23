const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const customerRegistryController = require('../controllers/customerRegistryController');
const validateRequest = require('../middleware/validateRequest');
const { authenticateToken, authorizeRoles, checkStoreAccess } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

const validateId = [
    param('id').isInt().withMessage('Invalid ID format'),
    validateRequest
];

// Create customer registry entry
router.post(
    '/',
    checkStoreAccess,
    authorizeRoles('admin', 'store_manager'),
    [
        body('mobile').notEmpty().trim().matches(/^[0-9]{10}$/).withMessage('Mobile number is required and must be 10 digits'),
        body('name').optional().trim(),
        body('registry_date').optional().isISO8601().withMessage('Registry date must be a valid ISO 8601 date/time string'),
    ],
    customerRegistryController.createCustomerRegistry
);

// Get all customer registry entries
router.get(
    '/',
    checkStoreAccess,
    customerRegistryController.getAllCustomerRegistry
);

// Export customer registry to Excel
router.get(
    '/export/excel',
    checkStoreAccess,
    authorizeRoles('admin', 'store_manager'),
    customerRegistryController.exportCustomerRegistryExcel
);

// Get registered customers with order status for a specific date
router.get(
    '/with-orders',
    checkStoreAccess,
    customerRegistryController.getRegisteredCustomersWithOrders
);

// Get customer registry entry by ID
router.get(
    '/:id',
    validateId,
    checkStoreAccess,
    customerRegistryController.getCustomerRegistryById
);

// Update customer registry entry
router.put(
    '/:id',
    validateId,
    checkStoreAccess,
    authorizeRoles('admin', 'store_manager'),
    [
        body('mobile').optional().trim().matches(/^[0-9]{10}$/).withMessage('Mobile number must be 10 digits'),
        body('name').optional().trim(),
        body('registry_date').optional().isISO8601().withMessage('Registry date must be a valid ISO 8601 date/time string'),
    ],
    customerRegistryController.updateCustomerRegistry
);

// Delete customer registry entry
router.delete(
    '/:id',
    validateId,
    checkStoreAccess,
    authorizeRoles('admin', 'store_manager'),
    customerRegistryController.deleteCustomerRegistry
);

module.exports = router;
