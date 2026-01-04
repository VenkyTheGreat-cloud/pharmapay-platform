-- Add ACCEPTED and REJECTED statuses to orders table
-- This allows delivery boys to accept or reject assigned orders

-- Step 1: Drop the existing constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Step 2: Add the new constraint with ACCEPTED and REJECTED statuses
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('ASSIGNED', 'ACCEPTED', 'REJECTED', 'PICKED_UP', 'IN_TRANSIT', 'PAYMENT_COLLECTION', 'DELIVERED', 'CANCELLED'));

-- Step 3: Verify the constraint
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'orders'::regclass
AND conname = 'orders_status_check';

-- Step 4: Check current orders with ASSIGNED status (these can now be accepted/rejected)
SELECT id, order_number, status, assigned_delivery_boy_id, assigned_at
FROM orders
WHERE status = 'ASSIGNED'
ORDER BY assigned_at DESC;

