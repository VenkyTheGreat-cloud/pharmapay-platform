import AsyncStorage from '@react-native-async-storage/async-storage';

const storage = {
  // Save data
  setItem: async (key, value) => {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      throw error;
    }
  },

  // Get data
  getItem: async (key) => {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error getting ${key}:`, error);
      return null;
    }
  },

  // Remove data
  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw error;
    }
  },

  // Clear all data
  clear: async () => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  },

  // Save auth token
  saveToken: async (token) => {
    await AsyncStorage.setItem('token', token);
  },

  // Get auth token
  getToken: async () => {
    return await AsyncStorage.getItem('token');
  },

  // Save user data
  saveUser: async (user) => {
    await storage.setItem('user', user);
  },

  // Get user data
  getUser: async () => {
    return await storage.getItem('user');
  },

  // Clear auth data
  clearAuth: async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
  },
};

export default storage;
