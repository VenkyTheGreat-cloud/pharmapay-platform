-- Check the actual role constraint in your database
SELECT 
    'Current Constraint' as info,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname LIKE '%role%';

-- Check current role values in users table
SELECT 
    'Current Roles' as info,
    role,
    COUNT(*) as count
FROM users
GROUP BY role;

-- If constraint is wrong, drop and recreate it
-- DO NOT RUN THIS YET - Check the constraint first above!

/*
-- Only run this if the constraint is wrong:
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'store_manager'));
*/









