const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
});

async function initDatabase() {
    try {
        console.log('Connecting to database...');
        const client = await pool.connect();

        console.log('Reading schema file...');
        const schema = fs.readFileSync(__dirname + '/../database/schema.sql', 'utf8');

        console.log('Executing schema...');
        await client.query(schema);

        console.log('Database initialized successfully!');

        client.release();
        pool.end();
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

initDatabase();
