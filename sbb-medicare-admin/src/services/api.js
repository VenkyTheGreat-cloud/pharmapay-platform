import axios from 'axios';

// Flip this flag to false when you want to use the real backend.
const USE_MOCK_API = false;

// Base URL for SBB Medicare backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://sbb-medicare-api.onrender.com/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle 401 / auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (window.location.pathname !== '/login') {
            window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// --------------------
// REAL API IMPLEMENTATIONS
// --------------------

const realAuthAPI = {
    login: ({ mobileEmail, password }) =>
        api.post('/auth/login', { mobileEmail, password, dashboardType: 'admin' }),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data) => api.put('/auth/profile', data),
    changePassword: (data) => api.post('/auth/change-password', data),
    logout: () => api.post('/auth/logout'),
    verifyToken: () => api.get('/auth/verify'),
};

const realCustomersAPI = {
    getAll: (params) => api.get('/customer', { params }), // Changed from /customers to /customer
    search: (search, extraParams = {}) =>
        api.get('/customer', { params: { search, ...extraParams } }), // Changed from /customers to /customer
    getById: (id) => api.get(`/customer/${id}`), // Changed from /customers to /customer
    getByMobile: (mobile) => api.get(`/customer/mobile/${mobile}`), // Changed from /customers to /customer
    create: (data) => api.post('/customer', data), // Changed from /customers to /customer
    update: (id, data) => api.put(`/customer/${id}`, data), // Changed from /customers to /customer
    delete: (id) => api.delete(`/customer/${id}`), // Changed from /customers to /customer
    getOrdersForCustomer: (id) => api.get(`/customer/${id}/orders`), // Changed from /customers to /customer
};

const realOrdersAPI = {
    getAll: (params) => api.get('/orders', { params }),
    getToday: (params) => api.get('/orders/today', { params }),
    getOngoing: (params) => api.get('/orders/ongoing', { params }),
    getById: (id) => api.get(`/orders/${id}`),
    create: (data) => api.post('/orders', data),
    assign: (id, deliveryBoyId) =>
        api.post(`/orders/${id}/assign`, { deliveryBoyId }),
    updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
    updateLocation: (id, data) => api.post(`/orders/${id}/location`, data),
    getByCustomerMobile: (mobile) =>
        api.get(`/orders/customer/${mobile}`),
};

const realPaymentsAPI = {
    collect: (data) => api.post('/payments/collect', data),
    split: (data) => api.post('/payments/split', data),
    getByOrderId: (orderId) => api.get(`/payments/order/${orderId}`),
};

const realDeliveryBoysAPI = {
    getAll: (params) => api.get('/delivery-boys', { params }),
    getApproved: () => api.get('/delivery-boys/approved'),
    getById: (id) => api.get(`/delivery-boys/${id}`),
    create: (data) => api.post('/delivery-boys', data),
    update: (id, data) => api.put(`/delivery-boys/${id}`, data),
    delete: (id) => api.delete(`/delivery-boys/${id}`),
    approve: (id) => api.patch(`/delivery-boys/${id}/approve`),
    toggleActive: (id, isActive) =>
        api.patch(`/delivery-boys/${id}/toggle-active`, { isActive }),
    updateAvailability: (id, isAvailable) =>
        api.patch(`/delivery-boys/${id}/availability`, { isAvailable }),
};

const realAccessControlAPI = {
    getAll: () => api.get('/access-control'),
    getById: (id) => api.get(`/access-control/${id}`),
    create: (data) => api.post('/access-control', data),
    update: (id, data) => api.put(`/access-control/${id}`, data),
    delete: (id) => api.delete(`/access-control/${id}`),
    toggleActive: (id, isActive) =>
        api.patch(`/access-control/${id}/toggle-active`, { isActive }),
};

const realConfigAPI = {
    get: () => api.get('/config'),
};

// --------------------
// MOCK API IMPLEMENTATIONS (NO NETWORK CALLS)
// --------------------

const mockUser = {
    id: 101,
    name: 'Ravi Kumar',
    storeName: 'SBB Pharmacy - HSR',
    mobile: '9876543210',
    email: 'ravi@sbbmedicare.com',
    address: '12th Main, HSR Layout, Bangalore',
    role: 'store_manager',
    isActive: true,
    createdAt: '2025-11-24T10:15:00Z',
    updatedAt: '2025-11-24T12:12:00Z',
};

let mockCustomers = [
    {
        id: 3001,
        name: 'Anita Sharma',
        mobile: '9123456789',
        address: '301, 7th Cross, Koramangala',
        landmark: 'Near Forum Mall',
        orderCount: 4,
        createdAt: '2025-01-10T08:30:00Z',
        updatedAt: '2025-11-10T10:45:00Z',
    },
];

let mockDeliveryBoys = [
    {
        id: 501,
        name: 'Sanjay Verma',
        mobile: '9988776655',
        email: 'sanjay@sbbmedicare.com',
        address: 'BTM Layout, Bangalore',
        photoUrl: 'https://cdn.sbbmedicare.com/profiles/sanjay.jpg',
        status: 'approved',
        isActive: true,
        createdAt: '2025-11-23T09:00:00Z',
        updatedAt: '2025-11-24T12:00:00Z',
    },
];

let mockStoreManagers = [
    {
        id: 201,
        name: 'Priya Menon',
        email: 'priya@sbbmedicare.com',
        mobile: '9000012345',
        storeName: 'SBB Pharmacy - Koramangala',
        address: 'NGV Complex Road',
        isActive: true,
        createdAt: '2025-05-01T09:00:00Z',
    },
];

let mockOrders = [
    {
        id: 9001,
        orderNumber: 'ORD-2025-0001',
        customerId: 3001,
        customerName: 'Anita Sharma',
        customerMobile: '9123456789',
        deliveryBoyId: 501,
        deliveryBoyName: 'Sanjay Verma',
        deliveryBoyMobile: '9988776655',
        status: 'ASSIGNED',
        amount: 1240.5,
        paymentMode: 'CASH',
        paymentStatus: 'PENDING',
        customerComments: 'Deliver before 8 PM',
        address: '301, 7th Cross, Koramangala',
        createdTime: '2025-11-24T09:30:00Z',
        updatedAt: '2025-11-24T10:45:00Z',
        deliveredAt: null,
        items: [
            {
                id: 1,
                name: 'Metformin 500mg',
                quantity: 2,
                price: 150.25,
                total: 300.5,
            },
            {
                id: 2,
                name: 'Vitamin D3',
                quantity: 1,
                price: 250.0,
                total: 250.0,
            },
        ],
    },
    {
        id: 9002,
        orderNumber: 'ORD-2025-0002',
        customerId: 3001,
        customerName: 'Anita Sharma',
        customerMobile: '9123456789',
        deliveryBoyId: 501,
        deliveryBoyName: 'Sanjay Verma',
        deliveryBoyMobile: '9988776655',
        status: 'DELIVERED',
        amount: 890.0,
        paymentMode: 'SPLIT',
        paymentStatus: 'CONFIRMED',
        customerComments: 'Ring the bell once',
        address: '301, 7th Cross, Koramangala',
        createdTime: '2025-11-23T15:10:00Z',
        updatedAt: '2025-11-23T16:00:00Z',
        deliveredAt: '2025-11-23T15:50:00Z',
        items: [
            {
                id: 3,
                name: 'Paracetamol 650mg',
                quantity: 1,
                price: 120.0,
                total: 120.0,
            },
            {
                id: 4,
                name: 'Cough Syrup',
                quantity: 2,
                price: 385.0,
                total: 770.0,
            },
        ],
    },
];

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

const mockAuthAPI = {
    login: async () => {
        await delay();
        return {
            data: {
                success: true,
                data: {
                    token: 'mock-token',
                    refreshToken: 'mock-refresh-token',
                    user: mockUser,
                },
            },
        };
    },
    getProfile: async () => {
        await delay();
        return { data: { success: true, data: mockUser } };
    },
    updateProfile: async (data) => {
        await delay();
        Object.assign(mockUser, data);
        return { data: { success: true, data: mockUser } };
    },
    changePassword: async () => {
        await delay();
        return { data: { success: true, message: 'Password changed successfully' } };
    },
    logout: async () => {
        await delay();
        return { data: { success: true, message: 'Logged out successfully' } };
    },
    verifyToken: async () => {
        await delay();
        return { data: { success: true, data: mockUser } };
    },
};

const mockCustomersAPI = {
    getAll: async () => {
        await delay();
        return {
            data: {
                success: true,
                data: {
                    data: mockCustomers,
                    pagination: {
                        total: mockCustomers.length,
                        page: 1,
                        limit: 50,
                        totalPages: 1,
                    },
                },
            },
        };
    },
    search: async () => {
        // For now just return all
        return mockCustomersAPI.getAll();
    },
    getById: async (id) => {
        await delay();
        const found = mockCustomers.find((c) => c.id === id) || mockCustomers[0];
        return { data: { success: true, data: found } };
    },
    getByMobile: async (mobile) => {
        await delay();
        const found = mockCustomers.find((c) => c.mobile === mobile) || mockCustomers[0];
        return { data: { success: true, data: found } };
    },
    create: async (data) => {
        await delay();
        const newCustomer = {
            ...data,
            id: Date.now(),
            orderCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        mockCustomers.push(newCustomer);
        return { data: { success: true, data: newCustomer } };
    },
    update: async (id, data) => {
        await delay();
        mockCustomers = mockCustomers.map((c) =>
            c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c
        );
        const updated = mockCustomers.find((c) => c.id === id);
        return { data: { success: true, data: updated } };
    },
    delete: async (id) => {
        await delay();
        mockCustomers = mockCustomers.filter((c) => c.id !== id);
        return { data: { success: true, message: 'Customer deleted successfully' } };
    },
    getOrdersForCustomer: async (id) => {
        await delay();
        const customer = mockCustomers.find((c) => c.id === id) || mockCustomers[0];
        return {
            data: {
                success: true,
                data: {
                    customer,
                    orders: mockOrders.filter((o) => o.customerId === customer.id),
                },
            },
        };
    },
};

const mockOrdersAPI = {
    getAll: async () => {
        await delay();
        return {
            data: {
                success: true,
                data: {
                    orders: mockOrders,
                    pagination: {
                        total: mockOrders.length,
                        page: 1,
                        limit: 20,
                        totalPages: 1,
                    },
                },
            },
        };
    },
    getToday: async () => mockOrdersAPI.getAll(),
    getOngoing: async () => mockOrdersAPI.getAll(),
    getById: async (id) => {
        await delay();
        const found = mockOrders.find((o) => o.id === id) || mockOrders[0];
        return { data: { success: true, data: found } };
    },
    create: async (data) => {
        await delay();
        const newOrder = {
            ...data,
            id: Date.now(),
            orderNumber: `ORD-${Date.now()}`,
            createdTime: new Date().toISOString(),
            status: 'ASSIGNED',
        };
        mockOrders.push(newOrder);
        return { data: { success: true, data: newOrder } };
    },
    assign: async () => {
        await delay();
        return {
            data: {
                success: true,
                message: 'Order assigned successfully',
            },
        };
    },
    updateStatus: async () => {
        await delay();
        return {
            data: {
                success: true,
                message: 'Order status updated successfully',
            },
        };
    },
    updateLocation: async () => {
        await delay();
        return {
            data: {
                success: true,
                message: 'Location updated successfully',
            },
        };
    },
    getByCustomerMobile: async () => {
        await delay();
        return {
            data: {
                success: true,
                data: mockOrders,
            },
        };
    },
};

const mockPaymentsAPI = {
    getByOrderId: async () => {
        await delay();
        return {
            data: {
                success: true,
                data: null,
            },
        };
    },
    collect: async () => {
        await delay();
        return {
            data: {
                success: true,
                message: 'Payment collected successfully',
            },
        };
    },
    split: async () => {
        await delay();
        return {
            data: {
                success: true,
                message: 'Split payment collected successfully',
            },
        };
    },
};

const mockDeliveryBoysAPI = {
    getAll: async () => {
        await delay();
        return {
            data: {
                success: true,
                data: mockDeliveryBoys,
            },
        };
    },
    getById: async (id) => {
        await delay();
        const found = mockDeliveryBoys.find((b) => b.id === id) || mockDeliveryBoys[0];
        return { data: { success: true, data: found } };
    },
    create: async (data) => {
        await delay();
        const newBoy = {
            ...data,
            id: Date.now(),
            status: 'approved',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        mockDeliveryBoys.push(newBoy);
        return { data: { success: true, data: newBoy } };
    },
    update: async (id, data) => {
        await delay();
        mockDeliveryBoys = mockDeliveryBoys.map((b) =>
            b.id === id ? { ...b, ...data, updatedAt: new Date().toISOString() } : b
        );
        const updated = mockDeliveryBoys.find((b) => b.id === id);
        return { data: { success: true, data: updated } };
    },
    delete: async (id) => {
        await delay();
        mockDeliveryBoys = mockDeliveryBoys.filter((b) => b.id !== id);
        return { data: { success: true, message: 'Delivery boy deleted successfully' } };
    },
    approve: async () => {
        await delay();
        return { data: { success: true, message: 'Delivery boy approved successfully' } };
    },
    toggleActive: async (id, isActive) => {
        await delay();
        mockDeliveryBoys = mockDeliveryBoys.map((b) =>
            b.id === id ? { ...b, isActive } : b
        );
        return { data: { success: true, message: 'Status updated successfully' } };
    },
    updateAvailability: async () => {
        await delay();
        return { data: { success: true, message: 'Availability updated successfully' } };
    },
};

const mockAccessControlAPI = {
    getAll: async () => {
        await delay();
        return {
            data: {
                success: true,
                data: mockStoreManagers,
            },
        };
    },
    create: async (data) => {
        await delay();
        const newManager = {
            ...data,
            id: Date.now(),
            isActive: true,
            createdAt: new Date().toISOString(),
        };
        mockStoreManagers.push(newManager);
        return { data: { success: true, data: newManager } };
    },
    update: async (id, data) => {
        await delay();
        mockStoreManagers = mockStoreManagers.map((m) =>
            m.id === id ? { ...m, ...data } : m
        );
        const updated = mockStoreManagers.find((m) => m.id === id);
        return { data: { success: true, data: updated } };
    },
    delete: async (id) => {
        await delay();
        mockStoreManagers = mockStoreManagers.filter((m) => m.id !== id);
        return { data: { success: true, message: 'Store manager deleted successfully' } };
    },
    toggleActive: async (id, isActive) => {
        await delay();
        mockStoreManagers = mockStoreManagers.map((m) =>
            m.id === id ? { ...m, isActive } : m
        );
        return { data: { success: true, message: 'Status updated successfully' } };
    },
};

const mockConfigAPI = {
    get: async () => {
        await delay();
        return {
            data: {
                success: true,
                data: {
                    qrMerchantVPA: 'sbbmedicare@paytm',
                    support: {
                        phone: '+91-9876543210',
                        email: 'support@sbbmedicare.com',
                    },
                    features: {
                        enableLocationTracking: true,
                        enableReceiptUpload: true,
                        enableSplitPayment: true,
                    },
                },
            },
        };
    },
};

// --------------------
// PUBLIC EXPORTS (choose mock vs real)
// --------------------

export const authAPI = USE_MOCK_API ? mockAuthAPI : realAuthAPI;
export const customersAPI = USE_MOCK_API ? mockCustomersAPI : realCustomersAPI;
export const ordersAPI = USE_MOCK_API ? mockOrdersAPI : realOrdersAPI;
export const paymentsAPI = USE_MOCK_API ? mockPaymentsAPI : realPaymentsAPI;
export const deliveryBoysAPI = USE_MOCK_API ? mockDeliveryBoysAPI : realDeliveryBoysAPI;
export const accessControlAPI = USE_MOCK_API ? mockAccessControlAPI : realAccessControlAPI;
export const configAPI = USE_MOCK_API ? mockConfigAPI : realConfigAPI;

export default api;
