const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticateToken, checkStoreAccess } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get delivery boy performance report
router.get(
    '/delivery-boy',
    checkStoreAccess,
    reportsController.getDeliveryBoyReport
);

// Get customer performance report
router.get(
    '/customer',
    checkStoreAccess,
    reportsController.getCustomerReport
);

// Get return items report
router.get(
    '/return-items',
    checkStoreAccess,
    reportsController.getReturnItemsReport
);

// Get sales report
router.get(
    '/sales',
    checkStoreAccess,
    reportsController.getSalesReport
);

module.exports = router;
