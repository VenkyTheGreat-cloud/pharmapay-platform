-- ============================================================
-- COMPLETE FIX FOR DELIVERY BOY PASSWORD ISSUE
-- ============================================================
-- Run this script to fix deliveryboy4@gmail.com login issue

\echo '========================================'
\echo 'FIXING DELIVERY BOY PASSWORD ISSUE'
\echo '========================================'

-- Step 1: Add password_hash column if it doesn't exist
\echo ''
\echo 'Step 1: Adding password_hash column...'
ALTER TABLE delivery_boys 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Step 2: Add email index for faster lookups
\echo 'Step 2: Creating email index...'
CREATE INDEX IF NOT EXISTS idx_delivery_boys_email ON delivery_boys(email) WHERE email IS NOT NULL;

-- Step 3: Set password for deliveryboy4@gmail.com
-- Password: admin123
-- Bcrypt hash: $2a$10$HtLuIFuLUOp/epG1Y0K/Nuxp6U799TvTSWI3DxJaTAHStWiBpzanO
\echo 'Step 3: Setting password for deliveryboy4@gmail.com...'
UPDATE delivery_boys 
SET password_hash = '$2a$10$HtLuIFuLUOp/epG1Y0K/Nuxp6U799TvTSWI3DxJaTAHStWiBpzanO',
    status = 'approved',
    is_active = true,
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'deliveryboy4@gmail.com';

-- Step 4: Verify the fix
\echo ''
\echo '========================================'
\echo 'VERIFICATION - Check deliveryboy4@gmail.com'
\echo '========================================'
SELECT 
    id,
    name,
    email,
    mobile,
    status,
    is_active,
    CASE 
        WHEN password_hash IS NOT NULL AND password_hash != '' THEN '✅ PASSWORD SET'
        ELSE '❌ NO PASSWORD'
    END as password_status,
    created_at,
    updated_at
FROM delivery_boys 
WHERE email = 'deliveryboy4@gmail.com';

\echo ''
\echo '========================================'
\echo 'SUMMARY'
\echo '========================================'
\echo 'After running this script, deliveryboy4@gmail.com should be able to login with:'
\echo '  Email: deliveryboy4@gmail.com'
\echo '  Password: admin123'
\echo ''
\echo 'Make sure:'
\echo '  ✓ Status = approved'
\echo '  ✓ is_active = true'
\echo '  ✓ password_hash is set'
\echo '========================================'




