# Mobile App Session Management Guide

## Overview

The mobile app uses a **two-token authentication system**:
- **Access Token**: Short-lived (24 hours) - used for API requests
- **Refresh Token**: Long-lived (30 days) - used to get new access tokens

## Token Configuration

### Current Settings
- **Access Token Expiry**: 24 hours (`JWT_ACCESS_TOKEN_EXPIRY=24h`)
- **Refresh Token Expiry**: 
  - **Mobile Apps**: Never expires (when `dashboardType: "mobile"`)
  - **Web Apps**: 30 days (`JWT_REFRESH_TOKEN_EXPIRY=30d`)

### Environment Variables
```env
JWT_ACCESS_TOKEN_EXPIRY=24h
JWT_REFRESH_TOKEN_EXPIRY=30d
```

## Authentication Flow

### 1. Login

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "mobileEmail": "deliveryboy@example.com",
  "password": "password123",
  "dashboardType": "mobile"  // Optional: "mobile" or "web"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // Access token (24h)
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // Refresh token (30d)
    "user": {
      "id": 123,
      "name": "John Doe",
      "mobile": "9876543210",
      "email": "deliveryboy@example.com",
      "role": "delivery_boy",
      "status": "approved"
    }
  }
}
```

**Mobile App Actions:**
1. Store both tokens securely (use secure storage like Keychain/Keystore)
2. Store user data
3. Use access token for all API requests

### 2. Using Access Token

**Include in every API request:**
```http
Authorization: Bearer <access_token>
```

**Example:**
```http
GET /api/orders/ongoing
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Token Expiration Handling

When the access token expires (after 24 hours), API requests will return:

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid or expired token"
  }
}
```

**Mobile App Should:**
1. Detect 401 error
2. Automatically call refresh token endpoint
3. Update stored access token
4. Retry the original request

### 4. Refresh Token

**Endpoint:** `POST /api/auth/refresh`

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // New access token (24h)
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  // Same refresh token (for mobile: never expires)
  }
}
```

**Important Notes:**
- Refresh token endpoint returns **new access token and same refresh token**
- **Mobile Apps**: Refresh token never expires - can be reused indefinitely
- **Web Apps**: Refresh token expires after 30 days or when revoked
- For mobile apps, you can use the same refresh token forever (until logout or app data cleared)
- Only update the access token after refresh

### 5. Logout

**Endpoint:** `POST /api/auth/logout`

**Request Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body (Optional):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Mobile App Actions:**
1. Call logout endpoint
2. Clear stored tokens
3. Clear user data
4. Navigate to login screen

## Mobile App Implementation

### React Native Example

```javascript
// services/authService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = 'https://sbb-medicare-api.onrender.com/api';

// Token storage keys
const ACCESS_TOKEN_KEY = '@access_token';
const REFRESH_TOKEN_KEY = '@refresh_token';
const USER_DATA_KEY = '@user_data';

class AuthService {
  // Store tokens securely
  static async storeTokens(accessToken, refreshToken, userData) {
    await AsyncStorage.multiSet([
      [ACCESS_TOKEN_KEY, accessToken],
      [REFRESH_TOKEN_KEY, refreshToken],
      [USER_DATA_KEY, JSON.stringify(userData)]
    ]);
  }

  // Get stored access token
  static async getAccessToken() {
    return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  }

  // Get stored refresh token
  static async getRefreshToken() {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  }

  // Get stored user data
  static async getUserData() {
    const data = await AsyncStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  }

  // Clear all stored data
  static async clearStorage() {
    await AsyncStorage.multiRemove([
      ACCESS_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      USER_DATA_KEY
    ]);
  }

  // Login
  static async login(mobileEmail, password) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        mobileEmail,
        password,
        dashboardType: 'mobile'
      });

      if (response.data.success) {
        const { token, refreshToken, user } = response.data.data;
        await this.storeTokens(token, refreshToken, user);
        return { success: true, user };
      }

      throw new Error('Login failed');
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  // Refresh access token
  static async refreshAccessToken() {
    try {
      const refreshToken = await this.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken
      });

      if (response.data.success) {
        const { token } = response.data.data;
        
        // Update only access token (refresh token stays the same)
        const refreshToken = await this.getRefreshToken();
        const userData = await this.getUserData();
        await this.storeTokens(token, refreshToken, userData);
        
        return { success: true, token };
      }

      throw new Error('Token refresh failed');
    } catch (error) {
      // Refresh token expired or invalid - user needs to login again
      await this.clearStorage();
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Session expired. Please login again.'
      };
    }
  }

  // Logout
  static async logout() {
    try {
      const accessToken = await this.getAccessToken();
      const refreshToken = await this.getRefreshToken();

      if (accessToken) {
        // Call logout endpoint
        await axios.post(
          `${API_BASE_URL}/auth/logout`,
          { refreshToken },
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        );
      }
    } catch (error) {
      // Ignore errors - clear storage anyway
      console.log('Logout error:', error);
    } finally {
      await this.clearStorage();
    }
  }
}

// API interceptor for automatic token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh token
      const refreshResult = await AuthService.refreshAccessToken();

      if (refreshResult.success) {
        // Update authorization header with new token
        originalRequest.headers.Authorization = `Bearer ${refreshResult.token}`;
        
        // Retry original request
        return axios(originalRequest);
      } else {
        // Refresh failed - redirect to login
        // You can use navigation here
        // navigation.navigate('Login');
        return Promise.reject(refreshResult.error);
      }
    }

    return Promise.reject(error);
  }
);

// Set authorization header for all requests
axios.interceptors.request.use(async (config) => {
  const token = await AuthService.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default AuthService;
```

### Flutter/Dart Example

```dart
// services/auth_service.dart
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class AuthService {
  static const String _baseUrl = 'https://sbb-medicare-api.onrender.com/api';
  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _userDataKey = 'user_data';

  // Store tokens
  static Future<void> storeTokens(String accessToken, String refreshToken, Map<String, dynamic> userData) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_accessTokenKey, accessToken);
    await prefs.setString(_refreshTokenKey, refreshToken);
    await prefs.setString(_userDataKey, jsonEncode(userData));
  }

  // Get access token
  static Future<String?> getAccessToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_accessTokenKey);
  }

  // Get refresh token
  static Future<String?> getRefreshToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_refreshTokenKey);
  }

  // Get user data
  static Future<Map<String, dynamic>?> getUserData() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString(_userDataKey);
    return data != null ? jsonDecode(data) : null;
  }

  // Clear storage
  static Future<void> clearStorage() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_accessTokenKey);
    await prefs.remove(_refreshTokenKey);
    await prefs.remove(_userDataKey);
  }

  // Login
  static Future<Map<String, dynamic>> login(String mobileEmail, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'mobileEmail': mobileEmail,
          'password': password,
          'dashboardType': 'mobile'
        }),
      );

      final data = jsonDecode(response.body);
      
      if (data['success'] == true) {
        final token = data['data']['token'];
        final refreshToken = data['data']['refreshToken'];
        final user = data['data']['user'];
        
        await storeTokens(token, refreshToken, user);
        
        return {'success': true, 'user': user};
      }

      return {'success': false, 'error': data['error']['message']};
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  // Refresh token
  static Future<Map<String, dynamic>> refreshAccessToken() async {
    try {
      final refreshToken = await getRefreshToken();
      
      if (refreshToken == null) {
        throw Exception('No refresh token available');
      }

      final response = await http.post(
        Uri.parse('$_baseUrl/auth/refresh'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': refreshToken}),
      );

      final data = jsonDecode(response.body);
      
      if (data['success'] == true) {
        final token = data['data']['token'];
        // Refresh token stays the same - only update access token
        final currentRefreshToken = await getRefreshToken();
        final userData = await getUserData();
        
        await storeTokens(token, currentRefreshToken ?? '', userData ?? {});
        
        return {'success': true, 'token': token};
      }

      throw Exception('Token refresh failed');
    } catch (e) {
      await clearStorage();
      return {'success': false, 'error': 'Session expired. Please login again.'};
    }
  }

  // Logout
  static Future<void> logout() async {
    try {
      final accessToken = await getAccessToken();
      final refreshToken = await getRefreshToken();

      if (accessToken != null) {
        await http.post(
          Uri.parse('$_baseUrl/auth/logout'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $accessToken'
          },
          body: jsonEncode({'refreshToken': refreshToken}),
        );
      }
    } catch (e) {
      // Ignore errors
    } finally {
      await clearStorage();
    }
  }

  // Make authenticated request with auto-refresh
  static Future<http.Response> authenticatedRequest(
    String method,
    Uri url, {
    Map<String, String>? headers,
    Object? body,
  }) async {
    String? token = await getAccessToken();
    
    final requestHeaders = {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
      ...?headers,
    };

    http.Response response;
    
    if (method == 'GET') {
      response = await http.get(url, headers: requestHeaders);
    } else if (method == 'POST') {
      response = await http.post(url, headers: requestHeaders, body: body);
    } else if (method == 'PUT') {
      response = await http.put(url, headers: requestHeaders, body: body);
    } else {
      throw Exception('Unsupported method: $method');
    }

    // If 401, try to refresh token and retry
    if (response.statusCode == 401) {
      final refreshResult = await refreshAccessToken();
      
      if (refreshResult['success'] == true) {
        // Retry with new token
        requestHeaders['Authorization'] = 'Bearer ${refreshResult['token']}';
        
        if (method == 'GET') {
          response = await http.get(url, headers: requestHeaders);
        } else if (method == 'POST') {
          response = await http.post(url, headers: requestHeaders, body: body);
        } else if (method == 'PUT') {
          response = await http.put(url, headers: requestHeaders, body: body);
        }
      } else {
        // Refresh failed - throw error to trigger login
        throw Exception('Session expired');
      }
    }

    return response;
  }
}
```

## Token Lifecycle

### Access Token (24 hours)
```
Login → Get Access Token → Use for API calls → Expires after 24h → Refresh
```

### Refresh Token (30 days)
```
Login → Get Refresh Token → Store securely → Use to refresh access token → Expires after 30d → Re-login required
```

## Best Practices

### 1. Secure Storage
- **iOS**: Use Keychain Services
- **Android**: Use EncryptedSharedPreferences or Keystore
- **React Native**: Use `react-native-keychain` or `@react-native-async-storage/async-storage` with encryption
- **Flutter**: Use `flutter_secure_storage`

### 2. Token Refresh Strategy

**Option A: Proactive Refresh (Recommended)**
- Check token expiry before making requests
- Refresh token when it's about to expire (e.g., 1 hour before)
- Prevents 401 errors

**Option B: Reactive Refresh**
- Wait for 401 error
- Automatically refresh and retry
- Simpler but may cause brief delays

### 3. Error Handling

```javascript
// Handle different error scenarios
if (error.response?.status === 401) {
  // Token expired - try refresh
  const refreshed = await AuthService.refreshAccessToken();
  if (refreshed.success) {
    // Retry request
  } else {
    // Redirect to login
  }
} else if (error.response?.status === 403) {
  // Forbidden - user doesn't have permission
} else {
  // Other errors
}
```

### 4. Token Expiry Detection

You can decode the JWT to check expiry:

```javascript
// Decode JWT (without verification - just to read expiry)
function getTokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // Convert to milliseconds
  } catch (e) {
    return null;
  }
}

// Check if token is expired or expiring soon
function isTokenExpiringSoon(token, bufferMinutes = 60) {
  const expiry = getTokenExpiry(token);
  if (!expiry) return true;
  
  const now = Date.now();
  const buffer = bufferMinutes * 60 * 1000;
  
  return (expiry - now) < buffer;
}

// Usage
const accessToken = await AuthService.getAccessToken();
if (isTokenExpiringSoon(accessToken)) {
  await AuthService.refreshAccessToken();
}
```

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | Login and get tokens |
| `/api/auth/refresh` | POST | Get new access token |
| `/api/auth/logout` | POST | Logout and revoke tokens |
| `/api/auth/me` | GET | Get current user info |

## Important Notes

1. **Refresh Token Reuse**: The same refresh token can be used multiple times until it expires (30 days) or is revoked. Only the access token is updated on refresh.
2. **Delivery Boys**: Refresh tokens are stored in database for users (admin/store_manager), but not for delivery boys (due to ID type mismatch - delivery boys use BIGINT, refresh_tokens.user_id expects UUID)
3. **Token Storage**: Never store tokens in plain text or unencrypted storage
4. **Network Errors**: Handle network failures gracefully - don't clear tokens on network errors
5. **Background Refresh**: Consider refreshing tokens in background before expiry (e.g., 1 hour before)
6. **Token Expiry**: Access token expires after 24 hours, refresh token expires after 30 days

## Testing

### Test Token Expiry
1. Login and get tokens
2. Wait 24 hours (or modify token expiry for testing)
3. Make API request - should get 401
4. Auto-refresh should trigger
5. Request should succeed with new token

### Test Refresh Token Expiry
1. Login and get tokens
2. Wait 30 days (or modify refresh token expiry for testing)
3. Try to refresh - should fail
4. User should be redirected to login

## Troubleshooting

### Issue: "Invalid or expired token"
- **Cause**: Access token expired
- **Solution**: Call refresh token endpoint

### Issue: "Invalid or expired refresh token"
- **Cause**: Refresh token expired (30 days) or revoked
- **Solution**: User must login again

### Issue: Tokens not persisting
- **Cause**: Storage not properly configured
- **Solution**: Use secure storage (Keychain/Keystore)

### Issue: Infinite refresh loop
- **Cause**: Refresh token also expired
- **Solution**: Check refresh token expiry before attempting refresh
