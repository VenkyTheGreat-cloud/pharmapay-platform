-- Make name and address fields optional (nullable) in customers table
-- This allows customers to be created with only mobile number
-- Note: This script is idempotent - it can be run multiple times safely

-- Make name nullable
ALTER TABLE customers 
ALTER COLUMN name DROP NOT NULL;

-- Make address nullable (if not already)
ALTER TABLE customers 
ALTER COLUMN address DROP NOT NULL;
