const express = require('express');
const router = express.Router();
const deliveryBoyController = require('../controllers/deliveryBoyController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

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

// Get delivery boy by ID
router.get(
    '/:id',
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
    authorizeRoles('admin', 'store_manager'),
    deliveryBoyController.updateDeliveryBoy
);

// Delete delivery boy (admin only)
router.delete(
    '/:id',
    authorizeRoles('admin'),
    deliveryBoyController.deleteDeliveryBoy
);

// Approve delivery boy (admin only)
router.patch(
    '/:id/approve',
    authorizeRoles('admin'),
    deliveryBoyController.approveDeliveryBoy
);

// Toggle active status (admin only)
router.patch(
    '/:id/toggle-active',
    authorizeRoles('admin'),
    deliveryBoyController.toggleActiveStatus
);

module.exports = router;





