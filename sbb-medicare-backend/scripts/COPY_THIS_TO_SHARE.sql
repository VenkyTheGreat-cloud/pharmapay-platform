-- ============================================
-- COPY THIS OUTPUT TO SHARE
-- Run this and copy ALL output
-- ============================================

\echo '========================================'
\echo 'DATABASE DIAGNOSIS - Copy All Output'
\echo '========================================'
\echo ''

-- 1. Constraint Status
SELECT 'CONSTRAINT EXISTS: ' || 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'users'::regclass AND conname = 'users_role_check')
        THEN 'YES'
        ELSE 'NO'
    END as result;

-- 2. Constraint Definition
SELECT 'CONSTRAINT DEFINITION:' as info;
SELECT pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname = 'users_role_check';

-- 3. All Constraints on Users Table
SELECT 'ALL CONSTRAINTS:' as info;
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass
ORDER BY conname;

-- 4. Role Values
SELECT 'ROLE VALUES:' as info;
SELECT role, COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;

-- 5. Invalid Roles
SELECT 'INVALID ROLES:' as info;
SELECT role, COUNT(*) as count
FROM users
WHERE role IS NULL OR role = '' OR role NOT IN ('admin', 'store_manager')
GROUP BY role;

-- 6. Role Column Info
SELECT 'ROLE COLUMN INFO:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'role';

\echo ''
\echo '========================================'
\echo 'END OF DIAGNOSIS'
\echo 'Copy everything above this line'
\echo '========================================'

