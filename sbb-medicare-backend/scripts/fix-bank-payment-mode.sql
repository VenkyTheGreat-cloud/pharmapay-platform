-- ============================================================================
-- DATABASE FIX: Add BANK Payment Mode and Update Constraints
-- ============================================================================
-- This script fixes the 500 error by:
-- 1. Migrating 'CARD' and 'UPI' records to 'BANK'
-- 2. Updating check constraints on 'orders' and 'payments' tables to include 'BANK'
-- ============================================================================

-- STEP 1: Find and drop existing constraints automatically
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- For orders table
    FOR constraint_record IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'orders'::regclass 
        AND pg_get_constraintdef(oid) LIKE '%payment_mode%'
    LOOP
        EXECUTE 'ALTER TABLE orders DROP CONSTRAINT IF EXISTS ' || constraint_record.conname;
        RAISE NOTICE 'Dropped orders constraint: %', constraint_record.conname;
    END LOOP;
    
    -- For payments table
    FOR constraint_record IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'payments'::regclass 
        AND pg_get_constraintdef(oid) LIKE '%payment_mode%'
    LOOP
        EXECUTE 'ALTER TABLE payments DROP CONSTRAINT IF EXISTS ' || constraint_record.conname;
        RAISE NOTICE 'Dropped payments constraint: %', constraint_record.conname;
    END LOOP;
END $$;

-- STEP 2: Update existing CARD and UPI records to BANK (as per new requirements)
UPDATE orders 
SET payment_mode = 'BANK' 
WHERE payment_mode IN ('CARD', 'UPI');

UPDATE payments 
SET payment_mode = 'BANK' 
WHERE payment_mode IN ('CARD', 'UPI', 'BANK_TRANSFER');

-- STEP 3: Add new constraints with restricted set (CASH, BANK, CREDIT, SPLIT)
ALTER TABLE orders ADD CONSTRAINT orders_payment_mode_check 
    CHECK (payment_mode IN ('CASH', 'BANK', 'CREDIT', 'SPLIT') OR payment_mode IS NULL);

ALTER TABLE payments ADD CONSTRAINT payments_payment_mode_check 
    CHECK (payment_mode IN ('CASH', 'BANK', 'CREDIT', 'SPLIT'));

-- STEP 4: Verify current constraints
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid IN ('orders'::regclass, 'payments'::regclass)
AND pg_get_constraintdef(oid) LIKE '%payment_mode%';
