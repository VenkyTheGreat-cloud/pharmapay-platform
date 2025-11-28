-- ============================================
-- DETAILED CONSTRAINT AND TABLE ANALYSIS
-- Run this to see EVERYTHING about the role constraint
-- ============================================

-- 1. Check ALL constraints on users table
SELECT 
    '=== ALL CONSTRAINTS ON USERS TABLE ===' as section,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass
ORDER BY contype, conname;

-- 2. Check role constraint specifically
SELECT 
    '=== ROLE CONSTRAINT DETAILS ===' as section,
    conname,
    contype,
    pg_get_constraintdef(oid) as definition,
    convalidated as is_validated
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname LIKE '%role%';

-- 3. Check role column definition
SELECT 
    '=== ROLE COLUMN DEFINITION ===' as section,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    is_identity
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name = 'role';

-- 4. Check for triggers
SELECT 
    '=== TRIGGERS ON USERS TABLE ===' as section,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users';

-- 5. Check current role values
SELECT 
    '=== CURRENT ROLE VALUES ===' as section,
    role,
    COUNT(*) as count,
    LENGTH(role) as role_length,
    role = 'store_manager' as exact_match,
    role ILIKE 'store_manager' as case_insensitive_match
FROM users
GROUP BY role
ORDER BY role;

-- 6. Test constraint manually
SELECT 
    '=== MANUAL CONSTRAINT TEST ===' as section,
    CASE WHEN 'store_manager' IN ('admin', 'store_manager') 
         THEN '✅ store_manager is valid'
         ELSE '❌ store_manager is invalid' END as test1,
    CASE WHEN 'admin' IN ('admin', 'store_manager') 
         THEN '✅ admin is valid'
         ELSE '❌ admin is invalid' END as test2,
    CASE WHEN 'Store_Manager' IN ('admin', 'store_manager') 
         THEN '⚠️ Case sensitive - Store_Manager is invalid'
         ELSE '✅ Case sensitive check works' END as test3;

-- 7. Check if there's a default value on role
SELECT 
    '=== CHECK DEFAULTS ===' as section,
    column_name,
    column_default,
    CASE 
        WHEN column_default IS NOT NULL THEN '⚠️ Has default - might override'
        ELSE '✅ No default'
    END as status
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name = 'role';

