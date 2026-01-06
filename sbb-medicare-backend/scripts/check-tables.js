const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
});

async function checkTables() {
    const client = await pool.connect();
    try {
        console.log('Checking database connection...');
        console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'NOT SET');
        
        // Get current database
        const dbResult = await client.query('SELECT current_database() as db_name, current_schema() as schema_name');
        console.log('\n✓ Connected to database:', dbResult.rows[0].db_name);
        console.log('✓ Current schema:', dbResult.rows[0].schema_name);
        
        // Check if refresh_tokens table exists
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = current_schema()
                AND table_name = 'refresh_tokens'
            ) as table_exists
        `);
        
        console.log('\n✓ refresh_tokens table exists:', tableCheck.rows[0].table_exists);
        
        if (tableCheck.rows[0].table_exists) {
            // Get table info
            const tableInfo = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_schema = current_schema()
                AND table_name = 'refresh_tokens'
                ORDER BY ordinal_position
            `);
            console.log('\n✓ Table structure:');
            tableInfo.rows.forEach(col => {
                console.log(`  - ${col.column_name}: ${col.data_type}`);
            });
            
            // Check row count
            const count = await client.query('SELECT COUNT(*) FROM refresh_tokens');
            console.log(`\n✓ Rows in table: ${count.rows[0].count}`);
        } else {
            console.log('\n✗ Table does NOT exist!');
            console.log('\nAvailable tables in current schema:');
            const tables = await client.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = current_schema()
                ORDER BY table_name
            `);
            tables.rows.forEach(t => console.log(`  - ${t.table_name}`));
        }
        
        // Check all schemas
        const schemas = await client.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
            ORDER BY schema_name
        `);
        console.log('\n✓ Available schemas:', schemas.rows.map(r => r.schema_name).join(', '));
        
    } catch (error) {
        console.error('\n✗ Error:', error.message);
        if (error.code === '28P01') {
            console.error('\nAuthentication failed. Check your DATABASE_URL in .env file.');
        }
    } finally {
        client.release();
        pool.end();
    }
}

checkTables();






