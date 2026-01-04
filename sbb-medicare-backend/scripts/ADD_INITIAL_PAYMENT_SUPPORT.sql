-- ============================================================================
-- DATABASE MIGRATION: Initial Payment Support in Order Creation
-- ============================================================================
-- This script ensures the database supports accepting initial payment
-- when creating orders from the store dashboard.
-- ============================================================================
-- Most changes are already in place from previous migrations, but this
-- script verifies and ensures everything is correct.
-- ============================================================================

-- ============================================================================
-- STEP 1: Verify orders table has payment_status column with PARTIAL support
-- ============================================================================
-- Check if payment_status constraint includes PARTIAL
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'orders'::regclass 
        AND conname = 'orders_payment_status_check'
        AND pg_get_constraintdef(oid) LIKE '%PARTIAL%'
    ) THEN
        -- Update payment_status constraint to include PARTIAL
        ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
        ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check 
            CHECK (payment_status IN ('PENDING', 'PARTIAL', 'PAID'));
        
        RAISE NOTICE 'Updated payment_status constraint to include PARTIAL';
    ELSE
        RAISE NOTICE 'payment_status constraint already includes PARTIAL';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: Verify orders table has payment_mode column with CARD and UPI
-- ============================================================================
-- Check if payment_mode constraint includes CARD and UPI
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'orders'::regclass 
        AND conname = 'orders_payment_mode_check'
        AND (pg_get_constraintdef(oid) LIKE '%CARD%' OR pg_get_constraintdef(oid) LIKE '%UPI%')
    ) THEN
        -- Update payment_mode constraint to include CARD and UPI
        ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_mode_check;
        ALTER TABLE orders ADD CONSTRAINT orders_payment_mode_check 
            CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'SPLIT') OR payment_mode IS NULL);
        
        RAISE NOTICE 'Updated payment_mode constraint to include CARD and UPI';
    ELSE
        RAISE NOTICE 'payment_mode constraint already includes CARD and UPI';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Verify payments table supports CARD and UPI
-- ============================================================================
-- Check if payments payment_mode constraint includes CARD and UPI
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'payments'::regclass 
        AND conname = 'payments_payment_mode_check'
        AND (pg_get_constraintdef(oid) LIKE '%CARD%' OR pg_get_constraintdef(oid) LIKE '%UPI%')
    ) THEN
        -- Update payment_mode constraint to include CARD and UPI
        ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_mode_check;
        ALTER TABLE payments ADD CONSTRAINT payments_payment_mode_check 
            CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'SPLIT'));
        
        RAISE NOTICE 'Updated payments payment_mode constraint to include CARD and UPI';
    ELSE
        RAISE NOTICE 'payments payment_mode constraint already includes CARD and UPI';
    END IF;
END $$;

-- ============================================================================
-- STEP 4: Verify payments table has transaction_reference column
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'transaction_reference'
    ) THEN
        -- Add transaction_reference column if it doesn't exist
        ALTER TABLE payments ADD COLUMN transaction_reference VARCHAR(255);
        RAISE NOTICE 'Added transaction_reference column to payments table';
    ELSE
        RAISE NOTICE 'transaction_reference column already exists in payments table';
    END IF;
END $$;

-- ============================================================================
-- STEP 5: Verify index exists for payment queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_payments_order_id_created_at 
    ON payments(order_id, created_at DESC);

-- ============================================================================
-- STEP 6: Ensure payments.created_by allows NULL
-- ============================================================================
-- Note: When store manager creates order with initial payment, created_by
-- should be NULL because payments.created_by is BIGINT (delivery_boy_id),
-- but store_id is UUID. Store info is tracked in order_status_history instead.

-- Check if created_by allows NULL
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'created_by'
        AND is_nullable = 'NO'
    ) THEN
        -- Make created_by nullable (for store-created payments)
        ALTER TABLE payments ALTER COLUMN created_by DROP NOT NULL;
        RAISE NOTICE 'Made payments.created_by nullable for store-created payments';
    ELSE
        RAISE NOTICE 'payments.created_by already allows NULL';
    END IF;
END $$;

-- ============================================================================
-- STEP 7: Verification Queries
-- ============================================================================

-- Verify orders table constraints
SELECT 
    'Orders Table - Payment Status Constraint' as check_type,
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'orders'::regclass
AND conname = 'orders_payment_status_check';

SELECT 
    'Orders Table - Payment Mode Constraint' as check_type,
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'orders'::regclass
AND conname = 'orders_payment_mode_check';

-- Verify payments table constraints
SELECT 
    'Payments Table - Payment Mode Constraint' as check_type,
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'payments'::regclass
AND conname = 'payments_payment_mode_check';

-- Verify payments table columns
SELECT 
    'Payments Table Columns' as check_type,
    column_name,
    data_type,
    is_nullable,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'payments'
AND column_name IN ('payment_mode', 'transaction_reference', 'created_by', 'cash_amount', 'bank_amount')
ORDER BY column_name;

-- Verify index
SELECT 
    'Payments Index' as check_type,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'payments'
AND indexname = 'idx_payments_order_id_created_at';

-- ============================================================================
-- STEP 8: Summary Report
-- ============================================================================
SELECT 
    'Migration Summary' as status,
    (SELECT COUNT(*) FROM orders) as total_orders,
    (SELECT COUNT(*) FROM payments) as total_payments,
    (SELECT COUNT(*) FROM orders WHERE payment_status = 'PENDING') as pending_orders,
    (SELECT COUNT(*) FROM orders WHERE payment_status = 'PARTIAL') as partial_orders,
    (SELECT COUNT(*) FROM orders WHERE payment_status = 'PAID') as paid_orders,
    (SELECT COUNT(*) FROM payments WHERE payment_mode = 'CASH') as cash_payments,
    (SELECT COUNT(*) FROM payments WHERE payment_mode = 'CARD') as card_payments,
    (SELECT COUNT(*) FROM payments WHERE payment_mode = 'UPI') as upi_payments;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

