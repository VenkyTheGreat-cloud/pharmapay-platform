-- ============================================================================
-- ALL DATABASE CHANGES - Complete Migration Script
-- ============================================================================
-- This script includes ALL database changes for:
-- 1. Accept/Reject order statuses
-- 2. Simplified order creation (manual order number)
-- 3. Multiple partial payments
-- 4. Payment modes: CASH, CARD, UPI, BANK_TRANSFER, SPLIT
-- 5. Payment status: PENDING, PARTIAL, PAID
-- 6. Delivery/payment proof photos
-- ============================================================================

-- ============================================================================
-- PART 1: ACCEPT/REJECT ORDER STATUSES
-- ============================================================================

-- Add ACCEPTED and REJECTED statuses to orders table
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('ASSIGNED', 'ACCEPTED', 'REJECTED', 'PICKED_UP', 'IN_TRANSIT', 'PAYMENT_COLLECTION', 'DELIVERED', 'CANCELLED'));

-- ============================================================================
-- PART 2: SIMPLIFIED ORDER & PAYMENT FLOW
-- ============================================================================

-- 1. Add delivery_photo_url column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_photo_url VARCHAR(500);

-- 2. Update payment_status constraint in orders table (add PARTIAL)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check 
    CHECK (payment_status IN ('PENDING', 'PARTIAL', 'PAID'));

-- 3. Update payment_mode constraint in orders table (add CARD and UPI)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_mode_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_mode_check 
    CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'SPLIT') OR payment_mode IS NULL);

-- 4. Update payment_mode constraint in payments table (add CARD and UPI)
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_mode_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_mode_check 
    CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'SPLIT'));

-- 5. Add index for payment queries (optimize payment summary calculations)
CREATE INDEX IF NOT EXISTS idx_payments_order_id_created_at 
    ON payments(order_id, created_at DESC);

-- ============================================================================
-- PART 3: UPDATE EXISTING DATA
-- ============================================================================

-- Update existing orders payment_status based on payments
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

-- ============================================================================
-- PART 4: VERIFICATION QUERIES
-- ============================================================================

-- Verify orders table constraints
SELECT 
    'Orders Table Constraints' as check_type,
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'orders'::regclass
AND conname IN ('orders_status_check', 'orders_payment_status_check', 'orders_payment_mode_check')
ORDER BY conname;

-- Verify payments table constraints
SELECT 
    'Payments Table Constraints' as check_type,
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'payments'::regclass
AND conname = 'payments_payment_mode_check';

-- Verify delivery_photo_url column
SELECT 
    'Orders Table Columns' as check_type,
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' 
AND column_name = 'delivery_photo_url';

-- Verify index
SELECT 
    'Payments Index' as check_type,
    indexname, 
    indexdef
FROM pg_indexes
WHERE tablename = 'payments'
AND indexname = 'idx_payments_order_id_created_at';

-- Summary report
SELECT 
    'Migration Summary' as status,
    (SELECT COUNT(*) FROM orders) as total_orders,
    (SELECT COUNT(*) FROM payments) as total_payments,
    (SELECT COUNT(*) FROM orders WHERE delivery_photo_url IS NOT NULL) as orders_with_photos,
    (SELECT COUNT(*) FROM orders WHERE payment_status = 'PENDING') as pending_orders,
    (SELECT COUNT(*) FROM orders WHERE payment_status = 'PARTIAL') as partial_orders,
    (SELECT COUNT(*) FROM orders WHERE payment_status = 'PAID') as paid_orders,
    (SELECT COUNT(*) FROM orders WHERE status = 'ACCEPTED') as accepted_orders,
    (SELECT COUNT(*) FROM orders WHERE status = 'REJECTED') as rejected_orders;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================


