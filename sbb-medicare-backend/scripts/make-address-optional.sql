-- Make address field optional (nullable) in customers table
-- This allows customers to be created without address (only area is required)
ALTER TABLE customers 
ALTER COLUMN address DROP NOT NULL;

