# How to Restart the Server

## Quick Steps

### If Server is Running in Terminal:

1. **Stop the server**: Press `Ctrl + C` in the terminal where the server is running
2. **Start the server again**: Run one of these commands:

```bash
# For production
npm start

# OR for development (with auto-reload)
npm run dev
```

---

## Detailed Instructions

### Method 1: Using Terminal (Recommended)

#### Step 1: Stop Current Server
If the server is running in a terminal window:
- Press `Ctrl + C` to stop it
- Wait for the process to stop (you'll see the command prompt return)

#### Step 2: Start Server Again
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

---

### Method 2: Kill Process and Restart

#### If Server is Running in Background:

**Windows PowerShell:**
```powershell
# Find Node.js processes
Get-Process -Name node

# Kill all Node.js processes (if needed)
Stop-Process -Name node -Force

# Then start server
npm start
```

**Windows Command Prompt:**
```cmd
# Find Node.js processes
tasklist | findstr node

# Kill Node.js process (replace PID with actual process ID)
taskkill /PID <process_id> /F

# Then start server
npm start
```

---

### Method 3: Using Task Manager

1. Open **Task Manager** (Press `Ctrl + Shift + Esc`)
2. Find `node.exe` or `Node.js` process
3. Right-click → **End Task**
4. Go back to terminal and run `npm start`

---

## For Production Server (Render/Heroku/etc.)

If your server is deployed on a cloud platform:

### Render.com:
- Go to your dashboard
- Click on your service
- Click **Manual Deploy** → **Deploy latest commit**
- OR the server auto-restarts on code push

### Heroku:
```bash
# Restart via CLI
heroku restart

# OR push new code (auto-restarts)
git push heroku main
```

---

## Verify Server Restarted

After restarting, check the logs. You should see:

```
✅ Firebase initialized from file: src/config/firebase-service-account.json
✅ Firebase Admin SDK initialized successfully
✅ SBB Medicare API server running on port 5000
```

---

## Common Issues

### Port Already in Use
If you get "port already in use" error:

**Windows:**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID)
taskkill /PID <process_id> /F
```

**Then restart:**
```bash
npm start
```

### Server Won't Stop
If `Ctrl + C` doesn't work:
1. Close the terminal window
2. Open a new terminal
3. Kill the process (Method 2 above)
4. Start server again

---

## Quick Commands Reference

```bash
# Start server (production)
npm start

# Start server (development with auto-reload)
npm run dev

# Stop server
Ctrl + C

# Check if server is running
# Open browser: http://localhost:5000
# Or check terminal for "server running" message
```

---

## After Restart

1. ✅ Verify server is running (check terminal output)
2. ✅ Test the device token API again
3. ✅ Check server logs for any errors

---

## Need Help?

If server won't restart:
1. Check if port is already in use
2. Kill all Node.js processes
3. Try starting again
4. Check for error messages in terminal
