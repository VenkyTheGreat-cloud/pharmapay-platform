const { query, transaction } = require('../config/database');

class Order {
    // Create a new order
    static async create(orderData) {
        const { customer_id, items, total_amount, created_by, notes } = orderData;

        return transaction(async (client) => {
            // Generate order number
            const orderNumResult = await client.query('SELECT nextval(\'order_number_seq\')');
            const orderNumber = `SBB${orderNumResult.rows[0].nextval}`;

            const result = await client.query(
                `INSERT INTO orders (order_number, customer_id, items, total_amount, created_by, notes)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [orderNumber, customer_id, JSON.stringify(items), total_amount, created_by, notes]
            );

            // Create initial status history
            await client.query(
                `INSERT INTO order_status_history (order_id, status, changed_by, notes)
                 VALUES ($1, $2, $3, $4)`,
                [result.rows[0].id, 'new', created_by, 'Order created']
            );

            return result.rows[0];
        });
    }

    // Find order by ID
    static async findById(id) {
        const result = await query(
            `SELECT o.*, c.full_name as customer_name, c.mobile_number as customer_mobile,
                    c.address as customer_address, c.latitude, c.longitude,
                    u.full_name as delivery_boy_name, u.mobile_number as delivery_boy_mobile
             FROM orders o
             LEFT JOIN customers c ON o.customer_id = c.id
             LEFT JOIN users u ON o.delivery_boy_id = u.id
             WHERE o.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    // Get all orders
    static async findAll(filters = {}) {
        let queryText = `
            SELECT o.*, c.full_name as customer_name, c.mobile_number as customer_mobile,
                   u.full_name as delivery_boy_name
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            LEFT JOIN users u ON o.delivery_boy_id = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (filters.status) {
            queryText += ` AND o.status = $${paramCount}`;
            params.push(filters.status);
            paramCount++;
        }

        if (filters.delivery_boy_id) {
            queryText += ` AND o.delivery_boy_id = $${paramCount}`;
            params.push(filters.delivery_boy_id);
            paramCount++;
        }

        if (filters.date_from) {
            queryText += ` AND DATE(o.created_at) >= $${paramCount}`;
            params.push(filters.date_from);
            paramCount++;
        }

        if (filters.date_to) {
            queryText += ` AND DATE(o.created_at) <= $${paramCount}`;
            params.push(filters.date_to);
            paramCount++;
        }

        queryText += ' ORDER BY o.created_at DESC';

        if (filters.limit) {
            queryText += ` LIMIT $${paramCount}`;
            params.push(filters.limit);
            paramCount++;
        }

        const result = await query(queryText, params);
        return result.rows;
    }

    // Assign order to delivery boy
    static async assign(orderId, deliveryBoyId, assignedBy) {
        return transaction(async (client) => {
            const result = await client.query(
                `UPDATE orders
                 SET delivery_boy_id = $1, status = 'assigned', assigned_at = CURRENT_TIMESTAMP
                 WHERE id = $2 AND status = 'new'
                 RETURNING *`,
                [deliveryBoyId, orderId]
            );

            if (result.rowCount === 0) {
                throw new Error('Order not found or already assigned');
            }

            // Create status history
            await client.query(
                `INSERT INTO order_status_history (order_id, status, changed_by, notes)
                 VALUES ($1, $2, $3, $4)`,
                [orderId, 'assigned', assignedBy, `Assigned to delivery boy`]
            );

            return result.rows[0];
        });
    }

    // Update order status
    static async updateStatus(orderId, status, userId, notes = null, location = null) {
        return transaction(async (client) => {
            const updates = { status };

            if (status === 'picked_up') {
                updates.picked_up_at = 'CURRENT_TIMESTAMP';
            } else if (status === 'delivered') {
                updates.delivered_at = 'CURRENT_TIMESTAMP';
            }

            const fields = Object.keys(updates).map((key, i) =>
                `${key} = ${updates[key] === 'CURRENT_TIMESTAMP' ? 'CURRENT_TIMESTAMP' : `$${i + 1}`}`
            );
            const values = Object.values(updates).filter(v => v !== 'CURRENT_TIMESTAMP');
            values.push(orderId);

            const result = await client.query(
                `UPDATE orders SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`,
                values
            );

            if (result.rowCount === 0) {
                throw new Error('Order not found');
            }

            // Create status history
            const historyParams = [orderId, status, userId, notes];
            if (location) {
                historyParams.push(location.latitude, location.longitude);
                await client.query(
                    `INSERT INTO order_status_history (order_id, status, changed_by, notes, latitude, longitude)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    historyParams
                );
            } else {
                await client.query(
                    `INSERT INTO order_status_history (order_id, status, changed_by, notes)
                     VALUES ($1, $2, $3, $4)`,
                    historyParams
                );
            }

            return result.rows[0];
        });
    }

    // Get order history
    static async getHistory(orderId) {
        const result = await query(
            `SELECT osh.*, u.full_name as changed_by_name
             FROM order_status_history osh
             LEFT JOIN users u ON osh.changed_by = u.id
             WHERE osh.order_id = $1
             ORDER BY osh.created_at ASC`,
            [orderId]
        );
        return result.rows;
    }

    // Get orders by date range with statistics
    static async getOrdersByDateRange(dateFrom, dateTo) {
        const result = await query(
            `SELECT DATE(created_at) as order_date,
                    COUNT(*) as total_orders,
                    SUM(total_amount) as total_amount,
                    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
                    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
             FROM orders
             WHERE DATE(created_at) BETWEEN $1 AND $2
             GROUP BY DATE(created_at)
             ORDER BY order_date DESC`,
            [dateFrom, dateTo]
        );
        return result.rows;
    }

    // Delete order
    static async delete(id) {
        const result = await query(
            'DELETE FROM orders WHERE id = $1 AND status = \'new\' RETURNING id',
            [id]
        );
        return result.rowCount > 0;
    }
}

module.exports = Order;
