# 🎯 The Problem and Fix

## ✅ What I Found

From your database output, I can see:

### The Problem:

1. **Malformed Role Constraint:**
   ```
   CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'store_manager'::character varying])::text[])))
   ```
   This constraint is incorrectly checking if `role::text` matches a text array, which will **NEVER work**.

2. **Wrong Status Constraint:**
   ```
   users_status_check | CHECK (is_active IN ('pending', 'active', 'inactive', 'rejected'))
   ```
   This is checking `is_active` as if it's a status field, but `is_active` is a **boolean**, not a status enum!

### The Fix:

The constraint should be:
```sql
CHECK (role IN ('admin', 'store_manager'))
```

---

## 🔧 Run This Fix

**Copy and paste this SQL into your database:**

```sql
BEGIN;

-- Drop incorrect constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check CASCADE;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check CASCADE;

-- Add correct role constraint
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'store_manager'));

COMMIT;

-- Verify
SELECT pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname = 'users_role_check';
```

**Expected output after fix:**
```
CHECK (role IN ('admin'::character varying, 'store_manager'::character varying))
```

---

## ✅ After Running the Fix

1. ✅ The role constraint will be correct
2. ✅ The wrong status constraint will be removed (is_active is boolean, not status)
3. ✅ Creating store managers via API will work

**The file `scripts/FIX_YOUR_DATABASE.sql` has this complete fix ready to run!**

---

## 🚀 Why This Happened

Someone or some script created the constraint incorrectly, using a text array comparison instead of a simple IN check. The fix removes the bad constraint and creates the correct one.

