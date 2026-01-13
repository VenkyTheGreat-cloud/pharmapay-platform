-- Safe Migration: Update foreign keys to UUID without losing data
-- This script preserves existing data while updating column types

BEGIN;

-- Step 1: Check if tables have data (you'll need to verify this manually)
-- SELECT COUNT(*) FROM delivery_boys;
-- SELECT COUNT(*) FROM customers;
-- SELECT COUNT(*) FROM orders;
-- SELECT COUNT(*) FROM refresh_tokens;
-- SELECT COUNT(*) FROM order_status_history;

-- ============================================
-- 1. DELIVERY_BOYS table
-- ============================================

-- Drop foreign key constraint temporarily
ALTER TABLE IF EXISTS delivery_boys 
    DROP CONSTRAINT IF EXISTS delivery_boys_store_id_fkey;

-- Change column type from BIGINT to UUID
-- Note: If store_id has values, they must be valid UUIDs or NULL
DO $$ 
BEGIN
    -- Check if column exists and its type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delivery_boys' AND column_name = 'store_id'
    ) THEN
        -- Convert to UUID (will fail if invalid values exist)
        -- If you have BIGINT values, set them to NULL first
        UPDATE delivery_boys SET store_id = NULL 
        WHERE store_id IS NOT NULL 
        AND store_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        
        -- Alter column type
        ALTER TABLE delivery_boys 
            ALTER COLUMN store_id TYPE UUID USING store_id::text::uuid;
    ELSE
        -- Column doesn't exist, add it
        ALTER TABLE delivery_boys ADD COLUMN store_id UUID;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error updating delivery_boys.store_id: %', SQLERRM;
END $$;

-- Recreate foreign key constraint
ALTER TABLE delivery_boys
    ADD CONSTRAINT delivery_boys_store_id_fkey 
    FOREIGN KEY (store_id) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- 2. CUSTOMERS table
-- ============================================

ALTER TABLE IF EXISTS customers 
    DROP CONSTRAINT IF EXISTS customers_store_id_fkey;

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'store_id'
    ) THEN
        UPDATE customers SET store_id = NULL 
        WHERE store_id IS NOT NULL 
        AND store_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        
        ALTER TABLE customers 
            ALTER COLUMN store_id TYPE UUID USING store_id::text::uuid;
    ELSE
        ALTER TABLE customers ADD COLUMN store_id UUID;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error updating customers.store_id: %', SQLERRM;
END $$;

ALTER TABLE customers
    ADD CONSTRAINT customers_store_id_fkey 
    FOREIGN KEY (store_id) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- 3. ORDERS table
-- ============================================

ALTER TABLE IF EXISTS orders 
    DROP CONSTRAINT IF EXISTS orders_store_id_fkey;

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'store_id'
    ) THEN
        UPDATE orders SET store_id = NULL 
        WHERE store_id IS NOT NULL 
        AND store_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        
        ALTER TABLE orders 
            ALTER COLUMN store_id TYPE UUID USING store_id::text::uuid;
    ELSE
        ALTER TABLE orders ADD COLUMN store_id UUID;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error updating orders.store_id: %', SQLERRM;
END $$;

ALTER TABLE orders
    ADD CONSTRAINT orders_store_id_fkey 
    FOREIGN KEY (store_id) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- 4. REFRESH_TOKENS table
-- ============================================

ALTER TABLE IF EXISTS refresh_tokens 
    DROP CONSTRAINT IF EXISTS refresh_tokens_user_id_fkey;

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'refresh_tokens' AND column_name = 'user_id'
    ) THEN
        UPDATE refresh_tokens SET user_id = NULL 
        WHERE user_id IS NOT NULL 
        AND user_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        
        ALTER TABLE refresh_tokens 
            ALTER COLUMN user_id TYPE UUID USING user_id::text::uuid;
    ELSE
        ALTER TABLE refresh_tokens ADD COLUMN user_id UUID;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error updating refresh_tokens.user_id: %', SQLERRM;
END $$;

ALTER TABLE refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ============================================
-- 5. ORDER_STATUS_HISTORY table
-- ============================================

ALTER TABLE IF EXISTS order_status_history 
    DROP CONSTRAINT IF EXISTS order_status_history_changed_by_fkey;

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_status_history' AND column_name = 'changed_by'
    ) THEN
        UPDATE order_status_history SET changed_by = NULL 
        WHERE changed_by IS NOT NULL 
        AND changed_by::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        
        ALTER TABLE order_status_history 
            ALTER COLUMN changed_by TYPE UUID USING changed_by::text::uuid;
    ELSE
        ALTER TABLE order_status_history ADD COLUMN changed_by UUID;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error updating order_status_history.changed_by: %', SQLERRM;
END $$;

ALTER TABLE order_status_history
    ADD CONSTRAINT order_status_history_changed_by_fkey 
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- Verify the changes
-- ============================================

SELECT 
    table_name,
    column_name,
    data_type,
    CASE 
        WHEN data_type = 'uuid' THEN '✅ Correct'
        ELSE '❌ Wrong type'
    END as status
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

-- If there are errors, you can rollback with: ROLLBACK;









