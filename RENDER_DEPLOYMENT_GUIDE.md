# SBB Medicare - Render Deployment Guide

Complete guide to deploying the SBB Medicare Order & Delivery Management System on Render.

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code should be pushed to GitHub
3. **Git Access**: Ensure your repository is accessible to Render

## Deployment Architecture

The application consists of three services on Render:

1. **PostgreSQL Database** - Managed database for data storage
2. **Backend API** - Node.js/Express web service
3. **Admin Dashboard** - Static site (React app)

## Step-by-Step Deployment

### Option 1: Deploy Using Blueprint (Recommended)

This is the fastest way to deploy all services at once.

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Go to Render Dashboard**:
   - Visit https://dashboard.render.com
   - Click "New" → "Blueprint"

3. **Connect Repository**:
   - Select your GitHub repository
   - Render will detect the `render.yaml` file

4. **Review Services**:
   - Render will show all services defined in render.yaml
   - Click "Apply" to create all services

5. **Set Environment Variables**:
   After deployment, configure these in each service:

   **Backend API** (`sbb-medicare-api`):
   - `DATABASE_URL`: (Auto-filled from database)
   - `JWT_SECRET`: (Auto-generated or set manually)
   - `ALLOWED_ORIGINS`: Your frontend URLs (e.g., `https://sbb-medicare-admin.onrender.com`)

   **Admin Dashboard** (`sbb-medicare-admin`):
   - `VITE_API_URL`: Your backend URL (e.g., `https://sbb-medicare-api.onrender.com/api`)

### Option 2: Manual Deployment (Step by Step)

#### Step 1: Create PostgreSQL Database

1. Go to Render Dashboard → "New" → "PostgreSQL"
2. Configure:
   - **Name**: `sbb-medicare-db`
   - **Database**: `sbb_medicare`
   - **User**: `sbb_medicare_user`
   - **Region**: Oregon (or your preferred region)
   - **Plan**: Starter (Free or paid as needed)
3. Click "Create Database"
4. **Important**: Save the connection details (especially the Internal Database URL)

#### Step 2: Deploy Backend API

1. Go to Render Dashboard → "New" → "Web Service"

2. **Connect Repository**:
   - Connect your GitHub repository
   - Select the repository containing your code

3. **Configure Service**:
   - **Name**: `sbb-medicare-api`
   - **Region**: Oregon (same as database)
   - **Branch**: `main` (or your deployment branch)
   - **Root Directory**: `sbb-medicare-backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Starter (Free or paid)

4. **Environment Variables** (click "Add Environment Variable"):
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=[Copy from your PostgreSQL database internal URL]
   JWT_SECRET=[Generate a secure random string - e.g., use: openssl rand -base64 32]
   JWT_EXPIRES_IN=7d
   MAX_FILE_SIZE=5242880
   UPLOAD_PATH=./uploads
   ALLOWED_ORIGINS=https://sbb-medicare-admin.onrender.com
   ```

5. **Add Persistent Disk** (for file uploads):
   - Click "Add Disk"
   - Name: `uploads`
   - Mount Path: `/opt/render/project/src/uploads`
   - Size: 1 GB

6. **Health Check Path**: `/health`

7. Click "Create Web Service"

8. **Wait for deployment** (first deploy takes 5-10 minutes)

9. **Initialize Database**:
   After the service is running, go to the service's "Shell" tab and run:
   ```bash
   npm run init-db
   ```

   Or manually connect and run the schema:
   ```bash
   psql $DATABASE_URL -f database/schema.sql
   ```

#### Step 3: Deploy Admin Dashboard

1. Go to Render Dashboard → "New" → "Static Site"

2. **Connect Repository**:
   - Select the same repository

3. **Configure Service**:
   - **Name**: `sbb-medicare-admin`
   - **Branch**: `main`
   - **Root Directory**: Leave blank (root of repo)
   - **Build Command**: `cd sbb-medicare-admin && npm install && npm run build`
   - **Publish Directory**: `sbb-medicare-admin/dist`

4. **Environment Variables**:
   ```
   VITE_API_URL=https://sbb-medicare-api.onrender.com/api
   ```

   **Important**: Replace with your actual backend API URL from Step 2

5. **Configure Redirects/Rewrites**:
   Click "Redirects/Rewrites" and add:
   - Source: `/*`
   - Destination: `/index.html`
   - Action: `Rewrite`

6. Click "Create Static Site"

7. **Wait for build** (takes 3-5 minutes)

#### Step 4: Deploy Store Dashboard (Optional)

Follow the same steps as Admin Dashboard but:
- **Name**: `sbb-medicare-store`
- **Root Directory**: Leave blank
- **Build Command**: `cd sbb-medicare-store && npm install && npm run build`
- **Publish Directory**: `sbb-medicare-store/dist`
- Same `VITE_API_URL` environment variable

## Post-Deployment Configuration

### 1. Update CORS Origins

In your Backend API service environment variables, update `ALLOWED_ORIGINS` with your actual frontend URLs:

```
ALLOWED_ORIGINS=https://sbb-medicare-admin.onrender.com,https://sbb-medicare-store.onrender.com
```

Then redeploy the backend service.

### 2. Create Admin User

The database schema automatically creates a default admin user, but you should change the password:

1. Go to your Backend API service → "Shell"
2. Connect to the database:
   ```bash
   psql $DATABASE_URL
   ```
3. Update admin password:
   ```sql
   UPDATE users
   SET password_hash = '$2a$10$YOUR_BCRYPT_HASH_HERE'
   WHERE email = 'admin@sbbmedicare.com';
   ```

Or create a new admin via the API:
```bash
curl -X POST https://sbb-medicare-api.onrender.com/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "newadmin@sbbmedicare.com",
    "password": "securepassword123",
    "full_name": "Admin User",
    "mobile_number": "+1234567890",
    "role": "admin"
  }'
```

### 3. Test the Deployment

1. **Test Backend Health**:
   ```bash
   curl https://sbb-medicare-api.onrender.com/health
   ```

   Should return:
   ```json
   {
     "status": "OK",
     "timestamp": "2024-11-07T...",
     "uptime": 123.45,
     "environment": "production"
   }
   ```

2. **Test Admin Login**:
   - Visit: `https://sbb-medicare-admin.onrender.com`
   - Login with: `admin@sbbmedicare.com` / `admin123`
   - Change password immediately!

3. **Test API Endpoints**:
   ```bash
   # Login
   curl -X POST https://sbb-medicare-api.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@sbbmedicare.com","password":"admin123"}'
   ```

## Service URLs

After deployment, your services will be available at:

- **Backend API**: `https://sbb-medicare-api.onrender.com`
- **Admin Dashboard**: `https://sbb-medicare-admin.onrender.com`
- **Store Dashboard**: `https://sbb-medicare-store.onrender.com`
- **Database**: Internal URL only (not publicly accessible)

## Custom Domains (Optional)

To use your own domain:

1. Go to service → "Settings" → "Custom Domain"
2. Add your domain (e.g., `api.sbbmedicare.com`)
3. Update DNS records as instructed by Render
4. Update environment variables with new URLs

## Monitoring & Logs

### View Logs

1. Go to your service in Render dashboard
2. Click "Logs" tab
3. View real-time logs or historical logs

### Metrics

1. Go to service → "Metrics"
2. Monitor:
   - CPU usage
   - Memory usage
   - Request rate
   - Response time

### Alerts

Set up email alerts for:
- Service failures
- High memory usage
- Deploy failures

## Database Management

### Backup Database

Render automatically backs up PostgreSQL databases, but you can create manual backups:

1. Go to database → "Backups"
2. Click "Create Backup"

### Connect to Database

```bash
# From your local machine
psql postgresql://user:password@host:port/database

# Or use Render's web shell
# Go to database → "Shell"
```

### Run Migrations

When you update the database schema:

1. Update `database/schema.sql`
2. Go to Backend service → "Shell"
3. Run:
   ```bash
   psql $DATABASE_URL -f database/schema.sql
   ```

## Scaling & Performance

### Free Tier Limitations

Render's free tier includes:
- Services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- 750 hours/month of runtime per service

### Upgrade for Production

For production use, upgrade to paid plans:

1. **Backend API**: Starter ($7/month) or higher
   - No sleep
   - Better performance
   - More resources

2. **Database**: Starter ($7/month) or higher
   - Better performance
   - More storage
   - Daily backups

### Auto-Scaling

Paid plans support:
- Horizontal scaling (multiple instances)
- Vertical scaling (more CPU/RAM)

## Troubleshooting

### Build Failures

**Issue**: Build fails with "Module not found"
**Solution**:
- Check `package.json` dependencies
- Clear build cache in Render dashboard
- Redeploy

**Issue**: Build timeout
**Solution**:
- Optimize `node_modules` size
- Use `npm ci` instead of `npm install`

### Runtime Errors

**Issue**: "Database connection failed"
**Solution**:
- Check `DATABASE_URL` environment variable
- Ensure database service is running
- Check database region matches backend region

**Issue**: "CORS error" in browser
**Solution**:
- Update `ALLOWED_ORIGINS` in backend
- Include full frontend URLs (with https://)
- Redeploy backend after changes

**Issue**: Service won't start
**Solution**:
- Check logs for errors
- Verify `PORT` environment variable
- Ensure start command is correct

### Performance Issues

**Issue**: Slow API responses
**Solution**:
- Check database query performance
- Add database indexes
- Upgrade to paid plan
- Enable caching

**Issue**: Frontend loads slowly
**Solution**:
- Check bundle size
- Enable compression
- Use CDN for static assets
- Optimize images

## CI/CD with GitHub

Render automatically deploys when you push to GitHub:

1. Push to `main` branch
2. Render detects changes
3. Automatically builds and deploys
4. Runs health checks
5. Switches to new version if successful

### Disable Auto-Deploy

In service settings → "Auto-Deploy":
- Turn off for manual control
- Deploy manually when ready

## Security Best Practices

1. **Environment Variables**:
   - Use strong, random JWT_SECRET
   - Never commit secrets to Git
   - Rotate secrets periodically

2. **Database**:
   - Use internal database URL (not public)
   - Enable SSL for connections
   - Regular backups

3. **API**:
   - Enable rate limiting
   - Use HTTPS only
   - Validate all inputs

4. **Admin Access**:
   - Change default admin password
   - Use strong passwords
   - Enable 2FA on Render account

## Cost Estimation

### Free Tier (Development/Testing)

- PostgreSQL: $0 (limited to 90 days)
- Backend API: $0 (with limitations)
- Admin Dashboard: $0
- **Total**: $0/month

### Production (Recommended)

- PostgreSQL Starter: $7/month
- Backend API Starter: $7/month
- Admin Dashboard: $0 (static sites are free)
- Store Dashboard: $0
- **Total**: ~$14/month

### Enterprise (High Traffic)

- PostgreSQL Standard: $50/month
- Backend API Pro: $85/month
- CDN & add-ons: ~$20/month
- **Total**: ~$155/month

## Support

### Render Documentation
- https://render.com/docs

### Render Status
- https://status.render.com

### Community
- Render Community: https://community.render.com

### SBB Medicare Issues
- Check logs in Render dashboard
- Review application README files
- Test locally before deploying

## Maintenance Schedule

### Weekly
- Check logs for errors
- Monitor resource usage
- Review security alerts

### Monthly
- Update dependencies
- Review database performance
- Check backup status
- Rotate secrets if needed

### Quarterly
- Review and optimize database
- Update Node.js version
- Security audit

## Rollback Procedure

If a deployment fails:

1. Go to service → "Events"
2. Find previous successful deploy
3. Click "Rollback to this version"
4. Service restarts with previous version

## Next Steps After Deployment

1. ✅ Test all functionality
2. ✅ Change default admin password
3. ✅ Create store staff accounts
4. ✅ Add initial customers and orders
5. ✅ Train staff on using the system
6. ✅ Set up monitoring alerts
7. ✅ Document any custom configurations
8. ✅ Plan for mobile app deployment

## Mobile App Deployment (Future)

For the React Native mobile app:

1. **Expo EAS**: Deploy to App Store and Google Play
2. **Update API URL**: Point to production backend
3. **Enable Push Notifications**: Configure FCM/APNs
4. **Test on Real Devices**: Before releasing

---

**Congratulations! Your SBB Medicare application is now live on Render!**

For support, check the logs, documentation, or contact your development team.
