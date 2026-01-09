-- Set database timezone to IST (Indian Standard Time)
-- This ensures all CURRENT_TIMESTAMP and date operations use IST

-- Set timezone for current session
SET timezone = 'Asia/Kolkata';

-- Set timezone for database (persistent)
ALTER DATABASE current_database() SET timezone = 'Asia/Kolkata';

-- Verify timezone setting
SHOW timezone;

-- Note: The application will also set timezone on each connection
-- This SQL ensures the database default is IST

