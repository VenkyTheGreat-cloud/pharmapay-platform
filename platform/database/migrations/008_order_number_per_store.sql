-- Migration 008: Make order_number unique per store instead of globally unique
-- This fixes the bug where a new pharmacy's first order fails with "order number already exists"

-- Drop the global unique constraint on order_number
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_number_key;

-- Add a composite unique constraint: order_number + store_id
ALTER TABLE orders ADD CONSTRAINT orders_order_number_store_unique UNIQUE (order_number, store_id);
