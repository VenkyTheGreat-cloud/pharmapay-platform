const { query } = require('../config/database');
const logger = require('../config/logger');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const PushNotificationService = require('../services/pushNotificationService');

// Haversine distance in km between two lat/lng points
function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/marketplace/pharmacies
// Public — list pharmacies accepting riders
exports.listPharmacies = async (req, res, next) => {
    try {
        const { city, area, lat, lng, radius_km } = req.query;

        const conditions = ['pl.is_accepting_riders = true'];
        const params = [];
        let idx = 1;

        if (city) {
            conditions.push(`pl.city ILIKE $${idx}`);
            params.push(`%${city}%`);
            idx++;
        }

        if (area) {
            conditions.push(`pl.area ILIKE $${idx}`);
            params.push(`%${area}%`);
            idx++;
        }

        const sql = `
            SELECT pl.id, pl.slug, pl.display_name, pl.city, pl.area,
                   pl.lat, pl.lng, pl.logo_url, pl.primary_color, pl.plan,
                   u.store_name
            FROM pharmacy_listings pl
            JOIN users u ON u.id = pl.id
            WHERE ${conditions.join(' AND ')}
            ORDER BY pl.display_name
        `;

        const result = await query(sql, params);
        let pharmacies = result.rows;

        // Client-side Haversine filter when lat/lng provided
        if (lat && lng) {
            const userLat = parseFloat(lat);
            const userLng = parseFloat(lng);
            const maxKm = parseFloat(radius_km) || 25;

            pharmacies = pharmacies
                .filter(p => p.lat != null && p.lng != null)
                .map(p => ({
                    ...p,
                    distance_km: Math.round(haversineKm(userLat, userLng, parseFloat(p.lat), parseFloat(p.lng)) * 10) / 10
                }))
                .filter(p => p.distance_km <= maxKm)
                .sort((a, b) => a.distance_km - b.distance_km);
        }

        res.json(successResponse({ pharmacies, count: pharmacies.length }));
    } catch (error) {
        next(error);
    }
};

// GET /api/marketplace/pharmacies/:slug
// Public — single pharmacy profile
exports.getPharmacy = async (req, res, next) => {
    try {
        const { slug } = req.params;

        const result = await query(
            `SELECT pl.id, pl.slug, pl.display_name, pl.city, pl.area,
                    pl.lat, pl.lng, pl.logo_url, pl.primary_color, pl.plan,
                    pl.is_accepting_riders, pl.created_at,
                    u.store_name, u.address, u.mobile, u.email
             FROM pharmacy_listings pl
             JOIN users u ON u.id = pl.id
             WHERE pl.slug = $1`,
            [slug]
        );

        if (result.rows.length === 0) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Pharmacy not found'));
        }

        res.json(successResponse(result.rows[0]));
    } catch (error) {
        next(error);
    }
};

// POST /api/marketplace/apply/:pharmacyId
// Auth required — delivery boy applies to a pharmacy
exports.applyToPharmacy = async (req, res, next) => {
    try {
        const deliveryBoyId = req.user.userId;
        const { pharmacyId } = req.params;

        // Verify pharmacy exists and is accepting riders
        const pharmacy = await query(
            `SELECT pl.id, pl.display_name, u.id AS owner_id
             FROM pharmacy_listings pl
             JOIN users u ON u.id = pl.id
             WHERE pl.id = $1`,
            [pharmacyId]
        );

        if (pharmacy.rows.length === 0) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Pharmacy not found'));
        }

        if (!pharmacy.rows[0].is_accepting_riders) {
            return res.status(400).json(errorResponse('NOT_ACCEPTING', 'This pharmacy is not accepting new riders'));
        }

        // Check for existing application
        const existing = await query(
            `SELECT id, status FROM delivery_boy_pharmacies
             WHERE delivery_boy_id = $1 AND pharmacy_id = $2`,
            [deliveryBoyId, pharmacyId]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json(errorResponse(
                'ALREADY_APPLIED',
                `Already applied (status: ${existing.rows[0].status})`
            ));
        }

        // Insert application
        const result = await query(
            `INSERT INTO delivery_boy_pharmacies (delivery_boy_id, pharmacy_id, status)
             VALUES ($1, $2, 'pending')
             RETURNING *`,
            [deliveryBoyId, pharmacyId]
        );

        // Get delivery boy name for notification
        const dbResult = await query(
            'SELECT name FROM delivery_boys WHERE id = $1',
            [deliveryBoyId]
        );
        const deliveryBoyName = dbResult.rows[0]?.name || 'A delivery boy';

        // Send FCM push to pharmacy admin (fire-and-forget)
        PushNotificationService.sendToDeliveryBoy(
            pharmacy.rows[0].owner_id,
            'New Rider Application',
            `New delivery boy application from ${deliveryBoyName}`
        ).catch(err => logger.warn('Failed to send application notification', { error: err.message }));

        logger.info('Delivery boy applied to pharmacy', {
            deliveryBoyId,
            pharmacyId,
            pharmacyName: pharmacy.rows[0].display_name
        });

        res.status(201).json(successResponse(result.rows[0], 'Application submitted'));
    } catch (error) {
        next(error);
    }
};

// GET /api/marketplace/applications
// Auth required — pharmacy owner views delivery boy applications
exports.getApplications = async (req, res, next) => {
    try {
        const ownerId = req.user.userId;
        const { status } = req.query;

        // Find pharmacy owned by this user
        const pharmacyResult = await query(
            `SELECT id FROM pharmacy_listings WHERE slug IN (SELECT slug FROM pharmacies WHERE owner_id = $1)`,
            [ownerId]
        );

        if (pharmacyResult.rows.length === 0) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'No pharmacy found for this owner'));
        }

        const pharmacyId = pharmacyResult.rows[0].id;

        let sql = `
            SELECT dbp.*, db.name, db.mobile, db.email, db.photo_url, db.address
            FROM delivery_boy_pharmacies dbp
            JOIN delivery_boys db ON dbp.delivery_boy_id = db.id
            WHERE dbp.pharmacy_id = $1
        `;
        const params = [pharmacyId];

        if (status) {
            sql += ` AND dbp.status = $2`;
            params.push(status);
        }

        sql += ` ORDER BY dbp.applied_at DESC`;

        const result = await query(sql, params);

        res.json(successResponse({ applications: result.rows, count: result.rows.length }));
    } catch (error) {
        next(error);
    }
};

// PUT /api/marketplace/applications/:id/f2f
// Auth required — pharmacy owner marks face-to-face completed
exports.markF2FCompleted = async (req, res, next) => {
    try {
        const ownerId = req.user.userId;
        const applicationId = req.params.id;

        // Verify ownership
        const pharmacyResult = await query(
            `SELECT id FROM pharmacy_listings WHERE slug IN (SELECT slug FROM pharmacies WHERE owner_id = $1)`,
            [ownerId]
        );

        if (pharmacyResult.rows.length === 0) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'No pharmacy found for this owner'));
        }

        const pharmacyId = pharmacyResult.rows[0].id;

        // Verify application belongs to this pharmacy
        const appCheck = await query(
            `SELECT id FROM delivery_boy_pharmacies WHERE id = $1 AND pharmacy_id = $2`,
            [applicationId, pharmacyId]
        );

        if (appCheck.rows.length === 0) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Application not found'));
        }

        const result = await query(
            `UPDATE delivery_boy_pharmacies SET f2f_completed = true, f2f_completed_at = NOW() WHERE id = $1 RETURNING *`,
            [applicationId]
        );

        logger.info('F2F marked completed', { applicationId, pharmacyId, ownerId });

        res.json(successResponse(result.rows[0], 'Face-to-face meeting marked as completed'));
    } catch (error) {
        next(error);
    }
};

// PUT /api/marketplace/applications/:id/approve
// Auth required — pharmacy owner approves application with terms
exports.approveWithTerms = async (req, res, next) => {
    try {
        const ownerId = req.user.userId;
        const applicationId = req.params.id;
        const { rate_per_km, base_rate, contract_period, terms_notes } = req.body;

        // Validate contract_period
        if (!['3_months', '6_months'].includes(contract_period)) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'contract_period must be 3_months or 6_months'));
        }

        // Verify ownership
        const pharmacyResult = await query(
            `SELECT id FROM pharmacy_listings WHERE slug IN (SELECT slug FROM pharmacies WHERE owner_id = $1)`,
            [ownerId]
        );

        if (pharmacyResult.rows.length === 0) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'No pharmacy found for this owner'));
        }

        const pharmacyId = pharmacyResult.rows[0].id;

        // Verify application belongs to this pharmacy and F2F is completed
        const appCheck = await query(
            `SELECT id, delivery_boy_id, f2f_completed FROM delivery_boy_pharmacies WHERE id = $1 AND pharmacy_id = $2`,
            [applicationId, pharmacyId]
        );

        if (appCheck.rows.length === 0) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Application not found'));
        }

        if (!appCheck.rows[0].f2f_completed) {
            return res.status(400).json(errorResponse('F2F_REQUIRED', 'Face-to-face meeting must be completed before approval'));
        }

        // Calculate contract dates
        const contractStart = new Date();
        const contractEnd = new Date();
        if (contract_period === '3_months') {
            contractEnd.setMonth(contractEnd.getMonth() + 3);
        } else {
            contractEnd.setMonth(contractEnd.getMonth() + 6);
        }

        const result = await query(
            `UPDATE delivery_boy_pharmacies
             SET status = 'approved', rate_per_km = $1, base_rate = $2, contract_period = $3,
                 contract_start = $4, contract_end = $5, terms_notes = $6,
                 approved_at = NOW(), approved_by = $7, engagement_status = 'active'
             WHERE id = $8
             RETURNING *`,
            [rate_per_km, base_rate, contract_period, contractStart, contractEnd, terms_notes, ownerId, applicationId]
        );

        // Activate the delivery boy
        const deliveryBoyId = appCheck.rows[0].delivery_boy_id;
        await query(`UPDATE delivery_boys SET is_active = true WHERE id = $1`, [deliveryBoyId]);

        logger.info('Application approved with terms', { applicationId, pharmacyId, deliveryBoyId, contract_period });

        res.json(successResponse(result.rows[0], 'Application approved'));
    } catch (error) {
        next(error);
    }
};

// PUT /api/marketplace/applications/:id/reject
// Auth required — pharmacy owner rejects application
exports.rejectApplication = async (req, res, next) => {
    try {
        const ownerId = req.user.userId;
        const applicationId = req.params.id;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Rejection reason is required'));
        }

        // Verify ownership
        const pharmacyResult = await query(
            `SELECT id FROM pharmacy_listings WHERE slug IN (SELECT slug FROM pharmacies WHERE owner_id = $1)`,
            [ownerId]
        );

        if (pharmacyResult.rows.length === 0) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'No pharmacy found for this owner'));
        }

        const pharmacyId = pharmacyResult.rows[0].id;

        // Verify application belongs to this pharmacy
        const appCheck = await query(
            `SELECT id FROM delivery_boy_pharmacies WHERE id = $1 AND pharmacy_id = $2`,
            [applicationId, pharmacyId]
        );

        if (appCheck.rows.length === 0) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Application not found'));
        }

        const result = await query(
            `UPDATE delivery_boy_pharmacies SET status = 'rejected', rejection_reason = $1 WHERE id = $2 RETURNING *`,
            [reason, applicationId]
        );

        logger.info('Application rejected', { applicationId, pharmacyId, reason });

        res.json(successResponse(result.rows[0], 'Application rejected'));
    } catch (error) {
        next(error);
    }
};

// GET /api/marketplace/my-delivery-boys
// Auth required — pharmacy owner views their approved delivery boys
exports.getMyDeliveryBoys = async (req, res, next) => {
    try {
        const ownerId = req.user.userId;

        // Find pharmacy owned by this user
        const pharmacyResult = await query(
            `SELECT id FROM pharmacy_listings WHERE slug IN (SELECT slug FROM pharmacies WHERE owner_id = $1)`,
            [ownerId]
        );

        if (pharmacyResult.rows.length === 0) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'No pharmacy found for this owner'));
        }

        const pharmacyId = pharmacyResult.rows[0].id;

        const result = await query(
            `SELECT dbp.id, dbp.delivery_boy_id, dbp.status, dbp.rate_per_km, dbp.base_rate,
                    dbp.contract_start, dbp.contract_end, dbp.contract_period,
                    dbp.engagement_status, dbp.approved_at, dbp.f2f_completed, dbp.f2f_completed_at,
                    db.name, db.mobile, db.email, db.photo_url, db.address
             FROM delivery_boy_pharmacies dbp
             JOIN delivery_boys db ON dbp.delivery_boy_id = db.id
             WHERE dbp.pharmacy_id = $1 AND dbp.status = 'approved'
             ORDER BY dbp.approved_at DESC`,
            [pharmacyId]
        );

        res.json(successResponse({ deliveryBoys: result.rows, count: result.rows.length }));
    } catch (error) {
        next(error);
    }
};

// GET /api/marketplace/my-applications
// Auth required — delivery boy's own applications
exports.getMyApplications = async (req, res, next) => {
    try {
        const deliveryBoyId = req.user.userId;

        const result = await query(
            `SELECT dbp.id, dbp.pharmacy_id, dbp.status,
                    dbp.applied_at, dbp.approved_at,
                    pl.slug, pl.display_name, pl.city, pl.area,
                    pl.logo_url, pl.primary_color
             FROM delivery_boy_pharmacies dbp
             JOIN pharmacy_listings pl ON pl.id = dbp.pharmacy_id
             WHERE dbp.delivery_boy_id = $1
             ORDER BY dbp.applied_at DESC`,
            [deliveryBoyId]
        );

        res.json(successResponse({ applications: result.rows, count: result.rows.length }));
    } catch (error) {
        next(error);
    }
};
