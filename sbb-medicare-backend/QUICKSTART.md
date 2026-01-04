# Quick Start Guide - SBB Medicare Backend

## Prerequisites

1. **Node.js** (v14 or higher) - ✅ Installed (v24.11.1)
2. **PostgreSQL** (v12 or higher) - Install if not already installed
3. **npm** - Comes with Node.js

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/sbb_medicare
JWT_SECRET=changeme-in-production-use-strong-secret-key-minimum-256-bits
JWT_ACCESS_TOKEN_EXPIRY=30m
JWT_REFRESH_TOKEN_EXPIRY=7d
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

**Important**: Replace `your_password` with your PostgreSQL password.

### 3. Create PostgreSQL Database

**Option A: Using psql command line**
```bash
psql -U postgres
CREATE DATABASE sbb_medicare;
\q
```

**Option B: Using createdb command**
```bash
createdb -U postgres sbb_medicare
```

### 4. Test Database Connection

```bash
node scripts/test-db-connection.js
```

If successful, you'll see:
```
✓ Database connection successful!
```

### 5. Initialize Database Schema

```bash
npm run init-db
```

This will create all tables, indexes, and functions.

### 6. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

### 7. Test the API

**Health Check:**
```bash
curl http://localhost:5000/health
```

**Get Config:**
```bash
curl http://localhost:5000/api/config
```

## Creating a Default Admin User

After initializing the database, you can create an admin user using psql:

```sql
psql -U postgres -d sbb_medicare

-- Hash password: "admin123" (change this!)
-- You can generate a hash using: node -e "const bcrypt=require('bcryptjs');bcrypt.hash('admin123',10).then(h=>console.log(h))"

INSERT INTO users (name, mobile, email, password_hash, role, is_active)
VALUES (
    'Admin User',
    '9876543210',
    'admin@sbbmedicare.com',
    '$2a$10$YourHashedPasswordHere',  -- Replace with actual hash
    'admin',
    true
);
```

Or use Node.js to create admin:

```javascript
// create-admin.js
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function createAdmin() {
    const password = 'admin123'; // Change this!
    const hash = await bcrypt.hash(password, 10);
    
    await pool.query(
        `INSERT INTO users (name, mobile, email, password_hash, role, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['Admin User', '9876543210', 'admin@sbbmedicare.com', hash, 'admin', true]
    );
    
    console.log('Admin user created!');
    console.log('Email: admin@sbbmedicare.com');
    console.log('Password: admin123');
    pool.end();
}

createAdmin();
```

Run: `node create-admin.js`

## API Testing Examples

### 1. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "mobileEmail": "admin@sbbmedicare.com",
    "password": "admin123"
  }'
```

### 2. Get Profile (with token)

```bash
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Create Customer

```bash
curl -X POST http://localhost:5000/api/customers \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Customer",
    "mobile": "9876543210",
    "address": "123 Main St",
    "landmark": "Near Park"
  }'
```

## Troubleshooting

### Database Connection Error

1. Check PostgreSQL is running:
   ```bash
   # Windows
   Get-Service postgresql*
   
   # Linux/Mac
   sudo systemctl status postgresql
   ```

2. Verify DATABASE_URL in `.env` file

3. Test connection: `node scripts/test-db-connection.js`

### Port Already in Use

Change PORT in `.env` file or kill the process using port 5000:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill
```

### Module Not Found

Run `npm install` again to ensure all dependencies are installed.

## Next Steps

1. Implement remaining controllers (Customer, Payment, DeliveryBoy, AccessControl)
2. Add file upload functionality for receipts
3. Implement SMS service for OTP
4. Add rate limiting
5. Set up logging
6. Add unit tests

## Project Structure

```
sbb-medicare-backend/
├── src/
│   ├── config/          # Database, logger config
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth, error handling
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── utils/           # Utilities
├── database/
│   └── schema.sql       # Database schema
├── scripts/
│   ├── init-database.js # Initialize DB
│   └── test-db-connection.js # Test DB
└── .env                 # Environment variables
```

## Support

For issues or questions, check the main README.md file.

