const { query } = require('../config/database');

class OtpVerification {
    // Generate 6-digit OTP
    static generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Create OTP record
    static async create(mobile) {
        const otp = this.generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Delete old unused OTPs for this mobile
        await query(
            'DELETE FROM otp_verifications WHERE mobile = $1 AND is_used = false',
            [mobile]
        );

        const result = await query(
            `INSERT INTO otp_verifications (mobile, otp, expires_at)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [mobile, otp, expiresAt]
        );
        return result.rows[0];
    }

    // Verify OTP
    static async verify(mobile, otp) {
        const result = await query(
            `SELECT * FROM otp_verifications
             WHERE mobile = $1 AND otp = $2 AND is_used = false AND expires_at > CURRENT_TIMESTAMP
             ORDER BY created_at DESC
             LIMIT 1`,
            [mobile, otp]
        );

        if (result.rows.length === 0) {
            return null;
        }

        const otpRecord = result.rows[0];

        // Mark as used
        await query(
            'UPDATE otp_verifications SET is_used = true WHERE id = $1',
            [otpRecord.id]
        );

        return otpRecord;
    }

    // Get latest OTP for mobile
    static async getLatest(mobile) {
        const result = await query(
            `SELECT * FROM otp_verifications
             WHERE mobile = $1 AND is_used = false AND expires_at > CURRENT_TIMESTAMP
             ORDER BY created_at DESC
             LIMIT 1`,
            [mobile]
        );
        return result.rows[0];
    }

    // Clean expired OTPs
    static async cleanExpired() {
        const result = await query(
            'DELETE FROM otp_verifications WHERE expires_at < CURRENT_TIMESTAMP OR is_used = true'
        );
        return result.rowCount;
    }
}

module.exports = OtpVerification;

