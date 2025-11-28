# 🔍 Check What Error You're Actually Getting

## Current Status
- **Status Code:** 400 (Bad Request)
- **Response Time:** 138ms (Fast - no timeout)
- **Endpoint:** `/api/access-control`

This means the request is completing, but something is wrong with the data/validation.

## 🎯 What to Check

### Step 1: Check the Full Error Response

In your browser's Developer Tools or API client:
1. Open **Network** tab
2. Find the request to `/api/access-control`
3. Click on it
4. Look at the **Response** tab

**What does the error message say?**
- Is it still: `"Database constraint violation. Please check role value."`?
- Or is it something else?

### Step 2: Check Render Logs

Go to Render.com → Your backend service → **Logs** tab

Look for lines around the time you made the request. You should see:
- `Error creating store manager`
- The actual error message
- Error code and constraint name

### Step 3: Verify Database Constraint

Run this SQL on your Render database:

```sql
-- Check if constraint exists
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname = 'users_role_check';

-- Check current roles
SELECT role, COUNT(*) FROM users GROUP BY role;
```

**Or use the script:** `scripts/VERIFY_ROLE_CONSTRAINT.sql`

---

## 🔧 Common 400 Errors

### Error 1: Role Constraint Violation
**Message:** `"Database constraint violation. Please check role value."`

**Fix:** Run the SQL fix script I provided earlier

### Error 2: Missing Required Fields
**Message:** `"Name, mobile, email, and password are required"`

**Fix:** Check your request payload has all required fields

### Error 3: Duplicate Email/Mobile
**Message:** `"Email already registered"` or `"Mobile number already registered"`

**Fix:** Use a different email/mobile number

### Error 4: Validation Error
**Message:** `"Invalid role value. Role must be \"admin\" or \"store_manager\"."`

**Fix:** This shouldn't happen if backend is correct - might be database constraint issue

---

## 📋 What Information I Need

Please share:

1. **The exact error message** from the API response
2. **The request payload** you're sending
3. **The output** of the verify script above

With this information, I can give you the exact fix!

---

## 🚀 Quick Diagnostic

Run this to check everything:

```sql
-- 1. Check constraint
SELECT pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname = 'users_role_check';

-- 2. Check roles
SELECT role, COUNT(*) FROM users GROUP BY role;

-- 3. Check table structure
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'role';
```

Share the results and I'll help fix it!

