-- ============================================================================
-- DATABASE MIGRATION: Simplify Payment Modes
-- ============================================================================
-- This script updates payment modes to:
-- - Remove BANK_TRANSFER
-- - Add CREDIT
-- - Keep: CASH, CARD, UPI, SPLIT
-- ============================================================================

-- ============================================================================
-- STEP 1: Update payment_mode constraint in orders table
-- ============================================================================
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_mode_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_mode_check 
    CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'CREDIT', 'SPLIT') OR payment_mode IS NULL);

-- ============================================================================
-- STEP 2: Update payment_mode constraint in payments table
-- ============================================================================
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_mode_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_mode_check 
    CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'CREDIT', 'SPLIT'));

-- ============================================================================
-- STEP 3: Update existing BANK_TRANSFER records to CARD (optional)
-- ============================================================================
-- Note: You may want to review these records before updating
-- Uncomment the following if you want to automatically convert BANK_TRANSFER to CARD:
-- UPDATE orders SET payment_mode = 'CARD' WHERE payment_mode = 'BANK_TRANSFER';
-- UPDATE payments SET payment_mode = 'CARD' WHERE payment_mode = 'BANK_TRANSFER';

-- ============================================================================
-- STEP 4: Verify changes
-- ============================================================================
SELECT 
    conname, 
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'orders'::regclass
AND conname = 'orders_payment_mode_check';

SELECT 
    conname, 
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'payments'::regclass
AND conname = 'payments_payment_mode_check';

-- ============================================================================
-- STEP 5: Check for any remaining BANK_TRANSFER records (should be 0 after migration)
-- ============================================================================
SELECT COUNT(*) as bank_transfer_orders FROM orders WHERE payment_mode = 'BANK_TRANSFER';
SELECT COUNT(*) as bank_transfer_payments FROM payments WHERE payment_mode = 'BANK_TRANSFER';
