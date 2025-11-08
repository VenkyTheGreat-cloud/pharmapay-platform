import Constants from 'expo-constants';

// API Configuration
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000/api';

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
  },

  // Order Status
  ORDER_STATUS: {
    NEW: 'new',
    ASSIGNED: 'assigned',
    PICKED_UP: 'picked_up',
    IN_TRANSIT: 'in_transit',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
  },

  // Payment Modes
  PAYMENT_MODES: {
    CASH: 'cash',
    BANK: 'bank',
    SPLIT: 'split',
  },
};
