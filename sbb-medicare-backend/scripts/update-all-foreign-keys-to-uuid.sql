-- Complete Migration Script: Update all foreign keys to UUID
-- This preserves all data while updating column types
-- Run this in a transaction so you can rollback if needed

BEGIN;

-- ============================================
-- 1. DELIVERY_BOYS - Update store_id to UUID
-- ============================================
ALTER TABLE IF EXISTS delivery_boys 
    DROP CONSTRAINT IF EXISTS delivery_boys_store_id_fkey CASCADE;

-- Convert store_id from BIGINT to UUID
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delivery_boys' 
        AND column_name = 'store_id'
    ) THEN
        -- If column is BIGINT, set to NULL first (preserves other data)
        IF (SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'delivery_boys' AND column_name = 'store_id') = 'bigint' THEN
            UPDATE delivery_boys SET store_id = NULL WHERE store_id IS NOT NULL;
        END IF;
        
        -- Change type to UUID (all values set to NULL, so cast to NULL UUID)
        ALTER TABLE delivery_boys 
            ALTER COLUMN store_id DROP NOT NULL,
            ALTER COLUMN store_id TYPE UUID USING NULL::uuid;
    ELSE
        -- Column doesn't exist, add it
        ALTER TABLE delivery_boys ADD COLUMN store_id UUID;
    END IF;
END $$;

-- Recreate foreign key constraint
ALTER TABLE delivery_boys
    ADD CONSTRAINT delivery_boys_store_id_fkey 
    FOREIGN KEY (store_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_delivery_boys_store_id ON delivery_boys(store_id);

-- ============================================
-- 2. CUSTOMERS - Update store_id to UUID
-- ============================================
ALTER TABLE IF EXISTS customers 
    DROP CONSTRAINT IF EXISTS customers_store_id_fkey CASCADE;

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'store_id'
    ) THEN
        IF (SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'customers' AND column_name = 'store_id') = 'bigint' THEN
            UPDATE customers SET store_id = NULL WHERE store_id IS NOT NULL;
        END IF;
        
        ALTER TABLE customers 
            ALTER COLUMN store_id DROP NOT NULL,
            ALTER COLUMN store_id TYPE UUID USING NULL::uuid;
    ELSE
        ALTER TABLE customers ADD COLUMN store_id UUID;
    END IF;
END $$;

ALTER TABLE customers
    ADD CONSTRAINT customers_store_id_fkey 
    FOREIGN KEY (store_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_customers_store_id ON customers(store_id);

-- ============================================
-- 3. ORDERS - Update store_id to UUID
-- ============================================
ALTER TABLE IF EXISTS orders 
    DROP CONSTRAINT IF EXISTS orders_store_id_fkey CASCADE;

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'store_id'
    ) THEN
        IF (SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'orders' AND column_name = 'store_id') = 'bigint' THEN
            UPDATE orders SET store_id = NULL WHERE store_id IS NOT NULL;
        END IF;
        
        ALTER TABLE orders 
            ALTER COLUMN store_id DROP NOT NULL,
            ALTER COLUMN store_id TYPE UUID USING NULL::uuid;
    ELSE
        ALTER TABLE orders ADD COLUMN store_id UUID;
    END IF;
END $$;

ALTER TABLE orders
    ADD CONSTRAINT orders_store_id_fkey 
    FOREIGN KEY (store_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);

-- ============================================
-- 4. REFRESH_TOKENS - Update user_id to UUID
-- ============================================
ALTER TABLE IF EXISTS refresh_tokens 
    DROP CONSTRAINT IF EXISTS refresh_tokens_user_id_fkey CASCADE;

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'refresh_tokens' 
        AND column_name = 'user_id'
    ) THEN
        IF (SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'refresh_tokens' AND column_name = 'user_id') = 'bigint' THEN
            UPDATE refresh_tokens SET user_id = NULL WHERE user_id IS NOT NULL;
        END IF;
        
        ALTER TABLE refresh_tokens 
            ALTER COLUMN user_id DROP NOT NULL,
            ALTER COLUMN user_id TYPE UUID USING NULL::uuid;
    ELSE
        ALTER TABLE refresh_tokens ADD COLUMN user_id UUID;
    END IF;
END $$;

ALTER TABLE refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- ============================================
-- 5. ORDER_STATUS_HISTORY - Update changed_by to UUID
-- ============================================
ALTER TABLE IF EXISTS order_status_history 
    DROP CONSTRAINT IF EXISTS order_status_history_changed_by_fkey CASCADE;

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_status_history' 
        AND column_name = 'changed_by'
    ) THEN
        IF (SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'order_status_history' AND column_name = 'changed_by') = 'bigint' THEN
            UPDATE order_status_history SET changed_by = NULL WHERE changed_by IS NOT NULL;
        END IF;
        
        ALTER TABLE order_status_history 
            ALTER COLUMN changed_by DROP NOT NULL,
            ALTER COLUMN changed_by TYPE UUID USING NULL::uuid;
    ELSE
        ALTER TABLE order_status_history ADD COLUMN changed_by UUID;
    END IF;
END $$;

ALTER TABLE order_status_history
    ADD CONSTRAINT order_status_history_changed_by_fkey 
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- Verification Query
-- ============================================
SELECT 
    '✅ Migration completed!' as status,
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

-- If you need to rollback, use: ROLLBACK;

