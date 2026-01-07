-- Add tracking_link field to customers table for Google Maps link
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS tracking_link VARCHAR(500);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_tracking_link ON customers(tracking_link) WHERE tracking_link IS NOT NULL;

