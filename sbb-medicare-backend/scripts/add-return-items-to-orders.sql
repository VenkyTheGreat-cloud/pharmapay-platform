-- Add return_items and return_adjust_amount columns to orders table
-- return_items: boolean flag indicating if there are return items
-- return_adjust_amount: decimal amount to be deducted from total amount

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS return_items BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS return_adjust_amount DECIMAL(10, 2) DEFAULT 0.00;

-- Add comment for documentation
COMMENT ON COLUMN orders.return_items IS 'Indicates if there are return items for this order (true/false)';
COMMENT ON COLUMN orders.return_adjust_amount IS 'Amount to be deducted from total amount due to return items';
