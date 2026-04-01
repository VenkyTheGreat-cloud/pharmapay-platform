import Constants from 'expo-constants';
import { Platform } from 'react-native';

// API Configuration
// On web (PWA): use relative /api so nginx proxies to backend
// On native: use full URL from app.config.js or production default
const API_URL = Platform.OS === 'web'
  ? '/api'
  : (Constants.expoConfig?.extra?.apiUrl || 'https://pharmapay.swinkpay-fintech.com/api');

export default {
  API_URL,
  GOOGLE_MAPS_API_KEY: Constants.expoConfig?.extra?.googleMapsApiKey || '',

  // API Endpoints
  ENDPOINTS: {
    // Auth
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',

    // Orders
    ORDERS: '/orders',
    MY_ORDERS: '/orders/my-orders',
    ORDER_BY_ID: (id) => `/orders/${id}`,
    UPDATE_ORDER_STATUS: (id) => `/orders/${id}/status`,
    ORDER_HISTORY: (id) => `/orders/${id}/history`,

    // Payments
    PAYMENTS: '/payments',
    MY_PAYMENTS: '/payments/my-payments',
    PAYMENT_STATISTICS: '/payments/statistics',

    // Customers
    CUSTOMERS: '/customers',
    CUSTOMER_BY_ID: (id) => `/customers/${id}`,

    // Marketplace
    MARKETPLACE: {
      PHARMACIES: '/marketplace/pharmacies',
      MY_APPLICATIONS: '/marketplace/my-applications',
      APPLY: '/marketplace/apply',
    },
  },

  // Order Status (matching backend API)
  ORDER_STATUS: {
    NEW: 'NEW',
    ASSIGNED: 'ASSIGNED',
    PICKED_UP: 'PICKED_UP',
    IN_TRANSIT: 'IN_TRANSIT',
    PAYMENT_COLLECTION: 'PAYMENT_COLLECTION',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
  },

  // Payment Modes (matching backend API)
  PAYMENT_MODES: {
    CASH: 'CASH',
    BANK: 'BANK',
    CREDIT: 'CREDIT',
  },
};
