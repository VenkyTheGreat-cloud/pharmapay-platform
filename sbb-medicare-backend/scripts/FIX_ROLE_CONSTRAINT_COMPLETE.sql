-- ============================================
-- COMPLETE FIX - Run This Entire Script
-- This will fix the role constraint issue
-- ============================================

BEGIN;

-- Step 1: Check what we have now
SELECT '=== BEFORE FIX - Current Roles ===' as step;
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role;

-- Step 2: Fix ALL invalid roles (update to store_manager)
-- This includes NULL, empty strings, and any other invalid values
UPDATE users
SET role = 'store_manager',
    updated_at = CURRENT_TIMESTAMP
WHERE role IS NULL 
   OR role = ''
   OR TRIM(role) = ''
   OR role NOT IN ('admin', 'store_manager');

-- Step 3: Verify all roles are now valid
SELECT '=== AFTER FIX - All Roles Should Be Valid ===' as step;
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role;

-- Step 4: Drop the old constraint (if it exists)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check CASCADE;

-- Step 5: Add the correct constraint
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'store_manager'));

-- Step 6: Verify constraint exists
SELECT '=== CONSTRAINT VERIFICATION ===' as step;
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname = 'users_role_check';

COMMIT;

-- Final success message
SELECT '✅✅✅ SUCCESS! Role constraint is now fixed. You can create store managers now. ✅✅✅' as result;





