require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
});

async function resetPassword(emailOrMobile, newPassword) {
    try {
        // Find user
        const result = await pool.query(
            'SELECT id, email, mobile, name FROM users WHERE email = $1 OR mobile = $1',
            [emailOrMobile]
        );

        if (result.rows.length === 0) {
            console.log('❌ User not found with email/mobile:', emailOrMobile);
            return;
        }

        const user = result.rows[0];
        console.log('✅ Found user:', user.name, '(', user.email, ')');

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 10);
        console.log('✅ Password hashed');

        // Update password
        await pool.query(
            'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [passwordHash, user.id]
        );

        console.log('✅✅✅ Password reset successfully!');
        console.log('New password:', newPassword);
        console.log('You can now login with this password.');
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

// Get arguments from command line
const emailOrMobile = process.argv[2];
const newPassword = process.argv[3];

if (!emailOrMobile || !newPassword) {
    console.log('Usage: node scripts/reset-user-password.js <email-or-mobile> <new-password>');
    console.log('');
    console.log('Example:');
    console.log('  node scripts/reset-user-password.js admin@example.com Admin123!');
    console.log('  node scripts/reset-user-password.js 9876543210 Admin123!');
    process.exit(1);
}

resetPassword(emailOrMobile, newPassword);





