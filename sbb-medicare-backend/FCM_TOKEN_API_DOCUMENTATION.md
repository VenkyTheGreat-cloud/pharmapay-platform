# FCM Device Token API Documentation

## Endpoint: Update Device Token

**Purpose**: Register or update the FCM (Firebase Cloud Messaging) device token for push notifications.

---

## API Details

### **PUT** `/api/delivery-boys/device-token`

**Authorization**: Required (Delivery Boy only)

**Content-Type**: `application/json`

---

## Request

### Headers
```
Authorization: Bearer <delivery_boy_jwt_token>
Content-Type: application/json
```

### Request Body
```json
{
  "device_token": "fcm_device_token_string_here"
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `device_token` | string | Yes | FCM device token obtained from Firebase Cloud Messaging SDK |

---

## Response

### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "device_token": "fcm_device_token_string_here"
  },
  "message": "Device token updated successfully"
}
```

### Error Responses

#### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Device token is required"
  }
}
```

#### 401 Unauthorized - Invalid Token
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid or expired token"
  }
}
```

#### 403 Forbidden - Not a Delivery Boy
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied. Only delivery boys can update device tokens."
  }
}
```

#### 404 Not Found - Delivery Boy Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Delivery boy not found"
  }
}
```

---

## Frontend Implementation Guide

### When to Call This API

1. **After Login**: Call immediately after delivery boy logs in successfully
2. **On App Launch**: Call when app starts (if user is already logged in)
3. **Token Refresh**: Call whenever FCM token is refreshed (Firebase SDK provides callbacks)

### Example: React Native Implementation

```javascript
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Function to register/update device token
async function registerDeviceToken(authToken) {
  try {
    // Get FCM token from Firebase
    const fcmToken = await messaging().getToken();
    
    if (!fcmToken) {
      console.log('No FCM token available');
      return;
    }

    // Call API to register token
    const response = await fetch('https://your-api-domain.com/api/delivery-boys/device-token', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        device_token: fcmToken
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Device token registered successfully');
      // Store token locally for reference
      await AsyncStorage.setItem('fcm_token', fcmToken);
    } else {
      console.error('Failed to register device token:', result.error);
    }
  } catch (error) {
    console.error('Error registering device token:', error);
  }
}

// Call after login
async function onLoginSuccess(authToken) {
  await registerDeviceToken(authToken);
}

// Listen for token refresh
messaging().onTokenRefresh(async (newToken) => {
  const authToken = await AsyncStorage.getItem('auth_token');
  if (authToken) {
    await registerDeviceToken(authToken);
  }
});
```

### Example: Flutter Implementation

```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<void> registerDeviceToken(String authToken) async {
  try {
    // Get FCM token
    String? fcmToken = await FirebaseMessaging.instance.getToken();
    
    if (fcmToken == null) {
      print('No FCM token available');
      return;
    }

    // Call API to register token
    final response = await http.put(
      Uri.parse('https://your-api-domain.com/api/delivery-boys/device-token'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $authToken',
      },
      body: jsonEncode({
        'device_token': fcmToken,
      }),
    );

    if (response.statusCode == 200) {
      final result = jsonDecode(response.body);
      if (result['success']) {
        print('Device token registered successfully');
        // Store token locally
        await storage.write(key: 'fcm_token', value: fcmToken);
      }
    } else {
      print('Failed to register device token: ${response.body}');
    }
  } catch (e) {
    print('Error registering device token: $e');
  }
}

// Call after login
void onLoginSuccess(String authToken) {
  registerDeviceToken(authToken);
}

// Listen for token refresh
FirebaseMessaging.instance.onTokenRefresh.listen((newToken) async {
  String? authToken = await storage.read(key: 'auth_token');
  if (authToken != null) {
    await registerDeviceToken(authToken);
  }
});
```

### Example: Android (Kotlin) Implementation

```kotlin
import com.google.firebase.messaging.FirebaseMessaging
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

fun registerDeviceToken(authToken: String) {
    FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
        if (!task.isSuccessful) {
            Log.w(TAG, "Fetching FCM registration token failed", task.exception)
            return@addOnCompleteListener
        }

        val fcmToken = task.result
        if (fcmToken.isNullOrEmpty()) {
            Log.w(TAG, "FCM token is empty")
            return@addOnCompleteListener
        }

        // Call API
        val client = OkHttpClient()
        val json = JSONObject()
        json.put("device_token", fcmToken)

        val requestBody = json.toString()
            .toRequestBody("application/json".toMediaType())

        val request = Request.Builder()
            .url("https://your-api-domain.com/api/delivery-boys/device-token")
            .put(requestBody)
            .addHeader("Authorization", "Bearer $authToken")
            .addHeader("Content-Type", "application/json")
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e(TAG, "Failed to register device token", e)
            }

            override fun onResponse(call: Call, response: Response) {
                if (response.isSuccessful) {
                    Log.d(TAG, "Device token registered successfully")
                } else {
                    Log.e(TAG, "Failed to register device token: ${response.body?.string()}")
                }
            }
        })
    }
}

// Call after login
fun onLoginSuccess(authToken: String) {
    registerDeviceToken(authToken)
}

// Listen for token refresh
FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
    val newToken = task.result
    // Get stored auth token and call registerDeviceToken
    val authToken = getStoredAuthToken()
    if (authToken != null) {
        registerDeviceToken(authToken)
    }
}
```

### Example: iOS (Swift) Implementation

```swift
import FirebaseMessaging

func registerDeviceToken(authToken: String) {
    Messaging.messaging().token { token, error in
        if let error = error {
            print("Error fetching FCM registration token: \(error)")
            return
        }
        
        guard let fcmToken = token else {
            print("FCM token is nil")
            return
        }

        // Call API
        let url = URL(string: "https://your-api-domain.com/api/delivery-boys/device-token")!
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        
        let body: [String: Any] = ["device_token": fcmToken]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("Error registering device token: \(error)")
                return
            }
            
            if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 {
                print("Device token registered successfully")
            } else {
                print("Failed to register device token")
            }
        }.resume()
    }
}

// Call after login
func onLoginSuccess(authToken: String) {
    registerDeviceToken(authToken: authToken)
}

// Listen for token refresh
Messaging.messaging().token { token, error in
    if let newToken = token {
        // Get stored auth token and call registerDeviceToken
        if let authToken = getStoredAuthToken() {
            registerDeviceToken(authToken: authToken)
        }
    }
}
```

---

## Important Notes

1. **Token Format**: The `device_token` should be the full FCM token string obtained from Firebase SDK
2. **Token Refresh**: FCM tokens can change, so always listen for token refresh events and update
3. **Authentication**: Must be called with a valid delivery boy JWT token
4. **Idempotent**: Can be called multiple times - it will update the existing token
5. **Timing**: Best practice is to call immediately after login and whenever token refreshes

---

## Testing

### Using cURL
```bash
curl -X PUT https://your-api-domain.com/api/delivery-boys/device-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_DELIVERY_BOY_JWT_TOKEN" \
  -d '{
    "device_token": "your_fcm_token_here"
  }'
```

### Using Postman
1. Method: `PUT`
2. URL: `https://your-api-domain.com/api/delivery-boys/device-token`
3. Headers:
   - `Authorization: Bearer <delivery_boy_token>`
   - `Content-Type: application/json`
4. Body (raw JSON):
   ```json
   {
     "device_token": "your_fcm_token_here"
   }
   ```

---

## Troubleshooting

### Token Not Being Saved
- Verify the delivery boy is logged in with a valid token
- Check that the token has `delivery_boy` role
- Verify the request body contains `device_token` as a string

### Token Invalid Error
- Ensure the FCM token is obtained from Firebase SDK
- Check that Firebase is properly configured in your mobile app
- Verify the token format is correct (should be a long string)

### 403 Forbidden
- Ensure the user is logged in as a delivery boy
- Check the JWT token is valid and not expired
- Verify the token contains `role: "delivery_boy"`

---

## Related APIs

- **Login**: `POST /api/auth/login` - Get delivery boy JWT token
- **Get Orders**: `GET /api/orders/ongoing` - See orders (will receive push notifications for new orders)
