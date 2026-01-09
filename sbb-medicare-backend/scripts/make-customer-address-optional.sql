-- Make customer_address field optional (nullable) in orders table
-- This allows orders to be created for customers without address (only area is required)
ALTER TABLE orders 
ALTER COLUMN customer_address DROP NOT NULL;

