-- ============================================================================
-- DATABASE MIGRATION: Add Return Items Photo URL
-- ============================================================================
-- This script adds return_items_photo_url column to orders table
-- This field stores the photo of returned items uploaded by delivery boy
-- ============================================================================

-- Add return_items_photo_url column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_items_photo_url TEXT;

-- Create index for return items photo queries (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_orders_return_items_photo ON orders(return_items_photo_url) WHERE return_items_photo_url IS NOT NULL;

-- ============================================================================
-- Verify changes
-- ============================================================================
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' 
AND column_name = 'return_items_photo_url';
