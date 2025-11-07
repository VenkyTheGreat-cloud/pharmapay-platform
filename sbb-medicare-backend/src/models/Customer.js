const { query } = require('../config/database');

class Customer {
    // Create a new customer
    static async create(customerData) {
        const { full_name, mobile_number, address, latitude, longitude, landmark, created_by } = customerData;
        const result = await query(
            `INSERT INTO customers (full_name, mobile_number, address, latitude, longitude, landmark, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [full_name, mobile_number, address, latitude, longitude, landmark, created_by]
        );
        return result.rows[0];
    }

    // Find customer by ID
    static async findById(id) {
        const result = await query(
            'SELECT * FROM customers WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    // Find customer by mobile number
    static async findByMobile(mobile_number) {
        const result = await query(
            'SELECT * FROM customers WHERE mobile_number = $1',
            [mobile_number]
        );
        return result.rows[0];
    }

    // Get all customers
    static async findAll(limit = 100, offset = 0) {
        const result = await query(
            'SELECT * FROM customers ORDER BY created_at DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );
        return result.rows;
    }

    // Search customers
    static async search(searchTerm) {
        const result = await query(
            `SELECT * FROM customers
             WHERE full_name ILIKE $1 OR mobile_number ILIKE $1 OR address ILIKE $1
             ORDER BY created_at DESC`,
            [`%${searchTerm}%`]
        );
        return result.rows;
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
        const result = await query(
            'DELETE FROM customers WHERE id = $1 RETURNING id',
            [id]
        );
        return result.rowCount > 0;
    }

    // Get customer with order count
    static async getWithOrderCount(id) {
        const result = await query(
            `SELECT c.*, COUNT(o.id) as order_count
             FROM customers c
             LEFT JOIN orders o ON c.id = o.customer_id
             WHERE c.id = $1
             GROUP BY c.id`,
            [id]
        );
        return result.rows[0];
    }
}

module.exports = Customer;
