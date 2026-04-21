const express = require('express');
const router = express.Router();
const controller = require('../controllers/adminDashboardController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken, authorizeRoles('admin'));

// Revenue
router.get('/revenue/summary', controller.revenueSummary);
router.get('/revenue/transactions', controller.revenueTransactions);

// Pharmacy Analytics
router.get('/analytics/pharmacies', controller.pharmacyAnalytics);
router.get('/analytics/onboarding-funnel', controller.onboardingFunnel);

// Delivery Boy Overview
router.get('/analytics/delivery-boys', controller.deliveryBoyOverview);

// Payment Reconciliation
router.get('/payments/history', controller.paymentHistory);
router.get('/payments/summary', controller.paymentSummary);

module.exports = router;
