-- Simple Migration: Update foreign keys to UUID
-- Use this if tables are empty or if foreign keys are already NULL/invalid
-- This version is simpler and safer for empty tables

BEGIN;

-- ============================================
-- 1. DELIVERY_BOYS.store_id
-- ============================================
ALTER TABLE IF EXISTS delivery_boys 
    DROP CONSTRAINT IF EXISTS delivery_boys_store_id_fkey CASCADE;

-- Check current type and convert
DO $$ 
BEGIN
    -- If column is BIGINT, set NULL first (preserve if already UUID)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delivery_boys' 
        AND column_name = 'store_id' 
        AND data_type = 'bigint'
    ) THEN
        -- Set existing values to NULL (you can update manually later)
        UPDATE delivery_boys SET store_id = NULL WHERE store_id IS NOT NULL;
        
        -- Change type to UUID
        ALTER TABLE delivery_boys 
            ALTER COLUMN store_id TYPE UUID USING NULL;
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delivery_boys' AND column_name = 'store_id'
    ) THEN
        -- Column doesn't exist, add it
        ALTER TABLE delivery_boys ADD COLUMN store_id UUID;
    END IF;
END $$;

-- Recreate foreign key
ALTER TABLE delivery_boys
    ADD CONSTRAINT delivery_boys_store_id_fkey 
    FOREIGN KEY (store_id) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- 2. CUSTOMERS.store_id
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
        UPDATE customers SET store_id = NULL WHERE store_id IS NOT NULL;
        ALTER TABLE customers 
            ALTER COLUMN store_id TYPE UUID USING NULL;
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

-- ============================================
-- 3. ORDERS.store_id
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
        UPDATE orders SET store_id = NULL WHERE store_id IS NOT NULL;
        ALTER TABLE orders 
            ALTER COLUMN store_id TYPE UUID USING NULL;
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

-- ============================================
-- 4. REFRESH_TOKENS.user_id
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
        UPDATE refresh_tokens SET user_id = NULL WHERE user_id IS NOT NULL;
        ALTER TABLE refresh_tokens 
            ALTER COLUMN user_id TYPE UUID USING NULL;
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

-- ============================================
-- 5. ORDER_STATUS_HISTORY.changed_by
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
        UPDATE order_status_history SET changed_by = NULL WHERE changed_by IS NOT NULL;
        ALTER TABLE order_status_history 
            ALTER COLUMN changed_by TYPE UUID USING NULL;
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
    'Migration completed!' as status,
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

