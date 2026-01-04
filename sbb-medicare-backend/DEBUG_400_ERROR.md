# 🔍 Debug 400 Error - Step by Step

## Current Situation
- **Status:** 400 (Bad Request)
- **Response Time:** 138ms (Fast - no timeout)
- **Endpoint:** `/api/access-control`

A 400 error with fast response means validation failed, not a database timeout.

---

## 🎯 Step 1: Check Render Logs

Go to **Render.com** → Your backend service → **"Logs"** tab

Look for a line that says:
```
Error creating store manager - FULL DETAILS
```

**What you should see:**
- `errorMessage`
- `errorCode`
- `constraint`
- `detail`

**Copy the error message and share it with me.**

---

## 🎯 Step 2: Check Browser/API Response

In your browser's Developer Tools (F12):
1. Go to **Network** tab
2. Find the request to `/api/access-control`
3. Click on it
4. Go to **Response** tab

**What does the error say?**
- Is it: `"Database constraint violation. Please check role value."`?
- Or: `"Name, mobile, email, and password are required"`?
- Or: `"Email already registered"`?
- Or something else?

---

## 🔧 Step 3: Run Database Check

Run this SQL to verify your database:

```sql
-- Check constraint exists
SELECT 
    conname,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname = 'users_role_check';

-- Check current roles
SELECT role, COUNT(*) as count
FROM users
GROUP BY role;
```

**Expected output:**
- Constraint should show: `CHECK (role IN ('admin'::character varying, 'store_manager'::character varying))`
- Roles should only show: `admin` and `store_manager`

---

## 📋 Step 4: Common 400 Errors & Fixes

### Error 1: Role Constraint Violation
**Message:** `"Database constraint violation. Please check role value."`

**Fix:** Run the SQL fix from `scripts/COPY_PASTE_THIS_TO_FIX.sql`

### Error 2: Missing Required Fields
**Message:** `"Name, mobile, email, and password are required"`

**Fix:** Check your request payload includes all required fields:
```json
{
  "name": "Store Manager1",
  "email": "store1@gmail.com",
  "mobile": "8877669988",
  "password": "admin123"
}
```

### Error 3: Duplicate Email
**Message:** `"Email already registered"`

**Fix:** Use a different email address

### Error 4: Duplicate Mobile
**Message:** `"Mobile number already registered"`

**Fix:** Use a different mobile number

---

## 🚀 Quick Test

Try this minimal payload to see what error you get:

```json
{
  "name": "Test Manager",
  "email": "test999@example.com",
  "mobile": "9999999999",
  "password": "test123"
}
```

**If this works, the issue was with your original payload.**
**If this fails, share the exact error message.**

---

## 📝 What I Need From You

1. **The exact error message** from the API response
2. **The error details** from Render logs (the "FULL DETAILS" log)
3. **Your request payload** that's failing
4. **Output** of the database check query above

With this information, I can give you the exact fix!

---

## ✅ Quick Verification Script

Run this script to check everything:
```bash
# File: scripts/VERIFY_ROLE_CONSTRAINT.sql
```

This will show you:
- If constraint exists
- If constraint is correct
- What role values exist
- If test insert works




