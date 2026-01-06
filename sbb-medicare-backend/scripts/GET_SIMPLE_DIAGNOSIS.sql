-- ============================================
-- SIMPLE DIAGNOSIS - Copy Output and Share
-- Run this and copy ALL output to share
-- ============================================

-- 1. Check constraint exists
SELECT '1. ROLE CONSTRAINT STATUS:' as check_item;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'users'::regclass AND conname = 'users_role_check')
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as status;

-- 2. Show constraint definition
SELECT '2. CONSTRAINT DEFINITION:' as check_item;
SELECT 
    COALESCE(
        (SELECT pg_get_constraintdef(oid) FROM pg_constraint 
         WHERE conrelid = 'users'::regclass AND conname = 'users_role_check'),
        'CONSTRAINT DOES NOT EXIST'
    ) as definition;

-- 3. Show all constraints
SELECT '3. ALL CONSTRAINTS ON USERS TABLE:' as check_item;
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass
ORDER BY conname;

-- 4. Show current role values
SELECT '4. CURRENT ROLE VALUES:' as check_item;
SELECT role, COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;

-- 5. Show invalid roles (if any)
SELECT '5. INVALID ROLES:' as check_item;
SELECT role, COUNT(*) as count
FROM users
WHERE role IS NULL OR role = '' OR role NOT IN ('admin', 'store_manager')
GROUP BY role;

-- 6. Show role column definition
SELECT '6. ROLE COLUMN DEFINITION:' as check_item;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'role';






