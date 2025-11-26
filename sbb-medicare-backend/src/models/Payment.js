const { query, transaction } = require('../config/database');

class Payment {
    // Create a new payment
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
            // Create payment
            const result = await client.query(
                `INSERT INTO payments (order_id, payment_mode, cash_amount, bank_amount,
                                      transaction_reference, receipt_photo_url, status, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, 'CONFIRMED', $7)
                 RETURNING *`,
                [order_id, payment_mode, cash_amount || 0, bank_amount || 0,
                 transaction_reference, receipt_photo_url, created_by]
            );

            // Update order payment status
            await client.query(
                `UPDATE orders SET payment_status = 'PAID', payment_mode = $1 WHERE id = $2`,
                [payment_mode, order_id]
            );

            return result.rows[0];
        });
    }

    // Find payment by order ID
    static async findByOrderId(orderId) {
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
}

module.exports = Payment;
