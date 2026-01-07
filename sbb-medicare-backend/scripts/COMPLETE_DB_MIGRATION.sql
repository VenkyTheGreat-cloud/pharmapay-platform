-- ============================================================================
-- COMPLETE DATABASE MIGRATION FOR SIMPLIFIED ORDER & PAYMENT FLOW
-- ============================================================================
-- This script contains ALL queries needed to support:
-- 1. Simplified order creation (no items, manual order number)
-- 2. Multiple partial payments per order
-- 3. Payment modes: CASH, CARD, UPI, BANK_TRANSFER, SPLIT
-- 4. Payment status: PENDING, PARTIAL, PAID
-- 5. Delivery/payment proof photos
-- ============================================================================

-- ============================================================================
-- STEP 1: Add delivery_photo_url column to orders table
-- ============================================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_photo_url VARCHAR(500);

-- Verify column was added
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' 
AND column_name = 'delivery_photo_url';

-- ============================================================================
-- STEP 2: Update payment_status constraint in orders table
-- ============================================================================
-- Drop existing constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;

-- Add new constraint with PARTIAL status
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check 
    CHECK (payment_status IN ('PENDING', 'PARTIAL', 'PAID'));

-- Verify constraint
SELECT 
    conname, 
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'orders'::regclass
AND conname = 'orders_payment_status_check';

-- ============================================================================
-- STEP 3: Update payment_mode constraint in orders table
-- ============================================================================
-- Drop existing constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_mode_check;

-- Add new constraint with CARD and UPI
ALTER TABLE orders ADD CONSTRAINT orders_payment_mode_check 
    CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'SPLIT') OR payment_mode IS NULL);

-- Verify constraint
SELECT 
    conname, 
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'orders'::regclass
AND conname = 'orders_payment_mode_check';

-- ============================================================================
-- STEP 4: Update payment_mode constraint in payments table
-- ============================================================================
-- Drop existing constraint
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_mode_check;

-- Add new constraint with CARD and UPI
ALTER TABLE payments ADD CONSTRAINT payments_payment_mode_check 
    CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'SPLIT'));

-- Verify constraint
SELECT 
    conname, 
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'payments'::regclass
AND conname = 'payments_payment_mode_check';

-- ============================================================================
-- STEP 5: Add index for payment queries (optimize payment summary calculations)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_payments_order_id_created_at 
    ON payments(order_id, created_at DESC);

-- Verify index
SELECT 
    indexname, 
    indexdef
FROM pg_indexes
WHERE tablename = 'payments'
AND indexname = 'idx_payments_order_id_created_at';

-- ============================================================================
-- STEP 6: Verify all changes
-- ============================================================================
-- Check orders table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'orders' 
AND column_name IN ('delivery_photo_url', 'payment_status', 'payment_mode')
ORDER BY column_name;

-- Check payments table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'payments' 
AND column_name = 'payment_mode';

-- Check all constraints on orders table
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'orders'::regclass
AND conname IN ('orders_payment_status_check', 'orders_payment_mode_check')
ORDER BY conname;

-- Check all constraints on payments table
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'payments'::regclass
AND conname = 'payments_payment_mode_check';

-- ============================================================================
-- STEP 7: Update existing orders (if any) to have correct payment_status
-- ============================================================================
-- This query updates payment_status for existing orders based on payments
UPDATE orders o
SET payment_status = CASE
    WHEN COALESCE((
        SELECT SUM(p.cash_amount + p.bank_amount)
        FROM payments p
        WHERE p.order_id = o.id AND p.status = 'CONFIRMED'
    ), 0) >= o.total_amount THEN 'PAID'
    WHEN COALESCE((
        SELECT SUM(p.cash_amount + p.bank_amount)
        FROM payments p
        WHERE p.order_id = o.id AND p.status = 'CONFIRMED'
    ), 0) > 0 THEN 'PARTIAL'
    ELSE 'PENDING'
END
WHERE payment_status IS NULL OR payment_status NOT IN ('PENDING', 'PARTIAL', 'PAID');

-- Verify updated payment statuses
SELECT 
    payment_status,
    COUNT(*) as count
FROM orders
GROUP BY payment_status
ORDER BY payment_status;

-- ============================================================================
-- STEP 8: Summary Report
-- ============================================================================
SELECT 
    'Migration Complete' as status,
    (SELECT COUNT(*) FROM orders) as total_orders,
    (SELECT COUNT(*) FROM payments) as total_payments,
    (SELECT COUNT(*) FROM orders WHERE delivery_photo_url IS NOT NULL) as orders_with_photos,
    (SELECT COUNT(*) FROM orders WHERE payment_status = 'PENDING') as pending_orders,
    (SELECT COUNT(*) FROM orders WHERE payment_status = 'PARTIAL') as partial_orders,
    (SELECT COUNT(*) FROM orders WHERE payment_status = 'PAID') as paid_orders;

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================
/*
-- To rollback these changes, execute:

-- Remove delivery_photo_url column
ALTER TABLE orders DROP COLUMN IF EXISTS delivery_photo_url;

-- Revert payment_status constraint (if needed)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check 
    CHECK (payment_status IN ('PENDING', 'PAID'));

-- Revert payment_mode constraints (if needed)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_mode_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_mode_check 
    CHECK (payment_mode IN ('CASH', 'BANK_TRANSFER', 'SPLIT') OR payment_mode IS NULL);

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_mode_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_mode_check 
    CHECK (payment_mode IN ('CASH', 'BANK_TRANSFER', 'SPLIT'));

-- Remove index
DROP INDEX IF EXISTS idx_payments_order_id_created_at;
*/

-- ============================================================================
-- END OF MIGRATION SCRIPT
-- ============================================================================




