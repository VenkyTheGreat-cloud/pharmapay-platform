const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
});

async function checkConstraints() {
    try {
        const client = await pool.connect();
        console.log('--- Orders Table Constraints ---');
        const ordersRes = await client.query(`
            SELECT conname, pg_get_constraintdef(oid) as definition
            FROM pg_constraint
            WHERE conrelid = 'orders'::regclass
            AND pg_get_constraintdef(oid) LIKE '%payment_mode%'
        `);
        console.table(ordersRes.rows);

        console.log('\n--- Payments Table Constraints ---');
        const paymentsRes = await client.query(`
            SELECT conname, pg_get_constraintdef(oid) as definition
            FROM pg_constraint
            WHERE conrelid = 'payments'::regclass
            AND pg_get_constraintdef(oid) LIKE '%payment_mode%'
        `);
        console.table(paymentsRes.rows);

        client.release();
        await pool.end();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkConstraints();
