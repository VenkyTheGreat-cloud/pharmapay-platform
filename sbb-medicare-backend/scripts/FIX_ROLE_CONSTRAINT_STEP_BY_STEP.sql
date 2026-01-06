-- ============================================
-- STEP-BY-STEP FIX FOR ROLE CONSTRAINT ERROR
-- Run this ENTIRE script from top to bottom
-- ============================================

-- ============================================
-- STEP 1: CHECK WHAT EXISTS NOW
-- ============================================
\echo '=== STEP 1: Checking current state ==='

-- Check what role values exist in the table
SELECT 'Current role values in users table:' as info;
SELECT role, COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;

-- Check what constraints exist
SELECT 'Existing constraints on users table:' as info;
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass
ORDER BY conname;

-- ============================================
-- STEP 2: FIX INVALID DATA FIRST
-- ============================================
\echo ''
\echo '=== STEP 2: Fixing invalid role values ==='

-- Update any invalid roles to 'store_manager'
UPDATE users
SET role = 'store_manager',
    updated_at = CURRENT_TIMESTAMP
WHERE role IS NULL 
   OR role = ''
   OR TRIM(role) = ''
   OR role NOT IN ('admin', 'store_manager');

-- Show what was changed
SELECT 'After fix - role values should only be admin or store_manager:' as info;
SELECT role, COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;

-- ============================================
-- STEP 3: REMOVE ALL OLD CONSTRAINTS
-- ============================================
\echo ''
\echo '=== STEP 3: Removing old constraints ==='

-- Drop ALL role-related constraints (even if they have different names)
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'users'::regclass 
        AND (
            conname LIKE '%role%' 
            OR pg_get_constraintdef(oid) LIKE '%role%'
        )
    LOOP
        EXECUTE 'ALTER TABLE users DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_record.conname) || ' CASCADE';
        RAISE NOTICE 'Dropped constraint: %', constraint_record.conname;
    END LOOP;
END $$;

-- Verify constraints are gone
SELECT 'Constraints remaining (should be empty or not role-related):' as info;
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND (conname LIKE '%role%' OR pg_get_constraintdef(oid) LIKE '%role%');

-- ============================================
-- STEP 4: ADD CORRECT CONSTRAINT
-- ============================================
\echo ''
\echo '=== STEP 4: Adding correct constraint ==='

-- Add the constraint with the exact name we expect
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'store_manager'));

-- ============================================
-- STEP 5: VERIFY IT WORKS
-- ============================================
\echo ''
\echo '=== STEP 5: Verifying constraint ==='

-- Check constraint exists
SELECT 'Constraint verification:' as info;
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname = 'users_role_check';

-- Test that it accepts valid values (will be rolled back)
BEGIN;
    INSERT INTO users (name, mobile, email, password_hash, role, is_active)
    VALUES ('TEST_ADMIN', '9999999999', 'testadmin@test.com', '$2a$10$test', 'admin', true);
    DELETE FROM users WHERE email = 'testadmin@test.com';
    
    INSERT INTO users (name, mobile, email, password_hash, role, is_active)
    VALUES ('TEST_STORE_MGR', '9999999998', 'testmgr@test.com', '$2a$10$test', 'store_manager', true);
    DELETE FROM users WHERE email = 'testmgr@test.com';
ROLLBACK;

-- ============================================
-- STEP 6: FINAL STATUS
-- ============================================
\echo ''
\echo '=== STEP 6: FINAL STATUS ==='

SELECT '✅ ROLE CONSTRAINT IS NOW FIXED!' as status;
SELECT 'You can now create store managers via the API.' as message;

-- Show final constraint
SELECT 
    'Final constraint definition:' as info,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname = 'users_role_check';






