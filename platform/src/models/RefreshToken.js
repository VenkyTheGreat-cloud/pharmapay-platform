const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

class RefreshToken {
    // Create refresh token
    static async create(userId, token, expiresAt) {
        // Hash the token before storing
        const tokenHash = await bcrypt.hash(token, 10);

        const result = await query(
            `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [userId, tokenHash, expiresAt]
        );
        return result.rows[0];
    }

    // Find token by hash
    static async findByToken(token) {
        // We need to check all tokens for this user and compare
        // This is not ideal but necessary since we hash tokens
        const result = await query(
            `SELECT * FROM refresh_tokens
             WHERE expires_at > CURRENT_TIMESTAMP AND is_revoked = false
             ORDER BY created_at DESC`
        );

        for (const tokenRecord of result.rows) {
            const isValid = await bcrypt.compare(token, tokenRecord.token_hash);
            if (isValid) {
                return tokenRecord;
            }
        }

        return null;
    }

    // Find tokens by user ID
    static async findByUserId(userId) {
        const result = await query(
            `SELECT * FROM refresh_tokens
             WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP AND is_revoked = false
             ORDER BY created_at DESC`,
            [userId]
        );
        return result.rows;
    }

    // Revoke token
    static async revoke(tokenId) {
        const result = await query(
            'UPDATE refresh_tokens SET is_revoked = true WHERE id = $1 RETURNING *',
            [tokenId]
        );
        return result.rows[0];
    }

    // Revoke all tokens for a user
    static async revokeAll(userId) {
        const result = await query(
            'UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1',
            [userId]
        );
        return result.rowCount;
    }

    // Clean expired tokens
    static async cleanExpired() {
        const result = await query(
            'DELETE FROM refresh_tokens WHERE expires_at < CURRENT_TIMESTAMP OR is_revoked = true'
        );
        return result.rowCount;
    }
}

module.exports = RefreshToken;

