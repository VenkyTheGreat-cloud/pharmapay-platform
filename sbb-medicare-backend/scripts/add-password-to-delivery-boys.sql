-- Add password_hash column to delivery_boys table
-- This allows delivery boys to authenticate with email/password

-- Step 1: Add password_hash column (nullable for existing records)
ALTER TABLE delivery_boys 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Step 2: Add index on email for faster lookups (if email is used for login)
CREATE INDEX IF NOT EXISTS idx_delivery_boys_email ON delivery_boys(email) WHERE email IS NOT NULL;

-- Step 3: Add index on mobile for faster lookups (already exists, but ensuring it's there)
CREATE INDEX IF NOT EXISTS idx_delivery_boys_mobile ON delivery_boys(mobile);

-- Note: Existing delivery boys won't have passwords until they're set
-- You can set a default password for existing delivery boys if needed:
-- UPDATE delivery_boys SET password_hash = '$2a$10$...' WHERE password_hash IS NULL;







