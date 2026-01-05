-- Quick check: What roles exist in the users table?
SELECT 
    role,
    COUNT(*) as count,
    CASE 
        WHEN role IN ('admin', 'store_manager') THEN '✅ Valid'
        ELSE '❌ Invalid'
    END as status
FROM users
GROUP BY role
ORDER BY role;

-- Show details of users with potentially invalid roles
SELECT 
    id,
    name,
    email,
    role,
    created_at
FROM users
WHERE role NOT IN ('admin', 'store_manager')
ORDER BY created_at;





