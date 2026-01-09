-- Add area field to customers table
-- For existing records, area is optional (nullable)
-- For new records, area will be mandatory (enforced in application layer)
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS area VARCHAR(255);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_area ON customers(area) WHERE area IS NOT NULL;

