import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '', // Uses VITE_API_URL if configured, otherwise falls back to relative paths (development proxy)
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject Authorization header on every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cashflow_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Format standardized responses and handle auth expiries
api.interceptors.response.use(
  (response) => {
    // NestJS response interceptor returns data wrapped in a { success: true, data: T } structure
    if (response.data && response.data.success && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Clear token and logout
      localStorage.removeItem('cashflow_token');
      localStorage.removeItem('cashflow_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    // Extract cleaner error messages
    let message = error.response?.data?.message || 'Something went wrong';
    
    // NestJS validation pipes often return an array of strings for multiple errors
    if (Array.isArray(message)) {
      message = message.join(' • ');
    }
    
    return Promise.reject(new Error(message));
  }
);

export default api;
