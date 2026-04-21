# Config Directory

This directory is for storing configuration files, including Firebase service account credentials.

## Firebase Service Account File

Place your Firebase service account JSON file here:

**File name**: `firebase-service-account.json`

**Important**: 
- This file contains sensitive credentials
- It is excluded from Git (see `.gitignore`)
- Do NOT commit this file to version control

## Getting the File

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Settings → Project settings → Service accounts
4. Click "Generate new private key"
5. Download the JSON file
6. Rename it to `firebase-service-account.json`
7. Place it in this directory

## Alternative: Environment Variable

Instead of using a file, you can set the JSON content as an environment variable:

```bash
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

This is recommended for cloud deployments.
