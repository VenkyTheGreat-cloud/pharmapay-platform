-- CORRECT SQL for creating refresh_tokens table
-- users.id is BIGSERIAL (BIGINT), not UUID!

-- First, drop the incorrectly created table (if it exists)
DROP TABLE IF EXISTS refresh_tokens CASCADE;

-- Create the table with correct data types
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- Verify the table was created
SELECT 'refresh_tokens table created successfully!' AS status;









