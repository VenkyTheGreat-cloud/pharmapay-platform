-- ============================================
-- COMPLETE DIAGNOSTIC - Check Everything
-- Run this to see EXACTLY what's wrong
-- ============================================

-- 1. Check current constraint definition
SELECT 
    '=== CONSTRAINT CHECK ===' as section,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname LIKE '%role%';

-- 2. Check ALL role values in users table
SELECT 
    '=== CURRENT ROLE VALUES ===' as section,
    role,
    COUNT(*) as user_count
FROM users
GROUP BY role
ORDER BY role;

-- 3. Show users with problematic roles
SELECT 
    '=== USERS WITH INVALID ROLES ===' as section,
    id,
    name,
    email,
    role,
    is_active,
    created_at
FROM users
WHERE role IS NULL 
   OR role NOT IN ('admin', 'store_manager')
   OR TRIM(role) != role  -- has whitespace
   OR LENGTH(role) != LENGTH(TRIM(role));  -- has whitespace

-- 4. Check column definition
SELECT 
    '=== COLUMN DEFINITION ===' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'role';

-- 5. Try to see what exact values cause issues
SELECT 
    '=== ROLE VALUE ANALYSIS ===' as section,
    role,
    LENGTH(role) as role_length,
    ASCII(role) as first_char_ascii,
    role ~ '^[a-z_]+$' as is_lowercase_underscore,
    role IN ('admin', 'store_manager') as matches_constraint
FROM users
GROUP BY role;

-- 6. Check if constraint exists at all
SELECT 
    '=== CONSTRAINT EXISTS CHECK ===' as section,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conrelid = 'users'::regclass 
            AND conname LIKE '%role%'
        ) THEN '✅ Constraint exists'
        ELSE '❌ NO CONSTRAINT FOUND'
    END as status;




