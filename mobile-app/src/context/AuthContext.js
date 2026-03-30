import React, { createContext, useState, useContext, useEffect } from 'react';
import apiService from '../services/api';
import storage from '../utils/storage';
import { handleApiError } from '../utils/helpers';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  const login = async (email, password) => {
    try {
      const response = await apiService.login(email, password);
      const { token, user: userData } = response.data;

      // Save token and user data
      await storage.saveToken(token);
      await storage.saveUser(userData);

      setUser(userData);
      setIsAuthenticated(true);

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
      const { token, user: userData, message } = response.data;

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

  const logout = async () => {
    try {
      await storage.clearAuth();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
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
    login,
    register,
    logout,
    updateUser,
    changePassword,
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
