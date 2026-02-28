-- SBB Medicare Backend - Complete Database Schema
-- PostgreSQL Database

-- Enable UUID extension (required for UUID primary keys)
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For gen_random_uuid()
-- Alternative: CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- For uuid_generate_v4()

-- Users table (Admin & Store Managers)
-- Note: This schema uses UUID for users.id to match existing database
-- If you need BIGINT instead, change UUID to BIGSERIAL and update foreign keys
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    store_name VARCHAR(255),
    mobile VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    address TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'store_manager' CHECK (role IN ('admin', 'store_manager')),
    is_active BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for users
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Delivery Boys table
CREATE TABLE IF NOT EXISTS delivery_boys (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    address TEXT,
    photo_url VARCHAR(500),
    password_hash VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    is_active BOOLEAN DEFAULT false,
    store_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for delivery_boys
CREATE INDEX IF NOT EXISTS idx_delivery_boys_mobile ON delivery_boys(mobile);
CREATE INDEX IF NOT EXISTS idx_delivery_boys_store_id ON delivery_boys(store_id);
CREATE INDEX IF NOT EXISTS idx_delivery_boys_status ON delivery_boys(status);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
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

-- Create indexes for customers
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile);
CREATE INDEX IF NOT EXISTS idx_customers_store_id ON customers(store_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
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
    status VARCHAR(50) NOT NULL DEFAULT 'ASSIGNED' CHECK (status IN ('ASSIGNED', 'ACCEPTED', 'REJECTED', 'PICKED_UP', 'IN_TRANSIT', 'PAYMENT_COLLECTION', 'DELIVERED', 'CANCELLED')),
    payment_status VARCHAR(50) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'PARTIAL')),
    payment_mode VARCHAR(20) CHECK (payment_mode IN ('CASH', 'BANK', 'CREDIT', 'SPLIT')),
    notes TEXT,
    customer_comments TEXT,
    return_items_photo_url TEXT,
    assigned_at TIMESTAMP,
    picked_up_at TIMESTAMP,
    in_transit_at TIMESTAMP,
    payment_collection_at TIMESTAMP,
    delivered_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_boy_id ON orders(assigned_delivery_boy_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status_delivery_boy ON orders(status, assigned_delivery_boy_id, assigned_at);

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    payment_mode VARCHAR(50) NOT NULL CHECK (payment_mode IN ('CASH', 'BANK', 'CREDIT', 'SPLIT')),
    cash_amount DECIMAL(10,2) DEFAULT 0,
    bank_amount DECIMAL(10,2) DEFAULT 0,
    transaction_reference VARCHAR(255),
    receipt_photo_url TEXT,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED')),
    created_by BIGINT REFERENCES delivery_boys(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Location Updates table
CREATE TABLE IF NOT EXISTS location_updates (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recorded_by BIGINT REFERENCES delivery_boys(id) ON DELETE SET NULL,
    source VARCHAR(20) DEFAULT 'MANUAL' CHECK (source IN ('AUTO', 'MANUAL'))
);

-- Create indexes for location_updates
CREATE INDEX IF NOT EXISTS idx_location_updates_order_id ON location_updates(order_id);
CREATE INDEX IF NOT EXISTS idx_location_updates_recorded_at ON location_updates(recorded_at);

-- OTP Verifications table
CREATE TABLE IF NOT EXISTS otp_verifications (
    id BIGSERIAL PRIMARY KEY,
    mobile VARCHAR(20) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for otp_verifications
CREATE INDEX IF NOT EXISTS idx_otp_mobile ON otp_verifications(mobile);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_verifications(expires_at);

-- Refresh Tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for refresh_tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- Order Status History table (Audit Trail)
CREATE TABLE IF NOT EXISTS order_status_history (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for order_status_history
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
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

-- Function to generate order number
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
    -- Extract sequence from order_number pattern: ORD-{storeId}-{sequence}
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
