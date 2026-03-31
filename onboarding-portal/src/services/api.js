import axios from 'axios';

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

export const pharmacyAPI = {
    signup: (data) => api.post('/pharmacies/signup', data),

    login: (data) => api.post('/auth/login', { ...data, dashboardType: 'onboarding' }),

    checkSlug: (slug) => api.get(`/pharmacies/check-slug/${slug}`),

    getMyPharmacy: () => api.get('/pharmacies/mine'),

    updateConfig: (data) => api.put('/pharmacies/mine/config', data),

    updateBranding: (data) => api.put('/pharmacies/mine/branding', data),

    uploadLogo: (formData) =>
        api.post('/pharmacies/mine/branding/logo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    submitForApproval: () => api.put('/pharmacies/mine/submit'),

    getBuildStatus: () => api.get('/pharmacies/mine/build-status'),
};

// Platform admin API (SwinkPay super admins)
export const adminAPI = {
    listPharmacies: (params) => api.get('/pharmacies', { params }),
    getPharmacy: (id) => api.get(`/pharmacies/${id}`),
    approve: (id) => api.put(`/pharmacies/${id}/approve`),
    reject: (id, reason) => api.put(`/pharmacies/${id}/reject`, { reason }),
};

export default api;
