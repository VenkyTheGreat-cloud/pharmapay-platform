-- Make name field optional (nullable) in customer_registry table
-- This allows customer registry entries to be created with only mobile number
ALTER TABLE customer_registry 
ALTER COLUMN name DROP NOT NULL;
