# 🔧 SIMPLE FIX - Role Constraint Error

## The Problem
```
"Database constraint violation. Please check role value."
```

## The Solution (3 Steps)

### Step 1: Open Your Database

1. Go to **Render.com**
2. Click your **Database** service
3. Click **"Shell"** tab
4. Type: `psql` and press Enter

**OR use pgAdmin:**
- Connect to your Render database
- Right-click database → "Query Tool"

---

### Step 2: Copy and Paste This SQL

Open the file: `scripts/COPY_PASTE_THIS_TO_FIX.sql`

**OR copy this:**

```sql
BEGIN;

-- Fix invalid roles
UPDATE users SET role = 'store_manager', updated_at = CURRENT_TIMESTAMP
WHERE role IS NULL OR role = '' OR role NOT IN ('admin', 'store_manager');

-- Remove old constraints
DO $$
DECLARE constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT conname FROM pg_constraint 
        WHERE conrelid = 'users'::regclass 
        AND (conname LIKE '%role%' OR pg_get_constraintdef(oid) LIKE '%role%')
    LOOP
        EXECUTE 'ALTER TABLE users DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name) || ' CASCADE';
    END LOOP;
END $$;

-- Add correct constraint
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'store_manager'));

COMMIT;

-- Verify
SELECT pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname = 'users_role_check';
```

---

### Step 3: Press Execute/Run

- In pgAdmin: Click **Execute** (F5)
- In psql: Just press Enter after pasting

---

### Step 4: Test API

Try creating store manager again - it should work!

---

## ✅ What You Should See

After running, you should see:
```
constraint_definition: CHECK (role IN ('admin'::character varying, 'store_manager'::character varying))
```

If you see this, **it's fixed!** ✅

---

## ❌ Still Not Working?

Run this to see what's wrong:

```sql
-- Check what roles exist
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Check what constraints exist
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass;
```

Share the output if you need help!




