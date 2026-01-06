const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
});

async function createRefreshTokensTable() {
    const client = await pool.connect();
    try {
        console.log('Creating refresh_tokens table...');
        
        // Create refresh_tokens table
        await client.query(`
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id BIGSERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
                token_hash VARCHAR(255) UNIQUE NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                is_revoked BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create indexes
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
            CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
        `);

        console.log('✓ refresh_tokens table created successfully!');
    } catch (error) {
        console.error('Error creating refresh_tokens table:', error.message);
        console.error('\nMake sure:');
        console.error('1. PostgreSQL is running');
        console.error('2. .env file has correct DATABASE_URL');
        console.error('3. Database and users table exist');
        process.exit(1);
    } finally {
        client.release();
        pool.end();
    }
}

createRefreshTokensTable();






