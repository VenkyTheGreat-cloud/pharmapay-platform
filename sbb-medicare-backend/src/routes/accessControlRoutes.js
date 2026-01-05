const express = require('express');
const router = express.Router();
const accessControlController = require('../controllers/accessControlController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// Get all store managers
router.get(
    '/',
    accessControlController.getAllStoreManagers
);

// Get store manager by ID
router.get(
    '/:id',
    accessControlController.getStoreManagerById
);

// Create store manager
router.post(
    '/',
    accessControlController.createStoreManager
);

// Update store manager
router.put(
    '/:id',
    accessControlController.updateStoreManager
);

// Delete store manager
router.delete(
    '/:id',
    accessControlController.deleteStoreManager
);

// Toggle active status
router.patch(
    '/:id/toggle-active',
    accessControlController.toggleActiveStatus
);

module.exports = router;





