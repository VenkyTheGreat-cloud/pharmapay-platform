const { query } = require('../config/database');

class DeliveryBoy {
    // Create a new delivery boy
    static async create(deliveryBoyData) {
        const { name, mobile, email, address, photo_url, store_id } = deliveryBoyData;
        const result = await query(
            `INSERT INTO delivery_boys (name, mobile, email, address, photo_url, store_id, status, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, 'pending', false)
             RETURNING *`,
            [name, mobile, email, address, photo_url, store_id]
        );
        return result.rows[0];
    }

    // Find delivery boy by ID
    static async findById(id) {
        const result = await query(
            `SELECT db.*, u.name as store_name, u.store_name as store_store_name
             FROM delivery_boys db
             LEFT JOIN users u ON db.store_id = u.id
             WHERE db.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    // Find delivery boy by mobile
    static async findByMobile(mobile) {
        const result = await query(
            'SELECT * FROM delivery_boys WHERE mobile = $1',
            [mobile]
        );
        return result.rows[0];
    }

    // Get all delivery boys with filters
    static async findAll(filters = {}) {
        let queryText = `
            SELECT db.*, u.name as store_name, u.store_name as store_store_name
            FROM delivery_boys db
            LEFT JOIN users u ON db.store_id = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (filters.status) {
            queryText += ` AND db.status = $${paramCount}`;
            params.push(filters.status);
            paramCount++;
        }

        if (filters.isActive !== undefined) {
            queryText += ` AND db.is_active = $${paramCount}`;
            params.push(filters.isActive);
            paramCount++;
        }

        if (filters.store_id) {
            queryText += ` AND db.store_id = $${paramCount}`;
            params.push(filters.store_id);
            paramCount++;
        }

        queryText += ' ORDER BY db.created_at DESC';

        const result = await query(queryText, params);
        return result.rows;
    }

    // Get approved and active delivery boys
    static async getApproved() {
        const result = await query(
            `SELECT db.*, u.name as store_name, u.store_name as store_store_name
             FROM delivery_boys db
             LEFT JOIN users u ON db.store_id = u.id
             WHERE db.status = 'approved' AND db.is_active = true
             ORDER BY db.name ASC`
        );
        return result.rows;
    }

    // Update delivery boy
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
            `UPDATE delivery_boys SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );
        return result.rows[0];
    }

    // Delete delivery boy
    static async delete(id) {
        const result = await query(
            'DELETE FROM delivery_boys WHERE id = $1 RETURNING id',
            [id]
        );
        return result.rowCount > 0;
    }

    // Approve delivery boy
    static async approve(id) {
        const result = await query(
            `UPDATE delivery_boys SET status = 'approved', is_active = true WHERE id = $1 RETURNING *`,
            [id]
        );
        return result.rows[0];
    }

    // Toggle active status
    static async toggleActive(id, isActive) {
        const updateResult = await query(
            'UPDATE delivery_boys SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
            [isActive, id]
        );
        
        if (updateResult.rowCount === 0) {
            return null;
        }
        
        // Return the full updated object
        return await this.findById(id);
    }
}

module.exports = DeliveryBoy;

