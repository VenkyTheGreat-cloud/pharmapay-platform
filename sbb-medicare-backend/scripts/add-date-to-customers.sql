-- Add date field to customers table for storing customer registration/entry date
-- This allows storing a custom date when creating customers
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS customer_date DATE;

-- Create index for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_customers_date ON customers(customer_date) WHERE customer_date IS NOT NULL;

COMMENT ON COLUMN customers.customer_date IS 'Custom date field for customer registration or entry date';
