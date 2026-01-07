# Fix: refresh_tokens table still not found after creation

## Most Common Issues

### Issue 1: Server needs restart ⚠️ MOST LIKELY
The connection pool might have cached connections from before the table was created.

**Solution:**
1. **Stop your server** (Ctrl+C in the terminal where it's running)
2. **Restart the server:**
   ```bash
   npm run dev
   ```
   or
   ```bash
   npm start
   ```

### Issue 2: Table created in wrong database
The table might have been created in a different database than the one your server connects to.

**Solution - Verify in psql:**
```bash
psql -U postgres -d sbb_medicare
```

Then run:
```sql
-- Check current database
SELECT current_database();

-- Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'refresh_tokens'
) as table_exists;

-- List all tables
\dt
```

If the table doesn't exist, create it:
```sql
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
```

### Issue 3: Schema mismatch
The table might be in a different schema.

**Solution:**
```sql
-- Check search path
SHOW search_path;

-- List tables in all schemas
SELECT schemaname, tablename 
FROM pg_tables 
WHERE tablename = 'refresh_tokens';

-- If table is in different schema, either:
-- Option A: Move to public schema
ALTER TABLE other_schema.refresh_tokens SET SCHEMA public;

-- Option B: Update search_path in .env or database config
```

### Issue 4: Multiple databases
You might have created the table in a different database.

**Solution:**
```sql
-- In psql, connect to the correct database
\c sbb_medicare

-- Then verify table exists
\dt refresh_tokens
```

## Quick Diagnostic Steps

1. **Check which database your server uses:**
   - Look at your `.env` file: `DATABASE_URL=postgresql://.../DATABASE_NAME`
   - Make sure the table was created in that exact database

2. **Verify table exists:**
   ```bash
   psql -U postgres -d sbb_medicare -c "\dt refresh_tokens"
   ```

3. **Restart server** (this fixes connection pooling issues)

4. **Test the API endpoint again**

## Still Not Working?

If restarting doesn't help, the table is likely in a different database. Check:
- Your `.env` file DATABASE_URL
- Which database you connected to in psql when you created the table
- Make sure they match!







