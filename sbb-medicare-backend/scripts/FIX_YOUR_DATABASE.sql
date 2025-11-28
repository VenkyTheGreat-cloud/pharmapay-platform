-- ============================================
-- FIX FOR YOUR SPECIFIC DATABASE ISSUE
-- Your constraint is malformed - this will fix it
-- ============================================

BEGIN;

-- Step 1: Drop the incorrect role constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check CASCADE;

-- Step 2: Drop the incorrect status constraint (is_active is boolean, not status)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check CASCADE;

-- Step 3: Add the CORRECT role constraint
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'store_manager'));

COMMIT;

-- Step 4: Verify it's fixed
SELECT '=== VERIFICATION ===' as info;
SELECT 
    conname,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname = 'users_role_check';

-- Step 5: Test insert
BEGIN;
    INSERT INTO users (name, mobile, email, password_hash, role, is_active)
    VALUES ('TEST_FIX', '8888888888', 'testfix@example.com', '$2a$10$test', 'store_manager', true);
    
    SELECT '✅ TEST INSERT SUCCESSFUL - Constraint is now working!' as result;
    
    DELETE FROM users WHERE email = 'testfix@example.com';
ROLLBACK;

SELECT '✅✅✅ FIXED! Now try creating a store manager via API. ✅✅✅' as status;

