# Fix: refresh_tokens table missing

## Problem
You're getting the error: `relation "refresh_tokens" does not exist`

This means the database tables haven't been fully initialized.

## Solutions (Choose ONE)

### Option 1: Run SQL directly via psql (EASIEST)

1. Open PowerShell or Command Prompt
2. Connect to your database:
   ```bash
   psql -U postgres -d sbb_medicare
   ```
   (If your database has a different name, replace `sbb_medicare`)

3. Run this SQL:
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

4. Type `\q` to exit

### Option 2: Run full database initialization

1. Make sure your `.env` file has the correct `DATABASE_URL`:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/sbb_medicare
   ```

2. Run the initialization:
   ```bash
   npm run init-db
   ```

   This will create ALL tables including `refresh_tokens`.

### Option 3: Use SQL file

1. Connect to database:
   ```bash
   psql -U postgres -d sbb_medicare -f scripts/create-missing-tables.sql
   ```

## Verify Fix

After creating the table, restart your server and test the API endpoint that was failing. The error should be gone!

## Still having issues?

Make sure:
- PostgreSQL is running
- Database `sbb_medicare` exists
- User has proper permissions
- `.env` file has correct `DATABASE_URL` when using npm scripts









