-- Run this in psql to verify the refresh_tokens table exists
-- Command: psql -U postgres -d sbb_medicare -f scripts/verify-refresh-tokens.sql

-- Show current database and schema
SELECT current_database() as current_database, current_schema() as current_schema;

-- Check if refresh_tokens table exists in current schema
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = current_schema()
            AND table_name = 'refresh_tokens'
        ) 
        THEN '✓ refresh_tokens table EXISTS' 
        ELSE '✗ refresh_tokens table DOES NOT EXIST' 
    END as table_status;

-- List all tables in current schema
SELECT 
    'Available tables in schema ' || current_schema() || ':' as info;
    
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = current_schema()
ORDER BY table_name;

-- If table exists, show its structure
\echo ''
\echo 'If refresh_tokens exists, showing structure:'
\d refresh_tokens

-- Check search_path (important for finding tables)
SHOW search_path;





