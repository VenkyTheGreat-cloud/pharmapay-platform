-- Fix: users.id type mismatch
-- Problem: users.id is UUID, but schema expects BIGSERIAL (BIGINT)
-- This causes foreign key constraint errors

-- ============================================
-- OPTION 1: Change users.id to BIGINT (RECOMMENDED if users table is empty)
-- ============================================

-- Step 1: Check current users.id type
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'id';

-- Step 2: Drop dependent tables first (if they exist)
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS delivery_boys CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS order_status_history CASCADE;

-- Step 3: Drop and recreate users table with BIGINT
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

-- Create indexes for users
CREATE INDEX idx_users_mobile ON users(mobile);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Step 4: Now run the full schema.sql to create all other tables


-- ============================================
-- OPTION 2: Change all foreign keys to UUID (Use if users table has data)
-- ============================================
-- UNCOMMENT THIS SECTION IF YOU HAVE DATA IN USERS TABLE

/*
-- Check if users table has data
SELECT COUNT(*) as user_count FROM users;

-- If users has data, update all foreign key references to UUID:
-- (This requires dropping and recreating tables, so backup data first!)

-- For delivery_boys:
ALTER TABLE delivery_boys 
    DROP CONSTRAINT IF EXISTS delivery_boys_store_id_fkey,
    ALTER COLUMN store_id TYPE UUID USING store_id::text::uuid;

ALTER TABLE delivery_boys
    ADD CONSTRAINT delivery_boys_store_id_fkey 
    FOREIGN KEY (store_id) REFERENCES users(id) ON DELETE SET NULL;

-- For customers:
ALTER TABLE customers 
    DROP CONSTRAINT IF EXISTS customers_store_id_fkey,
    ALTER COLUMN store_id TYPE UUID USING store_id::text::uuid;

ALTER TABLE customers
    ADD CONSTRAINT customers_store_id_fkey 
    FOREIGN KEY (store_id) REFERENCES users(id) ON DELETE SET NULL;

-- For orders:
ALTER TABLE orders 
    DROP CONSTRAINT IF EXISTS orders_store_id_fkey,
    ALTER COLUMN store_id TYPE UUID USING store_id::text::uuid;

ALTER TABLE orders
    ADD CONSTRAINT orders_store_id_fkey 
    FOREIGN KEY (store_id) REFERENCES users(id) ON DELETE SET NULL;

-- For refresh_tokens:
ALTER TABLE refresh_tokens 
    DROP CONSTRAINT IF EXISTS refresh_tokens_user_id_fkey,
    ALTER COLUMN user_id TYPE UUID USING user_id::text::uuid;

ALTER TABLE refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- For order_status_history:
ALTER TABLE order_status_history 
    DROP CONSTRAINT IF EXISTS order_status_history_changed_by_fkey,
    ALTER COLUMN changed_by TYPE UUID USING changed_by::text::uuid;

ALTER TABLE order_status_history
    ADD CONSTRAINT order_status_history_changed_by_fkey 
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL;
*/






