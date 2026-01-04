-- Update Order & Payment Flow for Simplified Order Creation
-- This script updates the schema to support:
-- 1. Orders without items (only total amount)
-- 2. Multiple payments per order (partial payments)
-- 3. Delivery/payment proof photos
-- 4. Payment status: PENDING, PARTIAL, PAID

-- Step 1: Add delivery_photo_url to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_photo_url VARCHAR(500);

-- Step 2: Update payment_status constraint to include PARTIAL
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check 
    CHECK (payment_status IN ('PENDING', 'PARTIAL', 'PAID'));

-- Step 2a: Update payment_mode constraint to include CARD and UPI
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_mode_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_mode_check 
    CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'SPLIT') OR payment_mode IS NULL);

-- Step 2b: Update payments table payment_mode constraint
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_mode_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_mode_check 
    CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'SPLIT'));

-- Step 3: Allow multiple payments per order (remove unique constraint if exists)
-- Note: The current schema already allows multiple payments (no unique constraint on order_id)

-- Step 4: Add index for payment queries
CREATE INDEX IF NOT EXISTS idx_payments_order_id_created_at ON payments(order_id, created_at DESC);

-- Step 5: Verify changes
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' 
AND column_name IN ('delivery_photo_url', 'payment_status')
ORDER BY column_name;

SELECT 
    conname, 
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'orders'::regclass
AND conname = 'orders_payment_status_check';

