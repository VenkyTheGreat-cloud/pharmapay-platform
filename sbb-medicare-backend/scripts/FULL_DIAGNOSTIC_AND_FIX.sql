-- ============================================
-- FULL DIAGNOSTIC AND FIX - Run This Complete Script
-- ============================================

BEGIN;

-- ============================================
-- STEP 1: COMPREHENSIVE DIAGNOSTIC
-- ============================================

-- Check all constraints
SELECT '=== STEP 1: ALL CONSTRAINTS ===' as step;
SELECT 
    conname,
    contype,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass
ORDER BY conname;

-- Check role column definition  
SELECT '=== STEP 2: ROLE COLUMN DEFINITION ===' as step;
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'role';

-- Check current role values
SELECT '=== STEP 3: CURRENT ROLE VALUES ===' as step;
SELECT role, COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;

-- Check for triggers
SELECT '=== STEP 4: TRIGGERS ===' as step;
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users';

-- ============================================
-- STEP 2: FIX ALL ISSUES
-- ============================================

-- Remove ALL role-related constraints (in case there are multiple)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'users'::regclass 
        AND (conname LIKE '%role%' OR pg_get_constraintdef(oid) LIKE '%role%')
    LOOP
        EXECUTE 'ALTER TABLE users DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname) || ' CASCADE';
        RAISE NOTICE 'Dropped constraint: %', r.conname;
    END LOOP;
END $$;

-- Fix any invalid role data
UPDATE users
SET role = 'store_manager',
    updated_at = CURRENT_TIMESTAMP
WHERE role IS NULL 
   OR TRIM(role) = ''
   OR role NOT IN ('admin', 'store_manager');

-- Remove default value (to avoid conflicts)
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;

-- Re-add default value explicitly
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'store_manager';

-- Add the constraint with explicit name
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'store_manager'));

-- ============================================
-- STEP 3: VERIFICATION
-- ============================================

-- Verify constraint
SELECT '=== STEP 5: CONSTRAINT VERIFICATION ===' as step;
SELECT 
    conname,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname = 'users_role_check';

-- Test insert (will be rolled back)
SELECT '=== STEP 6: TEST INSERT ===' as step;
DO $$
BEGIN
    BEGIN
        INSERT INTO users (
            name, mobile, email, password_hash, role, is_active
        ) VALUES (
            'TEST_USER', '0000000000', 'test@test.com', '$2a$10$test', 'store_manager', true
        );
        RAISE NOTICE '✅ TEST INSERT SUCCESSFUL - Constraint is working!';
        ROLLBACK;
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE '❌ TEST INSERT FAILED - Constraint is blocking!';
        RAISE;
    END;
END $$;

COMMIT;

-- Final status
SELECT '✅✅✅ DIAGNOSTIC COMPLETE - Check the messages above ✅✅✅' as status;





