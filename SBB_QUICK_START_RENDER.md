# Quick Start: Deploy to Render in 5 Minutes

The fastest way to get SBB Medicare running on Render.

## Prerequisites
- [ ] Render account (sign up at render.com)
- [ ] This code pushed to GitHub
- [ ] 5 minutes of your time

## Option A: One-Click Blueprint Deploy (Fastest)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Deploy to Render"
git push origin main
```

### Step 2: Deploy from Blueprint
1. Go to https://dashboard.render.com
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will detect `render.yaml`
5. Click **"Apply"**

### Step 3: Configure Environment Variables

**For Backend API** (`sbb-medicare-api`):
1. Go to the backend service
2. Click "Environment"
3. Update `ALLOWED_ORIGINS`:
   ```
   https://YOUR-ADMIN-DASHBOARD.onrender.com
   ```
   (Replace with your actual admin dashboard URL)

**For Admin Dashboard** (`sbb-medicare-admin`):
1. Go to the admin dashboard service
2. Click "Environment"
3. Set `VITE_API_URL`:
   ```
   https://YOUR-BACKEND-API.onrender.com/api
   ```
   (Replace with your actual backend URL)

### Step 4: Initialize Database
1. Wait for backend to deploy (check "Events" tab)
2. Go to backend service → "Shell"
3. Run:
   ```bash
   npm run init-db
   ```

### Step 5: Test It!
Visit your admin dashboard URL:
```
https://sbb-medicare-admin.onrender.com
```

Login with:
- Email: `admin@sbbmedicare.com`
- Password: `admin123`

**⚠️ CHANGE THE PASSWORD IMMEDIATELY!**

---

## Option B: Manual Deploy (More Control)

### 1. Create PostgreSQL Database
1. Render Dashboard → "New" → "PostgreSQL"
2. Name: `sbb-medicare-db`
3. Plan: Starter (Free for 90 days)
4. Click "Create"
5. **Save the Internal Database URL**

### 2. Deploy Backend
1. "New" → "Web Service"
2. Connect repository
3. Settings:
   - Name: `sbb-medicare-api`
   - Root Directory: `sbb-medicare-backend`
   - Build: `npm install`
   - Start: `npm start`
4. Environment Variables:
   ```
   NODE_ENV=production
   DATABASE_URL=[paste Internal Database URL]
   JWT_SECRET=[generate random string]
   ALLOWED_ORIGINS=[your frontend URLs]
   ```
5. Create & Wait for deploy

### 3. Initialize Database
Go to service → Shell:
```bash
npm run init-db
```

### 4. Deploy Admin Dashboard
1. "New" → "Static Site"
2. Connect repository
3. Settings:
   - Name: `sbb-medicare-admin`
   - Build: `cd sbb-medicare-admin && npm install && npm run build`
   - Publish: `sbb-medicare-admin/dist`
4. Environment:
   ```
   VITE_API_URL=https://YOUR-BACKEND.onrender.com/api
   ```
5. Redirects: `/*` → `/index.html` (Rewrite)
6. Create

### 5. Done!
Visit your admin dashboard and login!

---

## Common Issues

### "Cannot connect to database"
- Check DATABASE_URL has the Internal URL (not External)
- Ensure backend and database are in same region

### "CORS error"
- Update ALLOWED_ORIGINS in backend
- Include full URLs with `https://`
- Redeploy backend

### "Build failed"
- Check logs for specific error
- Clear build cache and retry
- Ensure all dependencies are in package.json

### "Service won't start"
- Check that PORT is not hardcoded
- Verify start command is correct
- Review logs for errors

---

## Your Service URLs

After deployment, you'll have:

| Service | URL | Purpose |
|---------|-----|---------|
| Backend API | `https://sbb-medicare-api.onrender.com` | API endpoints |
| Admin Dashboard | `https://sbb-medicare-admin.onrender.com` | Admin interface |
| Database | Internal only | PostgreSQL |

---

## Next Steps

- [ ] Change default admin password
- [ ] Create store staff accounts
- [ ] Add test customers
- [ ] Create test orders
- [ ] Test the delivery workflow
- [ ] Set up monitoring alerts
- [ ] Deploy Store Dashboard (optional)
- [ ] Build Mobile App (future)

---

## Free Tier Notes

Render's free tier:
- Services sleep after 15 minutes of inactivity
- Wake up takes ~30 seconds on first request
- Database free for 90 days, then $7/month

For production, upgrade to Starter plans ($7/month per service).

---

## Need Help?

1. Check logs in Render dashboard
2. Review [Full Deployment Guide](RENDER_DEPLOYMENT_GUIDE.md)
3. Check [Project Summary](SBB_MEDICARE_PROJECT_SUMMARY.md)
4. Visit https://render.com/docs

---

**That's it! Your SBB Medicare app is now live!** 🎉
