-- ============================================
-- ADD STATUS COLUMN TO USERS TABLE
-- This adds status field similar to delivery_boys
-- ============================================

BEGIN;

-- Add status column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' 
CHECK (status IN ('active', 'inactive'));

-- Update existing records based on is_active
UPDATE users 
SET status = CASE 
    WHEN is_active = true THEN 'active'
    WHEN is_active = false THEN 'inactive'
    ELSE 'inactive'
END
WHERE status IS NULL OR status = '';

-- Set NOT NULL after updating
ALTER TABLE users 
ALTER COLUMN status SET NOT NULL;

-- Create index for status
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

COMMIT;

-- Verify
SELECT '=== VERIFICATION ===' as info;
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'status';

-- Show current status values
SELECT status, is_active, COUNT(*) as count
FROM users
GROUP BY status, is_active;









