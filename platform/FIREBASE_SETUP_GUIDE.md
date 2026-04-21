# Firebase Cloud Messaging (FCM) Setup Guide

## Step 1: Download Service Account JSON File

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click on the **Settings (gear icon)** → **Project settings**
4. Go to the **Service accounts** tab
5. Click **Generate new private key**
6. Download the JSON file (e.g., `pharmapay-firebase-adminsdk-xxxxx.json`)

## Step 2: Place the JSON File

### Option A: Recommended Location (Project Root)
Place the file in the `config/` directory at the project root:

```
platform/
├── config/
│   └── firebase-service-account.json  ← Place your file here
├── src/
└── ...
```

**File Path**: `config/firebase-service-account.json`

### Option B: Alternative Location
You can place it anywhere and set the path via environment variable:

```bash
# In .env file
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/your/firebase-service-account.json
```

### Option C: For Cloud Deployments (Recommended for Production)
Instead of storing the file, you can set the JSON content as an environment variable:

```bash
# In .env file or cloud platform environment variables
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
```

## Step 3: Install Firebase Admin SDK

```bash
npm install firebase-admin
```

## Step 4: Verify Setup

The Firebase initialization happens automatically when the server starts. Check the logs:

```
Firebase initialized from file: config/firebase-service-account.json
Firebase Admin SDK initialized successfully
```

If you see:
```
Firebase service account file not found at: config/firebase-service-account.json
Push notifications will be logged only.
```

This means the file is not found. Check:
1. File path is correct
2. File name matches exactly
3. File has proper JSON format

## Step 5: Test Push Notifications

1. **Register a device token** (from mobile app):
   ```bash
   PUT /api/delivery-boys/device-token
   Authorization: Bearer <delivery_boy_token>
   {
     "device_token": "fcm_token_from_mobile_app"
   }
   ```

2. **Create an order** - This will trigger push notifications to all delivery boys under the admin.

3. **Check server logs** for notification status:
   ```
   Push notification sent successfully
   ```

## File Structure

```
platform/
├── config/
│   └── firebase-service-account.json  ← Your FCM credentials (DO NOT COMMIT)
├── src/
│   ├── config/
│   │   └── firebase.js               ← Firebase initialization
│   └── services/
│       └── pushNotificationService.js ← Push notification service
├── .gitignore                        ← Excludes Firebase JSON file
└── ...
```

## Security Notes

⚠️ **IMPORTANT**: 
- The Firebase service account JSON file contains sensitive credentials
- **DO NOT commit it to Git** (already added to `.gitignore`)
- For production, use environment variables instead of files
- Keep the file secure and limit access

## Troubleshooting

### Error: "Firebase service account file not found"
- Check file path in `config/firebase-service-account.json`
- Or set `FIREBASE_SERVICE_ACCOUNT_PATH` environment variable
- Or set `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable

### Error: "Invalid service account credentials"
- Verify the JSON file is valid
- Check that the file hasn't been corrupted
- Re-download from Firebase Console if needed

### Error: "messaging/invalid-registration-token"
- Device token is invalid or expired
- The token will be automatically cleared from database
- User needs to re-register their device token

### Notifications not being sent
- Check Firebase project is active
- Verify service account has proper permissions
- Check device tokens are registered
- Review server logs for detailed error messages

## Environment Variables

You can configure Firebase using these environment variables:

```bash
# Option 1: File path
FIREBASE_SERVICE_ACCOUNT_PATH=config/firebase-service-account.json

# Option 2: JSON content (for cloud deployments)
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

## Next Steps

1. ✅ Download service account JSON from Firebase Console
2. ✅ Place it in `config/firebase-service-account.json`
3. ✅ Install firebase-admin: `npm install firebase-admin`
4. ✅ Restart server
5. ✅ Test by creating an order

## Support

For Firebase-specific issues, refer to:
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [FCM Setup Guide](https://firebase.google.com/docs/cloud-messaging/server)
