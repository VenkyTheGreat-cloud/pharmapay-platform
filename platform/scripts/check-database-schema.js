// Script to check which tables need UUID foreign key updates
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
});

async function checkSchema() {
    const client = await pool.connect();
    try {
        console.log('=== Database Schema Check ===\n');

        // Check users.id type
        console.log('1. Checking users.id type...');
        const usersId = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'id'
        `);
        
        if (usersId.rows.length === 0) {
            console.log('❌ users table does not exist!\n');
            return;
        }
        
        const usersIdType = usersId.rows[0].data_type;
        console.log(`   users.id type: ${usersIdType}`);
        console.log(`   Expected: uuid\n`);

        if (usersIdType !== 'uuid') {
            console.log('⚠️  WARNING: users.id is not UUID!');
            console.log('   You need to decide:');
            console.log('   - Option 1: Change users.id to UUID');
            console.log('   - Option 2: Change all foreign keys to match users.id type\n');
        }

        // Check all foreign keys to users
        console.log('2. Checking foreign keys to users(id)...\n');
        const foreignKeys = await client.query(`
            SELECT 
                tc.table_name, 
                kcu.column_name, 
                c.data_type,
                CASE 
                    WHEN c.data_type = 'uuid' THEN '✅ Correct'
                    WHEN c.data_type = 'bigint' THEN '❌ Needs Update'
                    ELSE '⚠️ Unknown type'
                END as status
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu 
                ON ccu.constraint_name = tc.constraint_name
            JOIN information_schema.columns c 
                ON c.table_name = tc.table_name 
                AND c.column_name = kcu.column_name
            WHERE tc.constraint_type = 'FOREIGN KEY' 
                AND ccu.table_name = 'users'
                AND ccu.column_name = 'id'
            ORDER BY tc.table_name
        `);

        if (foreignKeys.rows.length === 0) {
            console.log('   No foreign keys found to users.id\n');
        } else {
            console.log('   Table            | Column      | Type     | Status');
            console.log('   -----------------|-------------|----------|--------------');
            foreignKeys.rows.forEach(row => {
                const table = row.table_name.padEnd(17);
                const column = row.column_name.padEnd(11);
                const type = row.data_type.padEnd(8);
                const status = row.status;
                console.log(`   ${table}| ${column}| ${type}| ${status}`);
            });
        }

        // Check specific tables
        console.log('\n3. Checking specific tables...\n');
        const tables = [
            'delivery_boys',
            'customers',
            'orders',
            'refresh_tokens',
            'order_status_history'
        ];

        for (const table of tables) {
            const exists = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = current_schema()
                    AND table_name = $1
                ) as exists
            `, [table]);

            if (!exists.rows[0].exists) {
                console.log(`   ❌ ${table}: Table does not exist`);
                continue;
            }

            // Get columns that reference users
            const columns = await client.query(`
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_name = $1
                AND column_name IN ('store_id', 'user_id', 'changed_by')
            `, [table]);

            if (columns.rows.length === 0) {
                console.log(`   ⚠️  ${table}: No user reference columns found`);
            } else {
                columns.rows.forEach(col => {
                    const status = col.data_type === 'uuid' ? '✅' : '❌';
                    console.log(`   ${status} ${table}.${col.column_name}: ${col.data_type} (expected: uuid)`);
                });
            }
        }

        console.log('\n=== Summary ===');
        const needsUpdate = foreignKeys.rows.filter(r => r.data_type !== 'uuid');
        if (needsUpdate.length === 0) {
            console.log('✅ All foreign keys are correctly typed as UUID!');
            console.log('✅ No updates needed.\n');
        } else {
            console.log(`❌ ${needsUpdate.length} table(s) need updates:\n`);
            needsUpdate.forEach(row => {
                console.log(`   - ${row.table_name}.${row.column_name} (current: ${row.data_type}, need: uuid)`);
            });
            console.log('\n⚠️  Run migration script: scripts/migrate-to-uuid-foreign-keys.sql\n');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        client.release();
        pool.end();
    }
}

checkSchema();









