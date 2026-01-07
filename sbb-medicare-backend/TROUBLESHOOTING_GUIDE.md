# 🔍 Troubleshooting Guide - Role Constraint Error

## Current Issue
Still getting: `"Database constraint violation. Please check role value."` even after running SQL fixes.

## What to Check Next

### 1. Check Server Logs on Render.com

Since you're using Render.com, check the logs for detailed error information:

1. Go to your Render dashboard
2. Click on your backend service
3. Go to "Logs" tab
4. Look for the error when you try to create a store manager
5. Look for:
   - The exact PostgreSQL error code
   - The constraint name
   - The actual role value being inserted
   - Any detailed error messages

### 2. Run Diagnostic Script

Run this in your database to see EVERYTHING:

```sql
-- Run this complete diagnostic
\i scripts/FULL_DIAGNOSTIC_AND_FIX.sql

-- OR manually:
-- scripts/CHECK_CONSTRAINT_DETAILS.sql
```

### 3. Check if Constraint Actually Exists

```sql
-- This should show the constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname LIKE '%role%';
```

### 4. Test Direct Insert

Try inserting directly into the database:

```sql
BEGIN;
INSERT INTO users (
    name, mobile, email, password_hash, role, is_active
) VALUES (
    'Test User', '1111111111', 'test@example.com', 
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'store_manager', 
    true
);
SELECT * FROM users WHERE email = 'test@example.com';
ROLLBACK;
```

### 5. Check for Multiple Databases

**Important**: Make sure you're running the SQL on the SAME database that Render.com is using!

1. Check your `DATABASE_URL` in Render.com environment variables
2. Connect to THAT database (not a local one)
3. Run the fix scripts there

### 6. Possible Issues

#### Issue A: Constraint Not Applied
- The SQL might have run on a different database
- The constraint might not have been committed

**Fix**: Run the fix script again and verify with:
```sql
SELECT conname FROM pg_constraint 
WHERE conrelid = 'users'::regclass AND conname = 'users_role_check';
```

#### Issue B: Different Database on Render
- Render might be using a different database than you're fixing

**Fix**: Check `DATABASE_URL` environment variable on Render

#### Issue C: Case Sensitivity
- PostgreSQL is case-sensitive with constraints

**Fix**: Make sure you're inserting exactly `'store_manager'` (lowercase, with underscore)

#### Issue D: Trigger Interfering
- There might be a trigger modifying the role value

**Fix**: Check for triggers:
```sql
SELECT * FROM information_schema.triggers 
WHERE event_object_table = 'users';
```

### 7. Nuclear Option - Recreate Constraint

If nothing else works:

```sql
-- Remove ALL role constraints
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'users'::regclass 
        AND (pg_get_constraintdef(oid) LIKE '%role%')
    LOOP
        EXECUTE 'ALTER TABLE users DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname) || ' CASCADE';
    END LOOP;
END $$;

-- Add fresh constraint
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'store_manager'));

-- Verify
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname = 'users_role_check';
```

### 8. Check Backend Logs

The updated code now logs:
- Exact role value being inserted
- Role type and length
- Actual SQL parameters

Check your Render logs for these messages after trying to create a store manager.

## Next Steps

1. ✅ Run `scripts/FULL_DIAGNOSTIC_AND_FIX.sql`
2. ✅ Check Render.com logs for detailed error
3. ✅ Verify you're fixing the correct database (the one Render uses)
4. ✅ Test direct insert in database
5. ✅ Check for triggers

## If Still Not Working

Send me:
1. Output from `scripts/CHECK_CONSTRAINT_DETAILS.sql`
2. Render.com logs showing the error
3. Result of: `SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'users'::regclass;`







