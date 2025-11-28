-- ============================================
-- CHECK AND FIX INDEXES FOR PERFORMANCE
-- This will verify indexes exist and create them if missing
-- ============================================

-- Step 1: Check existing indexes on users table
SELECT 
    '=== EXISTING INDEXES ON USERS TABLE ===' as info,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'users'
ORDER BY indexname;

-- Step 2: Check if indexes actually exist (in case they're missing)
SELECT 
    '=== INDEX VERIFICATION ===' as info,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'users' AND indexname = 'idx_users_email'
        ) THEN '✅ idx_users_email exists'
        ELSE '❌ idx_users_email MISSING'
    END as email_index,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'users' AND indexname = 'idx_users_mobile'
        ) THEN '✅ idx_users_mobile exists'
        ELSE '❌ idx_users_mobile MISSING'
    END as mobile_index,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'users' AND indexname = 'idx_users_role'
        ) THEN '✅ idx_users_role exists'
        ELSE '❌ idx_users_role MISSING'
    END as role_index;

-- Step 3: Create missing indexes (concurrent to avoid locking)
-- Email index
CREATE INDEX IF NOT EXISTS CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS CONCURRENTLY idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS CONCURRENTLY idx_users_role ON users(role);

-- Step 4: Verify indexes were created
SELECT 
    '=== AFTER CREATION ===' as info,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'users'
ORDER BY indexname;

-- Step 5: Analyze table to update statistics
ANALYZE users;

-- Step 6: Check table size and statistics
SELECT 
    '=== TABLE STATISTICS ===' as info,
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS indexes_size,
    n_live_tup as row_count
FROM pg_stat_user_tables
WHERE tablename = 'users';

-- Step 7: Test query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
EXPLAIN ANALYZE SELECT * FROM users WHERE mobile = '1234567890';

