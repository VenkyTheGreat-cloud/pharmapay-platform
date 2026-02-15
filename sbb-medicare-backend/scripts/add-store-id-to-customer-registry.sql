-- Add store_id column to customer_registry table
-- This allows filtering customer registrations by store/admin ownership

ALTER TABLE customer_registry 
ADD COLUMN store_id UUID;

-- Create index for better query performance
CREATE INDEX idx_customer_registry_store_id ON customer_registry(store_id);

-- Optional: Update existing records to link them to a store if possible
-- You may need to manually assign store_ids to existing records based on your business logic
-- Example: UPDATE customer_registry SET store_id = 'your-store-uuid' WHERE store_id IS NULL;
