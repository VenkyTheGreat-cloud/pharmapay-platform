-- Make name field optional (nullable) in customers table
-- This allows customers to be created with only mobile number
ALTER TABLE customers 
ALTER COLUMN name DROP NOT NULL;
