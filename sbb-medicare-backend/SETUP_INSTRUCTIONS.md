# Database Setup Instructions

## Current Issue
The database connection is failing because the PostgreSQL password in `.env` file needs to be updated.

## Steps to Fix

### 1. Update .env File

Open the `.env` file in the project root and update the `DATABASE_URL` with your actual PostgreSQL credentials:

```env
DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/sbb_medicare
```

Replace `YOUR_ACTUAL_PASSWORD` with your PostgreSQL password.

### 2. Create Database (if it doesn't exist)

**Option A: Using psql**
```bash
psql -U postgres
CREATE DATABASE sbb_medicare;
\q
```

**Option B: Using createdb**
```bash
createdb -U postgres sbb_medicare
```

### 3. Initialize Database Schema

After updating the `.env` file, run:
```bash
npm run init-db
```

### 4. Test Database Connection

```bash
node scripts/test-db-connection.js
```

### 5. Start the Server

```bash
npm run dev
```

## Alternative: Use Different PostgreSQL User

If you want to use a different PostgreSQL user, update the DATABASE_URL:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/sbb_medicare
```

## Troubleshooting

### PostgreSQL Not Running
- **Windows**: Check Services (services.msc) for PostgreSQL service
- **Linux/Mac**: `sudo systemctl status postgresql`

### Forgot PostgreSQL Password
- **Windows**: Reset password in pgAdmin or reinstall PostgreSQL
- **Linux**: Use `sudo -u postgres psql` to access without password

### Connection Refused
- Check if PostgreSQL is listening on port 5432
- Verify firewall settings
- Check PostgreSQL configuration files (postgresql.conf, pg_hba.conf)

