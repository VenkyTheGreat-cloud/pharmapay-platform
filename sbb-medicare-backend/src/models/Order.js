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
                    u.name as store_name, u.store_name as store_store_name,
                    c.area as customer_area
             FROM orders o
             LEFT JOIN delivery_boys db ON o.assigned_delivery_boy_id = db.id
             LEFT JOIN users u ON o.store_id = u.id
             LEFT JOIN customers c ON o.customer_id = c.id
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
                   u.name as store_name,
                   c.area as customer_area
            FROM orders o
            LEFT JOIN delivery_boys db ON o.assigned_delivery_boy_id = db.id
            LEFT JOIN users u ON o.store_id = u.id
            LEFT JOIN customers c ON o.customer_id = c.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        // Single store_id (legacy)
        if (filters.store_id) {
            queryText += ` AND o.store_id = $${paramCount}`;
            params.push(filters.store_id);
            paramCount++;
        }

        // Multiple store IDs (admin group)
        if (filters.store_ids && Array.isArray(filters.store_ids) && filters.store_ids.length > 0) {
            queryText += ` AND o.store_id = ANY($${paramCount})`;
            params.push(filters.store_ids);
            paramCount++;
        }

        if (filters.status) {
            queryText += ` AND o.status = $${paramCount}`;
            params.push(filters.status);
            paramCount++;
        }

        // Date range filter (uses created_at - for orders created in date range)
        // Convert to IST timezone for accurate date comparison
        if (filters.date_from && filters.date_to) {
            queryText += ` AND (o.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date >= $${paramCount}::date 
                          AND (o.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date <= $${paramCount + 1}::date`;
            params.push(filters.date_from, filters.date_to);
            paramCount += 2;
        }
        // Single date filter (treats value as a calendar day, regardless of time)
        // Business definition: \"today's orders\" = orders ASSIGNED on that day
        // Convert to IST timezone for accurate date comparison
        else if (filters.date) {
            // Accept either 'YYYY-MM-DD' or full ISO datetime; we cast to ::date
            queryText += ` AND (o.assigned_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date = $${paramCount}::date`;
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

        // Single store_id (legacy)
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

        if (filters.status) {
            queryText += ` AND status = $${paramCount}`;
            params.push(filters.status);
            paramCount++;
        }

        // Date range filter (uses created_at - for orders created in date range)
        // Convert to IST timezone for accurate date comparison
        if (filters.date_from && filters.date_to) {
            queryText += ` AND (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date >= $${paramCount}::date 
                          AND (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date <= $${paramCount + 1}::date`;
            params.push(filters.date_from, filters.date_to);
            paramCount += 2;
        }
        // Single date filter (based on assigned_at for backward compatibility)
        // Convert to IST timezone for accurate date comparison
        else if (filters.date) {
            queryText += ` AND (assigned_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date = $${paramCount}::date`;
            params.push(filters.date);
            paramCount++;
        }

        if (filters.assigned_delivery_boy_id) {
            queryText += ` AND assigned_delivery_boy_id = $${paramCount}`;
            params.push(filters.assigned_delivery_boy_id);
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

    // Get ongoing orders (ASSIGNED, ACCEPTED, PICKED_UP, IN_TRANSIT, PAYMENT_COLLECTION)
    static async getOngoingOrders(storeId = null) {
        const filters = {
            status: ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'PAYMENT_COLLECTION']
        };
        if (storeId) filters.store_id = storeId;
        
        let queryText = `
            SELECT o.*, 
                   db.name as delivery_boy_name, db.mobile as delivery_boy_mobile,
                   c.area as customer_area
            FROM orders o
            LEFT JOIN delivery_boys db ON o.assigned_delivery_boy_id = db.id
            LEFT JOIN customers c ON o.customer_id = c.id
            WHERE o.status IN ('ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'PAYMENT_COLLECTION')
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

    // Get ongoing orders for a specific delivery boy
    static async getOngoingOrdersForDeliveryBoy(deliveryBoyId) {
        const result = await query(
            `SELECT o.*, 
                    db.name as delivery_boy_name, db.mobile as delivery_boy_mobile,
                    u.name as store_name, u.store_name as store_store_name,
                    c.area as customer_area
             FROM orders o
             LEFT JOIN delivery_boys db ON o.assigned_delivery_boy_id = db.id
             LEFT JOIN users u ON o.store_id = u.id
             LEFT JOIN customers c ON o.customer_id = c.id
             WHERE o.assigned_delivery_boy_id = $1
               AND o.status IN ('ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'PAYMENT_COLLECTION')
             ORDER BY o.created_at DESC`,
            [deliveryBoyId]
        );
        return result.rows;
    }

    // Get dashboard statistics for a date range (based on created_at)
    static async getDashboardStats({ storeId, fromDate, toDate }) {
        const params = [];
        let paramCount = 1;

        let where = 'WHERE o.created_at >= $1::date AND o.created_at < ($2::date + INTERVAL \'1 day\')';
        params.push(fromDate, toDate || fromDate);
        paramCount = 3;

        if (storeId) {
            where += ` AND o.store_id = $${paramCount}`;
            params.push(storeId);
            paramCount++;
        }

        const statsQuery = `
            SELECT
                COUNT(*) AS total_orders,
                COUNT(*) FILTER (WHERE o.status = 'DELIVERED') AS delivered_orders,
                COUNT(*) FILTER (WHERE o.status = 'ASSIGNED') AS assigned_orders,
                COUNT(*) FILTER (WHERE o.status = 'PICKED_UP') AS picked_up_orders,
                COUNT(*) FILTER (WHERE o.status = 'PAYMENT_COLLECTION') AS payment_collection_orders
            FROM orders o
            ${where}
        `;

        const statsResult = await query(statsQuery, params);
        return statsResult.rows[0];
    }

    // Get orders in date range for list
    // Requirements:
    // - Only orders inside date range (created_at)
    // - Show statuses: ASSIGNED, PICKED_UP, PAYMENT_COLLECTION, DELIVERED
    // - Do NOT show IN_TRANSIT or other active statuses
    static async getCompletedByDateRange({ storeId, fromDate, toDate }) {
        const params = [];
        let paramCount = 1;

        let queryText = `
            SELECT o.*,
                   db.name as delivery_boy_name,
                   db.mobile as delivery_boy_mobile,
                   u.name as store_name,
                   c.area as customer_area
            FROM orders o
            LEFT JOIN delivery_boys db ON o.assigned_delivery_boy_id = db.id
            LEFT JOIN users u ON o.store_id = u.id
            LEFT JOIN customers c ON o.customer_id = c.id
            WHERE o.created_at >= $1::date
              AND o.created_at < ($2::date + INTERVAL '1 day')
              AND o.status IN ('ASSIGNED', 'PICKED_UP', 'PAYMENT_COLLECTION', 'DELIVERED')
        `;
        params.push(fromDate, toDate || fromDate);
        paramCount = 3;

        if (storeId) {
            queryText += ` AND o.store_id = $${paramCount}`;
            params.push(storeId);
            paramCount++;
        }

        queryText += ' ORDER BY o.assigned_at DESC';

        const result = await query(queryText, params);
        return result.rows;
    }

    // Get orders by customer mobile
    static async getByCustomerMobile(mobile, storeId = null) {
        let queryText = `
            SELECT o.*, 
                   db.name as delivery_boy_name, db.mobile as delivery_boy_mobile,
                   c.area as customer_area
            FROM orders o
            LEFT JOIN delivery_boys db ON o.assigned_delivery_boy_id = db.id
            LEFT JOIN customers c ON o.customer_id = c.id
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
            // Get current order to check if it's REJECTED
            const currentOrder = await client.query('SELECT status FROM orders WHERE id = $1', [orderId]);
            if (currentOrder.rowCount === 0) {
                throw new Error('NOT_FOUND');
            }

            // If order is REJECTED, allow reassignment. Otherwise, it should be in a state that allows assignment
            const currentStatus = currentOrder.rows[0].status;
            if (currentStatus !== 'REJECTED' && currentStatus !== 'ASSIGNED') {
                throw new Error('INVALID_STATUS_FOR_ASSIGNMENT');
            }

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
            const notes = currentStatus === 'REJECTED' 
                ? 'Order reassigned to delivery boy (previously rejected)'
                : 'Order assigned to delivery boy';
            
            await client.query(
                `INSERT INTO order_status_history (order_id, status, changed_by, notes)
                 VALUES ($1, $2, $3, $4)`,
                [orderId, 'ASSIGNED', assignedBy, notes]
            );

            return result.rows[0];
        });
    }

    // Accept order (delivery boy accepts assigned order)
    static async accept(orderId, deliveryBoyId, notes = null) {
        return transaction(async (client) => {
            // Verify order is assigned to this delivery boy
            const orderResult = await client.query(
                'SELECT * FROM orders WHERE id = $1 AND assigned_delivery_boy_id = $2',
                [orderId, deliveryBoyId]
            );

            if (orderResult.rowCount === 0) {
                throw new Error('NOT_FOUND');
            }

            const order = orderResult.rows[0];

            // Only ASSIGNED orders can be accepted
            if (order.status !== 'ASSIGNED') {
                throw new Error('INVALID_STATUS_TRANSITION');
            }

            // Update status to ACCEPTED
            const result = await client.query(
                `UPDATE orders SET status = 'ACCEPTED' WHERE id = $1 RETURNING *`,
                [orderId]
            );

            // Create status history
            let changedByValue = null;
            let historyNotes = notes || 'Order accepted by delivery boy';
            
            // Get delivery boy name for notes
            try {
                const deliveryBoyResult = await client.query(
                    'SELECT name FROM delivery_boys WHERE id = $1',
                    [deliveryBoyId]
                );
                if (deliveryBoyResult.rows.length > 0) {
                    const dbName = deliveryBoyResult.rows[0].name;
                    historyNotes = notes ? `${notes} (Accepted by: ${dbName})` : `Accepted by delivery boy: ${dbName}`;
                }
            } catch (err) {
                // Ignore error, use default notes
            }

            await client.query(
                `INSERT INTO order_status_history (order_id, status, changed_by, notes)
                 VALUES ($1, $2, $3, $4)`,
                [orderId, 'ACCEPTED', changedByValue, historyNotes]
            );

            return result.rows[0];
        });
    }

    // Reject order (delivery boy rejects assigned order)
    static async reject(orderId, deliveryBoyId, reason = null) {
        return transaction(async (client) => {
            // Verify order is assigned to this delivery boy
            const orderResult = await client.query(
                'SELECT * FROM orders WHERE id = $1 AND assigned_delivery_boy_id = $2',
                [orderId, deliveryBoyId]
            );

            if (orderResult.rowCount === 0) {
                throw new Error('NOT_FOUND');
            }

            const order = orderResult.rows[0];

            // ASSIGNED or ACCEPTED orders can be rejected
            if (order.status !== 'ASSIGNED' && order.status !== 'ACCEPTED') {
                throw new Error('INVALID_STATUS_TRANSITION');
            }

            // Update status to REJECTED
            const result = await client.query(
                `UPDATE orders SET status = 'REJECTED' WHERE id = $1 RETURNING *`,
                [orderId]
            );

            // Create status history
            let changedByValue = null;
            let historyNotes = reason || 'Order rejected by delivery boy';
            
            // Get delivery boy name for notes
            try {
                const deliveryBoyResult = await client.query(
                    'SELECT name FROM delivery_boys WHERE id = $1',
                    [deliveryBoyId]
                );
                if (deliveryBoyResult.rows.length > 0) {
                    const dbName = deliveryBoyResult.rows[0].name;
                    historyNotes = reason 
                        ? `Rejected by ${dbName}: ${reason}` 
                        : `Rejected by delivery boy: ${dbName}`;
                }
            } catch (err) {
                // Ignore error, use default notes
            }

            await client.query(
                `INSERT INTO order_status_history (order_id, status, changed_by, notes)
                 VALUES ($1, $2, $3, $4)`,
                [orderId, 'REJECTED', changedByValue, historyNotes]
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

            // Validate status transition (allows both forward and backward transitions)
            const validTransitions = {
                'ASSIGNED': ['ACCEPTED', 'REJECTED', 'CANCELLED'], // Can accept, reject, or cancel
                'ACCEPTED': ['ASSIGNED', 'PICKED_UP', 'REJECTED', 'CANCELLED'], // Can go back to ASSIGNED, forward to PICKED_UP, reject, or cancel
                'REJECTED': ['ASSIGNED'], // Rejected orders can be reassigned
                'PICKED_UP': ['ACCEPTED', 'IN_TRANSIT', 'CANCELLED'], // Can go back to ACCEPTED, forward to IN_TRANSIT, or cancel
                'IN_TRANSIT': ['PICKED_UP', 'PAYMENT_COLLECTION', 'DELIVERED', 'CANCELLED'], // Can go back to PICKED_UP, forward to PAYMENT_COLLECTION/DELIVERED, or cancel
                'PAYMENT_COLLECTION': ['IN_TRANSIT', 'DELIVERED', 'CANCELLED'], // Can go back to IN_TRANSIT, forward to DELIVERED, or cancel
                'DELIVERED': ['PAYMENT_COLLECTION', 'CANCELLED'] // Can go back to PAYMENT_COLLECTION or cancel
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
                'ACCEPTED': 'assigned_at', // Update assigned_at when accepted (optional, can keep original)
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
            // changed_by is UUID (references users.id), but delivery boys have BIGINT IDs
            // Check if changedBy is a delivery boy ID (numeric) or UUID (has dashes)
            let changedByValue = null;
            let historyNotes = notes || '';
            
            // UUIDs contain dashes, delivery boy IDs are just numbers
            const changedByStr = String(changedBy || '');
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(changedByStr);
            
            if (isUUID) {
                // This is a UUID (admin/store manager)
                changedByValue = changedBy;
            } else if (/^\d+$/.test(changedByStr)) {
                // This is a numeric ID (delivery boy)
                // Set changed_by to NULL and add delivery boy name to notes
                try {
                    const deliveryBoyResult = await client.query(
                        'SELECT name FROM delivery_boys WHERE id = $1',
                        [changedBy]
                    );
                    if (deliveryBoyResult.rows.length > 0) {
                        const dbName = deliveryBoyResult.rows[0].name;
                        historyNotes = notes ? `${notes} (Changed by delivery boy: ${dbName})` : `Changed by delivery boy: ${dbName}`;
                    } else {
                        historyNotes = notes || 'Changed by delivery boy';
                    }
                } catch (err) {
                    historyNotes = notes || 'Changed by delivery boy';
                }
            }

            await client.query(
                `INSERT INTO order_status_history (order_id, status, changed_by, notes)
                 VALUES ($1, $2, $3, $4)`,
                [orderId, status, changedByValue, historyNotes]
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
