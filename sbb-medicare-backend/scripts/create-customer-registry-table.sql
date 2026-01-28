-- Create customer_registry table for storing customer mobile, name, and date/time
-- This is separate from the customers table

CREATE TABLE IF NOT EXISTS customer_registry (
    id SERIAL PRIMARY KEY,
    mobile VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    registry_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index on mobile for faster lookups
CREATE INDEX IF NOT EXISTS idx_customer_registry_mobile ON customer_registry(mobile);

-- Add index on registry_date for date-based queries
CREATE INDEX IF NOT EXISTS idx_customer_registry_date ON customer_registry(registry_date);

-- Add comment for documentation
COMMENT ON TABLE customer_registry IS 'Registry/log of customers with mobile number, name, and date/time';
COMMENT ON COLUMN customer_registry.mobile IS 'Customer mobile number';
COMMENT ON COLUMN customer_registry.name IS 'Customer name';
COMMENT ON COLUMN customer_registry.registry_date IS 'Date and time when customer was registered/logged';
