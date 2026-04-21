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

// Pharmacy owner (admin) routes
router.get('/applications', authenticateToken, authorizeRoles('admin'), marketplaceController.getApplications);
router.put('/applications/:id/f2f', authenticateToken, authorizeRoles('admin'), marketplaceController.markF2FCompleted);
router.put('/applications/:id/approve', authenticateToken, authorizeRoles('admin'), marketplaceController.approveWithTerms);
router.put('/applications/:id/reject', authenticateToken, authorizeRoles('admin'), marketplaceController.rejectApplication);
router.get('/my-delivery-boys', authenticateToken, authorizeRoles('admin'), marketplaceController.getMyDeliveryBoys);

module.exports = router;
