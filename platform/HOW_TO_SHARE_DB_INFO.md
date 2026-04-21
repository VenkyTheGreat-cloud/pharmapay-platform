# 📋 How to Share Database Information

## Step 1: Connect to Your Render Database

### Option A: Using Render Shell (Easiest)
1. Go to **Render.com** dashboard
2. Click on your **Database** service
3. Click **"Shell"** tab
4. Type: `psql` and press Enter

### Option B: Using pgAdmin
1. Open pgAdmin
2. Connect to your Render database
3. Right-click database → **"Query Tool"**

---

## Step 2: Run the Extraction Script

I've created **two scripts** for you:

### Script 1: Simple Diagnosis (Recommended)
**File:** `scripts/GET_SIMPLE_DIAGNOSIS.sql`

This shows the key information I need.

**How to run:**
1. Copy the contents of `scripts/GET_SIMPLE_DIAGNOSIS.sql`
2. Paste into your database query tool
3. Execute (F5 in pgAdmin, or just press Enter in psql)
4. **Copy ALL the output**

### Script 2: Complete Schema Extraction
**File:** `scripts/EXTRACT_DATABASE_SCHEMA.sql`

This shows everything about your database.

---

## Step 3: Share the Output

After running the script, you'll see output like:

```
1. ROLE CONSTRAINT STATUS:
   status
   -------
   EXISTS

2. CONSTRAINT DEFINITION:
   definition
   -------
   CHECK (role IN ('admin'::character varying, 'store_manager'::character varying))
```

**Copy and paste ALL of this output here**, and I'll fix it for you!

---

## Step 4: Quick Manual Check

If you just want to quickly check, run these 3 queries:

```sql
-- Query 1: Check constraint
SELECT pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname = 'users_role_check';

-- Query 2: Check roles
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Query 3: Check all constraints
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass;
```

**Share the output of these 3 queries.**

---

## 📝 What I Need

I need to see:
1. ✅ Does the `users_role_check` constraint exist?
2. ✅ What is the constraint definition?
3. ✅ What role values currently exist in the database?
4. ✅ Are there any invalid role values?

Once I have this information, I can give you the exact fix!

---

## 🔄 Alternative: Quick Fix Script

If you want to try fixing it yourself first, run:

```sql
-- File: scripts/DIAGNOSE_AND_FIX.sql
```

This will automatically diagnose and fix the issue.

But **sharing the diagnosis output** will help me understand exactly what's wrong in your specific case.









