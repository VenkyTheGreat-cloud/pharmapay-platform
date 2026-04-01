-- Add engagement columns to delivery_boy_pharmacies
ALTER TABLE delivery_boy_pharmacies ADD COLUMN IF NOT EXISTS rate_per_km DECIMAL(6,2);
ALTER TABLE delivery_boy_pharmacies ADD COLUMN IF NOT EXISTS base_rate DECIMAL(6,2);
ALTER TABLE delivery_boy_pharmacies ADD COLUMN IF NOT EXISTS contract_period VARCHAR(10);
ALTER TABLE delivery_boy_pharmacies ADD COLUMN IF NOT EXISTS contract_start DATE;
ALTER TABLE delivery_boy_pharmacies ADD COLUMN IF NOT EXISTS contract_end DATE;
ALTER TABLE delivery_boy_pharmacies ADD COLUMN IF NOT EXISTS f2f_completed BOOLEAN DEFAULT false;
ALTER TABLE delivery_boy_pharmacies ADD COLUMN IF NOT EXISTS f2f_completed_at TIMESTAMP;
ALTER TABLE delivery_boy_pharmacies ADD COLUMN IF NOT EXISTS terms_notes TEXT;
ALTER TABLE delivery_boy_pharmacies ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE delivery_boy_pharmacies ADD COLUMN IF NOT EXISTS engagement_status VARCHAR(20) DEFAULT 'active';
