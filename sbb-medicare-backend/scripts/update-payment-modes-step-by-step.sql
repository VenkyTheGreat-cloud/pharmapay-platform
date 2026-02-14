-- ============================================================================
-- DATABASE MIGRATION: Simplify Payment Modes (STEP BY STEP)
-- ============================================================================
-- Run these steps ONE AT A TIME to identify where the error occurs
-- ============================================================================

-- ============================================================================
-- STEP 1: Check current state
-- ============================================================================
-- Run this first to see current constraints
SELECT 
    'Current orders constraints:' as step,
    conname, 
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'orders'::regclass
AND pg_get_constraintdef(oid) LIKE '%payment_mode%';

SELECT 
    'Current payments constraints:' as step,
    conname, 
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'payments'::regclass
AND pg_get_constraintdef(oid) LIKE '%payment_mode%';

-- ============================================================================
-- STEP 2: Check for BANK_TRANSFER records
-- ============================================================================
-- Run this to see if there are any BANK_TRANSFER records
SELECT 
    'BANK_TRANSFER in orders:' as step,
    COUNT(*) as count 
FROM orders 
WHERE payment_mode = 'BANK_TRANSFER';

SELECT 
    'BANK_TRANSFER in payments:' as step,
    COUNT(*) as count 
FROM payments 
WHERE payment_mode = 'BANK_TRANSFER';

-- ============================================================================
-- STEP 3: Update BANK_TRANSFER records (if any exist)
-- ============================================================================
-- ONLY run this if Step 2 shows records with BANK_TRANSFER
-- Uncomment to convert BANK_TRANSFER to CARD:
/*
UPDATE orders 
SET payment_mode = 'CARD' 
WHERE payment_mode = 'BANK_TRANSFER';

UPDATE payments 
SET payment_mode = 'CARD' 
WHERE payment_mode = 'BANK_TRANSFER';
*/

-- ============================================================================
-- STEP 4: Drop constraints (try different constraint names)
-- ============================================================================
-- Try these one at a time if DROP CONSTRAINT fails:

-- Option A: Drop by exact name
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_mode_check;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_mode_check;

-- Option B: If above fails, find the actual constraint name:
-- SELECT conname FROM pg_constraint 
-- WHERE conrelid = 'orders'::regclass 
-- AND pg_get_constraintdef(oid) LIKE '%payment_mode%';

-- Then drop using the actual name:
-- ALTER TABLE orders DROP CONSTRAINT <actual_constraint_name>;

-- ============================================================================
-- STEP 5: Add new constraints
-- ============================================================================
-- Only run this after successfully dropping constraints in Step 4
ALTER TABLE orders ADD CONSTRAINT orders_payment_mode_check 
    CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'CREDIT', 'SPLIT') OR payment_mode IS NULL);

ALTER TABLE payments ADD CONSTRAINT payments_payment_mode_check 
    CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'CREDIT', 'SPLIT'));

-- ============================================================================
-- STEP 6: Verify
-- ============================================================================
SELECT 
    'New orders constraint:' as step,
    conname, 
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'orders'::regclass
AND conname = 'orders_payment_mode_check';

SELECT 
    'New payments constraint:' as step,
    conname, 
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'payments'::regclass
AND conname = 'payments_payment_mode_check';
