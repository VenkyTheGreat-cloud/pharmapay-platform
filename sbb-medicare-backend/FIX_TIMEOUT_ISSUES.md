# 🔧 Fix Timeout Issues (HTTP 499)

## Problem
Your API requests are timing out with HTTP 499 status code:
- Response times: 470 seconds (7.8 minutes) and 96 seconds
- Status: `499 Client Closed Request`

## Root Cause
1. **Connection timeout too short**: Only 2 seconds (too fast for cloud databases)
2. **No query timeout**: Queries can hang forever
3. **Database connection issues**: Possible locks or slow database

## ✅ What I Fixed

### 1. Increased Connection Timeout
- Changed from `2000ms` (2 seconds) to `10000ms` (10 seconds)
- Better for cloud databases like Render.com

### 2. Added Query Timeout
- Added `query_timeout: 30000` (30 seconds)
- Added `statement_timeout: 30000` (30 seconds)
- Prevents queries from hanging forever

### 3. Added Timeout Protection in Code
- Query function now has timeout wrapper
- Transaction function has timeout protection
- Better error logging for slow queries

## 📋 Next Steps

### Step 1: Deploy the Updated Code
The database configuration has been updated. Deploy to Render.com:

1. Commit and push your changes
2. Go to Render.com → Your backend service
3. Click "Manual Deploy" → "Clear build cache & deploy"

### Step 2: Check Database Locks
If timeouts persist, check for database locks:

```sql
-- Check for long-running queries
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds'
AND state != 'idle'
ORDER BY duration DESC;
```

Run: `scripts/check-database-locks.sql`

### Step 3: Check Database Connection
Verify your database is accessible:

1. Go to Render.com → Your database service
2. Check status (should be "Available")
3. Check connection count (shouldn't be maxed out)

### Step 4: Restart Services
If issues persist:

1. Restart your backend service on Render
2. Restart your database service on Render (if possible)
3. Wait a few minutes and try again

## 🚨 If Still Timing Out

### Option 1: Check Render Logs
1. Go to Render.com → Backend service → Logs
2. Look for:
   - Database connection errors
   - Timeout messages
   - Slow query warnings

### Option 2: Test Database Directly
Connect to your Render database directly and run:

```sql
-- Test simple query
SELECT COUNT(*) FROM users;

-- Check if queries are slow
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@test.com';
```

### Option 3: Increase Timeout Further
If your database is very slow, you can increase timeouts in `src/config/database.js`:

```javascript
connectionTimeoutMillis: 15000, // 15 seconds
query_timeout: 60000, // 60 seconds
statement_timeout: 60000, // 60 seconds
```

## 📊 Monitoring

After deploying, monitor:
- Response times in Render logs
- Database connection pool usage
- Slow query warnings in logs

The updated code will now log:
- Slow queries (taking > 1 second)
- Query timeouts
- Connection issues

## ✅ Expected Result

After deploying:
- Requests should complete in < 5 seconds
- No more HTTP 499 errors
- Proper timeout errors if database is slow (instead of hanging)





