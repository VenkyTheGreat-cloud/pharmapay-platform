-- ============================================
-- FIX INVALID STATUS DATA IN USERS TABLE
-- This fixes records with wrong is_active and status values
-- ============================================

BEGIN;

-- Fix records where is_active is 'pending' or other invalid values
UPDATE users
SET 
    is_active = false,
    status = 'inactive',
    updated_at = CURRENT_TIMESTAMP
WHERE is_active = 'pending'
   OR is_active IS NULL
   OR (is_active::text NOT IN ('true', 'false', 't', 'f', '1', '0'));

-- Fix records where status is NULL
UPDATE users
SET 
    status = CASE 
        WHEN is_active = true OR is_active::text = 'true' THEN 'active'
        ELSE 'inactive'
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE status IS NULL OR status = '';

-- Fix records where is_active is string but should be boolean
-- Convert string booleans to actual booleans
UPDATE users
SET 
    is_active = CASE 
        WHEN is_active::text IN ('true', 't', '1') THEN true
        WHEN is_active::text IN ('false', 'f', '0', 'pending') THEN false
        ELSE false
    END,
    status = CASE 
        WHEN is_active::text IN ('true', 't', '1') THEN 'active'
        ELSE 'inactive'
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE is_active::text NOT IN ('true', 'false');

-- Ensure status matches is_active
UPDATE users
SET 
    status = CASE 
        WHEN (is_active = true OR is_active::text IN ('true', 't', '1')) THEN 'active'
        ELSE 'inactive'
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE (is_active = true OR is_active::text IN ('true', 't', '1')) AND status != 'active'
   OR (is_active = false OR is_active::text IN ('false', 'f', '0', 'pending')) AND status != 'inactive';

COMMIT;

-- Verification
SELECT '=== AFTER FIX ===' as info;
SELECT 
    id,
    email,
    is_active,
    status,
    CASE 
        WHEN (is_active = true OR is_active::text = 'true') AND status = 'active' THEN '✅ CORRECT - Active'
        WHEN (is_active = false OR is_active::text = 'false') AND status = 'inactive' THEN '✅ CORRECT - Inactive'
        ELSE '❌ MISMATCH'
    END as status_check
FROM users
WHERE role = 'store_manager'
ORDER BY created_at DESC;

-- Show summary
SELECT 
    'Summary' as info,
    COUNT(*) FILTER (WHERE (is_active = true OR is_active::text = 'true') AND status = 'active') as active_count,
    COUNT(*) FILTER (WHERE (is_active = false OR is_active::text = 'false') AND status = 'inactive') as inactive_count,
    COUNT(*) as total_count
FROM users
WHERE role = 'store_manager';

