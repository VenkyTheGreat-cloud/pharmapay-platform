const { query } = require('../config/database');

class Customer {
    // Create a new customer
    static async create(customerData) {
        const { name, mobile, address, area, landmark, customer_lat, customer_lng, store_id } = customerData;
        const result = await query(
            `INSERT INTO customers (name, mobile, address, area, landmark, customer_lat, customer_lng, store_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [name, mobile, address || null, area, landmark, customer_lat, customer_lng, store_id]
        );
        return result.rows[0];
    }

    // Find customer by ID
    static async findById(id) {
        const result = await query(
            `SELECT c.*, u.name as store_name, u.store_name as store_store_name,
                    (SELECT COUNT(*) FROM orders WHERE customer_id = c.id) as order_count
             FROM customers c
             LEFT JOIN users u ON c.store_id = u.id
             WHERE c.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    // Find customer by mobile and store
    static async findByMobileAndStore(mobile, store_id) {
        const result = await query(
            'SELECT * FROM customers WHERE mobile = $1 AND store_id = $2',
            [mobile, store_id]
        );
        return result.rows[0];
    }

    // Find customer by mobile (all stores)
    static async findByMobile(mobile, store_id = null) {
        let queryText = `
            SELECT c.*, u.name as store_name, u.store_name as store_store_name,
                   (SELECT COUNT(*) FROM orders WHERE customer_id = c.id) as order_count
            FROM customers c
            LEFT JOIN users u ON c.store_id = u.id
            WHERE c.mobile = $1
        `;
        const params = [mobile];

        if (store_id) {
            queryText += ' AND c.store_id = $2';
            params.push(store_id);
        }

        queryText += ' ORDER BY c.created_at DESC';
        const result = await query(queryText, params);
        return result.rows;
    }

    // Get all customers with pagination and filters
    static async findAll(filters = {}) {
        let queryText = `
            SELECT c.*, u.name as store_name, u.store_name as store_store_name,
                   (SELECT COUNT(*) FROM orders WHERE customer_id = c.id) as order_count
            FROM customers c
            LEFT JOIN users u ON c.store_id = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        // Single store_id filter (legacy)
        if (filters.store_id) {
            queryText += ` AND c.store_id = $${paramCount}`;
            params.push(filters.store_id);
            paramCount++;
        }

        // Multiple store IDs (admin group) - takes precedence if provided
        if (filters.store_ids && Array.isArray(filters.store_ids) && filters.store_ids.length > 0) {
            queryText += ` AND c.store_id = ANY($${paramCount})`;
            params.push(filters.store_ids);
            paramCount++;
        }

        if (filters.search) {
            queryText += ` AND (c.name ILIKE $${paramCount} OR c.mobile ILIKE $${paramCount})`;
            params.push(`%${filters.search}%`);
            paramCount++;
        }

        queryText += ' ORDER BY c.created_at DESC';

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
        let queryText = 'SELECT COUNT(*) as total FROM customers WHERE 1=1';
        const params = [];
        let paramCount = 1;

        // Single store_id filter (legacy)
        if (filters.store_id) {
            queryText += ` AND store_id = $${paramCount}`;
            params.push(filters.store_id);
            paramCount++;
        }

        // Multiple store IDs (admin group)
        if (filters.store_ids && Array.isArray(filters.store_ids) && filters.store_ids.length > 0) {
            queryText += ` AND store_id = ANY($${paramCount})`;
            params.push(filters.store_ids);
            paramCount++;
        }

        if (filters.search) {
            queryText += ` AND (name ILIKE $${paramCount} OR mobile ILIKE $${paramCount})`;
            params.push(`%${filters.search}%`);
            paramCount++;
        }

        const result = await query(queryText, params);
        return parseInt(result.rows[0].total);
    }

    // Update customer
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

        values.push(id);
        const result = await query(
            `UPDATE customers SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );
        return result.rows[0];
    }

    // Delete customer
    static async delete(id) {
        // Check if customer has orders
        const orderCheck = await query(
            'SELECT COUNT(*) as count FROM orders WHERE customer_id = $1',
            [id]
        );

        if (parseInt(orderCheck.rows[0].count) > 0) {
            throw new Error('CUSTOMER_HAS_ORDERS');
        }

        const result = await query(
            'DELETE FROM customers WHERE id = $1 RETURNING id',
            [id]
        );
        return result.rowCount > 0;
    }

    // Get customer orders with full details
    static async getOrders(customerId) {
        const result = await query(
            `SELECT 
                o.id,
                o.order_number,
                o.customer_id,
                o.customer_name,
                o.customer_phone,
                o.customer_address,
                o.customer_lat,
                o.customer_lng,
                o.total_amount,
                o.status,
                o.payment_status,
                o.payment_mode,
                o.notes,
                o.customer_comments,
                o.assigned_delivery_boy_id,
                o.store_id,
                o.assigned_at,
                o.picked_up_at,
                o.in_transit_at,
                o.payment_collection_at,
                o.delivered_at,
                o.cancelled_at,
                o.created_at,
                o.updated_at,
                db.name as delivery_boy_name,
                db.mobile as delivery_boy_mobile,
                u.name as store_name,
                u.store_name as store_store_name,
                (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
             FROM orders o
             LEFT JOIN delivery_boys db ON o.assigned_delivery_boy_id = db.id
             LEFT JOIN users u ON o.store_id = u.id
             WHERE o.customer_id = $1
             ORDER BY o.created_at DESC`,
            [customerId]
        );
        return result.rows;
    }
}

module.exports = Customer;
