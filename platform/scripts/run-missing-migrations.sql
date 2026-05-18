-- Consolidated migration script for missing tables/columns
-- Safe to run multiple times (uses IF NOT EXISTS / IF EXISTS checks)
-- Run this if you see errors like:
--   "column db.device_token does not exist"
--   "relation customer_registry does not exist"

-- ============================================
-- 1. Add device_token to delivery_boys table
-- ============================================
ALTER TABLE delivery_boys
ADD COLUMN IF NOT EXISTS device_token VARCHAR(500);

CREATE INDEX IF NOT EXISTS idx_delivery_boys_device_token
ON delivery_boys(device_token) WHERE device_token IS NOT NULL;

-- ============================================
-- 2. Create customer_registry table
-- ============================================
CREATE TABLE IF NOT EXISTS customer_registry (
    id SERIAL PRIMARY KEY,
    mobile VARCHAR(20) NOT NULL,
    name VARCHAR(255),
    registry_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    store_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customer_registry_mobile ON customer_registry(mobile);
CREATE INDEX IF NOT EXISTS idx_customer_registry_date ON customer_registry(registry_date);
CREATE INDEX IF NOT EXISTS idx_customer_registry_store_id ON customer_registry(store_id);

-- Add store_id if table existed but column was missing
ALTER TABLE customer_registry
ADD COLUMN IF NOT EXISTS store_id UUID;

-- ============================================
-- Verification: list columns to confirm
-- ============================================
SELECT 'delivery_boys.device_token' AS check_item,
       EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='delivery_boys' AND column_name='device_token') AS exists;

SELECT 'customer_registry table' AS check_item,
       EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_name='customer_registry') AS exists;
