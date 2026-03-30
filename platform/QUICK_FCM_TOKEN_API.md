# Quick Reference: FCM Token API

## Endpoint
```
PUT /api/delivery-boys/device-token
```

## Request
```json
{
  "device_token": "fcm_token_from_firebase_sdk"
}
```

## Headers
```
Authorization: Bearer <delivery_boy_jwt_token>
Content-Type: application/json
```

## Response (Success)
```json
{
  "success": true,
  "data": {
    "device_token": "fcm_token_from_firebase_sdk"
  },
  "message": "Device token updated successfully"
}
```

## When to Call
1. ✅ After delivery boy logs in
2. ✅ When app starts (if already logged in)
3. ✅ When FCM token refreshes

## Example (React Native)
```javascript
// Get FCM token
const fcmToken = await messaging().getToken();

// Register token
await fetch('https://api-domain.com/api/delivery-boys/device-token', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ device_token: fcmToken })
});
```

## Full Documentation
See `FCM_TOKEN_API_DOCUMENTATION.md` for complete implementation examples.
