-- Check for database locks and long-running queries
-- Run this if requests are timing out

-- Check for locks on users table
SELECT 
    '=== LOCKS ON USERS TABLE ===' as info,
    locktype,
    relation::regclass as table_name,
    mode,
    granted,
    pid,
    pg_blocking_pids(pid) as blocked_by
FROM pg_locks
WHERE relation = 'users'::regclass;

-- Check for long-running queries
SELECT 
    '=== LONG RUNNING QUERIES ===' as info,
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state,
    wait_event_type,
    wait_event
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds'
AND state != 'idle'
ORDER BY duration DESC;

-- Check for active connections
SELECT 
    '=== ACTIVE CONNECTIONS ===' as info,
    count(*) as total_connections,
    count(*) FILTER (WHERE state = 'active') as active,
    count(*) FILTER (WHERE state = 'idle') as idle,
    count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
FROM pg_stat_activity
WHERE datname = current_database();

-- Kill long-running queries (use with caution!)
-- SELECT pg_terminate_backend(pid) 
-- FROM pg_stat_activity 
-- WHERE (now() - pg_stat_activity.query_start) > interval '1 minute'
-- AND state != 'idle'
-- AND pid != pg_backend_pid();

