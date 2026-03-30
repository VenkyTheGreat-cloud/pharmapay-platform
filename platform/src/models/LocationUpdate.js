const { query } = require('../config/database');

class LocationUpdate {
    // Create a location update
    static async create(locationData) {
        const { order_id, latitude, longitude, recorded_by, source } = locationData;
        const result = await query(
            `INSERT INTO location_updates (order_id, latitude, longitude, recorded_by, source)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [order_id, latitude, longitude, recorded_by, source || 'MANUAL']
        );
        return result.rows[0];
    }

    // Get location updates for an order
    static async findByOrderId(orderId, limit = 100) {
        const result = await query(
            `SELECT lu.*, db.name as recorded_by_name
             FROM location_updates lu
             LEFT JOIN delivery_boys db ON lu.recorded_by = db.id
             WHERE lu.order_id = $1
             ORDER BY lu.recorded_at DESC
             LIMIT $2`,
            [orderId, limit]
        );
        return result.rows;
    }

    // Get latest location for an order
    static async getLatest(orderId) {
        const result = await query(
            `SELECT * FROM location_updates
             WHERE order_id = $1
             ORDER BY recorded_at DESC
             LIMIT 1`,
            [orderId]
        );
        return result.rows[0];
    }
}

module.exports = LocationUpdate;

