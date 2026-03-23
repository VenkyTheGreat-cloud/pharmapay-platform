-- ============================================================================
-- FIND AND DROP PAYMENT MODE CONSTRAINTS
-- ============================================================================
-- Run this to see what constraints exist, then drop them
-- ============================================================================

-- Step 1: Find all payment_mode constraints
SELECT 
    'orders' as table_name,
    conname as constraint_name, 
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'orders'::regclass
AND pg_get_constraintdef(oid) LIKE '%payment_mode%';

SELECT 
    'payments' as table_name,
    conname as constraint_name, 
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'payments'::regclass
AND pg_get_constraintdef(oid) LIKE '%payment_mode%';

-- Step 2: Copy the constraint_name from above and use it here
-- Replace 'orders_payment_mode_check' with the actual name from Step 1
-- ALTER TABLE orders DROP CONSTRAINT orders_payment_mode_check;
-- ALTER TABLE payments DROP CONSTRAINT payments_payment_mode_check;

-- OR use this to drop automatically:
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Drop orders constraints
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'orders'::regclass 
        AND pg_get_constraintdef(oid) LIKE '%payment_mode%'
    LOOP
        EXECUTE 'ALTER TABLE orders DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped: %', constraint_name;
    END LOOP;
    
    -- Drop payments constraints
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'payments'::regclass 
        AND pg_get_constraintdef(oid) LIKE '%payment_mode%'
    LOOP
        EXECUTE 'ALTER TABLE payments DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped: %', constraint_name;
    END LOOP;
END $$;
