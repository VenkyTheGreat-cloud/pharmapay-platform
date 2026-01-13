-- ============================================
-- QUICK CHECK AND FIX SCRIPT
-- Run this to check what needs to be fixed
-- ============================================

-- 1. Check users.id type
SELECT 'users.id type:' as check_item, data_type as current_type,
    CASE WHEN data_type = 'uuid' THEN '✅ OK' ELSE '❌ Needs UUID' END as status
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'id';

-- 2. Check foreign keys to users.id
SELECT 
    'Foreign Keys Check' as check_item,
    table_name,
    column_name,
    data_type,
    CASE 
        WHEN data_type = 'uuid' THEN '✅ OK'
        WHEN data_type = 'bigint' THEN '❌ NEEDS UPDATE'
        ELSE '⚠️ Unknown'
    END as status
FROM information_schema.columns
WHERE column_name IN ('store_id', 'user_id', 'changed_by')
    AND table_name IN (
        'delivery_boys',
        'customers', 
        'orders',
        'refresh_tokens',
        'order_status_history'
    )
ORDER BY table_name, column_name;

-- 3. Check if refresh_tokens table exists
SELECT 
    'Table Exists Check' as check_item,
    table_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = current_schema()
            AND table_name = 'refresh_tokens'
        ) THEN '✅ Exists'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.tables
WHERE table_name = 'refresh_tokens';

-- 4. Check role constraint
SELECT 
    'Role Constraint Check' as check_item,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname LIKE '%role%';

-- 5. Summary - What needs to be done?
SELECT 
    'SUMMARY' as info,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'id' AND data_type = 'uuid'
        ) 
        AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE column_name IN ('store_id', 'user_id', 'changed_by')
            AND table_name IN ('delivery_boys', 'customers', 'orders', 'refresh_tokens', 'order_status_history')
            AND data_type != 'uuid'
        )
        AND EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'refresh_tokens'
        )
        THEN '✅ ALL GOOD - No updates needed!'
        ELSE '⚠️ NEEDS UPDATES - Run migration script below'
    END as recommendation;









