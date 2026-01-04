-- ============================================
-- FIX ROLE CONSTRAINT - CHECK AND UPDATE DATA FIRST
-- This script checks existing data and fixes it before adding constraint
-- ============================================

-- Step 1: Check what role values currently exist
SELECT 
    'Current Role Values' as info,
    role,
    COUNT(*) as count,
    CASE 
        WHEN role IN ('admin', 'store_manager') THEN '✅ Valid'
        ELSE '❌ Invalid - needs update'
    END as status
FROM users
GROUP BY role
ORDER BY role;

-- Step 2: Show all users with invalid roles (for review)
SELECT 
    'Users with Invalid Roles' as info,
    id,
    name,
    email,
    role as current_role,
    'Will be updated to: store_manager' as action
FROM users
WHERE role NOT IN ('admin', 'store_manager');

-- Step 3: Update invalid roles to 'store_manager' (or keep as 'admin' if appropriate)
-- Change invalid roles to 'store_manager' (default for non-admin users)
UPDATE users
SET role = 'store_manager',
    updated_at = CURRENT_TIMESTAMP
WHERE role NOT IN ('admin', 'store_manager');

-- Step 4: Verify all roles are now valid
SELECT 
    'Verification - All Roles Should Be Valid' as info,
    role,
    COUNT(*) as count
FROM users
GROUP BY role;

-- Step 5: Drop old constraint (if exists)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 6: Add the constraint
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'store_manager'));

-- Step 7: Verify constraint was created
SELECT 
    'Constraint Created' as info,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname = 'users_role_check';

-- Step 8: Final check - try a test insert (will be rolled back)
BEGIN;
INSERT INTO users (name, mobile, email, password_hash, role, is_active)
VALUES ('Test Manager', '9999999999', 'test@test.com', '$2a$10$test', 'store_manager', true);
ROLLBACK;

SELECT '✅ Role constraint fixed successfully! All invalid roles were updated to store_manager.' as status;




