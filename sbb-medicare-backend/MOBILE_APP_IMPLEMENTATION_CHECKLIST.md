# Mobile App Implementation Checklist

## Required Changes for Mobile App

### ✅ 1. Login Request - Add `dashboardType: "mobile"`

**Current (Wrong):**
```javascript
POST /api/auth/login
{
  "mobileEmail": "user@example.com",
  "password": "password123"
}
```

**Updated (Correct):**
```javascript
POST /api/auth/login
{
  "mobileEmail": "user@example.com",
  "password": "password123",
  "dashboardType": "mobile"  // ← ADD THIS
}
```

**Why:** This tells the backend to generate a non-expiring refresh token for mobile apps.

---

### ✅ 2. Store Tokens Securely

**Required:**
- Store `accessToken` (24h expiry)
- Store `refreshToken` (never expires for mobile)
- Store `user` data

**Storage Options:**
- **React Native**: Use `@react-native-async-storage/async-storage` or `react-native-keychain`
- **Flutter**: Use `shared_preferences` or `flutter_secure_storage`
- **iOS Native**: Use Keychain
- **Android Native**: Use EncryptedSharedPreferences or Keystore

**Example:**
```javascript
// After successful login
await AsyncStorage.multiSet([
  ['@access_token', response.data.data.token],
  ['@refresh_token', response.data.data.refreshToken],
  ['@user_data', JSON.stringify(response.data.data.user)]
]);
```

---

### ✅ 3. Auto-Login on App Launch

**What to do:**
1. When app starts, check if refresh token exists
2. If exists → Call `/api/auth/refresh` with refresh token
3. If successful → User is logged in (show main screen)
4. If fails → Show login screen

**Implementation:**

```javascript
// On app launch (App.js or App.tsx)
useEffect(() => {
  checkAutoLogin();
}, []);

const checkAutoLogin = async () => {
  const refreshToken = await AsyncStorage.getItem('@refresh_token');
  
  if (refreshToken) {
    try {
      // Try to auto-login
      const response = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken
      });
      
      if (response.data.success) {
        // Update access token
        await AsyncStorage.setItem('@access_token', response.data.data.token);
        // User is logged in - show main screen
        setIsLoggedIn(true);
      }
    } catch (error) {
      // Refresh failed - show login screen
      setIsLoggedIn(false);
    }
  } else {
    // No refresh token - show login screen
    setIsLoggedIn(false);
  }
};
```

---

### ✅ 4. Auto-Refresh Access Token on 401 Errors

**What to do:**
- When API returns 401 (Unauthorized)
- Automatically call `/api/auth/refresh`
- Get new access token
- Retry the original request

**Implementation (Axios Interceptor):**

```javascript
// Add response interceptor
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Get refresh token
        const refreshToken = await AsyncStorage.getItem('@refresh_token');
        
        if (!refreshToken) {
          // No refresh token - redirect to login
          // navigation.navigate('Login');
          return Promise.reject(error);
        }

        // Call refresh endpoint
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken
        });

        if (response.data.success) {
          // Update access token
          const newAccessToken = response.data.data.token;
          await AsyncStorage.setItem('@access_token', newAccessToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        await AsyncStorage.multiRemove(['@access_token', '@refresh_token', '@user_data']);
        // navigation.navigate('Login');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

---

### ✅ 5. Add Authorization Header to All API Requests

**Implementation (Axios Interceptor):**

```javascript
// Add request interceptor
axios.interceptors.request.use(async (config) => {
  const accessToken = await AsyncStorage.getItem('@access_token');
  
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  
  return config;
});
```

---

### ✅ 6. Handle Logout Properly

**What to do:**
1. Call `/api/auth/logout` endpoint
2. Clear all stored tokens and user data
3. Navigate to login screen

**Implementation:**

```javascript
const handleLogout = async () => {
  try {
    const accessToken = await AsyncStorage.getItem('@access_token');
    const refreshToken = await AsyncStorage.getItem('@refresh_token');

    if (accessToken) {
      // Call logout endpoint
      await axios.post(
        `${API_URL}/auth/logout`,
        { refreshToken },
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
    }
  } catch (error) {
    // Ignore errors - clear storage anyway
  } finally {
    // Clear all stored data
    await AsyncStorage.multiRemove([
      '@access_token',
      '@refresh_token',
      '@user_data'
    ]);
    
    // Navigate to login
    // navigation.navigate('Login');
    setIsLoggedIn(false);
  }
};
```

---

## Complete Implementation Example

### React Native - Complete Auth Service

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

  // Get tokens
  static async getAccessToken() {
    return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  }

  static async getRefreshToken() {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  }

  static async getUserData() {
    const data = await AsyncStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  }

  // Clear storage
  static async clearStorage() {
    await AsyncStorage.multiRemove([
      ACCESS_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      USER_DATA_KEY
    ]);
  }

  // Login - IMPORTANT: Include dashboardType: 'mobile'
  static async login(mobileEmail, password) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        mobileEmail,
        password,
        dashboardType: 'mobile' // ← REQUIRED for non-expiring refresh token
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

  // Auto-login on app launch
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
        const userData = await this.getUserData();
        
        // Update access token (refresh token stays same for mobile)
        await this.storeTokens(
          token, 
          newRefreshToken || refreshToken, 
          userData
        );
        
        return { success: true, user: userData };
      }

      throw new Error('Auto-login failed');
    } catch (error) {
      await this.clearStorage();
      return {
        success: false,
        needsLogin: true,
        error: error.response?.data?.error?.message || 'Session expired'
      };
    }
  }

  // Refresh access token (when it expires)
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
        const userData = await this.getUserData();
        
        await this.storeTokens(
          token, 
          newRefreshToken || refreshToken, 
          userData
        );
        
        return { success: true, token };
      }

      throw new Error('Token refresh failed');
    } catch (error) {
      await this.clearStorage();
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Session expired'
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

// Setup axios interceptors
axios.interceptors.request.use(async (config) => {
  const token = await AuthService.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshResult = await AuthService.refreshAccessToken();

      if (refreshResult.success) {
        originalRequest.headers.Authorization = `Bearer ${refreshResult.token}`;
        return axios(originalRequest);
      } else {
        // Redirect to login
        return Promise.reject(new Error('Session expired'));
      }
    }

    return Promise.reject(error);
  }
);

export default AuthService;
```

### App Launch Handler

```javascript
// App.js
import React, { useEffect, useState } from 'react';
import AuthService from './services/authService';
import LoginScreen from './screens/LoginScreen';
import MainScreen from './screens/MainScreen';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAutoLogin();
  }, []);

  const checkAutoLogin = async () => {
    const result = await AuthService.autoLogin();
    
    if (result.success) {
      setUser(result.user);
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
    
    setIsLoading(false);
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
    return <LoadingScreen />;
  }

  return (
    <>
      {isLoggedIn ? (
        <MainScreen user={user} onLogout={handleLogout} />
      ) : (
        <LoginScreen onLogin={handleLogin} />
      )}
    </>
  );
}

export default App;
```

---

## Summary Checklist

- [ ] **Login**: Add `dashboardType: "mobile"` to login request
- [ ] **Storage**: Store access token, refresh token, and user data securely
- [ ] **Auto-Login**: Check refresh token on app launch and auto-login
- [ ] **Token Refresh**: Auto-refresh access token on 401 errors
- [ ] **Authorization Header**: Add Bearer token to all API requests
- [ ] **Logout**: Call logout endpoint and clear storage

---

## Testing

1. **Test Auto-Login:**
   - Login with `dashboardType: "mobile"`
   - Close app completely
   - Reopen app
   - Should auto-login without showing login screen

2. **Test Token Refresh:**
   - Make API request
   - If access token expired, should auto-refresh and retry

3. **Test Logout:**
   - Call logout
   - Try to make API request
   - Should require login

---

## Important Notes

1. **Always include `dashboardType: "mobile"`** in login request
2. **Store tokens securely** - use Keychain/Keystore, not plain storage
3. **Handle 401 errors** - auto-refresh token before showing error
4. **Clear tokens on logout** - don't leave tokens in storage
5. **Check refresh token on app launch** - provide seamless experience
