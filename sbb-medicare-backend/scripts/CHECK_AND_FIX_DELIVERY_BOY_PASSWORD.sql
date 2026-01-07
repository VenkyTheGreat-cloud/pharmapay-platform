-- Check Delivery Boy Password Issue
-- Run this to diagnose and fix the password issue

-- ============================================================================
-- STEP 1: Check the registered account (ID 11, mobile 6655223344)
-- ============================================================================
SELECT 
    id,
    name,
    mobile,
    email,
    CASE 
        WHEN password_hash IS NULL THEN '❌ NO PASSWORD'
        WHEN password_hash = '' THEN '❌ EMPTY PASSWORD'
        ELSE '✅ HAS PASSWORD'
    END as password_status,
    status,
    is_active,
    created_at
FROM delivery_boys
WHERE id = 11 OR mobile = '6655223344';

-- ============================================================================
-- STEP 2: Check the account trying to login (email deliveryboy10@gmail.com)
-- ============================================================================
SELECT 
    id,
    name,
    mobile,
    email,
    CASE 
        WHEN password_hash IS NULL THEN '❌ NO PASSWORD'
        WHEN password_hash = '' THEN '❌ EMPTY PASSWORD'
        ELSE '✅ HAS PASSWORD'
    END as password_status,
    status,
    is_active,
    created_at
FROM delivery_boys
WHERE email = 'deliveryboy10@gmail.com';

-- ============================================================================
-- STEP 3: Set password for account ID 11 (if password_hash is NULL)
-- Password: admin123
-- Hash: $2a$10$HtLuIFuLUOp/epG1Y0K/Nuxp6U799TvTSWI3DxJaTAHStWiBpzanO
-- ============================================================================
UPDATE delivery_boys 
SET password_hash = '$2a$10$HtLuIFuLUOp/epG1Y0K/Nuxp6U799TvTSWI3DxJaTAHStWiBpzanO'
WHERE id = 11 
  AND (password_hash IS NULL OR password_hash = '');

-- ============================================================================
-- STEP 4: Set password for account with email deliveryboy10@gmail.com (if exists)
-- ============================================================================
UPDATE delivery_boys 
SET password_hash = '$2a$10$HtLuIFuLUOp/epG1Y0K/Nuxp6U799TvTSWI3DxJaTAHStWiBpzanO'
WHERE email = 'deliveryboy10@gmail.com'
  AND (password_hash IS NULL OR password_hash = '');

-- ============================================================================
-- STEP 5: Verify the fix
-- ============================================================================
SELECT 
    id,
    name,
    mobile,
    email,
    CASE 
        WHEN password_hash IS NULL THEN '❌ NO PASSWORD'
        WHEN password_hash = '' THEN '❌ EMPTY PASSWORD'
        ELSE '✅ HAS PASSWORD'
    END as password_status,
    status,
    is_active
FROM delivery_boys
WHERE id = 11 OR mobile = '6655223344' OR email = 'deliveryboy10@gmail.com';

-- ============================================================================
-- NOTES:
-- 1. If account ID 11 has no password_hash, it will be set to "admin123"
-- 2. If account with email "deliveryboy10@gmail.com" exists and has no password, it will be set
-- 3. After running this, delivery boy should login with:
--    - mobileEmail: "6655223344" OR "deliveryboy10@gmail.com"
--    - password: "admin123"
-- ============================================================================




