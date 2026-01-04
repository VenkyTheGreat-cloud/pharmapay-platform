-- ============================================
-- EXTRACT DATABASE SCHEMA - Run This to Share
-- This will show your current database structure
-- ============================================

-- ============================================
-- 1. USERS TABLE STRUCTURE
-- ============================================
SELECT '=== USERS TABLE STRUCTURE ===' as section;

SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    is_identity
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- ============================================
-- 2. ALL CONSTRAINTS ON USERS TABLE
-- ============================================
SELECT '=== ALL CONSTRAINTS ON USERS TABLE ===' as section;

SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass
ORDER BY conname;

-- ============================================
-- 3. ROLE CONSTRAINT SPECIFICALLY
-- ============================================
SELECT '=== ROLE CONSTRAINT CHECK ===' as section;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conrelid = 'users'::regclass 
            AND conname = 'users_role_check'
        ) THEN 'EXISTS'
        ELSE 'DOES NOT EXIST'
    END as constraint_exists,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conrelid = 'users'::regclass 
            AND conname = 'users_role_check'
        )
        THEN (SELECT pg_get_constraintdef(oid) FROM pg_constraint 
              WHERE conrelid = 'users'::regclass AND conname = 'users_role_check')
        ELSE 'N/A'
    END as constraint_definition;

-- ============================================
-- 4. CURRENT ROLE VALUES IN DATABASE
-- ============================================
SELECT '=== CURRENT ROLE VALUES ===' as section;

SELECT role, COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;

-- ============================================
-- 5. INDEXES ON USERS TABLE
-- ============================================
SELECT '=== INDEXES ON USERS TABLE ===' as section;

SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'users'
ORDER BY indexname;

-- ============================================
-- 6. CHECK FOR INVALID ROLE VALUES
-- ============================================
SELECT '=== INVALID ROLE VALUES (if any) ===' as section;

SELECT 
    id,
    name,
    email,
    role,
    CASE 
        WHEN role IS NULL THEN 'NULL'
        WHEN role = '' THEN 'EMPTY'
        WHEN role NOT IN ('admin', 'store_manager') THEN 'INVALID'
        ELSE 'VALID'
    END as status
FROM users
WHERE role IS NULL 
   OR role = ''
   OR role NOT IN ('admin', 'store_manager')
ORDER BY role;

-- ============================================
-- 7. COMPLETE TABLE DEFINITION (CREATE STATEMENT)
-- ============================================
SELECT '=== COMPLETE TABLE DEFINITION ===' as section;

SELECT 
    'CREATE TABLE users (' || chr(10) ||
    string_agg(
        column_name || ' ' || 
        CASE 
            WHEN data_type = 'character varying' THEN 'VARCHAR(' || character_maximum_length || ')'
            WHEN data_type = 'uuid' THEN 'UUID'
            WHEN data_type = 'boolean' THEN 'BOOLEAN'
            WHEN data_type = 'timestamp without time zone' THEN 'TIMESTAMP'
            WHEN data_type = 'text' THEN 'TEXT'
            ELSE data_type
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
        ',' || chr(10)
        ORDER BY ordinal_position
    ) || ');' as table_definition
FROM information_schema.columns
WHERE table_name = 'users';

-- ============================================
-- 8. ALL CHECK CONSTRAINTS
-- ============================================
SELECT '=== ALL CHECK CONSTRAINTS ===' as section;

SELECT 
    conname,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass
AND contype = 'c'
ORDER BY conname;

-- ============================================
-- FINAL SUMMARY
-- ============================================
SELECT '=== SUMMARY ===' as section;

SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(DISTINCT role) FROM users) as unique_roles,
    (SELECT COUNT(*) FROM pg_constraint WHERE conrelid = 'users'::regclass AND conname = 'users_role_check') as role_constraint_exists,
    (SELECT COUNT(*) FROM users WHERE role IS NULL OR role = '' OR role NOT IN ('admin', 'store_manager')) as invalid_roles_count;




