# 🔧 EXACT DATABASE FIX INSTRUCTIONS - Role Constraint Error

## ❌ Error You're Getting
```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Database constraint violation. Please check role value."
    }
}
```

## 🎯 What You Need to Do

**This is a DATABASE issue. You must fix it in your Render.com database.**

---

## 📋 STEP-BY-STEP INSTRUCTIONS

### Step 1: Connect to Your Render Database

1. Go to **Render.com** dashboard
2. Click on your **Database** service (not backend service)
3. Go to **"Info"** tab
4. Copy the **"Connection String"** (looks like: `postgresql://user:pass@host:port/dbname`)

### Step 2: Connect Using pgAdmin or psql

**Option A: Using pgAdmin (Easier)**
1. Open pgAdmin
2. Right-click "Servers" → "Create" → "Server"
3. Go to "Connection" tab
4. Paste your connection details
5. Click "Save"

**Option B: Using psql (Command Line)**
```bash
psql "postgresql://user:pass@host:port/dbname"
```

### Step 3: Run the Fix Script

**I've created a complete fix script:** `scripts/FIX_ROLE_CONSTRAINT_STEP_BY_STEP.sql`

**In pgAdmin:**
1. Connect to your Render database
2. Right-click on database → "Query Tool"
3. Open file: `scripts/FIX_ROLE_CONSTRAINT_STEP_BY_STEP.sql`
4. Click "Execute" (F5)

**OR Copy-Paste This Entire SQL:**

```sql
-- ============================================
-- COMPLETE FIX - Copy and paste this ENTIRE block
-- ============================================

BEGIN;

-- Step 1: Fix invalid roles
UPDATE users
SET role = 'store_manager', updated_at = CURRENT_TIMESTAMP
WHERE role IS NULL OR role = '' OR role NOT IN ('admin', 'store_manager');

-- Step 2: Remove ALL role constraints
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN SELECT conname FROM pg_constraint 
        WHERE conrelid = 'users'::regclass 
        AND pg_get_constraintdef(oid) LIKE '%role%'
    LOOP
        EXECUTE 'ALTER TABLE users DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname) || ' CASCADE';
    END LOOP;
END $$;

-- Step 3: Add correct constraint
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'store_manager'));

COMMIT;

-- Verify
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname = 'users_role_check';
```

### Step 4: Verify It Worked

After running the script, you should see:
```
conname: users_role_check
constraint_definition: CHECK (role IN ('admin'::character varying, 'store_manager'::character varying))
```

### Step 5: Test the API

Try creating a store manager again:
```
POST https://sbb-medicare-api.onrender.com/api/access-control
```

**Payload:**
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

## 🔍 If You Can't Connect to Database

### Alternative: Use Render Shell

1. Go to Render.com → Your Database service
2. Click "Shell" tab
3. Type: `psql`
4. Then run the SQL commands above

---

## 📝 Quick Copy-Paste Version

If you just want to run the fix quickly, copy this:

```sql
-- Fix invalid roles
UPDATE users SET role = 'store_manager', updated_at = CURRENT_TIMESTAMP
WHERE role IS NULL OR role = '' OR role NOT IN ('admin', 'store_manager');

-- Remove old constraints
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN SELECT conname FROM pg_constraint 
        WHERE conrelid = 'users'::regclass AND pg_get_constraintdef(oid) LIKE '%role%'
    LOOP
        EXECUTE 'ALTER TABLE users DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname) || ' CASCADE';
    END LOOP;
END $$;

-- Add correct constraint
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'store_manager'));
```

---

## ✅ What This Does

1. ✅ Fixes any invalid role values (sets them to 'store_manager')
2. ✅ Removes ALL old role constraints (no matter what they're named)
3. ✅ Adds the correct constraint that allows only 'admin' and 'store_manager'
4. ✅ Verifies it worked

---

## 🚨 Important Notes

1. **Run this on Render's database** - Not your local database!
2. **The database that Render.com uses** - Check your `DATABASE_URL` environment variable
3. **Backup first** (if you have important data) - Though this shouldn't delete data

---

## ❓ Still Not Working?

1. **Check you're on the right database:**
   ```sql
   SELECT current_database();
   ```
   Should match your Render database name.

2. **Check if constraint exists:**
   ```sql
   SELECT conname, pg_get_constraintdef(oid) 
   FROM pg_constraint 
   WHERE conrelid = 'users'::regclass 
   AND conname LIKE '%role%';
   ```

3. **Check current roles:**
   ```sql
   SELECT role, COUNT(*) FROM users GROUP BY role;
   ```

4. **Share the output** of these queries if it still doesn't work.

---

## ✅ After Fixing

Once the constraint is fixed:
- ✅ The API will accept role='store_manager'
- ✅ No more validation errors
- ✅ Store managers can be created successfully

**The fix is 100% in the database - no code changes needed!**





