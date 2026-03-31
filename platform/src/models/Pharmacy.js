const { query } = require('../config/database');

class Pharmacy {
    // Create a new pharmacy
    static async create(data) {
        const { owner_id, slug, name, plan, status, primary_color, features, max_delivery_boys, max_outlets } = data;

        const result = await query(
            `INSERT INTO pharmacies (owner_id, slug, name, plan, status, primary_color, features, max_delivery_boys, max_outlets)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [owner_id, slug, name, plan || 'starter', status || 'pending', primary_color || '#4F46E5', features || '{}', max_delivery_boys || 5, max_outlets || 1]
        );

        return result.rows[0];
    }

    // Find pharmacy by ID
    static async findById(id) {
        const result = await query(
            'SELECT * FROM pharmacies WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    // Find pharmacy by owner ID
    static async findByOwnerId(ownerId) {
        const result = await query(
            'SELECT * FROM pharmacies WHERE owner_id = $1',
            [ownerId]
        );
        return result.rows[0];
    }

    // Find pharmacy by slug
    static async findBySlug(slug) {
        const result = await query(
            'SELECT * FROM pharmacies WHERE slug = $1',
            [slug]
        );
        return result.rows[0];
    }

    // Check if slug already exists
    static async slugExists(slug) {
        const result = await query(
            'SELECT EXISTS(SELECT 1 FROM pharmacies WHERE slug = $1)',
            [slug]
        );
        return result.rows[0].exists;
    }

    // Get all pharmacies with optional status filter
    static async findAll(filters = {}) {
        let sql = `SELECT p.*, u.name as owner_name, u.email as owner_email, u.mobile as owner_mobile
             FROM pharmacies p
             JOIN users u ON p.owner_id = u.id`;
        const values = [];

        if (filters.status) {
            sql += ' WHERE p.status = $1';
            values.push(filters.status);
        }

        sql += ' ORDER BY p.created_at DESC';

        const result = await query(sql, values);
        return result.rows;
    }

    // Update pharmacy config (plan, features, limits)
    static async updateConfig(id, config) {
        const { plan, features, max_delivery_boys, max_outlets, config_json } = config;

        const result = await query(
            `UPDATE pharmacies
             SET plan = $1, features = $2, max_delivery_boys = $3, max_outlets = $4, config_json = $5, updated_at = CURRENT_TIMESTAMP
             WHERE id = $6
             RETURNING *`,
            [plan, features, max_delivery_boys, max_outlets, config_json, id]
        );

        return result.rows[0];
    }

    // Update pharmacy branding (colors, logo)
    static async updateBranding(id, branding) {
        const { primary_color, logo_url } = branding;

        const result = await query(
            `UPDATE pharmacies
             SET primary_color = $1, logo_url = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING *`,
            [primary_color, logo_url, id]
        );

        return result.rows[0];
    }

    // Update pharmacy status (approve, reject, submit)
    static async updateStatus(id, status, extra = {}) {
        const fields = ['status = $1'];
        const values = [status];
        let paramCount = 2;

        if (extra.approved_at) {
            fields.push(`approved_at = $${paramCount}`);
            values.push(extra.approved_at);
            paramCount++;
        }

        if (extra.rejection_reason) {
            fields.push(`rejection_reason = $${paramCount}`);
            values.push(extra.rejection_reason);
            paramCount++;
        }

        if (extra.submitted_at) {
            fields.push(`submitted_at = $${paramCount}`);
            values.push(extra.submitted_at);
            paramCount++;
        }

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        const result = await query(
            `UPDATE pharmacies SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );

        return result.rows[0];
    }

    // Update pharmacy build info
    static async updateBuild(id, buildData) {
        const { build_id, build_status, build_url } = buildData;

        const result = await query(
            `UPDATE pharmacies
             SET build_id = $1, build_status = $2, build_url = $3, updated_at = CURRENT_TIMESTAMP
             WHERE id = $4
             RETURNING *`,
            [build_id, build_status, build_url, id]
        );

        return result.rows[0];
    }
}

module.exports = Pharmacy;
