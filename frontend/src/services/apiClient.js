import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Super Admin API Axios Client
 */
export const superAdminApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

superAdminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('superadmin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    if (config.headers && typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type');
      config.headers.delete('content-type');
    } else if (config.headers) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
  }
  return config;
});

superAdminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('superadmin_token');
      localStorage.removeItem('superadmin_user');
      if (!window.location.pathname.startsWith('/superadmin/login') && 
          !window.location.pathname.startsWith('/superadmin/forgot-password') &&
          !window.location.pathname.startsWith('/superadmin/reset-password')) {
        window.location.href = '/superadmin';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Admin API Axios Client
 */
export const adminApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    if (config.headers && typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type');
      config.headers.delete('content-type');
    } else if (config.headers) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
  }
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      if (!window.location.pathname.startsWith('/admin/login') && 
          !window.location.pathname.startsWith('/admin/forgot-password') &&
          !window.location.pathname.startsWith('/admin/reset-password')) {
        window.location.href = '/admin';
      }
    }
    return Promise.reject(error);
  }
);

export default {
  superAdminApi,
  adminApi,
};

