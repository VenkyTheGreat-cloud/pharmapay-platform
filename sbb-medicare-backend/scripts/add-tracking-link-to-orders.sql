-- Add tracking_link field to orders table for Google Maps link
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tracking_link VARCHAR(500);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_tracking_link ON orders(tracking_link) WHERE tracking_link IS NOT NULL;

