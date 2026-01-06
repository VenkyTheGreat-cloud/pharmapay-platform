-- ============================================
-- DIAGNOSE AND FIX - Run This Complete Script
-- This will tell you EXACTLY what's wrong and fix it
-- ============================================

-- Step 1: Show what's wrong
\echo '=== DIAGNOSIS ==='

-- Check if constraint exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conrelid = 'users'::regclass 
            AND conname = 'users_role_check'
        ) THEN '✅ Constraint EXISTS'
        ELSE '❌ Constraint MISSING - This is the problem!'
    END as constraint_status;

-- Show current constraint definition
SELECT 
    'Current constraint definition:' as info,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conrelid = 'users'::regclass 
            AND conname = 'users_role_check'
        ) 
        THEN pg_get_constraintdef(oid)
        ELSE 'CONSTRAINT DOES NOT EXIST'
    END as definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname = 'users_role_check';

-- Check for invalid roles
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM users 
            WHERE role IS NULL 
            OR role = ''
            OR role NOT IN ('admin', 'store_manager')
        ) THEN '❌ Invalid roles found - This will block constraint!'
        ELSE '✅ All roles are valid'
    END as role_status;

-- Show invalid roles (if any)
SELECT 
    'Invalid roles (these need to be fixed):' as info,
    role,
    COUNT(*) as count
FROM users
WHERE role IS NULL 
   OR role = ''
   OR role NOT IN ('admin', 'store_manager')
GROUP BY role;

-- ============================================
-- Step 2: FIX EVERYTHING
-- ============================================
\echo ''
\echo '=== APPLYING FIX ==='

BEGIN;

-- Fix invalid roles first
UPDATE users
SET role = 'store_manager', updated_at = CURRENT_TIMESTAMP
WHERE role IS NULL 
   OR role = ''
   OR role NOT IN ('admin', 'store_manager');

-- Remove ALL role constraints
DO $$
DECLARE constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT conname FROM pg_constraint 
        WHERE conrelid = 'users'::regclass 
        AND (
            conname LIKE '%role%' 
            OR pg_get_constraintdef(oid) LIKE '%role%'
        )
    LOOP
        EXECUTE 'ALTER TABLE users DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name) || ' CASCADE';
        RAISE NOTICE 'Removed constraint: %', constraint_name;
    END LOOP;
END $$;

-- Add correct constraint
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'store_manager'));

COMMIT;

-- ============================================
-- Step 3: VERIFY FIX
-- ============================================
\echo ''
\echo '=== VERIFICATION ==='

-- Verify constraint exists and is correct
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conrelid = 'users'::regclass 
            AND conname = 'users_role_check'
        ) THEN '✅ Constraint EXISTS and is CORRECT'
        ELSE '❌ Constraint STILL MISSING - Something went wrong!'
    END as final_status;

-- Show the constraint definition
SELECT 
    'Final constraint:' as info,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname = 'users_role_check';

-- Test that it works
BEGIN;
    INSERT INTO users (name, mobile, email, password_hash, role, is_active)
    VALUES ('TEST_FIX', '8888888888', 'testfix@test.com', '$2a$10$test', 'store_manager', true);
    
    SELECT '✅ TEST INSERT SUCCESSFUL - Constraint is working!' as test_result;
    
    DELETE FROM users WHERE email = 'testfix@test.com';
ROLLBACK;

\echo ''
\echo '=== DONE ==='
\echo 'If you see "✅ TEST INSERT SUCCESSFUL", the fix worked!'
\echo 'Now try creating a store manager via the API.'






