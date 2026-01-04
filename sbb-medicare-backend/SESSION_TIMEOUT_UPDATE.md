# Session Timeout Update

## Changes Made

Session timeout (access token expiry) has been increased from **15 minutes** to **30 minutes**.

## Updated Files

1. **`src/services/authService.js`**
   - Changed default from `'15m'` to `'30m'`
   - Still reads from environment variable `JWT_ACCESS_TOKEN_EXPIRY`

2. **`scripts/setup-env.js`**
   - Updated example `.env` file to show `30m`

3. **`QUICKSTART.md`**
   - Updated documentation to reflect `30m`

## Configuration

### Environment Variable
```env
JWT_ACCESS_TOKEN_EXPIRY=30m
```

### Current Settings
- **Access Token Expiry**: 30 minutes (default)
- **Refresh Token Expiry**: 7 days (unchanged)
- **OTP Expiry**: 10 minutes (unchanged)

## For Production (Render.com)

If you're using Render.com, update the environment variable:

1. Go to Render Dashboard
2. Select your service
3. Go to **Environment** tab
4. Add/Update: `JWT_ACCESS_TOKEN_EXPIRY=30m`
5. Redeploy

## Verification

After deployment, users will have **30 minutes** of active session time before needing to refresh their token.

## Token Refresh

Users can still use the refresh token endpoint to get a new access token:
```
POST /api/auth/refresh
```

Refresh tokens remain valid for **7 days**.

