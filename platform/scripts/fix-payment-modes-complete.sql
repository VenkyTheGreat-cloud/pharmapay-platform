-- ============================================================================
-- COMPLETE FIX: Update Payment Modes (Remove BANK_TRANSFER, Add CREDIT)
-- ============================================================================
-- This script automatically finds and drops constraints, no placeholders needed
-- ============================================================================

-- ============================================================================
-- STEP 1: Update existing BANK_TRANSFER records to CARD
-- ============================================================================
UPDATE orders 
SET payment_mode = 'CARD' 
WHERE payment_mode = 'BANK_TRANSFER';

UPDATE payments 
SET payment_mode = 'CARD' 
WHERE payment_mode = 'BANK_TRANSFER';

-- ============================================================================
-- STEP 2: Drop ALL payment_mode constraints automatically
-- ============================================================================
-- This finds and drops any constraint related to payment_mode
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find and drop orders payment_mode constraint
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'orders'::regclass 
        AND pg_get_constraintdef(oid) LIKE '%payment_mode%'
    LOOP
        EXECUTE 'ALTER TABLE orders DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Dropped orders constraint: %', constraint_name;
    END LOOP;
    
    -- Find and drop payments payment_mode constraint
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'payments'::regclass 
        AND pg_get_constraintdef(oid) LIKE '%payment_mode%'
    LOOP
        EXECUTE 'ALTER TABLE payments DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Dropped payments constraint: %', constraint_name;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 3: Add new constraints with CREDIT (no BANK_TRANSFER)
-- ============================================================================
ALTER TABLE orders ADD CONSTRAINT orders_payment_mode_check 
    CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'CREDIT', 'SPLIT') OR payment_mode IS NULL);

ALTER TABLE payments ADD CONSTRAINT payments_payment_mode_check 
    CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'CREDIT', 'SPLIT'));

-- ============================================================================
-- STEP 4: Verify the changes
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
