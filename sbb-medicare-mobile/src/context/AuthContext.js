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
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      const token = await storage.getToken();
      const savedUser = await storage.getUser();

      if (token && savedUser) {
        setUser(savedUser);
        setIsAuthenticated(true);
        // Optionally refresh user data from API
        try {
          const response = await apiService.getProfile();
          setUser(response.data);
          await storage.saveUser(response.data);
        } catch (error) {
          console.log('Error refreshing user data:', error);
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
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
