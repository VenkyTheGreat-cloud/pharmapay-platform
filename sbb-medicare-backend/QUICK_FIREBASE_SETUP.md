# Quick Firebase Setup Guide

## Where to Place the Firebase JSON File

### ✅ Recommended Location:
```
sbb-medicare-backend/
└── config/
    └── firebase-service-account.json  ← Place your file HERE
```

**Full path**: `config/firebase-service-account.json` (at project root)

## Quick Steps

1. **Download** the service account JSON from Firebase Console
   - Firebase Console → Project Settings → Service Accounts → Generate new private key

2. **Rename** the downloaded file to: `firebase-service-account.json`

3. **Place** it in the `config/` folder at the project root:
   ```
   config/firebase-service-account.json
   ```

4. **Install** Firebase Admin SDK:
   ```bash
   npm install firebase-admin
   ```

5. **Restart** your server - Firebase will initialize automatically

## Alternative: Use Environment Variable

If you prefer not to use a file (recommended for production):

1. Open the JSON file and copy its entire content
2. Set it as an environment variable:
   ```bash
   FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
   ```

## Verify It's Working

After restarting the server, check the logs. You should see:
```
✅ Firebase initialized from file: config/firebase-service-account.json
✅ Firebase Admin SDK initialized successfully
```

If you see:
```
⚠️ Firebase service account file not found
```
→ Check the file path and name

## File Structure

```
sbb-medicare-backend/
├── config/
│   ├── firebase-service-account.json  ← Your file goes here
│   └── README.md
├── src/
│   ├── config/
│   │   └── firebase.js               ← Firebase initialization
│   └── services/
│       └── pushNotificationService.js ← Uses Firebase
└── .gitignore                         ← Excludes the JSON file
```

## Security

⚠️ **The JSON file is automatically excluded from Git** (already in `.gitignore`)

Do NOT commit this file to version control!

## Need Help?

See `FIREBASE_SETUP_GUIDE.md` for detailed instructions.
