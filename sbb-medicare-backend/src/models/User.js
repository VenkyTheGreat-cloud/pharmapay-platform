const { query } = require('../config/database');

class User {
    // Create a new user
    static async create(userData) {
        const { email, password_hash, full_name, mobile_number, role, profile_image, address } = userData;
        const result = await query(
            `INSERT INTO users (email, password_hash, full_name, mobile_number, role, profile_image, address)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, email, full_name, mobile_number, role, status, profile_image, address, created_at`,
            [email, password_hash, full_name, mobile_number, role, profile_image, address]
        );
        return result.rows[0];
    }

    // Find user by email
    static async findByEmail(email) {
        const result = await query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return result.rows[0];
    }

    // Find user by ID
    static async findById(id) {
        const result = await query(
            'SELECT id, email, full_name, mobile_number, role, status, profile_image, address, created_at, updated_at FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    // Get all users by role
    static async findByRole(role, status = null) {
        let queryText = 'SELECT id, email, full_name, mobile_number, role, status, profile_image, address, created_at FROM users WHERE role = $1';
        const params = [role];

        if (status) {
            queryText += ' AND status = $2';
            params.push(status);
        }

        queryText += ' ORDER BY created_at DESC';
        const result = await query(queryText, params);
        return result.rows;
    }

    // Update user
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
            `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount}
             RETURNING id, email, full_name, mobile_number, role, status, profile_image, address, updated_at`,
            values
        );
        return result.rows[0];
    }

    // Delete user
    static async delete(id) {
        const result = await query(
            'DELETE FROM users WHERE id = $1 RETURNING id',
            [id]
        );
        return result.rowCount > 0;
    }

    // Update user status (for approval/rejection)
    static async updateStatus(id, status) {
        const result = await query(
            'UPDATE users SET status = $1 WHERE id = $2 RETURNING id, email, full_name, status',
            [status, id]
        );
        return result.rows[0];
    }

    // Get all delivery boys
    static async getDeliveryBoys(status = null) {
        return this.findByRole('delivery_boy', status);
    }

    // Get pending delivery boy requests
    static async getPendingDeliveryBoys() {
        return this.findByRole('delivery_boy', 'pending');
    }
}

module.exports = User;
