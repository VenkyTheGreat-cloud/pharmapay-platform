-- Check the actual role constraint in the database
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname LIKE '%role%';

-- Also check the column definition
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name = 'role';

-- Test what values are currently in the database
SELECT 
    role,
    COUNT(*) as count
FROM users
GROUP BY role;

