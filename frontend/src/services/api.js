import axios from 'axios';

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000, // Increased to 30 seconds for PDF generation
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create a special instance for PDF exports with longer timeout
const pdfApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 60000, // 60 seconds for PDF generation
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('🔑 API Request Interceptor:', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token'
    });

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('⚠️ No token found in localStorage for API request');
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response Success:', {
      url: response.config.url,
      method: response.config.method,
      status: response.status
    });
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });

    if (error.response?.status === 401) {
      console.warn('🔒 401 Unauthorized - Clearing auth data and redirecting to login');
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Add same interceptors to pdfApi
pdfApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('🔑 PDF API Request Interceptor:', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token'
    });

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('⚠️ No token found in localStorage for PDF API request');
    }
    return config;
  },
  (error) => {
    console.error('❌ PDF API Request interceptor error:', error);
    return Promise.reject(error);
  }
);

pdfApi.interceptors.response.use(
  (response) => {
    console.log('✅ PDF API Response Success:', {
      url: response.config.url,
      method: response.config.method,
      status: response.status
    });
    return response;
  },
  (error) => {
    console.error('❌ PDF API Response Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });

    if (error.response?.status === 401) {
      console.warn('🔒 401 Unauthorized - Clearing auth data and redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  verifyToken: () => api.get('/auth/verify'),
  getAllUsers: (params) => api.get('/auth/users', { params }),
  getUserById: (userId) => api.get(`/auth/users/${userId}`),
  createUser: (userData) => api.post('/auth/users', userData),
  updateUser: (userId, userData) => api.put(`/auth/users/${userId}`, userData),
  deleteUser: (userId) => api.delete(`/auth/users/${userId}`),
};

// Customer API calls
export const customerAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (customerData) => api.post('/customers', customerData),
  update: (id, customerData) => api.put(`/customers/${id}`, customerData),
  delete: (id) => api.delete(`/customers/${id}`),
  getPurchaseHistory: (id, params) => api.get(`/customers/${id}/orders`, { params }),
  getStatistics: (params) => api.get('/customers/statistics', { params }),
};

// Product API calls
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (productData) => {
    // Handle FormData for file uploads
    const config = productData instanceof FormData ? {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    } : {};
    return api.post('/products', productData, config);
  },
  update: (id, productData) => {
    // Handle FormData for file uploads
    const config = productData instanceof FormData ? {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    } : {};
    return api.put(`/products/${id}`, productData, config);
  },
  delete: (id) => api.delete(`/products/${id}`),
  updateStock: (id, stockData) => api.put(`/products/${id}/stock`, stockData),
  getLowStock: (params) => api.get('/products/low-stock', { params }),
  getCategories: () => api.get('/products/categories'),
  createCategory: (categoryData) => api.post('/products/categories', categoryData),
  getStatistics: (params) => api.get('/products/statistics', { params }),
};

// Order API calls
export const orderAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (orderData) => api.post('/orders', orderData),
  update: (id, orderData) => api.put(`/orders/${id}`, orderData),
  updateStatus: (id, statusData) => api.put(`/orders/${id}/status`, statusData),
  getStatistics: (params) => api.get('/orders/statistics', { params }),
};

// Utility functions
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    return {
      message: error.response.data.message || 'An error occurred',
      status: error.response.status,
      details: error.response.data.details || null,
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      message: 'Network error. Please check your connection.',
      status: 0,
      details: null,
    };
  } else {
    // Something else happened
    return {
      message: error.message || 'An unexpected error occurred',
      status: 0,
      details: null,
    };
  }
};

// Analytics API calls
export const analyticsAPI = {
  getDashboard: (params) => api.get('/analytics/dashboard', { params }),
  getSales: (params) => api.get('/analytics/sales', { params }),
  getCustomers: (params) => api.get('/analytics/customers', { params }),
  getProducts: (params) => api.get('/analytics/products', { params }),
  getOperations: (params) => api.get('/analytics/operations', { params }),
  exportPDF: (params) => pdfApi.get('/analytics/export-pdf', {
    params,
    responseType: 'blob',
    headers: {
      'Accept': 'application/pdf'
    }
  }),
};

export default api;
