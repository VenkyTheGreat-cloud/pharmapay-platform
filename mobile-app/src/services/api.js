import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CONFIG from '../config/api';

// ============================================
// 🔴 DISABLE REAL API - USE MOCK DATA ONLY
// ============================================
const USE_MOCK = false; // Set to false only when backend is ready

// ============================================
// MOCK DATA
// ============================================
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let mockUser = {
  id: 1,
  name: 'Test Delivery Boy',
  mobile: '9876543210',
  email: 'delivery@test.com',
  address: 'Test Address, City',
  role: 'delivery_boy',
};

let mockOrders = [
  {
    id: 101,
    orderNumber: 'ORD-1-001',
    customer_name: 'John Customer',
    customer_phone: '9999999999',
    customer_address: '123 Main St, City',
    customer_lat: 12.9715987,
    customer_lng: 77.5945627,
    amount: 1500.0,
    status: 'ASSIGNED',
    paymentMode: 'CASH',
    paymentStatus: 'PENDING',
    customerComments: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 102,
    orderNumber: 'ORD-1-002',
    customer_name: 'Jane Doe',
    customer_phone: '8888888888',
    customer_address: '456 Market Rd, City',
    customer_lat: 12.9715987,
    customer_lng: 77.5945627,
    amount: 900.0,
    status: 'IN_TRANSIT',
    paymentMode: 'BANK_TRANSFER',
    paymentStatus: 'PENDING',
    customerComments: 'Call on arrival',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let mockPayments = [];

// ============================================
// MOCK API SERVICE (NO REAL API CALLS)
// ============================================
const mockApiService = {
  // Auth
  login: async (emailOrMobile, password) => {
    console.log('🔵 MOCK API: Login called - email/mobile:', emailOrMobile);
    console.log('🔵 MOCK API: Password provided:', password ? 'Yes' : 'No');
    await delay(500);

    // Always return success - no validation needed
    const response = {
      data: {
        token: 'mock-jwt-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
        user: {
          ...mockUser,
          email: emailOrMobile || 'test@example.com',
          mobile: emailOrMobile || '9876543210',
        },
      },
    };

    console.log('✅ MOCK API: Login successful - returning mock user');
    return response;
  },

  register: async (data) => {
    console.log('🔵 MOCK API: Register called');
    await delay(800);
    return {
      data: {
        message: 'Registration successful. Pending approval.',
        data: {
          id: 2,
          name: data.name,
          mobile: data.mobile || '9876543211',
          status: 'pending',
        },
      },
    };
  },

  getProfile: async () => {
    console.log('🔵 MOCK API: GetProfile called');
    await delay(300);
    return { data: mockUser };
  },

  updateProfile: async (data) => {
    console.log('🔵 MOCK API: UpdateProfile called');
    await delay(500);
    mockUser = { ...mockUser, ...data };
    return { data: mockUser };
  },

  changePassword: async (oldPassword, newPassword) => {
    console.log('🔵 MOCK API: ChangePassword called');
    await delay(400);
    return { data: { success: true, message: 'Password changed successfully' } };
  },

  // Orders
  getMyOrders: async (status = null) => {
    console.log('🔵 MOCK API: GetMyOrders called - status:', status);
    await delay(500);
    let orders = [...mockOrders];
    if (status) {
      orders = orders.filter((o) => o.status === status);
    }
    // Sort: IN_TRANSIT orders first
    orders.sort((a, b) => {
      if (a.status === 'IN_TRANSIT') return -1;
      if (b.status === 'IN_TRANSIT') return 1;
      return 0;
    });
    return { data: orders };
  },

  getOrderById: async (id) => {
    console.log('🔵 MOCK API: GetOrderById called - id:', id);
    await delay(400);
    const order = mockOrders.find((o) => o.id === parseInt(id));
    if (!order) {
      throw new Error('Order not found');
    }
    return { data: order };
  },

  updateOrderStatus: async (id, status, notes = '', returnItemsPhotoUri = null) => {
    console.log('🔵 MOCK API: UpdateOrderStatus called - id:', id, 'status:', status);
    if (returnItemsPhotoUri) {
      console.log('🔵 MOCK API: Return items photo provided:', returnItemsPhotoUri);
    }
    await delay(400);
    mockOrders = mockOrders.map((o) =>
      o.id === parseInt(id)
        ? {
          ...o,
          status,
          updated_at: new Date().toISOString(),
          notes,
          return_items_photo_url: returnItemsPhotoUri ? 'mock-url-for-photo' : o.return_items_photo_url,
        }
        : o
    );
    return { data: mockOrders.find((o) => o.id === parseInt(id)) };
  },

  getOrderHistory: async () => {
    await delay(300);
    return { data: [] };
  },

  // Payments
  createPayment: async (data) => {
    console.log('🔵 MOCK API: CreatePayment called');
    await delay(600);
    const payment = {
      id: mockPayments.length + 1,
      orderId: data.orderId,
      paymentMode: data.paymentMode,
      cashAmount: data.cashAmount || data.amount || 0,
      bankAmount: data.bankAmount || 0,
      transactionReference: data.transactionReference || null,
      receiptPhotoUrl: data.receiptPhotoUrl || data.receipt_photo || null,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };
    mockPayments.push(payment);
    return { data: payment };
  },

  getMyPayments: async () => {
    await delay(300);
    return { data: mockPayments };
  },

  getPaymentStatistics: async () => {
    await delay(300);
    const total = mockPayments.reduce(
      (sum, p) => sum + (p.cashAmount || 0) + (p.bankAmount || 0),
      0
    );
    return { data: { total } };
  },

  // Customers
  getCustomerById: async (id) => {
    await delay(300);
    return {
      data: {
        id,
        name: 'Mock Customer',
        mobile: '9999999999',
        address: 'Mock Address',
        landmark: 'Near Park',
        storeId: 1,
      },
    };
  },

  updateCustomer: async (id, data) => {
    await delay(300);
    return {
      data: {
        id,
        ...data,
      },
    };
  },

  // File Upload
  uploadFile: async (uri) => {
    console.log('🔵 MOCK API: UploadFile called');
    await delay(500);
    return {
      data: {
        url: uri || 'https://example.com/mock-receipt.jpg',
      },
    };
  },
};

// ============================================
// REAL API SERVICE (DISABLED WHEN USE_MOCK = true)
// ============================================
const api = axios.create({
  baseURL: CONFIG.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(
  async (config) => {
    if (USE_MOCK) {
      console.error('🚫 ERROR: Real API call attempted but USE_MOCK is true!');
      console.error('🚫 This should never happen - check apiService implementation');
      throw new Error('Real API calls are disabled. USE_MOCK is set to true.');
    }
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
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user']);
    }
    return Promise.reject(error);
  }
);

const realApiService = {
  login: (mobileEmail, password) =>
    api.post(CONFIG.ENDPOINTS.LOGIN, { mobileEmail, password }),

  register: (data) => api.post(CONFIG.ENDPOINTS.REGISTER, data),

  getProfile: () => api.get(CONFIG.ENDPOINTS.PROFILE),

  updateProfile: (data) => api.put(CONFIG.ENDPOINTS.PROFILE, data),

  changePassword: (oldPassword, newPassword) =>
    api.post(CONFIG.ENDPOINTS.CHANGE_PASSWORD, { oldPassword, newPassword }),

  getMyOrders: (status = null) => {
    const params = status ? { status } : {};
    return api.get(CONFIG.ENDPOINTS.MY_ORDERS, { params });
  },

  getOrderById: (id) => api.get(CONFIG.ENDPOINTS.ORDER_BY_ID(id)),

  updateOrderStatus: (id, status, notes = '', returnItemsPhotoUri = null) => {
    if (returnItemsPhotoUri) {
      const formData = new FormData();
      formData.append('status', status);
      formData.append('notes', notes);

      const filename = returnItemsPhotoUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('returnItemsPhoto', {
        uri: returnItemsPhotoUri,
        name: filename,
        type,
      });

      return api.put(CONFIG.ENDPOINTS.UPDATE_ORDER_STATUS(id), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.put(CONFIG.ENDPOINTS.UPDATE_ORDER_STATUS(id), { status, notes });
  },

  getOrderHistory: (id) => api.get(CONFIG.ENDPOINTS.ORDER_HISTORY(id)),

  createPayment: (data) => api.post(CONFIG.ENDPOINTS.PAYMENTS, data),

  getMyPayments: () => api.get(CONFIG.ENDPOINTS.MY_PAYMENTS),

  getPaymentStatistics: () => api.get(CONFIG.ENDPOINTS.PAYMENT_STATISTICS),

  getCustomerById: (id) => api.get(CONFIG.ENDPOINTS.CUSTOMER_BY_ID(id)),

  updateCustomer: (id, data) => api.put(CONFIG.ENDPOINTS.CUSTOMER_BY_ID(id), data),

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

// ============================================
// PHARMACY API SERVICE
// ============================================
const realPharmacyAPI = {
  signup: (data) => api.post('/pharmacies/signup', data),
  checkSlug: (slug) => api.get(`/pharmacies/check-slug/${slug}`),
  getMyPharmacy: () => api.get('/pharmacies/mine'),
  updateConfig: (data) => api.put('/pharmacies/mine/config', data),
  updateBranding: (data) => api.put('/pharmacies/mine/branding', data),
  uploadLogo: (formData) =>
    api.post('/pharmacies/mine/branding/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateAppName: (appName) => api.put('/pharmacies/mine/app-name', { app_name: appName }),
  initiatePayment: () => api.post('/pharmacies/mine/pay'),
  getBuildStatus: () => api.get('/pharmacies/mine/build-status'),

  // Admin methods
  listAllPharmacies: () => api.get('/pharmacies'),
  approvePharmacy: (id) => api.put(`/pharmacies/${id}/approve`),
  rejectPharmacy: (id, reason) => api.put(`/pharmacies/${id}/reject`, { reason }),

  // Admin dashboard analytics
  getRevenueSummary: () => api.get('/admin-dashboard/revenue/summary'),
  getRevenueTransactions: () => api.get('/admin-dashboard/revenue/transactions'),
  getPharmacyAnalytics: () => api.get('/admin-dashboard/analytics/pharmacies'),
  getOnboardingFunnel: () => api.get('/admin-dashboard/analytics/onboarding-funnel'),
  getDeliveryBoyOverview: () => api.get('/admin-dashboard/analytics/delivery-boys'),
  listDeliveryBoys: () => api.get('/delivery-boys'),
  approveDeliveryBoy: (id) => api.patch(`/delivery-boys/${id}/approve`),
  getPaymentHistory: () => api.get('/admin-dashboard/payments/history'),
  getPaymentSummary: () => api.get('/admin-dashboard/payments/summary'),
};

const mockPharmacyAPI = {
  signup: async (data) => {
    await delay(800);
    return { data: { token: 'mock-pharmacy-token-' + Date.now(), pharmacy: { id: 1, name: data.pharmacyName, slug: data.slug } } };
  },
  checkSlug: async (slug) => {
    await delay(400);
    return { data: { available: slug !== 'taken-slug' } };
  },
  getMyPharmacy: async () => {
    await delay(300);
    return { data: { id: 1, name: 'Mock Pharmacy', plan: 'starter', features: {}, status: 'pending_approval' } };
  },
  updateConfig: async (data) => { await delay(500); return { data: { success: true } }; },
  updateBranding: async (data) => { await delay(500); return { data: { success: true } }; },
  uploadLogo: async () => { await delay(500); return { data: { url: 'https://example.com/logo.png' } }; },
  updateAppName: async (appName) => { await delay(300); return { data: { success: true } }; },
  initiatePayment: async () => { await delay(500); return { data: { paymentUrl: 'https://pay.swinkpay.com/mock' } }; },
  getBuildStatus: async () => { await delay(300); return { data: { status: 'pending_approval' } }; },
};

// ============================================
// EXPORT - MOCK OR REAL
// ============================================
const apiService = USE_MOCK ? mockApiService : realApiService;
export const pharmacyAPI = USE_MOCK ? mockPharmacyAPI : realPharmacyAPI;

// Big warning in console
if (USE_MOCK) {
  console.log('========================================');
  console.log('✅ MOCK API ENABLED - NO BACKEND REQUIRED');
  console.log('✅ All API calls will return mock data');
  console.log('✅ Login will work with ANY credentials');
  console.log('========================================');
} else {
  console.log('🌐 REAL API ENABLED - Backend connection active');
}

export { api as apiAxios };
export default apiService;
