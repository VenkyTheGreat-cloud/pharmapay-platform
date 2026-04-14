-- Link orders to their source capture (voice call or WhatsApp message)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source_capture_id UUID REFERENCES inbound_captures(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_source_capture ON orders(source_capture_id) WHERE source_capture_id IS NOT NULL;

-- Add 'converted' and 'dismissed' statuses to inbound_captures
ALTER TABLE inbound_captures DROP CONSTRAINT IF EXISTS inbound_captures_status_check;
ALTER TABLE inbound_captures ADD CONSTRAINT inbound_captures_status_check
  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'converted', 'dismissed'));
