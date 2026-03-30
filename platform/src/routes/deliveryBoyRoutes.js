const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const deliveryBoyController = require('../controllers/deliveryBoyController');
const validateRequest = require('../middleware/validateRequest');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

const validateId = [
    param('id').isInt().withMessage('Invalid delivery boy ID format'),
    validateRequest
];

// Get all delivery boys (admin, store_manager can view)
router.get(
    '/',
    authorizeRoles('admin', 'store_manager'),
    deliveryBoyController.getAllDeliveryBoys
);

// Get approved delivery boys
router.get(
    '/approved',
    authorizeRoles('admin', 'store_manager'),
    deliveryBoyController.getApprovedDeliveryBoys
);

// Update device token (delivery boy only - updates their own token)
// IMPORTANT: This route must be BEFORE /:id to avoid route conflict
router.put(
    '/device-token',
    authorizeRoles('delivery_boy'),
    deliveryBoyController.updateDeviceToken
);

// Get delivery boy by ID
router.get(
    '/:id',
    validateId,
    authorizeRoles('admin', 'store_manager'),
    deliveryBoyController.getDeliveryBoyById
);

// Create delivery boy (admin, store_manager can create)
router.post(
    '/',
    authorizeRoles('admin', 'store_manager'),
    deliveryBoyController.createDeliveryBoy
);

// Update delivery boy (admin, store_manager can update)
router.put(
    '/:id',
    validateId,
    authorizeRoles('admin', 'store_manager'),
    deliveryBoyController.updateDeliveryBoy
);

// Delete delivery boy (admin only)
router.delete(
    '/:id',
    validateId,
    authorizeRoles('admin'),
    deliveryBoyController.deleteDeliveryBoy
);

// Approve delivery boy (admin only)
router.patch(
    '/:id/approve',
    validateId,
    authorizeRoles('admin'),
    deliveryBoyController.approveDeliveryBoy
);

// Toggle active status (admin only)
router.patch(
    '/:id/toggle-active',
    validateId,
    authorizeRoles('admin'),
    deliveryBoyController.toggleActiveStatus
);

module.exports = router;









