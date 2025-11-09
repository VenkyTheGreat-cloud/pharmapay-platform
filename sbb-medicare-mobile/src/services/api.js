import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CONFIG from '../config/api';

// Create axios instance
const api = axios.create({
  baseURL: CONFIG.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage and redirect to login
      await AsyncStorage.multiRemove(['token', 'user']);
    }
    return Promise.reject(error);
  }
);

// API Service Methods
const apiService = {
  // Auth APIs
  login: (email, password) =>
    api.post(CONFIG.ENDPOINTS.LOGIN, { email, password }),

  register: (data) =>
    api.post(CONFIG.ENDPOINTS.REGISTER, data),

  getProfile: () =>
    api.get(CONFIG.ENDPOINTS.PROFILE),

  updateProfile: (data) =>
    api.put(CONFIG.ENDPOINTS.PROFILE, data),

  changePassword: (oldPassword, newPassword) =>
    api.put(CONFIG.ENDPOINTS.CHANGE_PASSWORD, { oldPassword, newPassword }),

  // Order APIs
  getMyOrders: (status = null) => {
    const params = status ? { status } : {};
    return api.get(CONFIG.ENDPOINTS.MY_ORDERS, { params });
  },

  getOrderById: (id) =>
    api.get(CONFIG.ENDPOINTS.ORDER_BY_ID(id)),

  updateOrderStatus: (id, status, notes = '') =>
    api.patch(CONFIG.ENDPOINTS.UPDATE_ORDER_STATUS(id), { status, notes }),

  getOrderHistory: (id) =>
    api.get(CONFIG.ENDPOINTS.ORDER_HISTORY(id)),

  // Payment APIs
  createPayment: (data) =>
    api.post(CONFIG.ENDPOINTS.PAYMENTS, data),

  getMyPayments: () =>
    api.get(CONFIG.ENDPOINTS.MY_PAYMENTS),

  getPaymentStatistics: () =>
    api.get(CONFIG.ENDPOINTS.PAYMENT_STATISTICS),

  // Customer APIs
  getCustomerById: (id) =>
    api.get(CONFIG.ENDPOINTS.CUSTOMER_BY_ID(id)),

  updateCustomer: (id, data) =>
    api.put(CONFIG.ENDPOINTS.CUSTOMER_BY_ID(id), data),

  // File Upload
  uploadFile: async (uri, fieldName = 'file') => {
    const formData = new FormData();
    const filename = uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append(fieldName, {
      uri,
      name: filename,
      type,
    });

    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default apiService;
