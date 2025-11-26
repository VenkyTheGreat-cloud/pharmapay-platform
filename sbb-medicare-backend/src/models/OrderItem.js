const { query } = require('../config/database');

class OrderItem {
    // Create order items (bulk insert)
    static async createMany(orderId, items) {
        const values = [];
        const placeholders = [];
        let paramCount = 1;

        items.forEach((item, index) => {
            const { name, quantity, price } = item;
            const total = quantity * price;
            placeholders.push(`($${paramCount}, $${paramCount + 1}, $${paramCount + 2}, $${paramCount + 3}, $${paramCount + 4})`);
            values.push(orderId, name, quantity, price, total);
            paramCount += 5;
        });

        const result = await query(
            `INSERT INTO order_items (order_id, name, quantity, price, total)
             VALUES ${placeholders.join(', ')}
             RETURNING *`,
            values
        );
        return result.rows;
    }

    // Get items by order ID
    static async findByOrderId(orderId) {
        const result = await query(
            'SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC',
            [orderId]
        );
        return result.rows;
    }

    // Delete items by order ID
    static async deleteByOrderId(orderId) {
        const result = await query(
            'DELETE FROM order_items WHERE order_id = $1',
            [orderId]
        );
        return result.rowCount;
    }
}

module.exports = OrderItem;

