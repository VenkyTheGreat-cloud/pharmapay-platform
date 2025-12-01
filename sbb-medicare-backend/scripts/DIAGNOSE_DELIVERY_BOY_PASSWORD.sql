-- ============================================================
-- DIAGNOSE DELIVERY BOY PASSWORD ISSUE
-- ============================================================
-- Run this to check the current state of deliveryboy4@gmail.com

\echo '========================================'
\echo 'STEP 1: Check if password_hash column exists'
\echo '========================================'

SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'delivery_boys' 
AND column_name = 'password_hash';

\echo ''
\echo '========================================'
\echo 'STEP 2: Check deliveryboy4@gmail.com record'
\echo '========================================'

SELECT 
    id,
    name,
    email,
    mobile,
    status,
    is_active,
    password_hash,
    CASE 
        WHEN password_hash IS NULL THEN '❌ NO PASSWORD'
        WHEN password_hash = '' THEN '❌ EMPTY PASSWORD'
        ELSE '✅ PASSWORD SET'
    END as password_status,
    created_at,
    updated_at
FROM delivery_boys 
WHERE email = 'deliveryboy4@gmail.com';

\echo ''
\echo '========================================'
\echo 'STEP 3: List ALL delivery boys password status'
\echo '========================================'

SELECT 
    id,
    name,
    email,
    status,
    is_active,
    CASE 
        WHEN password_hash IS NULL OR password_hash = '' THEN '❌ NO PASSWORD'
        ELSE '✅ HAS PASSWORD'
    END as password_status
FROM delivery_boys
ORDER BY created_at DESC;

