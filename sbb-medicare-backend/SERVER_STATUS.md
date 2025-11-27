# Server Status and Troubleshooting

## ✅ Server is Running

The SBB Medicare Backend server should now be running on **http://localhost:5000**

## Quick Test

Open your browser or use curl to test:

```bash
# Health check
curl http://localhost:5000/health

# Config endpoint  
curl http://localhost:5000/api/config
```

## If Server is Not Working

### 1. Check if Server is Running
```powershell
netstat -ano | findstr :5000
```

### 2. Start the Server
```powershell
cd "d:\SwinkPay-Workspace\SBB\SBB-Niranjan-Branch\sbb-medicare\sbb-medicare-backend"
node src/server.js
```

Or use the startup script:
```powershell
.\start-server.ps1
```

### 3. Check for Errors
- Make sure all dependencies are installed: `npm install`
- Check if .env file exists and has correct configuration
- Verify PostgreSQL is running (if using database features)

### 4. Common Issues

**Port Already in Use:**
```powershell
# Find and kill process on port 5000
Get-NetTCPConnection -LocalPort 5000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

**Database Connection Errors:**
- Update DATABASE_URL in .env file with correct PostgreSQL password
- Make sure PostgreSQL is running
- Create database: `createdb -U postgres sbb_medicare`
- Initialize schema: `npm run init-db`

## Available Endpoints

- `GET /health` - Health check (works without database)
- `GET /api/config` - Get app config (works without database)
- `POST /api/auth/login` - Login (requires database)
- `GET /api/orders` - Get orders (requires database and authentication)

## Development Mode

For auto-reload on file changes:
```bash
npm run dev
```

This uses nodemon to automatically restart the server when files change.

