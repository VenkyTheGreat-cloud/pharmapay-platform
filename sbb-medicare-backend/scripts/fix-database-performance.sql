-- ============================================
-- QUICK FIX FOR DATABASE PERFORMANCE ISSUES
-- Run this to fix slow queries
-- ============================================

BEGIN;

-- Step 1: Create indexes if missing (using IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Step 2: Create composite index for OR queries (optimization)
CREATE INDEX IF NOT EXISTS idx_users_email_mobile ON users(email, mobile);

-- Step 3: Update table statistics for query planner
ANALYZE users;

-- Step 4: Vacuum to reclaim space and update statistics
VACUUM ANALYZE users;

COMMIT;

-- Verification
SELECT '✅ Indexes created/verified' as status;
SELECT indexname FROM pg_indexes WHERE tablename = 'users' ORDER BY indexname;




