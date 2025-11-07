const { query } = require('../config/database');

class Payment {
    // Create a new payment
    static async create(paymentData) {
        const {
            order_id,
            payment_mode,
            cash_amount,
            bank_amount,
            total_amount,
            receipt_image,
            transaction_reference,
            collected_by
        } = paymentData;

        const result = await query(
            `INSERT INTO payments (order_id, payment_mode, cash_amount, bank_amount, total_amount,
                                   receipt_image, transaction_reference, collected_by, payment_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'completed')
             RETURNING *`,
            [order_id, payment_mode, cash_amount || 0, bank_amount || 0, total_amount,
             receipt_image, transaction_reference, collected_by]
        );
        return result.rows[0];
    }

    // Find payment by order ID
    static async findByOrderId(orderId) {
        const result = await query(
            `SELECT p.*, u.full_name as collected_by_name
             FROM payments p
             LEFT JOIN users u ON p.collected_by = u.id
             WHERE p.order_id = $1`,
            [orderId]
        );
        return result.rows[0];
    }

    // Find payment by ID
    static async findById(id) {
        const result = await query(
            'SELECT * FROM payments WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    // Get all payments
    static async findAll(filters = {}) {
        let queryText = `
            SELECT p.*, o.order_number, c.full_name as customer_name,
                   u.full_name as collected_by_name
            FROM payments p
            LEFT JOIN orders o ON p.order_id = o.id
            LEFT JOIN customers c ON o.customer_id = c.id
            LEFT JOIN users u ON p.collected_by = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (filters.payment_mode) {
            queryText += ` AND p.payment_mode = $${paramCount}`;
            params.push(filters.payment_mode);
            paramCount++;
        }

        if (filters.collected_by) {
            queryText += ` AND p.collected_by = $${paramCount}`;
            params.push(filters.collected_by);
            paramCount++;
        }

        if (filters.date_from) {
            queryText += ` AND DATE(p.payment_date) >= $${paramCount}`;
            params.push(filters.date_from);
            paramCount++;
        }

        if (filters.date_to) {
            queryText += ` AND DATE(p.payment_date) <= $${paramCount}`;
            params.push(filters.date_to);
            paramCount++;
        }

        queryText += ' ORDER BY p.payment_date DESC';

        const result = await query(queryText, params);
        return result.rows;
    }

    // Get payment statistics
    static async getStatistics(dateFrom, dateTo) {
        const result = await query(
            `SELECT
                COUNT(*) as total_payments,
                SUM(total_amount) as total_amount,
                SUM(cash_amount) as total_cash,
                SUM(bank_amount) as total_bank,
                COUNT(CASE WHEN payment_mode = 'cash' THEN 1 END) as cash_payments,
                COUNT(CASE WHEN payment_mode = 'bank' THEN 1 END) as bank_payments,
                COUNT(CASE WHEN payment_mode = 'split' THEN 1 END) as split_payments
             FROM payments
             WHERE DATE(payment_date) BETWEEN $1 AND $2`,
            [dateFrom, dateTo]
        );
        return result.rows[0];
    }

    // Update payment status
    static async updateStatus(id, status) {
        const result = await query(
            'UPDATE payments SET payment_status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        return result.rows[0];
    }
}

module.exports = Payment;
