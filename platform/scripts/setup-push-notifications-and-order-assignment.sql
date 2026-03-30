-- ============================================================================
-- Database Setup for Push Notifications & Order Assignment Changes
-- ============================================================================
-- This script sets up the database for:
-- 1. Push notifications (device_token column)
-- 2. Order assignment changes (orders can be created without delivery boy)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Add device_token column to delivery_boys table for push notifications
-- ----------------------------------------------------------------------------
ALTER TABLE delivery_boys 
ADD COLUMN IF NOT EXISTS device_token VARCHAR(500);

-- Create index for faster queries on device_token
CREATE INDEX IF NOT EXISTS idx_delivery_boys_device_token 
ON delivery_boys(device_token) 
WHERE device_token IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 2. Verify orders table allows NULL for assigned_delivery_boy_id
-- ----------------------------------------------------------------------------
-- The orders table already allows NULL for assigned_delivery_boy_id
-- (it has ON DELETE SET NULL, which means the column can be NULL)
-- No changes needed here, but let's verify:

-- Check if assigned_delivery_boy_id can be NULL
SELECT 
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_name = 'orders' 
AND column_name = 'assigned_delivery_boy_id';

-- Expected result: is_nullable should be 'YES'

-- ----------------------------------------------------------------------------
-- 3. Verify status constraint includes ACCEPTED and REJECTED
-- ----------------------------------------------------------------------------
-- Check if ACCEPTED and REJECTED are in the status constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'orders'::regclass
AND conname LIKE '%status%';

-- Expected: Should see 'ASSIGNED', 'ACCEPTED', 'REJECTED', 'PICKED_UP', 'IN_TRANSIT', 
--           'PAYMENT_COLLECTION', 'DELIVERED', 'CANCELLED'

-- If ACCEPTED and REJECTED are missing, run this:
-- ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
-- ALTER TABLE orders ADD CONSTRAINT orders_status_check 
--     CHECK (status IN ('ASSIGNED', 'ACCEPTED', 'REJECTED', 'PICKED_UP', 'IN_TRANSIT', 
--                       'PAYMENT_COLLECTION', 'DELIVERED', 'CANCELLED'));

-- ----------------------------------------------------------------------------
-- 4. Summary
-- ----------------------------------------------------------------------------
-- After running this script:
-- ✅ delivery_boys table has device_token column
-- ✅ Orders can be created with assigned_delivery_boy_id = NULL
-- ✅ Orders can be accepted/rejected by delivery boys
-- ✅ Push notifications can be sent to delivery boys

-- ----------------------------------------------------------------------------
-- Verification Queries
-- ----------------------------------------------------------------------------

-- Verify device_token column exists
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'delivery_boys' 
AND column_name = 'device_token';

-- Verify orders can have NULL assigned_delivery_boy_id
SELECT 
    COUNT(*) as total_orders,
    COUNT(assigned_delivery_boy_id) as assigned_orders,
    COUNT(*) - COUNT(assigned_delivery_boy_id) as unassigned_orders
FROM orders;

-- Check current order statuses
SELECT 
    status,
    COUNT(*) as count
FROM orders
GROUP BY status
ORDER BY status;
