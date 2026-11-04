import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Super Admin API Axios Client
 */
export const superAdminApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Accept': 'application/json',
  },
});

superAdminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('superadmin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    if (config.headers) {
      if (typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type');
        config.headers.delete('content-type');
      }
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
  } else if (!config.headers['Content-Type'] && !config.headers['content-type']) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

superAdminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('superadmin_token');
      localStorage.removeItem('superadmin_user');
      // Only redirect if the current active tab is viewing a superadmin route
      if (
        window.location.pathname.startsWith('/superadmin') &&
        !window.location.pathname.startsWith('/superadmin/login') &&
        !window.location.pathname.startsWith('/superadmin/forgot-password') &&
        !window.location.pathname.startsWith('/superadmin/reset-password')
      ) {
        window.location.href = '/superadmin';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Admin API Axios Client
 * Supports separate, isolated sessions for Admin and Staff across browser tabs.
 */
export const adminApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Accept': 'application/json',
  },
});

adminApi.interceptors.request.use((config) => {
  const isAuthGuestRoute =
    config.url?.includes('/admin/login') ||
    config.url?.includes('/admin/forgot-password') ||
    config.url?.includes('/admin/reset-password');

  if (isAuthGuestRoute) {
    if (config.headers) {
      delete config.headers.Authorization;
      delete config.headers.authorization;
    }
  } else {
    // 1. Tab-specific session token takes first priority
    const tabToken = sessionStorage.getItem('clinic_tab_token');
    const tabRole = sessionStorage.getItem('clinic_tab_role');

    let token = tabToken;
    if (!token) {
      if (tabRole === 'staff') {
        token = localStorage.getItem('staff_token');
      } else if (tabRole === 'admin') {
        token = localStorage.getItem('admin_token');
      } else {
        token = localStorage.getItem('admin_token') || localStorage.getItem('staff_token');
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  if (config.data instanceof FormData) {
    if (config.headers) {
      if (typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type');
        config.headers.delete('content-type');
      }
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
  } else if (!config.headers['Content-Type'] && !config.headers['content-type']) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const tabRole = sessionStorage.getItem('clinic_tab_role');
      sessionStorage.removeItem('clinic_tab_token');
      sessionStorage.removeItem('clinic_tab_user');
      sessionStorage.removeItem('clinic_tab_role');

      if (tabRole === 'staff') {
        localStorage.removeItem('staff_token');
        localStorage.removeItem('staff_user');
      } else {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      }

      // Only redirect if the current active tab is viewing an admin route
      if (
        window.location.pathname.startsWith('/admin') &&
        !window.location.pathname.startsWith('/admin/login') &&
        !window.location.pathname.startsWith('/admin/forgot-password') &&
        !window.location.pathname.startsWith('/admin/reset-password')
      ) {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default {
  superAdminApi,
  adminApi,
};
