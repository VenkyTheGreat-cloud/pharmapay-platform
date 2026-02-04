const { query } = require('../config/database');

class ReturnItem {
    // Create return items (bulk insert)
    static async createMany(orderId, items) {
        if (!items || items.length === 0) {
            return [];
        }

        const values = [];
        const placeholders = [];
        let paramCount = 1;

        items.forEach((item) => {
            const { name, quantity } = item;
            placeholders.push(`($${paramCount}, $${paramCount + 1}, $${paramCount + 2})`);
            values.push(orderId, name, quantity);
            paramCount += 3;
        });

        const result = await query(
            `INSERT INTO return_items (order_id, name, quantity)
             VALUES ${placeholders.join(', ')}
             RETURNING *`,
            values
        );
        return result.rows;
    }

    // Get return items by order ID
    static async findByOrderId(orderId) {
        const result = await query(
            'SELECT * FROM return_items WHERE order_id = $1 ORDER BY id ASC',
            [orderId]
        );
        return result.rows;
    }

    // Delete return items by order ID
    static async deleteByOrderId(orderId) {
        const result = await query(
            'DELETE FROM return_items WHERE order_id = $1',
            [orderId]
        );
        return result.rowCount;
    }
}

module.exports = ReturnItem;
