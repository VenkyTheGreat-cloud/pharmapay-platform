const { query } = require('../config/database');

class CustomerRegistry {
    // Create a new customer registry entry
    static async create(registryData) {
        const {
            mobile,
            name,
            registry_date
        } = registryData;

        const result = await query(
            `INSERT INTO customer_registry (mobile, name, registry_date)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [mobile.trim(), name.trim(), registry_date || new Date().toISOString()]
        );

        return result.rows[0];
    }

    // Find by ID
    static async findById(id) {
        const result = await query(
            'SELECT * FROM customer_registry WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    // Find all with filters and pagination
    static async findAll(filters = {}) {
        let queryText = 'SELECT * FROM customer_registry WHERE 1=1';
        const params = [];
        let paramCount = 1;

        // Filter by mobile
        if (filters.mobile) {
            queryText += ` AND mobile = $${paramCount}`;
            params.push(filters.mobile);
            paramCount++;
        }

        // Filter by date range (for timestamp, compare date part)
        if (filters.date_from && filters.date_to) {
            queryText += ` AND DATE(registry_date) >= $${paramCount}::date AND DATE(registry_date) <= $${paramCount + 1}::date`;
            params.push(filters.date_from, filters.date_to);
            paramCount += 2;
        } else if (filters.date) {
            queryText += ` AND DATE(registry_date) = $${paramCount}::date`;
            params.push(filters.date);
            paramCount++;
        }

        // Search by name (case-insensitive partial match)
        if (filters.search) {
            queryText += ` AND LOWER(name) LIKE $${paramCount}`;
            params.push(`%${filters.search.toLowerCase()}%`);
            paramCount++;
        }

        queryText += ' ORDER BY registry_date DESC, created_at DESC';

        // Pagination
        if (filters.limit) {
            queryText += ` LIMIT $${paramCount}`;
            params.push(filters.limit);
            paramCount++;
        }

        if (filters.offset) {
            queryText += ` OFFSET $${paramCount}`;
            params.push(filters.offset);
            paramCount++;
        }

        const result = await query(queryText, params);
        return result.rows;
    }

    // Get total count for pagination
    static async count(filters = {}) {
        let queryText = 'SELECT COUNT(*) as total FROM customer_registry WHERE 1=1';
        const params = [];
        let paramCount = 1;

        // Filter by mobile
        if (filters.mobile) {
            queryText += ` AND mobile = $${paramCount}`;
            params.push(filters.mobile);
            paramCount++;
        }

        // Filter by date range (for timestamp, compare date part)
        if (filters.date_from && filters.date_to) {
            queryText += ` AND DATE(registry_date) >= $${paramCount}::date AND DATE(registry_date) <= $${paramCount + 1}::date`;
            params.push(filters.date_from, filters.date_to);
            paramCount += 2;
        } else if (filters.date) {
            queryText += ` AND DATE(registry_date) = $${paramCount}::date`;
            params.push(filters.date);
            paramCount++;
        }

        // Search by name
        if (filters.search) {
            queryText += ` AND LOWER(name) LIKE $${paramCount}`;
            params.push(`%${filters.search.toLowerCase()}%`);
            paramCount++;
        }

        const result = await query(queryText, params);
        return parseInt(result.rows[0].total);
    }

    // Update registry entry
    static async update(id, updates) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) {
                fields.push(`${key} = $${paramCount}`);
                values.push(updates[key]);
                paramCount++;
            }
        });

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        // Always update updated_at
        fields.push(`updated_at = CURRENT_TIMESTAMP`);

        values.push(id);
        const result = await query(
            `UPDATE customer_registry SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );
        return result.rows[0];
    }

    // Delete registry entry
    static async delete(id) {
        const result = await query(
            'DELETE FROM customer_registry WHERE id = $1 RETURNING *',
            [id]
        );
        return result.rows[0];
    }

    // Get registered customers with order status for a specific date
    // Returns all customers registered on the date, with order info if orders exist for that mobile on that date
    static async getRegisteredCustomersWithOrders(date, storeIds = null) {
        let queryText = `
            SELECT 
                cr.id as registry_id,
                cr.name as customer_name,
                cr.mobile as customer_mobile,
                cr.registry_date,
                cr.created_at as registry_created_at,
                CASE 
                    WHEN o.id IS NOT NULL THEN true 
                    ELSE false 
                END as has_order,
                o.id as order_id,
                o.order_number,
                o.created_at as order_created_at,
                o.total_amount,
                o.status as order_status
            FROM customer_registry cr
            LEFT JOIN orders o ON cr.mobile = o.customer_phone 
                AND DATE(o.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = $1::date
            WHERE DATE(cr.registry_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = $1::date
        `;
        const params = [date];
        let paramCount = 2;

        // Filter by store IDs if provided (for orders)
        if (storeIds && Array.isArray(storeIds) && storeIds.length > 0) {
            queryText += ` AND (o.store_id IS NULL OR o.store_id = ANY($${paramCount}))`;
            params.push(storeIds);
            paramCount++;
        }

        queryText += ' ORDER BY cr.registry_date DESC, o.created_at DESC';

        const result = await query(queryText, params);
        return result.rows;
    }
}

module.exports = CustomerRegistry;
