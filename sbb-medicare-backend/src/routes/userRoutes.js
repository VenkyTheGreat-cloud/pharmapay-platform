const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all users (admin and store staff can view delivery boys)
router.get('/', authorizeRoles('admin', 'store_staff'), userController.getAllUsers);

// Get delivery boys
router.get('/delivery-boys', authorizeRoles('admin', 'store_staff'), userController.getDeliveryBoys);

// Get pending delivery boy requests (admin only)
router.get('/pending-requests', authorizeRoles('admin'), userController.getPendingRequests);

// Create user (admin only)
router.post('/', authorizeRoles('admin'), userController.createUser);

// Get user by ID
router.get('/:id', authorizeRoles('admin', 'store_staff'), userController.getUserById);

// Update user (admin only)
router.put('/:id', authorizeRoles('admin'), userController.updateUser);

// Delete user (admin only)
router.delete('/:id', authorizeRoles('admin'), userController.deleteUser);

// Update user status - approve/reject delivery boy (admin only)
router.patch('/:id/status', authorizeRoles('admin'), userController.updateUserStatus);

module.exports = router;
