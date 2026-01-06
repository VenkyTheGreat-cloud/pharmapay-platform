-- ============================================
-- FIX WRONG STATUS VALUES IN USERS TABLE
-- If status is showing "pending" or other wrong values, run this
-- ============================================

BEGIN;

-- Fix any wrong status values based on is_active
UPDATE users
SET status = CASE 
    WHEN is_active = true THEN 'active'
    WHEN is_active = false THEN 'inactive'
    ELSE 'inactive'
END
WHERE status IS NULL 
   OR status = ''
   OR status NOT IN ('active', 'inactive')
   OR (is_active = true AND status != 'active')
   OR (is_active = false AND status != 'inactive');

-- Show what was updated
SELECT '=== AFTER FIX ===' as info;
SELECT 
    id,
    name,
    email,
    is_active,
    status,
    CASE 
        WHEN (is_active = true AND status = 'active') OR (is_active = false AND status = 'inactive')
        THEN '✅ CORRECT'
        ELSE '❌ MISMATCH'
    END as status_check
FROM users
ORDER BY name;

COMMIT;

SELECT '✅ Status values have been fixed!' as result;






