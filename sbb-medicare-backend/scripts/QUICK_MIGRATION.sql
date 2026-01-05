-- ============================================================================
-- QUICK MIGRATION - Essential queries only
-- ============================================================================
-- Run these queries if you want a quick migration without verification steps
-- ============================================================================

-- 1. Add delivery_photo_url to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_photo_url VARCHAR(500);

-- 2. Update payment_status constraint (orders table)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check 
    CHECK (payment_status IN ('PENDING', 'PARTIAL', 'PAID'));

-- 3. Update payment_mode constraint (orders table)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_mode_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_mode_check 
    CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'SPLIT') OR payment_mode IS NULL);

-- 4. Update payment_mode constraint (payments table)
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_mode_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_mode_check 
    CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'SPLIT'));

-- 5. Add index for payment queries
CREATE INDEX IF NOT EXISTS idx_payments_order_id_created_at 
    ON payments(order_id, created_at DESC);

-- 6. Update existing orders payment_status based on payments
UPDATE orders o
SET payment_status = CASE
    WHEN COALESCE((
        SELECT SUM(p.cash_amount + p.bank_amount)
        FROM payments p
        WHERE p.order_id = o.id AND p.status = 'CONFIRMED'
    ), 0) >= o.total_amount THEN 'PAID'
    WHEN COALESCE((
        SELECT SUM(p.cash_amount + p.bank_amount)
        FROM payments p
        WHERE p.order_id = o.id AND p.status = 'CONFIRMED'
    ), 0) > 0 THEN 'PARTIAL'
    ELSE 'PENDING'
END
WHERE payment_status IS NULL OR payment_status NOT IN ('PENDING', 'PARTIAL', 'PAID');

-- Done!


