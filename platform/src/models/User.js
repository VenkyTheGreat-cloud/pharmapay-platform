const { query } = require('../config/database');

class User {
    // Create a new user
    static async create(userData) {
        const { name, store_name, mobile, email, password_hash, address, role, is_active, admin_id } = userData;
        
        // Ensure role is valid (must be exactly 'admin' or 'store_manager' for database constraint)
        // Database constraint: CHECK (role IN ('admin', 'store_manager'))
        // Use exact string literal - no modifications
        let validRole = 'store_manager'; // Default value
        
        if (role) {
            // Normalize for comparison only
            const normalizedRole = String(role).trim().toLowerCase();
            if (normalizedRole === 'admin') {
                validRole = 'admin'; // Exact match
            } else if (normalizedRole === 'store_manager' || normalizedRole === 'store manager') {
                validRole = 'store_manager'; // Exact match
            }
        }
        
        // Final safety check - ensure it's exactly one of the allowed values
        // Use strict comparison to ensure exact match
        if (validRole !== 'admin' && validRole !== 'store_manager') {
            validRole = 'store_manager';
        }
        
        // Default is_active to true if not provided
        const activeStatus = is_active !== undefined ? is_active : true;
        // Set status based on is_active (similar to delivery_boys)
        const statusValue = activeStatus ? 'active' : 'inactive';
        
        // Log exactly what we're inserting (for debugging)
        const logger = require('../config/logger');
        logger.info('User.create - Inserting user', {
            email: email,
            role: validRole,
            is_active: activeStatus,
            status: statusValue
        });
        
        const result = await query(
            `INSERT INTO users (name, store_name, mobile, email, password_hash, address, role, is_active, status, admin_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING id, name, store_name, mobile, email, address, role, is_active, status, admin_id, created_at, updated_at`,
            [name, store_name, mobile, email, password_hash, address, validRole, activeStatus, statusValue, admin_id || null]
        );
        
        // Log what was actually inserted
        logger.info('User.create - User created successfully', {
            userId: result.rows[0]?.id,
            insertedRole: result.rows[0]?.role,
            insertedRoleType: typeof result.rows[0]?.role
        });
        
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

    // Find user by email or mobile (optimized to use indexes)
    static async findByEmailOrMobile(mobileEmail) {
        // Try email first (faster if email format)
        const emailResult = await query(
            'SELECT * FROM users WHERE email = $1 LIMIT 1',
            [mobileEmail]
        );
        if (emailResult.rows.length > 0) {
            return emailResult.rows[0];
        }
        
        // Try mobile if email didn't match
        const mobileResult = await query(
            'SELECT * FROM users WHERE mobile = $1 LIMIT 1',
            [mobileEmail]
        );
        return mobileResult.rows[0];
    }

    // Find user by ID
    static async findById(id) {
        const result = await query(
            'SELECT id, name, store_name, mobile, email, address, role, is_active, status, password_hash, created_at, updated_at FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    // Get all users by role
    static async findByRole(role) {
        const result = await query(
            'SELECT id, name, store_name, mobile, email, address, role, is_active, status, admin_id, created_at, updated_at FROM users WHERE role = $1 ORDER BY created_at DESC',
            [role]
        );
        
        // Normalize data types - ensure is_active is boolean and status is set
        return result.rows.map(user => {
            // Convert is_active to boolean if it's a string
            let isActive = user.is_active;
            if (typeof isActive === 'string') {
                isActive = isActive === 'true' || isActive === 't' || isActive === '1';
            } else if (isActive === null || isActive === undefined || isActive === 'pending') {
                isActive = false;
            }
            
            // Ensure status is set correctly
            let status = user.status;
            if (!status || status === 'pending') {
                status = isActive ? 'active' : 'inactive';
            }
            
            return {
                ...user,
                is_active: isActive,
                status: status
            };
        });
    }

    // Get all store managers (for admin)
    static async getAllStoreManagers() {
        return this.findByRole('store_manager');
    }

    // Get all store and admin user IDs in an admin group
    // For a given adminId (top-level admin user ID), returns:
    // - the admin's own ID
    // - all store_manager IDs where admin_id = adminId
    static async getStoreIdsForAdmin(adminId) {
        const result = await query(
            `SELECT id FROM users WHERE id = $1 OR admin_id = $1`,
            [adminId]
        );
        return result.rows.map(row => row.id);
    }

    // Get all admins and store managers for registration dropdown (public)
    // Returns only super admins (not store managers) since delivery boys are created by super admin
    static async getAdminsAndStores() {
        // Handle both boolean and string types for is_active
        // Use COALESCE and text comparison to handle type mismatches
        const result = await query(
            `SELECT id, name, store_name, mobile, email, role, is_active, status 
             FROM users 
             WHERE role = 'admin' 
             AND COALESCE(is_active::text, 'false') IN ('true', 't', '1')
             AND status = 'active'
             ORDER BY name ASC`
        );
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

        // If is_active is being updated, also sync status
        if (updates.is_active !== undefined) {
            const newStatus = updates.is_active ? 'active' : 'inactive';
            fields.push(`status = $${paramCount}`);
            values.push(newStatus);
            paramCount++;
        }
        
        values.push(id);
        const result = await query(
            `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount}
             RETURNING id, name, store_name, mobile, email, address, role, is_active, status, created_at, updated_at`,
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

    // Toggle active status (also updates status field, similar to delivery_boys)
    static async toggleActive(id, isActive) {
        // Determine status based on is_active value
        // is_active: true → status: "active"
        // is_active: false → status: "inactive"
        const newStatus = isActive ? 'active' : 'inactive';
        
        const updateResult = await query(
            'UPDATE users SET is_active = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id',
            [isActive, newStatus, id]
        );
        
        if (updateResult.rowCount === 0) {
            return null;
        }
        
        // Return the full updated object
        return await this.findById(id);
    }
}

module.exports = User;
