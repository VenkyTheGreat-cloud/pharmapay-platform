-- ============================================
-- FIX ROLE CONSTRAINT SCRIPT
-- Run this to check and fix the role constraint
-- ============================================

-- Step 1: Check current constraint
SELECT 
    'Current Constraint' as info,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname LIKE '%role%';

-- Step 2: Drop old constraint (if exists with wrong values)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 3: Create correct constraint
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'store_manager'));

-- Step 4: Verify constraint was created
SELECT 
    'Constraint Fixed' as info,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname = 'users_role_check';

-- Step 5: Test insert (optional - will be rolled back)
BEGIN;
INSERT INTO users (name, mobile, email, password_hash, role, is_active)
VALUES ('Test Manager', '9999999999', 'test@test.com', '$2a$10$test', 'store_manager', true);
ROLLBACK;

SELECT '✅ Role constraint is now correct! You can create store managers.' as status;





