const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
});

async function testConnection() {
    try {
        console.log('Testing database connection...');
        console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
        
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
        
        console.log('✓ Database connection successful!');
        console.log('Current time:', result.rows[0].current_time);
        console.log('PostgreSQL version:', result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1]);
        
        client.release();
        pool.end();
    } catch (error) {
        console.error('✗ Database connection failed:');
        console.error('Error:', error.message);
        console.error('\nPlease check:');
        console.error('1. PostgreSQL is running');
        console.error('2. DATABASE_URL is set correctly in .env file');
        console.error('3. Database exists');
        console.error('4. User has proper permissions');
        process.exit(1);
    }
}

testConnection();

