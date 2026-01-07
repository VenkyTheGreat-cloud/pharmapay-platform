-- Migration: Update all foreign keys to UUID to match users.id
-- Use this if users.id is already UUID and has data

-- Step 1: Check users.id type
SELECT 'Current users.id type:' as info, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'id';

-- Step 2: Create tables with UUID foreign keys (if they don't exist)

-- Refresh Tokens table
DROP TABLE IF EXISTS refresh_tokens CASCADE;
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- Delivery Boys table (drop if exists, recreate with UUID)
DROP TABLE IF EXISTS delivery_boys CASCADE;
CREATE TABLE delivery_boys (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    address TEXT,
    photo_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    is_active BOOLEAN DEFAULT false,
    store_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_delivery_boys_mobile ON delivery_boys(mobile);
CREATE INDEX idx_delivery_boys_store_id ON delivery_boys(store_id);
CREATE INDEX idx_delivery_boys_status ON delivery_boys(status);

-- Customers table
DROP TABLE IF EXISTS customers CASCADE;
CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    landmark VARCHAR(255),
    customer_lat DECIMAL(10,8),
    customer_lng DECIMAL(11,8),
    store_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(mobile, store_id)
);
CREATE INDEX idx_customers_mobile ON customers(mobile);
CREATE INDEX idx_customers_store_id ON customers(store_id);
CREATE INDEX idx_customers_name ON customers(name);

-- Orders table
DROP TABLE IF EXISTS orders CASCADE;
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
    assigned_delivery_boy_id BIGINT REFERENCES delivery_boys(id) ON DELETE SET NULL,
    store_id UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_address TEXT NOT NULL,
    customer_lat DECIMAL(10,8),
    customer_lng DECIMAL(11,8),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ASSIGNED' CHECK (status IN ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'PAYMENT_COLLECTION', 'DELIVERED', 'CANCELLED')),
    payment_status VARCHAR(50) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'PARTIAL')),
    payment_mode VARCHAR(20) CHECK (payment_mode IN ('CASH', 'BANK_TRANSFER', 'SPLIT')),
    notes TEXT,
    customer_comments TEXT,
    assigned_at TIMESTAMP,
    picked_up_at TIMESTAMP,
    in_transit_at TIMESTAMP,
    payment_collection_at TIMESTAMP,
    delivered_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_delivery_boy_id ON orders(assigned_delivery_boy_id);
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status_delivery_boy ON orders(status, assigned_delivery_boy_id, assigned_at);

-- Order Items table
DROP TABLE IF EXISTS order_items CASCADE;
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Payments table
DROP TABLE IF EXISTS payments CASCADE;
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    payment_mode VARCHAR(50) NOT NULL CHECK (payment_mode IN ('CASH', 'BANK_TRANSFER', 'SPLIT')),
    cash_amount DECIMAL(10,2) DEFAULT 0,
    bank_amount DECIMAL(10,2) DEFAULT 0,
    transaction_reference VARCHAR(255),
    receipt_photo_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED')),
    created_by BIGINT REFERENCES delivery_boys(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Location Updates table
DROP TABLE IF EXISTS location_updates CASCADE;
CREATE TABLE location_updates (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recorded_by BIGINT REFERENCES delivery_boys(id) ON DELETE SET NULL,
    source VARCHAR(20) DEFAULT 'MANUAL' CHECK (source IN ('AUTO', 'MANUAL'))
);
CREATE INDEX idx_location_updates_order_id ON location_updates(order_id);
CREATE INDEX idx_location_updates_recorded_at ON location_updates(recorded_at);

-- OTP Verifications table (no foreign key to users)
DROP TABLE IF EXISTS otp_verifications CASCADE;
CREATE TABLE otp_verifications (
    id BIGSERIAL PRIMARY KEY,
    mobile VARCHAR(20) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_otp_mobile ON otp_verifications(mobile);
CREATE INDEX idx_otp_expires_at ON otp_verifications(expires_at);

-- Order Status History table
DROP TABLE IF EXISTS order_status_history CASCADE;
CREATE TABLE order_status_history (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);

-- Create triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_delivery_boys_updated_at ON delivery_boys;
CREATE TRIGGER update_delivery_boys_updated_at BEFORE UPDATE ON delivery_boys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update generate_order_number function to work with UUID
CREATE OR REPLACE FUNCTION generate_order_number(store_id_param UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    sequence_num INTEGER;
    order_num VARCHAR(50);
    store_id_str VARCHAR(50);
BEGIN
    -- Convert UUID to string (remove hyphens for shorter order number)
    store_id_str := REPLACE(store_id_param::TEXT, '-', '');
    
    -- Get the next sequence number for this store
    SELECT COALESCE(
        MAX(
            CASE 
                WHEN order_number ~ ('^ORD-' || store_id_str || '-(\d+)$')
                THEN CAST(SUBSTRING(order_number FROM ('ORD-' || store_id_str || '-(\d+)$')) AS INTEGER)
                ELSE 0
            END
        ), 0
    ) + 1
    INTO sequence_num
    FROM orders
    WHERE store_id = store_id_param;
    
    -- Format: ORD-{storeId}-{sequence}
    order_num := 'ORD-' || store_id_str || '-' || LPAD(sequence_num::TEXT, 3, '0');
    
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

SELECT 'Migration completed! All tables created with UUID foreign keys.' as status;







