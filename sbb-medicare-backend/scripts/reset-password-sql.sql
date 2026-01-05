-- ============================================
-- RESET USER PASSWORD - SQL VERSION
-- Use this if you want to set password directly
-- ============================================

-- Step 1: Check if user exists
SELECT id, name, email, mobile, role
FROM users
WHERE email = 'your-email@example.com'
   OR mobile = 'your-mobile-number';

-- Step 2: Generate new password hash
-- You'll need to run the Node.js script to get the hash, or use this:
-- node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YourNewPassword123!', 10).then(hash => console.log(hash));"

-- Step 3: Update password (replace the hash below with the one from step 2)
-- UPDATE users
-- SET password_hash = '$2a$10$YOUR_NEW_HASH_HERE',
--     updated_at = CURRENT_TIMESTAMP
-- WHERE email = 'your-email@example.com';

-- ============================================
-- ALTERNATIVE: Use Node.js script (EASIER)
-- ============================================
-- Run: node scripts/reset-user-password.js your-email@example.com NewPassword123!





