# Session Management Configuration

## Overview

The application now supports configurable session management with:
- **Idle Timeout**: 30-60 minutes (no user activity)
- **Token Expiration**: 24 hours (absolute)
- **Warning**: 2-3 minutes before timeout

## Backend Configuration

### Environment Variables

```env
# JWT Token Configuration
JWT_ACCESS_TOKEN_EXPIRY=24h    # Access token expires in 24 hours
JWT_REFRESH_TOKEN_EXPIRY=30d    # Refresh token expires in 30 days
JWT_SECRET=your-secret-key-here
```

### Current Settings

- **Access Token Expiry**: 24 hours (default)
- **Refresh Token Expiry**: 30 days (unchanged)
- **Idle Timeout**: Handled by frontend (30-60 minutes configurable)

## Frontend Implementation

See `FRONTEND_SESSION_MANAGEMENT.md` for complete implementation guide.

### Quick Setup

1. Copy the `SessionManager` utility from the guide
2. Initialize it in your main app component after login
3. Add the `SessionWarningModal` component
4. Configure timeouts as needed (30-60 minutes for idle)

### Configuration Example

```javascript
const manager = new SessionManager({
    idleTimeout: 45 * 60 * 1000,      // 45 minutes (between 30-60)
    tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours (fixed)
    warningTime: 2.5 * 60 * 1000,     // 2.5 minutes before timeout
});
```

## Production Deployment

### For Render.com

1. Go to Render Dashboard
2. Select your service
3. Go to **Environment** tab
4. Add/Update:
   ```
   JWT_ACCESS_TOKEN_EXPIRY=24h
   ```
5. Redeploy

### For Other Platforms

Set the environment variable `JWT_ACCESS_TOKEN_EXPIRY=24h` in your deployment configuration.

## Testing

### Test Idle Timeout
1. Login to the app
2. Wait without activity
3. Warning should appear 2-3 minutes before timeout
4. User should be logged out after timeout

### Test Token Expiry
1. Login to the app
2. Wait 24 hours (or modify for testing)
3. Warning should appear before expiry
4. User should be logged out after expiry

## Notes

- Idle timeout resets on any user activity
- Token expiry is absolute (24 hours from login)
- Warning appears 2-3 minutes before timeout
- User can extend session by clicking "Stay Logged In"
- Token can be refreshed using `/api/auth/refresh` endpoint
