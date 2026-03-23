-- ============================================================================
-- DATABASE MIGRATION: Simplify Payment Modes (SAFE VERSION)
-- ============================================================================
-- This script safely updates payment modes to:
-- - Remove BANK_TRANSFER
-- - Add CREDIT
-- - Keep: CASH, CARD, UPI, SPLIT
-- ============================================================================
-- This version handles existing BANK_TRANSFER records before updating constraints
-- ============================================================================

-- ============================================================================
-- STEP 0: Check for existing BANK_TRANSFER records
-- ============================================================================
SELECT 
    'BANK_TRANSFER records in orders:' as info,
    COUNT(*) as count 
FROM orders 
WHERE payment_mode = 'BANK_TRANSFER';

SELECT 
    'BANK_TRANSFER records in payments:' as info,
    COUNT(*) as count 
FROM payments 
WHERE payment_mode = 'BANK_TRANSFER';

-- ============================================================================
-- STEP 1: Update existing BANK_TRANSFER records to CARD
-- ============================================================================
-- IMPORTANT: Review the counts above before proceeding
-- Uncomment the following lines to convert BANK_TRANSFER to CARD:

-- UPDATE orders 
-- SET payment_mode = 'CARD' 
-- WHERE payment_mode = 'BANK_TRANSFER';

-- UPDATE payments 
-- SET payment_mode = 'CARD' 
-- WHERE payment_mode = 'BANK_TRANSFER';

-- ============================================================================
-- STEP 2: Drop existing constraints (if they exist)
-- ============================================================================
-- Find and drop all payment_mode constraints (they might have different names)
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Drop orders payment_mode constraint
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'orders'::regclass
    AND pg_get_constraintdef(oid) LIKE '%payment_mode%';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE orders DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END IF;
    
    -- Drop payments payment_mode constraint
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'payments'::regclass
    AND pg_get_constraintdef(oid) LIKE '%payment_mode%';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE payments DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Add new constraints with CREDIT (no BANK_TRANSFER)
-- ============================================================================
ALTER TABLE orders ADD CONSTRAINT orders_payment_mode_check 
    CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'CREDIT', 'SPLIT') OR payment_mode IS NULL);

ALTER TABLE payments ADD CONSTRAINT payments_payment_mode_check 
    CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'CREDIT', 'SPLIT'));

-- ============================================================================
-- STEP 4: Verify changes
-- ============================================================================
SELECT 
    'Orders constraint:' as info,
    conname, 
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'orders'::regclass
AND conname = 'orders_payment_mode_check';

SELECT 
    'Payments constraint:' as info,
    conname, 
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'payments'::regclass
AND conname = 'payments_payment_mode_check';

-- ============================================================================
-- STEP 5: Verify no BANK_TRANSFER records remain
-- ============================================================================
SELECT 
    'Remaining BANK_TRANSFER in orders:' as info,
    COUNT(*) as count 
FROM orders 
WHERE payment_mode = 'BANK_TRANSFER';

SELECT 
    'Remaining BANK_TRANSFER in payments:' as info,
    COUNT(*) as count 
FROM payments 
WHERE payment_mode = 'BANK_TRANSFER';

-- If counts are > 0, you need to update those records first!
