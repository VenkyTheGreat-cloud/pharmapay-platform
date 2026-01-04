-- Fix: Add password_hash column and set password for deliveryboy4@gmail.com
-- Run this in your PostgreSQL database

-- Step 1: Add password_hash column if it doesn't exist
ALTER TABLE delivery_boys 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Step 2: Set password for deliveryboy4@gmail.com
-- Password: admin123
-- Bcrypt hash for "admin123"
UPDATE delivery_boys 
SET password_hash = '$2a$10$HtLuIFuLUOp/epG1Y0K/Nuxp6U799TvTSWI3DxJaTAHStWiBpzanO',
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'deliveryboy4@gmail.com';

-- Step 3: Verify the update
SELECT 
    id, 
    name, 
    email, 
    status, 
    is_active,
    CASE 
        WHEN password_hash IS NOT NULL THEN 'Password Set ✓' 
        ELSE 'No Password ✗' 
    END as password_status
FROM delivery_boys 
WHERE email = 'deliveryboy4@gmail.com';

-- Step 4: Also check all delivery boys without passwords
SELECT 
    id,
    name,
    email,
    status,
    is_active,
    CASE 
        WHEN password_hash IS NOT NULL THEN 'Password Set ✓' 
        ELSE 'No Password ✗' 
    END as password_status
FROM delivery_boys
WHERE password_hash IS NULL OR password_hash = ''
ORDER BY created_at DESC;




