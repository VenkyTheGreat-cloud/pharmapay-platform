const { query } = require('../config/database');

class User {
    // Create a new user
    static async create(userData) {
        const { name, store_name, mobile, email, password_hash, address, role, is_active } = userData;
        
        // Ensure role is valid (must be exactly 'admin' or 'store_manager' for database constraint)
        // Database constraint: CHECK (role IN ('admin', 'store_manager'))
        let validRole = 'store_manager'; // Default value
        
        if (role && typeof role === 'string') {
            const normalizedRole = role.trim().toLowerCase();
            // Only accept exact matches to database constraint values
            if (normalizedRole === 'admin') {
                validRole = 'admin';
            } else if (normalizedRole === 'store_manager') {
                validRole = 'store_manager';
            }
            // If role doesn't match, keep default 'store_manager'
        }
        
        // Final validation - ensure it's exactly one of the allowed values
        if (validRole !== 'admin' && validRole !== 'store_manager') {
            validRole = 'store_manager';
        }
        
        // Default is_active to true if not provided
        const activeStatus = is_active !== undefined ? is_active : true;
        
        // Log the exact role value being inserted (for debugging)
        const logger = require('../config/logger');
        logger.debug('Creating user with role', { 
            role: validRole, 
            roleType: typeof validRole,
            roleLength: validRole.length,
            roleBytes: Buffer.from(validRole).toString('hex')
        });
        
        const result = await query(
            `INSERT INTO users (name, store_name, mobile, email, password_hash, address, role, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id, name, store_name, mobile, email, address, role, is_active, created_at, updated_at`,
            [name, store_name, mobile, email, password_hash, address, validRole, activeStatus]
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

    // Find user by mobile
    static async findByMobile(mobile) {
        const result = await query(
            'SELECT * FROM users WHERE mobile = $1',
            [mobile]
        );
        return result.rows[0];
    }

    // Find user by email or mobile
    static async findByEmailOrMobile(mobileEmail) {
        const result = await query(
            'SELECT * FROM users WHERE email = $1 OR mobile = $1',
            [mobileEmail]
        );
        return result.rows[0];
    }

    // Find user by ID
    static async findById(id) {
        const result = await query(
            'SELECT id, name, store_name, mobile, email, address, role, is_active, created_at, updated_at FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    // Get all users by role
    static async findByRole(role) {
        const result = await query(
            'SELECT id, name, store_name, mobile, email, address, role, is_active, created_at, updated_at FROM users WHERE role = $1 ORDER BY created_at DESC',
            [role]
        );
        return result.rows;
    }

    // Get all store managers (for admin)
    static async getAllStoreManagers() {
        return this.findByRole('store_manager');
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
             RETURNING id, name, store_name, mobile, email, address, role, is_active, updated_at`,
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

    // Toggle active status
    static async toggleActive(id, isActive) {
        const result = await query(
            'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, name, is_active',
            [isActive, id]
        );
        return result.rows[0];
    }
}

module.exports = User;
