const express = require('express');
const router = express.Router();
const marketplaceController = require('../controllers/marketplaceController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Public routes
router.get('/pharmacies', marketplaceController.listPharmacies);
router.get('/pharmacies/:slug', marketplaceController.getPharmacy);

// Delivery boy auth required
router.post(
    '/apply/:pharmacyId',
    authenticateToken,
    authorizeRoles('delivery_boy'),
    marketplaceController.applyToPharmacy
);

router.get(
    '/my-applications',
    authenticateToken,
    authorizeRoles('delivery_boy'),
    marketplaceController.getMyApplications
);

module.exports = router;
