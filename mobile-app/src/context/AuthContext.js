import React, { createContext, useState, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import apiService from '../services/api';
import storage from '../utils/storage';
import { handleApiError } from '../utils/helpers';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pharmacyStatus, setPharmacyStatus] = useState(null); // null = not checked, 'none' = no pharmacy, or pharmacy status

  // Load user from storage on app start
  useEffect(() => {
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Loading timeout - forcing loading to false');
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    loadUser();

    return () => clearTimeout(timeoutId);
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading user from storage...');
      
      // Use Promise.race with timeout to prevent hanging
      const loadPromise = Promise.all([
        storage.getToken().catch(() => null),
        storage.getUser().catch(() => null),
      ]);
      
      const timeoutPromise = new Promise((resolve) => 
        setTimeout(() => resolve([null, null]), 2000)
      );
      
      const [token, savedUser] = await Promise.race([loadPromise, timeoutPromise]);

      console.log('📦 Token found:', !!token);
      console.log('👤 User found:', !!savedUser);

      if (token && savedUser) {
        console.log('✅ User found in storage, setting authenticated');
        setUser(savedUser);
        setIsAuthenticated(true);
      } else {
        console.log('ℹ️ No saved user, showing login screen');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ Error loading user:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      console.log('✅ Loading complete, setting loading to false');
      setLoading(false);
    }
  };

  const checkPharmacyStatus = async () => {
    try {
      const { pharmacyAPI } = require('../services/api');
      const res = await pharmacyAPI.getMyPharmacy();
      const pharmacy = res.data?.data || res.data;
      if (pharmacy && pharmacy.status) {
        setPharmacyStatus(pharmacy.status);
        return pharmacy.status;
      }
      setPharmacyStatus('none');
      return 'none';
    } catch {
      setPharmacyStatus('none');
      return 'none';
    }
  };

  const login = async (email, password) => {
    try {
      const response = await apiService.login(email, password);
      // API returns { success, data: { token, refreshToken, user } }
      const responseData = response.data?.data || response.data;
      const { token, user: userData } = responseData;

      if (!token) {
        return { success: false, message: 'Login failed. No token received.' };
      }

      // Save token and user data
      await storage.saveToken(token);
      await storage.saveUser(userData);

      setUser(userData);
      setIsAuthenticated(true);

      // Check if user has a pharmacy (admin role)
      if (userData?.role === 'admin') {
        await checkPharmacyStatus();
      } else {
        setPharmacyStatus('none');
      }

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: handleApiError(error),
      };
    }
  };

  const register = async (registrationData) => {
    try {
      const response = await apiService.register(registrationData);
      const responseData = response.data?.data || response.data;
      const { token, user: userData } = responseData || {};
      const message = response.data?.message || responseData?.message;

      // If token is provided, user is approved and can login
      if (token) {
        await storage.saveToken(token);
        await storage.saveUser(userData);
        setUser(userData);
        setIsAuthenticated(true);
        return { success: true };
      }

      // If no token, account is pending approval
      return {
        success: true,
        pending: true,
        message: message || 'Registration successful. Your account is pending approval.'
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: handleApiError(error),
      };
    }
  };

  const logout = () => {
    // Set state immediately (synchronous) so UI updates instantly
    setUser(null);
    setIsAuthenticated(false);
    setPharmacyStatus(null);
    // Clear storage in background
    storage.clearAuth().catch((e) => console.error('Logout storage error:', e));
    // On web/PWA only, force URL reset to landing page
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
      window.location.href = '/';
    }
  };

  const updateUser = async (userData) => {
    try {
      const response = await apiService.updateProfile(userData);
      const updatedUser = response.data;

      await storage.saveUser(updatedUser);
      setUser(updatedUser);

      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Update user error:', error);
      return {
        success: false,
        message: handleApiError(error),
      };
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    try {
      await apiService.changePassword(oldPassword, newPassword);
      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: handleApiError(error),
      };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    pharmacyStatus,
    login,
    register,
    logout,
    updateUser,
    changePassword,
    checkPharmacyStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
