const { query, transaction } = require('../config/database');

class Payment {
    // Create a new payment (supports partial payments)
    static async create(paymentData) {
        const {
            order_id,
            payment_mode,
            cash_amount,
            bank_amount,
            transaction_reference,
            receipt_photo_url,
            created_by
        } = paymentData;

        return transaction(async (client) => {
            // Get order total amount
            const orderResult = await client.query(
                'SELECT total_amount FROM orders WHERE id = $1',
                [order_id]
            );
            if (orderResult.rowCount === 0) {
                throw new Error('ORDER_NOT_FOUND');
            }
            const orderTotal = parseFloat(orderResult.rows[0].total_amount);

            // Create payment
            const result = await client.query(
                `INSERT INTO payments (order_id, payment_mode, cash_amount, bank_amount,
                                      transaction_reference, receipt_photo_url, status, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, 'CONFIRMED', $7)
                 RETURNING *`,
                [order_id, payment_mode, cash_amount || 0, bank_amount || 0,
                 transaction_reference, receipt_photo_url, created_by]
            );

            // Calculate total paid amount (sum of all confirmed payments)
            const totalPaidResult = await client.query(
                `SELECT COALESCE(SUM(cash_amount + bank_amount), 0) as total_paid
                 FROM payments
                 WHERE order_id = $1 AND status = 'CONFIRMED'`,
                [order_id]
            );
            const totalPaid = parseFloat(totalPaidResult.rows[0].total_paid);

            // Update order payment status based on total paid
            let paymentStatus = 'PENDING';
            if (totalPaid >= orderTotal) {
                paymentStatus = 'PAID';
            } else if (totalPaid > 0) {
                paymentStatus = 'PARTIAL';
            }

            // Update order payment status and mode
            await client.query(
                `UPDATE orders 
                 SET payment_status = $1, 
                     payment_mode = CASE WHEN payment_mode IS NULL THEN $2 ELSE payment_mode END
                 WHERE id = $3`,
                [paymentStatus, payment_mode, order_id]
            );

            // NOTE: Do NOT auto-mark order as DELIVERED here.
            // Order status will change via the normal status flow (ASSIGNED -> ... -> DELIVERED).

            return result.rows[0];
        });
    }

    // Find all payments by order ID (returns all payments for the order)
    static async findByOrderId(orderId) {
        const result = await query(
            `SELECT p.*, db.name as created_by_name
             FROM payments p
             LEFT JOIN delivery_boys db ON p.created_by = db.id
             WHERE p.order_id = $1
             ORDER BY p.created_at DESC`,
            [orderId]
        );
        return result.rows;
    }

    // Get latest payment by order ID
    static async findLatestByOrderId(orderId) {
        const result = await query(
            `SELECT p.*, db.name as created_by_name
             FROM payments p
             LEFT JOIN delivery_boys db ON p.created_by = db.id
             WHERE p.order_id = $1
             ORDER BY p.created_at DESC
             LIMIT 1`,
            [orderId]
        );
        return result.rows[0];
    }

    // Get payment summary for an order (paid amount, remaining amount)
    static async getPaymentSummary(orderId) {
        const result = await query(
            `SELECT 
                o.total_amount,
                COALESCE(SUM(p.cash_amount + p.bank_amount), 0) as total_paid,
                o.total_amount - COALESCE(SUM(p.cash_amount + p.bank_amount), 0) as remaining_amount,
                o.payment_status
             FROM orders o
             LEFT JOIN payments p ON o.id = p.order_id AND p.status = 'CONFIRMED'
             WHERE o.id = $1
             GROUP BY o.id, o.total_amount, o.payment_status`,
            [orderId]
        );
        
        if (result.rows.length === 0) {
            return null;
        }

        const row = result.rows[0];
        return {
            total_amount: parseFloat(row.total_amount || 0),
            total_paid: parseFloat(row.total_paid || 0),
            remaining_amount: parseFloat(row.remaining_amount || 0),
            payment_status: row.payment_status,
            is_fully_paid: parseFloat(row.total_paid || 0) >= parseFloat(row.total_amount || 0)
        };
    }

    // Find payment by ID
    static async findById(id) {
        const result = await query(
            `SELECT p.*, db.name as created_by_name
             FROM payments p
             LEFT JOIN delivery_boys db ON p.created_by = db.id
             WHERE p.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    // Get all payments with filters
    static async findAll(filters = {}) {
        let queryText = `
            SELECT p.*, o.order_number, db.name as created_by_name
            FROM payments p
            LEFT JOIN orders o ON p.order_id = o.id
            LEFT JOIN delivery_boys db ON p.created_by = db.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (filters.order_id) {
            queryText += ` AND p.order_id = $${paramCount}`;
            params.push(filters.order_id);
            paramCount++;
        }

        if (filters.status) {
            queryText += ` AND p.status = $${paramCount}`;
            params.push(filters.status);
            paramCount++;
        }

        queryText += ' ORDER BY p.created_at DESC';

        const result = await query(queryText, params);
        return result.rows;
    }

    // Update payment
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
            `UPDATE payments SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );
        return result.rows[0];
    }

    // Get total collected amount for orders in a date range (based on order.created_at)
    static async getCollectedAmountByDateRange(fromDate, toDate, storeId = null) {
        let queryText = `
            SELECT COALESCE(SUM(p.cash_amount + p.bank_amount), 0) as total_collected
            FROM payments p
            INNER JOIN orders o ON p.order_id = o.id
            WHERE p.status = 'CONFIRMED'
              AND o.created_at >= $1::date
              AND o.created_at < ($2::date + INTERVAL '1 day')
        `;
        const params = [fromDate, toDate || fromDate];
        let paramCount = 3;

        if (storeId) {
            queryText += ` AND o.store_id = $${paramCount}`;
            params.push(storeId);
        }

        const result = await query(queryText, params);
        return parseFloat(result.rows[0].total_collected || 0);
    }
}

module.exports = Payment;
