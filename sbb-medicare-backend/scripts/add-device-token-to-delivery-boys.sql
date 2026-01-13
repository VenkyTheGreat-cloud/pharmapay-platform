-- Add device_token column to delivery_boys table for push notifications
ALTER TABLE delivery_boys 
ADD COLUMN IF NOT EXISTS device_token VARCHAR(500);

CREATE INDEX IF NOT EXISTS idx_delivery_boys_device_token ON delivery_boys(device_token) WHERE device_token IS NOT NULL;
