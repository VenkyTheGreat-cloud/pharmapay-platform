-- Migration: Add payment columns to pharmacies table
-- SwinkPay payment integration for setup fees

ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS app_name VARCHAR(255);
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) CHECK (payment_status IN ('pending', 'paid', 'failed'));
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS payment_invoice VARCHAR(255);
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2);
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP;
