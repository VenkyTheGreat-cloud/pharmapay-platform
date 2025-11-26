const { query, transaction } = require('../config/database');

class Order {
    // Create a new order
    static async create(orderData) {
        const {
            customer_id,
            assigned_delivery_boy_id,
            store_id,
            customer_name,
            customer_phone,
            customer_address,
            customer_lat,
            customer_lng,
            total_amount,
            customer_comments
        } = orderData;

        return transaction(async (client) => {
            // Generate order number
            const orderNumberResult = await client.query(
                'SELECT generate_order_number($1) as order_number',
                [store_id]
            );
            const orderNumber = orderNumberResult.rows[0].order_number;

            // Create order
            const orderResult = await client.query(
                `INSERT INTO orders (order_number, customer_id, assigned_delivery_boy_id, store_id,
                                    customer_name, customer_phone, customer_address, customer_lat, customer_lng,
                                    total_amount, status, customer_comments, assigned_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ASSIGNED', $11, CURRENT_TIMESTAMP)
                 RETURNING *`,
                [orderNumber, customer_id, assigned_delivery_boy_id, store_id,
                 customer_name, customer_phone, customer_address, customer_lat, customer_lng,
                 total_amount, customer_comments]
            );

            const order = orderResult.rows[0];

            // Create order status history
            await client.query(
                `INSERT INTO order_status_history (order_id, status, changed_by, notes)
                 VALUES ($1, $2, $3, $4)`,
                [order.id, 'ASSIGNED', store_id, 'Order created and assigned']
            );

            return order;
        });
    }

    // Find order by ID
    static async findById(id) {
        const result = await query(
            `SELECT o.*, 
                    db.name as delivery_boy_name, db.mobile as delivery_boy_mobile,
                    u.name as store_name, u.store_name as store_store_name
             FROM orders o
             LEFT JOIN delivery_boys db ON o.assigned_delivery_boy_id = db.id
             LEFT JOIN users u ON o.store_id = u.id
             WHERE o.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    // Find order by order number
    static async findByOrderNumber(orderNumber) {
        const result = await query(
            'SELECT * FROM orders WHERE order_number = $1',
            [orderNumber]
        );
        return result.rows[0];
    }

    // Get all orders with filters and pagination
    static async findAll(filters = {}) {
        let queryText = `
            SELECT o.*, 
                   db.name as delivery_boy_name, db.mobile as delivery_boy_mobile,
                   u.name as store_name
            FROM orders o
            LEFT JOIN delivery_boys db ON o.assigned_delivery_boy_id = db.id
            LEFT JOIN users u ON o.store_id = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (filters.store_id) {
            queryText += ` AND o.store_id = $${paramCount}`;
            params.push(filters.store_id);
            paramCount++;
        }

        if (filters.status) {
            queryText += ` AND o.status = $${paramCount}`;
            params.push(filters.status);
            paramCount++;
        }

        if (filters.date) {
            queryText += ` AND DATE(o.created_at) = $${paramCount}`;
            params.push(filters.date);
            paramCount++;
        }

        if (filters.assigned_delivery_boy_id) {
            queryText += ` AND o.assigned_delivery_boy_id = $${paramCount}`;
            params.push(filters.assigned_delivery_boy_id);
            paramCount++;
        }

        queryText += ' ORDER BY o.created_at DESC';

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
        let queryText = 'SELECT COUNT(*) as total FROM orders WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (filters.store_id) {
            queryText += ` AND store_id = $${paramCount}`;
            params.push(filters.store_id);
            paramCount++;
        }

        if (filters.status) {
            queryText += ` AND status = $${paramCount}`;
            params.push(filters.status);
            paramCount++;
        }

        if (filters.date) {
            queryText += ` AND DATE(created_at) = $${paramCount}`;
            params.push(filters.date);
            paramCount++;
        }

        const result = await query(queryText, params);
        return parseInt(result.rows[0].total);
    }

    // Get today's orders
    static async getTodayOrders(storeId = null) {
        const filters = { date: new Date().toISOString().split('T')[0] };
        if (storeId) filters.store_id = storeId;
        return this.findAll(filters);
    }

    // Get ongoing orders (ASSIGNED, PICKED_UP, IN_TRANSIT, PAYMENT_COLLECTION)
    static async getOngoingOrders(storeId = null) {
        const filters = {
            status: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'PAYMENT_COLLECTION']
        };
        if (storeId) filters.store_id = storeId;
        
        let queryText = `
            SELECT o.*, 
                   db.name as delivery_boy_name, db.mobile as delivery_boy_mobile
            FROM orders o
            LEFT JOIN delivery_boys db ON o.assigned_delivery_boy_id = db.id
            WHERE o.status IN ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'PAYMENT_COLLECTION')
        `;
        const params = [];
        let paramCount = 1;

        if (storeId) {
            queryText += ` AND o.store_id = $${paramCount}`;
            params.push(storeId);
        }

        queryText += ' ORDER BY o.created_at DESC';
        const result = await query(queryText, params);
        return result.rows;
    }

    // Get orders by customer mobile
    static async getByCustomerMobile(mobile, storeId = null) {
        let queryText = `
            SELECT o.*, 
                   db.name as delivery_boy_name, db.mobile as delivery_boy_mobile
            FROM orders o
            LEFT JOIN delivery_boys db ON o.assigned_delivery_boy_id = db.id
            WHERE o.customer_phone = $1
        `;
        const params = [mobile];
        let paramCount = 2;

        if (storeId) {
            queryText += ` AND o.store_id = $${paramCount}`;
            params.push(storeId);
            paramCount++;
        }

        queryText += ' ORDER BY o.created_at DESC';
        const result = await query(queryText, params);
        return result.rows;
    }

    // Assign order to delivery boy
    static async assign(orderId, deliveryBoyId, assignedBy) {
        return transaction(async (client) => {
            const result = await client.query(
                `UPDATE orders
                 SET assigned_delivery_boy_id = $1, status = 'ASSIGNED', assigned_at = CURRENT_TIMESTAMP
                 WHERE id = $2
                 RETURNING *`,
                [deliveryBoyId, orderId]
            );

            if (result.rowCount === 0) {
                throw new Error('NOT_FOUND');
            }

            // Create status history
            await client.query(
                `INSERT INTO order_status_history (order_id, status, changed_by, notes)
                 VALUES ($1, $2, $3, $4)`,
                [orderId, 'ASSIGNED', assignedBy, 'Order assigned to delivery boy']
            );

            return result.rows[0];
        });
    }

    // Update order status
    static async updateStatus(orderId, status, changedBy, notes = null) {
        return transaction(async (client) => {
            // Get current order
            const orderResult = await client.query('SELECT * FROM orders WHERE id = $1', [orderId]);
            if (orderResult.rowCount === 0) {
                throw new Error('NOT_FOUND');
            }
            const order = orderResult.rows[0];

            // Validate status transition
            const validTransitions = {
                'ASSIGNED': ['PICKED_UP', 'CANCELLED'],
                'PICKED_UP': ['IN_TRANSIT', 'CANCELLED'],
                'IN_TRANSIT': ['PAYMENT_COLLECTION', 'DELIVERED', 'CANCELLED'],
                'PAYMENT_COLLECTION': ['DELIVERED', 'CANCELLED']
            };

            if (!validTransitions[order.status] || !validTransitions[order.status].includes(status)) {
                throw new Error('INVALID_STATUS_TRANSITION');
            }

            // Check if another order is IN_TRANSIT for this delivery boy
            if (status === 'IN_TRANSIT' && order.assigned_delivery_boy_id) {
                const inTransitCheck = await client.query(
                    `SELECT id FROM orders 
                     WHERE assigned_delivery_boy_id = $1 AND status = 'IN_TRANSIT' AND id != $2`,
                    [order.assigned_delivery_boy_id, orderId]
                );
                if (inTransitCheck.rowCount > 0) {
                    throw new Error('CONFLICT');
                }
            }

            // Update order with appropriate timestamp
            const timestampFields = {
                'PICKED_UP': 'picked_up_at',
                'IN_TRANSIT': 'in_transit_at',
                'PAYMENT_COLLECTION': 'payment_collection_at',
                'DELIVERED': 'delivered_at',
                'CANCELLED': 'cancelled_at'
            };

            const timestampField = timestampFields[status];
            let updateQuery = `UPDATE orders SET status = $1`;
            const updateParams = [status];
            let paramCount = 2;

            if (timestampField) {
                updateQuery += `, ${timestampField} = CURRENT_TIMESTAMP`;
            }

            updateQuery += ` WHERE id = $${paramCount} RETURNING *`;
            updateParams.push(orderId);

            const updateResult = await client.query(updateQuery, updateParams);

            // Create status history
            await client.query(
                `INSERT INTO order_status_history (order_id, status, changed_by, notes)
                 VALUES ($1, $2, $3, $4)`,
                [orderId, status, changedBy, notes]
            );

            return updateResult.rows[0];
        });
    }

    // Update order
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
            `UPDATE orders SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );
        return result.rows[0];
    }

    // Get order status history
    static async getStatusHistory(orderId) {
        const result = await query(
            `SELECT osh.*, u.name as changed_by_name
             FROM order_status_history osh
             LEFT JOIN users u ON osh.changed_by = u.id
             WHERE osh.order_id = $1
             ORDER BY osh.created_at ASC`,
            [orderId]
        );
        return result.rows;
    }
}

module.exports = Order;
