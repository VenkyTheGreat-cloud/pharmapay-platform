-- ============================================================================
-- Increase receipt_photo_url Column Size
-- ============================================================================
-- This script changes receipt_photo_url from VARCHAR(500) to TEXT
-- to support base64-encoded images and longer URLs
-- ============================================================================

-- Alter the column to TEXT (unlimited length)
ALTER TABLE payments 
ALTER COLUMN receipt_photo_url TYPE TEXT;

-- Verify the change
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'payments' 
AND column_name = 'receipt_photo_url';

-- Expected result:
-- column_name: receipt_photo_url
-- data_type: text
-- character_maximum_length: null (unlimited)
-- is_nullable: YES


