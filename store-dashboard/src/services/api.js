import axios from 'axios';

// Toggle for UI-only mode (no real API calls)
// Set VITE_API_DISABLED=true in .env to run with mock data
const API_DISABLED = import.meta.env.VITE_API_DISABLED === 'true';

// Backend base URL (Play Framework API)
// Default: https://pharmapay-api.onrender.com/api
// For local development, set VITE_API_URL=http://localhost:9000/api in .env
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
        // Don't set Content-Type for blob requests (let browser set it)
        if (config.responseType === 'blob') {
            delete config.headers['Content-Type'];
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle 401/403 and normalize errors
api.interceptors.response.use(
    (response) => {
        // For blob responses, ensure the blob has the correct type from response headers
        if (response.config?.responseType === 'blob' && response.data instanceof Blob) {
            const contentType = response.headers['content-type'] ||
                response.headers['Content-Type'] ||
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

            // If blob type doesn't match the content-type header, recreate it
            if (response.data.type !== contentType && contentType.includes('spreadsheet')) {
                response.data = new Blob([response.data], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });
            }
        }
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Unauthorized - token missing or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
        } else if (error.response?.status === 403) {
            // Forbidden - token valid but insufficient permissions
            // Log the error but don't auto-redirect (let the component handle it)
            console.error('403 Forbidden - Access denied:', error.response?.data);
        }
        return Promise.reject(error);
    }
);

// Simple helpers for mock responses
const mockResolve = (data) => Promise.resolve({ data });

/**
 * Validates if an ID is a valid positive integer.
 * Prevents "undefined" or non-numeric values from being sent to strict backend endpoints.
 */
const isValidId = (id) => {
    if (id === null || id === undefined) return false;
    const num = Number(id);
    return Number.isInteger(num) && num > 0;
};

const invalidIdReject = (id) => {
    console.error(`Invalid ID blocked locally: ${id}`);
    return Promise.reject({
        response: {
            status: 400,
            data: {
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: `Invalid ID format: ${id}. Please check if the source data is loaded correctly.`
                }
            }
        }
    });
};

// Auth API (Play backend spec)
export const authAPI = {
    // credentials: { mobileEmail, password }
    login: (credentials) => {
        if (API_DISABLED) {
            // Accept any credentials in mock mode
            return mockResolve({
                success: true,
                data: {
                    token: 'mock-token',
                    refreshToken: 'mock-refresh-token',
                    user: {
                        id: 1,
                        name: 'Mock Store Manager',
                        storeName: 'Mock Store',
                        mobile: credentials.mobileEmail,
                        email: 'store@pharmapay.com',
                        address: '123 Mock Street',
                        role: 'store_manager',
                    },
                },
            });
        }
        return api.post('/auth/login', credentials);
    },
    getProfile: () => {
        if (API_DISABLED) {
            const savedUser = localStorage.getItem('user');
            return mockResolve({
                success: true,
                data: savedUser ? JSON.parse(savedUser) : null,
            });
        }
        return api.get('/auth/profile');
    },
    updateProfile: (data) => {
        if (API_DISABLED) {
            const savedUser = localStorage.getItem('user');
            const user = savedUser ? { ...JSON.parse(savedUser), ...data } : data;
            localStorage.setItem('user', JSON.stringify(user));
            return mockResolve({ success: true, data: user });
        }
        return api.put('/auth/profile', data);
    },
    changePassword: (data) => {
        if (API_DISABLED) {
            return mockResolve({
                success: true,
                message: 'Password changed successfully (mock)',
                data: null,
            });
        }
        return api.post('/auth/change-password', data);
    },
    changePassword: (data) => {
        if (API_DISABLED) {
            return mockResolve({ success: true, message: 'Password changed (mock)' });
        }
        return api.post('/auth/change-password', data);
    },
};

// Delivery Boys API
export const deliveryBoysAPI = {
    // List delivery boys with optional filters: status, isActive
    list: (params) => {
        if (API_DISABLED) {
            const all = [
                {
                    id: 1,
                    name: 'Raj Kumar',
                    mobile: '9876543211',
                    email: 'raj@example.com',
                    status: 'approved',
                    isActive: true,
                    createdAt: new Date().toISOString(),
                },
                {
                    id: 2,
                    name: 'Pending Boy',
                    mobile: '9876543212',
                    email: 'pending@example.com',
                    status: 'pending',
                    isActive: false,
                    createdAt: new Date().toISOString(),
                },
            ];
            let filtered = all;
            if (params?.status) {
                filtered = filtered.filter((b) => b.status === params.status);
            }
            if (typeof params?.isActive === 'boolean') {
                filtered = filtered.filter((b) => b.isActive === params.isActive);
            }
            return mockResolve({ success: true, data: filtered });
        }
        return api.get('/delivery-boys', { params });
    },
    // Approved + active list for assignment dropdown
    listApproved: () => {
        if (API_DISABLED) {
            return mockResolve({
                success: true,
                data: [
                    {
                        id: 1,
                        name: 'Raj Kumar',
                        mobile: '9876543211',
                        email: 'raj@example.com',
                        status: 'approved',
                        isActive: true,
                        createdAt: new Date().toISOString(),
                    },
                ],
            });
        }
        return api.get('/delivery-boys/approved');
    },
    getById: (id) => {
        if (!isValidId(id)) return invalidIdReject(id);
        if (API_DISABLED) {
            return mockResolve({
                success: true,
                data: {
                    id,
                    name: 'Mock Delivery Boy',
                    mobile: '9876543211',
                    email: 'dboy@example.com',
                    status: 'approved',
                    isActive: true,
                },
            });
        }
        return api.get(`/delivery-boys/${id}`);
    },
    create: (data) => {
        if (API_DISABLED) {
            return mockResolve({ success: true, data: { id: Date.now(), ...data, status: 'pending', isActive: false } });
        }
        return api.post('/delivery-boys', data);
    },
    update: (id, data) => {
        if (!isValidId(id)) return invalidIdReject(id);
        if (API_DISABLED) {
            return mockResolve({ success: true, data: { id, ...data } });
        }
        return api.put(`/delivery-boys/${id}`, data);
    },
    delete: (id) => {
        if (!isValidId(id)) return invalidIdReject(id);
        if (API_DISABLED) {
            return mockResolve({ success: true, message: 'Deleted (mock)' });
        }
        return api.delete(`/delivery-boys/${id}`);
    },
    approve: (id) => {
        if (!isValidId(id)) return invalidIdReject(id);
        if (API_DISABLED) {
            return mockResolve({ success: true, message: 'Approved (mock)' });
        }
        return api.patch(`/delivery-boys/${id}/approve`);
    },
    toggleActive: (id, isActive) => {
        if (!isValidId(id)) return invalidIdReject(id);
        if (API_DISABLED) {
            return mockResolve({ success: true, message: 'Status updated (mock)', data: { id, isActive } });
        }
        return api.patch(`/delivery-boys/${id}/toggle-active`, { isActive });
    },
};

// Customers API
export const customersAPI = {
    // GET /customers?search=&page=&limit=
    getAll: (params) => {
        if (API_DISABLED) {
            return mockResolve({
                success: true,
                data: {
                    data: [
                        {
                            id: 1,
                            name: 'John Customer',
                            mobile: '9876543210',
                            address: '123 Main St',
                            landmark: 'Near Park',
                            createdAt: new Date().toISOString(),
                        },
                    ],
                    pagination: { total: 1, page: 1, limit: 50, totalPages: 1 },
                },
            });
        }
        return api.get('/customers', { params });
    },
    // Convenience search wrapper using ?search=
    search: (search) => {
        if (API_DISABLED) {
            return customersAPI.getAll({ search });
        }
        return api.get('/customers', { params: { search } });
    },
    getById: (id) => {
        if (!isValidId(id)) return invalidIdReject(id);
        if (API_DISABLED) {
            return mockResolve({
                success: true,
                data: {
                    id,
                    name: 'John Customer',
                    mobile: '9876543210',
                    address: '123 Main St',
                    landmark: 'Near Park',
                    createdAt: new Date().toISOString(),
                },
            });
        }
        return api.get(`/customers/${id}`);
    },
    create: (data) => {
        if (API_DISABLED) {
            return mockResolve({ success: true, data: { id: Date.now(), ...data } });
        }
        return api.post('/customers', data);
    },
    update: (id, data) => {
        if (!isValidId(id)) return invalidIdReject(id);
        if (API_DISABLED) {
            return mockResolve({ success: true, data: { id, ...data } });
        }
        return api.put(`/customers/${id}`, data);
    },
    delete: (id) => {
        if (!isValidId(id)) return invalidIdReject(id);
        if (API_DISABLED) {
            return mockResolve({ success: true, message: 'Customer deleted (mock)' });
        }
        return api.delete(`/customers/${id}`);
    },
};

// Orders API
export const ordersAPI = {
    // GET /orders with filters: status, date, page, limit
    getAll: (params) => {
        if (API_DISABLED) {
            return mockResolve({
                success: true,
                data: {
                    orders: [
                        {
                            id: 1,
                            orderNumber: 'ORD-1-001',
                            customerId: 1,
                            customerName: 'John Customer',
                            customerMobile: '9876543210',
                            deliveryBoyId: 1,
                            deliveryBoyName: 'Raj Kumar',
                            deliveryBoyMobile: '9876543211',
                            status: 'ASSIGNED',
                            amount: 1500.0,
                            paymentMode: 'CASH',
                            paymentStatus: 'PENDING',
                            customerComments: 'Handle with care',
                            address: '123 Main St',
                            createdTime: new Date().toISOString(),
                            items: [
                                { id: 1, name: 'Medicine A', quantity: 2, price: 500.0, total: 1000.0 },
                            ],
                        },
                    ],
                    pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
                },
            });
        }
        return api.get('/orders', { params });
    },
    getToday: (params) => {
        if (API_DISABLED) {
            return ordersAPI.getAll(params);
        }
        return api.get('/orders/today', { params });
    },
    getOngoing: (params) => {
        if (API_DISABLED) {
            return ordersAPI.getAll(params);
        }
        return api.get('/orders/ongoing', { params });
    },
    getPendingTillYesterday: (params) => {
        if (API_DISABLED) {
            return mockResolve({
                success: true,
                data: {
                    orders: [],
                    pagination: { total: 0, page: 1, limit: 100, totalPages: 0 },
                },
            });
        }
        return api.get('/orders/pending-till-yesterday', { params });
    },
    getById: (id) => {
        if (!isValidId(id)) return invalidIdReject(id);
        if (API_DISABLED) {
            return mockResolve({
                success: true,
                data: {
                    id,
                    orderNumber: 'ORD-1-001',
                    customerId: 1,
                    customerName: 'John Customer',
                    customerMobile: '9876543210',
                    deliveryBoyId: 1,
                    deliveryBoyName: 'Raj Kumar',
                    deliveryBoyMobile: '9876543211',
                    status: 'ASSIGNED',
                    amount: 1500.0,
                    paymentMode: 'CASH',
                    paymentStatus: 'PENDING',
                    customerComments: 'Handle with care',
                    address: '123 Main St',
                    createdTime: new Date().toISOString(),
                    items: [
                        { id: 1, name: 'Medicine A', quantity: 2, price: 500.0, total: 1000.0 },
                    ],
                },
            });
        }
        return api.get(`/orders/${id}`);
    },
    create: (data) => {
        if (API_DISABLED) {
            return mockResolve({
                success: true,
                message: 'Order created (mock)',
                data: {
                    id: Date.now(),
                    ...data,
                    status: 'ASSIGNED',
                    totalAmount: data.totalAmount || 0,
                    paidAmount: data.paidAmount || 0,
                },
            });
        }
        return api.post('/orders', data);
    },
    // Assign order to delivery boy or mark as received at store
    // If options.customerReceivedAtStore is true, backend should treat as "customer received at store"
    assign: (id, deliveryBoyId, options = {}) => {
        if (!isValidId(id)) return invalidIdReject(id);
        if (API_DISABLED) {
            return mockResolve({
                success: true,
                message: 'Order assigned (mock)',
                data: { assignedBy: 1, assignedByName: 'Mock Manager', assignedTime: new Date().toISOString() },
            });
        }
        const payload = {
            deliveryBoyId,
            ...options,
        };
        return api.post(`/orders/${id}/assign`, payload);
    },
    accept: (id) => {
        if (!isValidId(id)) return invalidIdReject(id);
        if (API_DISABLED) {
            return mockResolve({
                success: true,
                message: 'Order accepted (mock)',
                data: { id, status: 'ACCEPTED' },
            });
        }
        return api.post(`/orders/${id}/accept`);
    },
    reject: (id) => {
        if (!isValidId(id)) return invalidIdReject(id);
        if (API_DISABLED) {
            return mockResolve({
                success: true,
                message: 'Order rejected (mock)',
                data: { id, status: 'REJECTED' },
            });
        }
        return api.post(`/orders/${id}/reject`);
    },
    update: (id, data) => {
        if (!isValidId(id)) return invalidIdReject(id);
        if (API_DISABLED) {
            return mockResolve({ success: true, message: 'Order updated (mock)', data: { id, ...data } });
        }
        // If data contains a file, use FormData for multipart/form-data upload
        if (data.returnItemsPhoto instanceof File) {
            const formData = new FormData();
            Object.keys(data).forEach(key => {
                if (data[key] !== undefined && data[key] !== null) {
                    formData.append(key, data[key]);
                }
            });
            return api.put(`/orders/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        }
        return api.put(`/orders/${id}`, data);
    },
    updateStatus: (id, data) => {
        if (!isValidId(id)) return invalidIdReject(id);
        if (API_DISABLED) {
            return mockResolve({ success: true, message: 'Status updated (mock)', data: { id, ...data } });
        }
        return api.put(`/orders/${id}/status`, data);
    },
    delete: (id) => {
        if (!isValidId(id)) return invalidIdReject(id);
        if (API_DISABLED) {
            return mockResolve({ success: true, message: 'Order deleted (mock)' });
        }
        return api.delete(`/orders/${id}`);
    },
    // GET /orders/export/excel
    // Option 1: Single date with time range: date=YYYY-MM-DD&from_time=HH:MM&to_time=HH:MM
    // Option 2: Date range: date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
    exportExcel: (params) => {
        if (API_DISABLED) {
            // Return a mock blob for testing
            const mockBlob = new Blob(['Mock Excel Data'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            return Promise.resolve({ data: mockBlob });
        }
        return api.get('/orders/export/excel', {
            params,
            responseType: 'blob' // Important: Set responseType to 'blob' for file downloads
        });
    },
    getByCustomerMobile: (mobile, storeId) => {
        if (API_DISABLED) {
            return mockResolve({
                success: true,
                data: [],
            });
        }
        return api.get(`/orders/customer/${mobile}`, { params: storeId ? { storeId } : undefined });
    },
};

// Payments API
export const paymentsAPI = {
    collect: (data) => {
        if (API_DISABLED) {
            return mockResolve({
                success: true,
                message: 'Payment collected (mock)',
                data: { id: Date.now(), ...data, status: 'CONFIRMED', createdAt: new Date().toISOString() },
            });
        }
        return api.post('/payments/collect', data);
    },
    split: (data) => {
        if (API_DISABLED) {
            return mockResolve({
                success: true,
                message: 'Split payment collected (mock)',
                data: { id: Date.now(), ...data, status: 'CONFIRMED', createdAt: new Date().toISOString() },
            });
        }
        return api.post('/payments/split', data);
    },
    getByOrderId: (orderId) => {
        if (API_DISABLED) {
            return mockResolve({
                success: true,
                data: {
                    id: 1,
                    orderId,
                    paymentMode: 'CASH',
                    cashAmount: 1500.0,
                    bankAmount: 0,
                    status: 'CONFIRMED',
                    createdAt: new Date().toISOString(),
                },
            });
        }
        return api.get(`/payments/order/${orderId}`);
    },
};

// Contacts API
export const contactsAPI = {
    // GET /contacts?date=YYYY-MM-DD
    getByDate: (date) => {
        if (API_DISABLED) {
            return mockResolve({
                success: true,
                data: {
                    contacts: [],
                },
            });
        }
        return api.get('/contacts', { params: { date } });
    },
    // POST /contacts - { mobile, date }
    create: (data) => {
        if (API_DISABLED) {
            return mockResolve({
                success: true,
                data: {
                    id: Date.now(),
                    mobile: data.mobile,
                    date: data.date || new Date().toISOString(),
                    created_at: new Date().toISOString(),
                },
            });
        }
        return api.post('/contacts', data);
    },
    // GET /contacts - get all contacts
    getAll: (params) => {
        if (API_DISABLED) {
            return mockResolve({
                success: true,
                data: {
                    contacts: [],
                },
            });
        }
        return api.get('/contacts', { params });
    },
    // DELETE /contacts/:id
    delete: (id) => {
        if (!isValidId(id)) return invalidIdReject(id);
        if (API_DISABLED) {
            return mockResolve({ success: true, message: 'Contact deleted (mock)' });
        }
        return api.delete(`/contacts/${id}`);
    },
};

// Customer Registry API
export const customerRegistryAPI = {
    // POST /customer-registry - { mobile, name, registry_date }
    create: (data) => {
        if (API_DISABLED) {
            return mockResolve({
                success: true,
                data: {
                    id: Date.now(),
                    mobile: data.mobile,
                    name: data.name,
                    registry_date: data.registry_date,
                    created_at: new Date().toISOString(),
                },
            });
        }
        return api.post('/customer-registry', data);
    },
    // GET /customer-registry/with-orders?date=YYYY-MM-DD
    getWithOrders: (date) => {
        if (API_DISABLED) {
            return mockResolve({
                success: true,
                data: {
                    date: date,
                    customers: [],
                    total_registered: 0,
                    total_with_orders: 0,
                    total_without_orders: 0,
                },
            });
        }
        return api.get('/customer-registry/with-orders', { params: { date } });
    },
};

// Reports API
export const reportsAPI = {
    // Delivery Boy Report
    // GET /api/reports/delivery-boy?from_date=YYYY-MM-DD&from_time=HH:MM:SS&to_date=YYYY-MM-DD&to_time=HH:MM:SS&format=excel&delivery_boy_id=1 (optional)
    exportDeliveryBoyReport: (params) => {
        if (API_DISABLED) {
            const mockBlob = new Blob(['Mock Delivery Boy Report'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            return Promise.resolve({ data: mockBlob });
        }
        // Add format=excel parameter
        const requestParams = {
            ...params,
            format: 'excel'
        };
        return api.get('/reports/delivery-boy', {
            params: requestParams,
            responseType: 'blob'
        });
    },

    // Customer Report
    // GET /api/reports/customer?from_date=YYYY-MM-DD&from_time=HH:MM:SS&to_date=YYYY-MM-DD&to_time=HH:MM:SS&format=excel&customer_id=1 (optional)
    exportCustomerReport: (params) => {
        if (API_DISABLED) {
            const mockBlob = new Blob(['Mock Customer Report'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            return Promise.resolve({ data: mockBlob });
        }
        // Add format=excel parameter
        const requestParams = {
            ...params,
            format: 'excel'
        };
        return api.get('/reports/customer', {
            params: requestParams,
            responseType: 'blob'
        });
    },

    // Return Item Report
    // GET /api/reports/return-items?from_date=YYYY-MM-DD&from_time=HH:MM:SS&to_date=YYYY-MM-DD&to_time=HH:MM:SS&format=excel
    exportReturnItemsReport: (params) => {
        if (API_DISABLED) {
            const mockBlob = new Blob(['Mock Return Items Report'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            return Promise.resolve({ data: mockBlob });
        }
        // Add format=excel parameter
        const requestParams = {
            ...params,
            format: 'excel'
        };
        return api.get('/reports/return-items', {
            params: requestParams,
            responseType: 'blob'
        });
    },

    // Orders Report (using existing endpoint)
    // GET /orders/export/excel
    // Option 1: date=YYYY-MM-DD&from_time=HH:MM&to_time=HH:MM
    // Option 2: date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
    exportOrdersReport: (params) => {
        return ordersAPI.exportExcel(params);
    },

    // Sale Report
    // GET /api/reports/sales?from_date=YYYY-MM-DD&from_time=HH:MM:SS&to_date=YYYY-MM-DD&to_time=HH:MM:SS&format=excel
    exportSalesReport: (params) => {
        if (API_DISABLED) {
            const mockBlob = new Blob(['Mock Sales Report'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            return Promise.resolve({ data: mockBlob });
        }
        // Add format=excel parameter
        const requestParams = {
            ...params,
            format: 'excel'
        };
        return api.get('/reports/sales', {
            params: requestParams,
            responseType: 'blob'
        });
    },

    // Day Calls Report
    // GET /api/customer-registry/export/excel?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
    exportDayCallsReport: (params) => {
        if (API_DISABLED) {
            const mockBlob = new Blob(['Mock Day Calls Report'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            return Promise.resolve({ data: mockBlob });
        }
        return api.get('/customer-registry/export/excel', {
            params,
            responseType: 'blob'
        });
    },

    // Pending Orders Report
    // GET /api/orders/pending-till-yesterday/export/excel
    exportPendingOrdersReport: () => {
        if (API_DISABLED) {
            const mockBlob = new Blob(['Mock Pending Orders Report'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            return Promise.resolve({ data: mockBlob });
        }
        return api.get('/orders/pending-till-yesterday/export/excel', {
            responseType: 'blob'
        });
    },
};

export default api;
