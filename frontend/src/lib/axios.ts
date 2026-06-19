import axios from 'axios';

let baseURL = import.meta.env.VITE_BACKEND_URL || '/api';
if (import.meta.env.VITE_BACKEND_URL && !baseURL.endsWith('/api')) {
  baseURL = `${baseURL}/api`;
}
const api = axios.create({
  baseURL,
  withCredentials: true, // Send httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // CSRF protection header
  },
});

// Request interceptor - attach JWT token (backward compatibility, though cookies are primary)
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

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
