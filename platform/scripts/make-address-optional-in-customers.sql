-- Make address field optional (nullable) in customers table
-- The application treats address as optional but the DB column has NOT NULL
ALTER TABLE customers ALTER COLUMN address DROP NOT NULL;

-- Verify
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'customers' AND column_name = 'address';
