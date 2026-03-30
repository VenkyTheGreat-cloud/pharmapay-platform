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
