-- ============================================
-- TEST DIRECT INSERT - See if database accepts the role
-- ============================================

-- Test 1: Try inserting with exact values the backend uses
BEGIN;

-- Generate a test password hash (you'll need to replace this with actual hash)
INSERT INTO users (
    name, 
    store_name, 
    mobile, 
    email, 
    password_hash, 
    address, 
    role, 
    is_active
)
VALUES (
    'Test Store Manager',
    'Test Store',
    '9999999999',
    'teststore@test.com',
    '$2a$10$testhash', -- Replace with actual bcrypt hash
    'Test Address',
    'store_manager',  -- Exact value
    true
);

-- Check what was inserted
SELECT id, name, email, role, LENGTH(role) as role_length, role = 'store_manager' as matches_exact
FROM users 
WHERE email = 'teststore@test.com';

ROLLBACK;

-- Test 2: Check what the constraint actually allows
SELECT 
    'Constraint Check' as test,
    conname,
    pg_get_constraintdef(oid) as constraint_def
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname = 'users_role_check';

-- Test 3: Check if role column has any default or triggers
SELECT 
    'Column Info' as test,
    column_name,
    column_default,
    is_nullable,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name = 'role';

-- Test 4: Check for triggers on users table
SELECT 
    'Triggers' as test,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users';




