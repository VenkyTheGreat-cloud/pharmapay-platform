# 🔍 Debug 401 Login Error

## Current Issue
Getting **401 Unauthorized** when trying to login to store dashboard.

## Possible Causes

### 1. User Not Found
- Email/mobile doesn't exist in database
- Wrong email/mobile format
- Case sensitivity issues

### 2. Wrong Password
- Password doesn't match
- Password hash mismatch

### 3. User Inactive
- `is_active = false` (but this would return 403, not 401)

## ✅ What I Added

### Better Error Logging
- Logs login attempts (masked email/mobile)
- Logs when user not found
- Logs when password is wrong
- Logs when user is inactive

## 🔍 How to Debug

### Step 1: Check Render Logs
Go to Render.com → Backend service → Logs

Look for:
- `Login attempt` - Shows what's being attempted
- `Login failed - user not found` - User doesn't exist
- `Login failed - invalid password` - Password is wrong
- `Login failed - inactive user` - User is inactive

### Step 2: Verify User Exists
Run this SQL to check if the user exists:

```sql
-- Check if user exists by email
SELECT id, name, email, mobile, role, is_active, status
FROM users
WHERE email = 'your-email@example.com'
   OR mobile = 'your-mobile-number';
```

### Step 3: Check User Status
```sql
-- Check if user is active
SELECT id, name, email, is_active, status
FROM users
WHERE email = 'your-email@example.com';
```

Should show:
- `is_active: true`
- `status: 'active'`

### Step 4: Test Password
The password is hashed with bcrypt, so you can't directly check it. But you can:
1. Try resetting the password
2. Check if password was set correctly during creation

## 📋 Common Issues

### Issue 1: Wrong Email/Mobile Format
- Make sure email is lowercase
- Remove any spaces
- Use exact email/mobile used during registration

### Issue 2: User Not Active
If user exists but `is_active = false`:
- You'll get **403** (not 401)
- Message: "User account is inactive"
- Need to activate user first

### Issue 3: Password Case Sensitive
- Passwords are case-sensitive
- Check for typos
- Make sure no extra spaces

## 🚀 Quick Fix

If you know the user exists, you can activate them:

```sql
-- Activate user
UPDATE users
SET is_active = true, status = 'active'
WHERE email = 'your-email@example.com';
```

## 📝 Expected Request

**Endpoint:** `POST /api/auth/login`

**Payload:**
```json
{
  "mobileEmail": "store@example.com",
  "password": "your-password"
}
```

**OR:**
```json
{
  "mobileEmail": "9876543210",
  "password": "your-password"
}
```

## ✅ After Deploy

The improved logging will show exactly why login is failing:
- User not found → Check email/mobile
- Invalid password → Check password
- Inactive user → Activate user first

Check Render logs after deploying to see the detailed error messages!




