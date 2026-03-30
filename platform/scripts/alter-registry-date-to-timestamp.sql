-- Migration script to alter registry_date from DATE to TIMESTAMP
-- Run this if the table already exists with DATE type

-- Alter the column type from DATE to TIMESTAMP
ALTER TABLE customer_registry 
ALTER COLUMN registry_date TYPE TIMESTAMP USING registry_date::TIMESTAMP;

-- Update default value to CURRENT_TIMESTAMP
ALTER TABLE customer_registry 
ALTER COLUMN registry_date SET DEFAULT CURRENT_TIMESTAMP;
