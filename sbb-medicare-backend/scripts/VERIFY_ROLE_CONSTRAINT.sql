-- ============================================
-- VERIFY ROLE CONSTRAINT - Run This to Check
-- ============================================

-- 1. Check what constraints exist
SELECT '=== CURRENT CONSTRAINTS ===' as section;
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass
ORDER BY conname;

-- 2. Check what role values exist
SELECT '=== CURRENT ROLE VALUES ===' as section;
SELECT role, COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;

-- 3. Check role constraint specifically
SELECT '=== ROLE CONSTRAINT CHECK ===' as section;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conrelid = 'users'::regclass 
            AND conname = 'users_role_check'
        ) THEN '✅ Constraint EXISTS'
        ELSE '❌ Constraint MISSING'
    END as constraint_status,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname = 'users_role_check';

-- 4. Test if constraint works
SELECT '=== TEST INSERT ===' as section;
BEGIN;
    -- This should work
    INSERT INTO users (name, mobile, email, password_hash, role, is_active)
    VALUES ('TEST_USER', '0000000000', 'test@verify.com', '$2a$10$test', 'store_manager', true);
    
    SELECT '✅ Test insert successful - constraint is working!' as result;
    
    DELETE FROM users WHERE email = 'test@verify.com';
ROLLBACK;






