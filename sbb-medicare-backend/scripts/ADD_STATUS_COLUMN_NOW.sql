-- ============================================
-- ADD STATUS COLUMN TO USERS TABLE
-- Run this to fix "column status does not exist" error
-- ============================================

BEGIN;

-- Step 1: Add status column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status VARCHAR(50);

-- Step 2: Set default value for existing records based on is_active
UPDATE users 
SET status = CASE 
    WHEN is_active = true THEN 'active'
    WHEN is_active = false THEN 'inactive'
    ELSE 'inactive'
END
WHERE status IS NULL OR status = '';

-- Step 3: Add default value for future inserts
ALTER TABLE users 
ALTER COLUMN status SET DEFAULT 'active';

-- Step 4: Set NOT NULL constraint
ALTER TABLE users 
ALTER COLUMN status SET NOT NULL;

-- Step 5: Add check constraint
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_status_check;

ALTER TABLE users 
ADD CONSTRAINT users_status_check 
CHECK (status IN ('active', 'inactive'));

-- Step 6: Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

COMMIT;

-- Verification
SELECT '=== VERIFICATION ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'status';

-- Show current status values
SELECT '=== CURRENT STATUS VALUES ===' as info;
SELECT status, is_active, COUNT(*) as count
FROM users
GROUP BY status, is_active
ORDER BY status;

SELECT '✅✅✅ STATUS COLUMN ADDED SUCCESSFULLY! ✅✅✅' as result;






