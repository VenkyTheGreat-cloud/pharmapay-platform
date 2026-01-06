-- Check what data exists before migration
-- Run this first to see what will be affected

-- Check users table
SELECT 
    'users' as table_name,
    COUNT(*) as total_rows,
    COUNT(DISTINCT id) as unique_ids,
    'UUID' as id_type
FROM users;

-- Check delivery_boys
SELECT 
    'delivery_boys' as table_name,
    COUNT(*) as total_rows,
    COUNT(store_id) as rows_with_store_id,
    COUNT(CASE WHEN store_id IS NULL THEN 1 END) as null_store_id,
    pg_typeof(store_id) as store_id_type
FROM delivery_boys
GROUP BY pg_typeof(store_id);

-- Check customers
SELECT 
    'customers' as table_name,
    COUNT(*) as total_rows,
    COUNT(store_id) as rows_with_store_id,
    COUNT(CASE WHEN store_id IS NULL THEN 1 END) as null_store_id,
    pg_typeof(store_id) as store_id_type
FROM customers
GROUP BY pg_typeof(store_id);

-- Check orders
SELECT 
    'orders' as table_name,
    COUNT(*) as total_rows,
    COUNT(store_id) as rows_with_store_id,
    COUNT(CASE WHEN store_id IS NULL THEN 1 END) as null_store_id,
    pg_typeof(store_id) as store_id_type
FROM orders
GROUP BY pg_typeof(store_id);

-- Check refresh_tokens
SELECT 
    'refresh_tokens' as table_name,
    COUNT(*) as total_rows,
    COUNT(user_id) as rows_with_user_id,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as null_user_id,
    pg_typeof(user_id) as user_id_type
FROM refresh_tokens
GROUP BY pg_typeof(user_id);

-- Check order_status_history
SELECT 
    'order_status_history' as table_name,
    COUNT(*) as total_rows,
    COUNT(changed_by) as rows_with_changed_by,
    COUNT(CASE WHEN changed_by IS NULL THEN 1 END) as null_changed_by,
    pg_typeof(changed_by) as changed_by_type
FROM order_status_history
GROUP BY pg_typeof(changed_by);

-- Show sample user IDs for reference
SELECT 
    'Sample user IDs' as info,
    id,
    name,
    role
FROM users
LIMIT 5;






