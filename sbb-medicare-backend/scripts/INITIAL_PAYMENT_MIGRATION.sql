-- ============================================================================
-- DATABASE MIGRATION: Initial Payment Support
-- ============================================================================
-- This script ensures the database supports accepting initial payment
-- when creating orders from the store dashboard.
-- ============================================================================
-- Run this script if you haven't run ALL_DB_CHANGES.sql yet
-- ============================================================================

-- ============================================================================
-- STEP 1: Update payment_status constraint (add PARTIAL)
-- ============================================================================
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check 
    CHECK (payment_status IN ('PENDING', 'PARTIAL', 'PAID'));

-- ============================================================================
-- STEP 2: Update payment_mode constraint in orders (add CARD and UPI)
-- ============================================================================
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_mode_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_mode_check 
    CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'SPLIT') OR payment_mode IS NULL);

-- ============================================================================
-- STEP 3: Update payment_mode constraint in payments (add CARD and UPI)
-- ============================================================================
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_mode_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_mode_check 
    CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'SPLIT'));

-- ============================================================================
-- STEP 4: Ensure payments.created_by allows NULL
-- ============================================================================
-- This is needed because store managers (UUID) can create payments,
-- but payments.created_by references delivery_boys (BIGINT)
ALTER TABLE payments ALTER COLUMN created_by DROP NOT NULL;

-- ============================================================================
-- STEP 5: Ensure transaction_reference column exists
-- ============================================================================
ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_reference VARCHAR(255);

-- ============================================================================
-- STEP 6: Add index for payment queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_payments_order_id_created_at 
    ON payments(order_id, created_at DESC);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check constraints
SELECT 
    'Orders - Payment Status' as check_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'orders'::regclass
AND conname = 'orders_payment_status_check';

SELECT 
    'Orders - Payment Mode' as check_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'orders'::regclass
AND conname = 'orders_payment_mode_check';

SELECT 
    'Payments - Payment Mode' as check_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'payments'::regclass
AND conname = 'payments_payment_mode_check';

-- Check columns
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'payments'
AND column_name IN ('transaction_reference', 'created_by')
ORDER BY column_name;

-- Done!
SELECT 'Migration completed successfully!' as status;




