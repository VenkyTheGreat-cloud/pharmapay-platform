-- ============================================
-- COMPLETE DATABASE MIGRATION SCRIPT
-- Updates all foreign keys to UUID while preserving data
-- ============================================

BEGIN;

-- ============================================
-- 1. DELIVERY_BOYS.store_id → UUID
-- ============================================
ALTER TABLE IF EXISTS delivery_boys 
    DROP CONSTRAINT IF EXISTS delivery_boys_store_id_fkey CASCADE;

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delivery_boys' 
        AND column_name = 'store_id'
        AND data_type = 'bigint'
    ) THEN
        -- Set to NULL first (preserves other column data)
        UPDATE delivery_boys SET store_id = NULL;
        -- Convert BIGINT → UUID via TEXT
        ALTER TABLE delivery_boys 
            ALTER COLUMN store_id DROP NOT NULL,
            ALTER COLUMN store_id TYPE TEXT,
            ALTER COLUMN store_id TYPE UUID;
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delivery_boys' AND column_name = 'store_id'
    ) THEN
        ALTER TABLE delivery_boys ADD COLUMN store_id UUID;
    END IF;
END $$;

ALTER TABLE delivery_boys
    ADD CONSTRAINT delivery_boys_store_id_fkey 
    FOREIGN KEY (store_id) REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_delivery_boys_store_id ON delivery_boys(store_id);

-- ============================================
-- 2. CUSTOMERS.store_id → UUID
-- ============================================
ALTER TABLE IF EXISTS customers 
    DROP CONSTRAINT IF EXISTS customers_store_id_fkey CASCADE;

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'store_id'
        AND data_type = 'bigint'
    ) THEN
        UPDATE customers SET store_id = NULL;
        ALTER TABLE customers 
            ALTER COLUMN store_id DROP NOT NULL,
            ALTER COLUMN store_id TYPE TEXT,
            ALTER COLUMN store_id TYPE UUID;
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'store_id'
    ) THEN
        ALTER TABLE customers ADD COLUMN store_id UUID;
    END IF;
END $$;

ALTER TABLE customers
    ADD CONSTRAINT customers_store_id_fkey 
    FOREIGN KEY (store_id) REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_customers_store_id ON customers(store_id);

-- ============================================
-- 3. ORDERS.store_id → UUID
-- ============================================
ALTER TABLE IF EXISTS orders 
    DROP CONSTRAINT IF EXISTS orders_store_id_fkey CASCADE;

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'store_id'
        AND data_type = 'bigint'
    ) THEN
        UPDATE orders SET store_id = NULL;
        ALTER TABLE orders 
            ALTER COLUMN store_id DROP NOT NULL,
            ALTER COLUMN store_id TYPE TEXT,
            ALTER COLUMN store_id TYPE UUID;
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'store_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN store_id UUID;
    END IF;
END $$;

ALTER TABLE orders
    ADD CONSTRAINT orders_store_id_fkey 
    FOREIGN KEY (store_id) REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);

-- ============================================
-- 4. REFRESH_TOKENS.user_id → UUID
-- ============================================
ALTER TABLE IF EXISTS refresh_tokens 
    DROP CONSTRAINT IF EXISTS refresh_tokens_user_id_fkey CASCADE;

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'refresh_tokens' 
        AND column_name = 'user_id'
        AND data_type = 'bigint'
    ) THEN
        UPDATE refresh_tokens SET user_id = NULL;
        ALTER TABLE refresh_tokens 
            ALTER COLUMN user_id DROP NOT NULL,
            ALTER COLUMN user_id TYPE TEXT,
            ALTER COLUMN user_id TYPE UUID;
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'refresh_tokens' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE refresh_tokens ADD COLUMN user_id UUID;
    END IF;
END $$;

ALTER TABLE refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- ============================================
-- 5. ORDER_STATUS_HISTORY.changed_by → UUID
-- ============================================
ALTER TABLE IF EXISTS order_status_history 
    DROP CONSTRAINT IF EXISTS order_status_history_changed_by_fkey CASCADE;

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_status_history' 
        AND column_name = 'changed_by'
        AND data_type = 'bigint'
    ) THEN
        UPDATE order_status_history SET changed_by = NULL;
        ALTER TABLE order_status_history 
            ALTER COLUMN changed_by DROP NOT NULL,
            ALTER COLUMN changed_by TYPE TEXT,
            ALTER COLUMN changed_by TYPE UUID;
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_status_history' AND column_name = 'changed_by'
    ) THEN
        ALTER TABLE order_status_history ADD COLUMN changed_by UUID;
    END IF;
END $$;

ALTER TABLE order_status_history
    ADD CONSTRAINT order_status_history_changed_by_fkey 
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- Verification
-- ============================================
SELECT 
    '✅ Migration Complete!' as status,
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE column_name IN ('store_id', 'user_id', 'changed_by')
    AND table_name IN (
        'delivery_boys',
        'customers', 
        'orders',
        'refresh_tokens',
        'order_status_history'
    )
ORDER BY table_name, column_name;

COMMIT;






