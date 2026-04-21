-- Inbound captures from store phones (calls + WhatsApp messages)
CREATE TABLE IF NOT EXISTS inbound_captures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES users(id),
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('voice', 'whatsapp')),
    caller_number VARCHAR(15),
    sender_name VARCHAR(100),
    message_text TEXT,
    audio_path VARCHAR(500),
    audio_duration_seconds INTEGER,
    transcript TEXT,
    extracted_data JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inbound_captures_store ON inbound_captures(store_id);
CREATE INDEX IF NOT EXISTS idx_inbound_captures_status ON inbound_captures(status);
CREATE INDEX IF NOT EXISTS idx_inbound_captures_created ON inbound_captures(created_at DESC);
