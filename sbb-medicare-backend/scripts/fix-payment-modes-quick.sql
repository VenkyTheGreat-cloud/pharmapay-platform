-- ============================================================================
-- QUICK FIX: Update Payment Modes (Remove BANK_TRANSFER, Add CREDIT)
-- ============================================================================
-- This script handles all edge cases and updates existing data first
-- ============================================================================

-- Step 1: Update existing BANK_TRANSFER records to CARD
UPDATE orders 
SET payment_mode = 'CARD' 
WHERE payment_mode = 'BANK_TRANSFER';

UPDATE payments 
SET payment_mode = 'CARD' 
WHERE payment_mode = 'BANK_TRANSFER';

-- Step 2: Drop ALL payment_mode constraints (handles any constraint name)
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all payment_mode constraints from orders
    FOR r IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'orders'::regclass 
        AND pg_get_constraintdef(oid) LIKE '%payment_mode%'
    LOOP
        EXECUTE 'ALTER TABLE orders DROP CONSTRAINT IF EXISTS ' || r.conname;
        RAISE NOTICE 'Dropped orders constraint: %', r.conname;
    END LOOP;
    
    -- Drop all payment_mode constraints from payments
    FOR r IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'payments'::regclass 
        AND pg_get_constraintdef(oid) LIKE '%payment_mode%'
    LOOP
        EXECUTE 'ALTER TABLE payments DROP CONSTRAINT IF EXISTS ' || r.conname;
        RAISE NOTICE 'Dropped payments constraint: %', r.conname;
    END LOOP;
END $$;

-- Step 3: Add new constraints with CREDIT (no BANK_TRANSFER)
ALTER TABLE orders ADD CONSTRAINT orders_payment_mode_check 
    CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'CREDIT', 'SPLIT') OR payment_mode IS NULL);

ALTER TABLE payments ADD CONSTRAINT payments_payment_mode_check 
    CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'CREDIT', 'SPLIT'));

-- Step 4: Verify
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

-- Step 5: Verify no BANK_TRANSFER remains
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
