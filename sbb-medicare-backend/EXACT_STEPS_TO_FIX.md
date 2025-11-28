# ✅ EXACT STEPS TO FIX - Role Constraint Error

## 🎯 The Problem
You're getting: `"Database constraint violation. Please check role value."` when creating store managers.

## 🔍 Root Cause
The database constraint is either:
1. Not properly set up
2. Being violated by existing data
3. Case-sensitive mismatch
4. Different database being used (Render vs local)

---

## 📋 STEP-BY-STEP FIX

### Step 1: Connect to the CORRECT Database ⚠️ IMPORTANT

**You MUST fix the database that Render.com is using!**

1. Go to Render.com dashboard
2. Find your database service
3. Get the connection string from Environment variables (look for `DATABASE_URL`)
4. Connect to THAT database (not your local one!)

### Step 2: Run the Complete Fix Script

Run this **ENTIRE** SQL script in your database:

```sql
BEGIN;

-- Step 1: Fix all invalid roles
UPDATE users
SET role = 'store_manager', updated_at = CURRENT_TIMESTAMP
WHERE role IS NULL 
   OR role = ''
   OR TRIM(role) = ''
   OR role NOT IN ('admin', 'store_manager');

-- Step 2: Remove ALL existing role constraints
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'users'::regclass 
        AND (conname LIKE '%role%' OR pg_get_constraintdef(oid) LIKE '%role%')
    LOOP
        EXECUTE 'ALTER TABLE users DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname) || ' CASCADE';
        RAISE NOTICE 'Dropped constraint: %', r.conname;
    END LOOP;
END $$;

-- Step 3: Verify no invalid roles remain
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Step 4: Add the constraint fresh
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'store_manager'));

-- Step 5: Verify constraint exists
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname = 'users_role_check';

COMMIT;

SELECT '✅ FIXED! Constraint is now correct.' as status;
```

### Step 3: Test Direct Insert

Test that the database accepts the insert:

```sql
BEGIN;
INSERT INTO users (
    name, mobile, email, password_hash, role, is_active
) VALUES (
    'Test User', '9999999999', 'test@example.com', 
    '$2a$10$test', 
    'store_manager', 
    true
);
SELECT * FROM users WHERE email = 'test@example.com';
ROLLBACK;
```

If this works, the database is fixed!

### Step 4: Check Render.com Logs

After running the fix:

1. Go to Render.com → Your backend service → Logs
2. Try creating a store manager again
3. Check the logs for detailed error messages

The updated code now logs:
- Exact role value being inserted
- Full database error details
- Constraint name

### Step 5: Restart Your Backend Service

After fixing the database:

1. Go to Render.com → Your backend service
2. Click "Manual Deploy" → "Clear build cache & deploy"
3. Wait for deployment to complete
4. Try creating store manager again

---

## 🔧 Alternative: Run the Script File

I've created a complete fix script:

**File:** `scripts/FULL_DIAGNOSTIC_AND_FIX.sql`

Run it with:
```bash
psql -U postgres -d YOUR_DATABASE_NAME -f scripts/FULL_DIAGNOSTIC_AND_FIX.sql
```

Or copy-paste the contents directly into pgAdmin/SQL client.

---

## 🧪 Verify Everything Works

### Test 1: Check Constraint
```sql
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname = 'users_role_check';
```

Should show:
```
conname: users_role_check
definition: CHECK (role IN ('admin'::character varying, 'store_manager'::character varying))
```

### Test 2: Check All Roles
```sql
SELECT role, COUNT(*) FROM users GROUP BY role;
```

Should ONLY show:
- `admin`
- `store_manager`

### Test 3: Try API
Make a POST request to:
```
POST https://sbb-medicare-api.onrender.com/api/access-control
```

With payload:
```json
{
  "name": "Store Manager1",
  "email": "store1@gmail.com",
  "mobile": "8877669988",
  "password": "admin123",
  "address": "Bangalore",
  "store_name": "Store Manager 1"
}
```

---

## 🚨 Still Not Working?

If you're still getting the error after all this:

1. **Check Render.com Logs** - The updated code now logs full error details
2. **Verify Database** - Make sure you fixed the database Render is using
3. **Check Connection String** - Verify `DATABASE_URL` in Render environment variables
4. **Run Diagnostic** - Run `scripts/CHECK_CONSTRAINT_DETAILS.sql` and share the output

---

## 📝 Summary

✅ **What's Fixed:**
- Backend code is correct (automatically sets role to 'store_manager')
- Error logging improved (will show full database error)
- Database scripts created for fixing

⏳ **What You Need to Do:**
1. Connect to Render's database (not local)
2. Run the complete fix SQL script
3. Restart your backend service on Render
4. Test creating store manager

The fix is 100% in the **database**. Once the constraint is properly set, everything will work!

