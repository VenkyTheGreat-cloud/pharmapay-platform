# Mobile App Auto-Login Guide

## Overview

Mobile apps now support **non-expiring refresh tokens** that allow users to stay logged in indefinitely until they explicitly logout or clear app data.

## How It Works

### 1. Initial Login

When user logs in from mobile app, include `dashboardType: "mobile"`:

**Request:**
```json
POST /api/auth/login
{
  "mobileEmail": "deliveryboy@example.com",
  "password": "password123",
  "dashboardType": "mobile"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // Access token (24h)
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // Refresh token (NEVER EXPIRES)
    "user": { ... }
  }
}
```

**Key Points:**
- Access token: Expires in 24 hours
- Refresh token: **Never expires** (for mobile apps only)
- Store both tokens securely

### 2. App Launch - Auto Login

When app opens, check if refresh token exists and auto-login:

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
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  // Same refresh token (unchanged)
  }
}
```

**Mobile App Flow:**
1. App launches
2. Check if refresh token exists in storage
3. If exists → Call `/api/auth/refresh` with refresh token
4. If successful → User is logged in automatically
5. If fails → Show login screen

### 3. Token Refresh During App Usage

When access token expires (24h), automatically refresh:

1. API request returns 401
2. Call `/api/auth/refresh` with stored refresh token
3. Get new access token
4. Retry original request

## Implementation Examples

### React Native - Auto Login on App Launch

```javascript
// services/authService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = 'https://sbb-medicare-api.onrender.com/api';

const ACCESS_TOKEN_KEY = '@access_token';
const REFRESH_TOKEN_KEY = '@refresh_token';
const USER_DATA_KEY = '@user_data';

class AuthService {
  // Store tokens
  static async storeTokens(accessToken, refreshToken, userData) {
    await AsyncStorage.multiSet([
      [ACCESS_TOKEN_KEY, accessToken],
      [REFRESH_TOKEN_KEY, refreshToken],
      [USER_DATA_KEY, JSON.stringify(userData)]
    ]);
  }

  // Get stored refresh token
  static async getRefreshToken() {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  }

  // Get stored access token
  static async getAccessToken() {
    return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  }

  // Get stored user data
  static async getUserData() {
    const data = await AsyncStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  }

  // Clear all storage
  static async clearStorage() {
    await AsyncStorage.multiRemove([
      ACCESS_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      USER_DATA_KEY
    ]);
  }

  // Login (with dashboardType: 'mobile' for non-expiring refresh token)
  static async login(mobileEmail, password) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        mobileEmail,
        password,
        dashboardType: 'mobile' // IMPORTANT: This makes refresh token non-expiring
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

  // Auto-login on app launch using refresh token
  static async autoLogin() {
    try {
      const refreshToken = await this.getRefreshToken();
      
      if (!refreshToken) {
        return { success: false, needsLogin: true };
      }

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken
      });

      if (response.data.success) {
        const { token, refreshToken: newRefreshToken } = response.data.data;
        
        // Update access token (refresh token stays the same for mobile)
        const userData = await this.getUserData();
        await this.storeTokens(token, newRefreshToken || refreshToken, userData);
        
        return { success: true, user: userData };
      }

      throw new Error('Auto-login failed');
    } catch (error) {
      // Refresh token invalid - clear storage and show login
      await this.clearStorage();
      return {
        success: false,
        needsLogin: true,
        error: error.response?.data?.error?.message || 'Session expired'
      };
    }
  }

  // Refresh access token (when it expires during app usage)
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
        const { token, refreshToken: newRefreshToken } = response.data.data;
        
        // Update access token
        const userData = await this.getUserData();
        await this.storeTokens(token, newRefreshToken || refreshToken, userData);
        
        return { success: true, token };
      }

      throw new Error('Token refresh failed');
    } catch (error) {
      // If refresh fails, user needs to login again
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
        await axios.post(
          `${API_BASE_URL}/auth/logout`,
          { refreshToken },
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        );
      }
    } catch (error) {
      // Ignore errors
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
        return Promise.reject(new Error('Session expired'));
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

### App Launch Handler (React Native)

```javascript
// App.js or App.tsx
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthService from './services/authService';
import LoginScreen from './screens/LoginScreen';
import MainScreen from './screens/MainScreen';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check for auto-login on app launch
    checkAutoLogin();
  }, []);

  const checkAutoLogin = async () => {
    try {
      // Try to auto-login using refresh token
      const result = await AuthService.autoLogin();
      
      if (result.success) {
        setUser(result.user);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Auto-login error:', error);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (mobileEmail, password) => {
    const result = await AuthService.login(mobileEmail, password);
    
    if (result.success) {
      setUser(result.user);
      setIsLoggedIn(true);
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setUser(null);
    setIsLoggedIn(false);
  };

  if (isLoading) {
    // Show splash screen or loading indicator
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {isLoggedIn ? (
        <MainScreen user={user} onLogout={handleLogout} />
      ) : (
        <LoginScreen onLogin={handleLogin} />
      )}
    </NavigationContainer>
  );
}

export default App;
```

### Flutter/Dart - Auto Login

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

  // Get refresh token
  static Future<String?> getRefreshToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_refreshTokenKey);
  }

  // Get access token
  static Future<String?> getAccessToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_accessTokenKey);
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

  // Login (with dashboardType: 'mobile' for non-expiring refresh token)
  static Future<Map<String, dynamic>> login(String mobileEmail, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'mobileEmail': mobileEmail,
          'password': password,
          'dashboardType': 'mobile' // IMPORTANT: Makes refresh token non-expiring
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

  // Auto-login on app launch
  static Future<Map<String, dynamic>> autoLogin() async {
    try {
      final refreshToken = await getRefreshToken();
      
      if (refreshToken == null) {
        return {'success': false, 'needsLogin': true};
      }

      final response = await http.post(
        Uri.parse('$_baseUrl/auth/refresh'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': refreshToken}),
      );

      final data = jsonDecode(response.body);
      
      if (data['success'] == true) {
        final token = data['data']['token'];
        final newRefreshToken = data['data']['refreshToken'] ?? refreshToken;
        final userData = await getUserData();
        
        await storeTokens(token, newRefreshToken, userData ?? {});
        
        return {'success': true, 'user': userData};
      }

      throw Exception('Auto-login failed');
    } catch (e) {
      await clearStorage();
      return {'success': false, 'needsLogin': true, 'error': 'Session expired'};
    }
  }

  // Refresh access token
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
        final newRefreshToken = data['data']['refreshToken'] ?? refreshToken;
        final userData = await getUserData();
        
        await storeTokens(token, newRefreshToken, userData ?? {});
        
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
}
```

### Flutter App Launch Handler

```dart
// main.dart
import 'package:flutter/material.dart';
import 'services/auth_service.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatefulWidget {
  @override
  _MyAppState createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  bool _isLoading = true;
  bool _isLoggedIn = false;
  Map<String, dynamic>? _user;

  @override
  void initState() {
    super.initState();
    _checkAutoLogin();
  }

  Future<void> _checkAutoLogin() async {
    try {
      final result = await AuthService.autoLogin();
      
      setState(() {
        if (result['success'] == true) {
          _user = result['user'];
          _isLoggedIn = true;
        } else {
          _isLoggedIn = false;
        }
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoggedIn = false;
        _isLoading = false;
      });
    }
  }

  Future<void> _handleLogin(String mobileEmail, String password) async {
    final result = await AuthService.login(mobileEmail, password);
    
    if (result['success'] == true) {
      setState(() {
        _user = result['user'];
        _isLoggedIn = true;
      });
    } else {
      // Show error
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['error'] ?? 'Login failed')),
      );
    }
  }

  Future<void> _handleLogout() async {
    await AuthService.logout();
    setState(() {
      _user = null;
      _isLoggedIn = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return MaterialApp(
        home: Scaffold(
          body: Center(child: CircularProgressIndicator()),
        ),
      );
    }

    return MaterialApp(
      home: _isLoggedIn
          ? MainScreen(user: _user, onLogout: _handleLogout)
          : LoginScreen(onLogin: _handleLogin),
    );
  }
}
```

## Key Differences: Mobile vs Web

| Feature | Mobile App | Web App |
|---------|-----------|---------|
| **Refresh Token Expiry** | Never expires | 30 days |
| **Login Parameter** | `dashboardType: "mobile"` | `dashboardType: "web"` or omitted |
| **Token Storage** | Not stored in DB | Stored in DB with expiry |
| **Auto-Login** | Use refresh token on app launch | Not applicable |
| **Logout Required** | Only when user explicitly logs out | Or when token expires |

## Important Notes

1. **Mobile Refresh Tokens Never Expire**: Once you login with `dashboardType: "mobile"`, the refresh token will work indefinitely
2. **Access Token Still Expires**: Access tokens expire in 24 hours and need to be refreshed
3. **Logout Clears Session**: When user logs out, refresh token is revoked
4. **App Data Clear**: If user clears app data, refresh token is lost and they need to login again
5. **User Status Check**: Even with non-expiring token, if user is deactivated, refresh will fail

## Security Considerations

1. **Secure Storage**: Always use secure storage (Keychain/Keystore) for tokens
2. **Token Revocation**: Admin can revoke tokens by deactivating user
3. **Device Security**: If device is compromised, tokens can be stolen - consider device binding
4. **Logout on Security Events**: Consider logging out if suspicious activity detected

## Testing

### Test Auto-Login Flow
1. Login with `dashboardType: "mobile"`
2. Close app completely
3. Reopen app
4. Should auto-login without showing login screen

### Test Token Refresh
1. Login and get tokens
2. Wait 24 hours (or modify token expiry for testing)
3. Make API request
4. Should auto-refresh and succeed

### Test Logout
1. Login and get tokens
2. Call logout endpoint
3. Try to refresh token
4. Should fail and require login

## API Endpoints

```
POST /api/auth/login        → Login (include dashboardType: "mobile")
POST /api/auth/refresh      → Get new access token (auto-login on app launch)
POST /api/auth/logout       → Logout and revoke refresh token
```
