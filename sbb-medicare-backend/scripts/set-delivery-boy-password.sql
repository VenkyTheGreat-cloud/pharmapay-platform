-- Set password for delivery boy
-- This will set password "admin123" for deliveryboy@gmail.com
-- The hash is for password "admin123"

-- First, make sure password_hash column exists
ALTER TABLE delivery_boys 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Update the specific delivery boy's password
-- Password: admin123
-- Hash: $2a$10$HtLuIFuLUOp/epG1Y0K/Nuxp6U799TvTSWI3DxJaTAHStWiBpzanO
UPDATE delivery_boys 
SET password_hash = '$2a$10$HtLuIFuLUOp/epG1Y0K/Nuxp6U799TvTSWI3DxJaTAHStWiBpzanO',
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'deliveryboy@gmail.com';

-- Verify the update
SELECT id, name, email, status, is_active, 
       CASE WHEN password_hash IS NOT NULL THEN 'Password Set' ELSE 'No Password' END as password_status
FROM delivery_boys 
WHERE email = 'deliveryboy@gmail.com';

