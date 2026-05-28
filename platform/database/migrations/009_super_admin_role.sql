-- Migration 009: Add super_admin role to users table
-- This allows the SwinkPay platform admin to have a distinct role

-- Update the CHECK constraint to include super_admin
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'store_manager', 'super_admin'));

-- Update the SwinkPay admin account to super_admin role
UPDATE users SET role = 'super_admin' WHERE email = 'admin@swinkpay-fintech.com';
