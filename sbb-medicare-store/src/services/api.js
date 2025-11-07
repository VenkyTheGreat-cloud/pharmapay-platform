import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data) => api.put('/auth/profile', data),
    changePassword: (data) => api.put('/auth/change-password', data),
};

// Users API
export const usersAPI = {
    getAll: (params) => api.get('/users', { params }),
    getDeliveryBoys: (params) => api.get('/users/delivery-boys', { params }),
    getPendingRequests: () => api.get('/users/pending-requests'),
    create: (data) => api.post('/users', data),
    getById: (id) => api.get(`/users/${id}`),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
    updateStatus: (id, status) => api.patch(`/users/${id}/status`, { status }),
};

// Customers API
export const customersAPI = {
    getAll: (params) => api.get('/customers', { params }),
    search: (query) => api.get('/customers/search', { params: { query } }),
    getById: (id) => api.get(`/customers/${id}`),
    create: (data) => api.post('/customers', data),
    update: (id, data) => api.put(`/customers/${id}`, data),
    delete: (id) => api.delete(`/customers/${id}`),
};

// Orders API
export const ordersAPI = {
    getAll: (params) => api.get('/orders', { params }),
    getStatistics: (params) => api.get('/orders/statistics', { params }),
    getById: (id) => api.get(`/orders/${id}`),
    create: (data) => api.post('/orders', data),
    assign: (id, deliveryBoyId) => api.patch(`/orders/${id}/assign`, { delivery_boy_id: deliveryBoyId }),
    updateStatus: (id, data) => api.patch(`/orders/${id}/status`, data),
    getHistory: (id) => api.get(`/orders/${id}/history`),
    delete: (id) => api.delete(`/orders/${id}`),
};

// Payments API
export const paymentsAPI = {
    getAll: (params) => api.get('/payments', { params }),
    getStatistics: (params) => api.get('/payments/statistics', { params }),
    getByOrderId: (orderId) => api.get(`/payments/order/${orderId}`),
    create: (data) => api.post('/payments', data),
};

export default api;
