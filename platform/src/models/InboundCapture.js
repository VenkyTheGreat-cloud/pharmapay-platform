const { query } = require('../config/database');

class InboundCapture {
    static async create(data) {
        const result = await query(
            `INSERT INTO inbound_captures (store_id, channel, caller_number, sender_name, message_text, audio_path)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [data.store_id, data.channel, data.caller_number, data.sender_name, data.message_text, data.audio_path]
        );
        return result.rows[0];
    }

    static async findById(id) {
        const result = await query('SELECT * FROM inbound_captures WHERE id = $1', [id]);
        return result.rows[0];
    }

    static async findByStore(storeId, { limit = 50, offset = 0, status } = {}) {
        let sql = 'SELECT * FROM inbound_captures WHERE store_id = $1';
        const params = [storeId];

        if (status) {
            params.push(status);
            sql += ` AND status = $${params.length}`;
        }

        sql += ' ORDER BY created_at DESC';
        params.push(limit);
        sql += ` LIMIT $${params.length}`;
        params.push(offset);
        sql += ` OFFSET $${params.length}`;

        const result = await query(sql, params);
        return result.rows;
    }

    static async updateStatus(id, status, extras = {}) {
        const sets = ['status = $2'];
        const params = [id, status];

        if (extras.transcript) {
            params.push(extras.transcript);
            sets.push(`transcript = $${params.length}`);
        }
        if (extras.extracted_data) {
            params.push(JSON.stringify(extras.extracted_data));
            sets.push(`extracted_data = $${params.length}`);
        }
        if (status === 'completed' || status === 'failed') {
            sets.push('processed_at = CURRENT_TIMESTAMP');
        }

        const result = await query(
            `UPDATE inbound_captures SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
            params
        );
        return result.rows[0];
    }

    static async countByStore(storeId, status) {
        const result = await query(
            'SELECT COUNT(*) as count FROM inbound_captures WHERE store_id = $1 AND status = $2',
            [storeId, status]
        );
        return parseInt(result.rows[0].count);
    }

    static async findConvertibleByStore(storeId, { limit = 50, offset = 0 } = {}) {
        const result = await query(
            `SELECT ic.*,
                    c.id as matched_customer_id,
                    c.name as matched_customer_name,
                    c.mobile as matched_customer_mobile,
                    c.address as matched_customer_address,
                    c.area as matched_customer_area
             FROM inbound_captures ic
             LEFT JOIN customers c
               ON RIGHT(ic.caller_number, 10) = RIGHT(c.mobile, 10)
               AND c.store_id = ic.store_id
             WHERE ic.store_id = $1
               AND ic.status = 'completed'
               AND (
                 ic.channel = 'voice'
                 OR ic.extracted_data->>'is_order' = 'true'
               )
             ORDER BY ic.created_at DESC
             LIMIT $2 OFFSET $3`,
            [storeId, limit, offset]
        );
        return result.rows;
    }

    static async findDismissedByStore(storeId, { limit = 50, offset = 0 } = {}) {
        const result = await query(
            `SELECT ic.*,
                    c.id as matched_customer_id,
                    c.name as matched_customer_name,
                    c.mobile as matched_customer_mobile
             FROM inbound_captures ic
             LEFT JOIN customers c
               ON RIGHT(ic.caller_number, 10) = RIGHT(c.mobile, 10)
               AND c.store_id = ic.store_id
             WHERE ic.store_id = $1
               AND ic.status = 'dismissed'
             ORDER BY ic.processed_at DESC
             LIMIT $2 OFFSET $3`,
            [storeId, limit, offset]
        );
        return result.rows;
    }

    static async countDismissedByStore(storeId) {
        const result = await query(
            `SELECT COUNT(*) as count FROM inbound_captures
             WHERE store_id = $1 AND status = 'dismissed'`,
            [storeId]
        );
        return parseInt(result.rows[0].count);
    }

    static async countConvertibleByStore(storeId) {
        const result = await query(
            `SELECT COUNT(*) as count
             FROM inbound_captures
             WHERE store_id = $1
               AND status = 'completed'
               AND (
                 channel = 'voice'
                 OR extracted_data->>'is_order' = 'true'
               )`,
            [storeId]
        );
        return parseInt(result.rows[0].count);
    }
}

module.exports = InboundCapture;
