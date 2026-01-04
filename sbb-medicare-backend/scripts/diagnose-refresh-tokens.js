// Diagnostic script to check refresh_tokens table
// This uses the same connection as your server

require('dotenv').config();
const { Pool } = require('pg');

console.log('=== Refresh Tokens Table Diagnostic ===\n');

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
    console.log('✗ ERROR: DATABASE_URL not found in .env file');
    console.log('   Make sure you have a .env file with DATABASE_URL set');
    process.exit(1);
}

console.log('✓ DATABASE_URL is set');
console.log('  Connection string:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

// Extract database name from connection string
const dbMatch = process.env.DATABASE_URL.match(/\/\/([^:]+):[^@]+@[^\/]+\/([^?]+)/);
if (dbMatch) {
    const dbUser = dbMatch[1];
    const dbName = dbMatch[2];
    console.log('  Database user:', dbUser);
    console.log('  Database name:', dbName);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
});

async function diagnose() {
    const client = await pool.connect();
    try {
        console.log('\n=== Connection Test ===');
        console.log('✓ Successfully connected to database\n');

        // Get current database and schema
        const dbInfo = await client.query('SELECT current_database() as db, current_schema() as schema');
        console.log('Current database:', dbInfo.rows[0].db);
        console.log('Current schema:', dbInfo.rows[0].schema);

        // Check search path
        const searchPath = await client.query('SHOW search_path');
        console.log('Search path:', searchPath.rows[0].search_path);

        // Check if refresh_tokens exists in current schema
        console.log('\n=== Table Check ===');
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = current_schema()
                AND table_name = 'refresh_tokens'
            ) as exists_in_current_schema
        `);

        if (tableCheck.rows[0].exists_in_current_schema) {
            console.log('✓ refresh_tokens table EXISTS in current schema');
            
            // Get table info
            const tableInfo = await client.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_schema = current_schema()
                AND table_name = 'refresh_tokens'
                ORDER BY ordinal_position
            `);
            
            console.log('\nTable structure:');
            tableInfo.rows.forEach(col => {
                console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
            });

            // Check if users table exists (for foreign key)
            const usersCheck = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = current_schema()
                    AND table_name = 'users'
                ) as users_exists
            `);
            
            if (!usersCheck.rows[0].users_exists) {
                console.log('\n⚠ WARNING: users table does not exist! Foreign key will fail.');
            }
        } else {
            console.log('✗ refresh_tokens table DOES NOT EXIST in current schema');
            
            // Check in all schemas
            console.log('\nChecking all schemas...');
            const allSchemas = await client.query(`
                SELECT schemaname, tablename 
                FROM pg_tables 
                WHERE tablename = 'refresh_tokens'
            `);
            
            if (allSchemas.rows.length > 0) {
                console.log('⚠ Found refresh_tokens in other schemas:');
                allSchemas.rows.forEach(row => {
                    console.log(`  - Schema: ${row.schemaname}, Table: ${row.tablename}`);
                });
                console.log('\n⚠ Solution: The table exists but in a different schema!');
                console.log('   Either move it or update your search_path');
            } else {
                console.log('✗ refresh_tokens table not found in ANY schema');
                console.log('\n📋 Available tables in current schema:');
                const tables = await client.query(`
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = current_schema()
                    ORDER BY table_name
                `);
                if (tables.rows.length > 0) {
                    tables.rows.forEach(t => console.log(`  - ${t.table_name}`));
                } else {
                    console.log('  (no tables found)');
                }
            }
        }

        console.log('\n=== Recommendations ===');
        if (!tableCheck.rows[0].exists_in_current_schema) {
            console.log('1. Create the table using the correct SQL (see create-refresh-tokens-correct.sql)');
            console.log('2. Make sure you\'re connected to the correct database');
            console.log('3. After creating, RESTART your server (connection pool cache)');
        } else {
            console.log('✓ Table exists! If you still get errors:');
            console.log('1. RESTART your server (Ctrl+C then npm run dev)');
            console.log('2. Check that your server is using the same DATABASE_URL');
        }

    } catch (error) {
        console.error('\n✗ ERROR:', error.message);
        if (error.code === '28P01') {
            console.error('\nAuthentication failed. Your .env DATABASE_URL password is incorrect.');
        } else if (error.code === '42P01') {
            console.error('\nRelation does not exist - table needs to be created');
        }
    } finally {
        client.release();
        pool.end();
    }
}

diagnose().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});




