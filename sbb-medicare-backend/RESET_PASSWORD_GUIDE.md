# 🔑 Reset User Password Guide

## Problem
You have a bcrypt password hash but **cannot recover the original password** because bcrypt is a one-way hashing algorithm.

## ✅ Solution: Reset the Password

### Option 1: Using Node.js Script (Recommended)

**Run this command:**
```bash
node scripts/reset-user-password.js <email-or-mobile> <new-password>
```

**Examples:**
```bash
# Reset password for email
node scripts/reset-user-password.js admin@example.com Admin123!

# Reset password for mobile
node scripts/reset-user-password.js 9876543210 Admin123!
```

**What it does:**
1. Finds the user by email or mobile
2. Hashes the new password
3. Updates the database
4. Confirms success

---

### Option 2: Using SQL (Manual)

**Step 1: Generate password hash**

Run this in Node.js:
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YourNewPassword123!', 10).then(hash => console.log(hash));"
```

**Step 2: Update in database**

```sql
UPDATE users
SET password_hash = 'PASTE_HASH_FROM_STEP_1',
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'your-email@example.com';
```

---

### Option 3: Direct Database Update (If you have hash)

If you already have a bcrypt hash for the password you want:

```sql
UPDATE users
SET password_hash = '$2a$10$YOUR_HASH_HERE',
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'your-email@example.com';
```

---

## 🔍 Find User First

Before resetting, verify the user exists:

```sql
SELECT id, name, email, mobile, role, is_active, status
FROM users
WHERE email = 'your-email@example.com'
   OR mobile = 'your-mobile-number';
```

---

## 📝 Important Notes

1. **Bcrypt is one-way** - You cannot recover the original password from a hash
2. **Use strong passwords** - Minimum 8 characters, mix of letters, numbers, special chars
3. **After reset** - User must use the new password to login
4. **Security** - Only reset passwords you have authorization for

---

## ✅ After Resetting

1. User can login with the new password
2. Old password will no longer work
3. User can change password again via the change-password API endpoint

---

## 🚀 Quick Command

```bash
# Make sure you're in the project directory
cd sbb-medicare-backend

# Reset password
node scripts/reset-user-password.js store@example.com Store123!
```

---

## 🔒 Password Requirements

For better security, use passwords with:
- At least 8 characters
- Mix of uppercase and lowercase
- Numbers
- Special characters (!@#$%^&*)

Example: `StoreManager123!`




