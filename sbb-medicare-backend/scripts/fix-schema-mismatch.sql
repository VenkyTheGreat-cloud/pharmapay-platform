-- Quick Fix: Recreate users table with correct BIGINT type
-- This will work if users table is empty or you're okay recreating it

-- Check current type
\echo 'Checking current users.id type...'
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'id';

-- Drop all dependent tables
\echo 'Dropping dependent tables...'
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS delivery_boys CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS order_status_history CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS location_updates CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;

-- Recreate users table with BIGINT
\echo 'Recreating users table with BIGINT...'
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    store_name VARCHAR(255),
    mobile VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    address TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'store_manager' CHECK (role IN ('admin', 'store_manager')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_mobile ON users(mobile);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

\echo '✓ users table recreated with BIGINT id'
\echo 'Now run the full schema.sql or init-database.js to create remaining tables'

