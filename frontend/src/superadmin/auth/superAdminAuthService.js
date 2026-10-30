import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

/**
 * Dedicated Axios Client for Superadmin API
 */
export const superAdminApiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Attach Bearer token to outgoing Superadmin requests
superAdminApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('superadmin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept 401 Unauthenticated responses to clear state safely
superAdminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('superadmin_token');
      localStorage.removeItem('superadmin_user');
      const publicPaths = ['/superadmin', '/superadmin/forgot-password', '/superadmin/reset-password'];
      if (!publicPaths.some((p) => window.location.pathname.startsWith(p))) {
        window.location.href = '/superadmin';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Superadmin Authentication API Service
 */
export const superAdminAuthService = {
  async login(credentials) {
    const response = await superAdminApiClient.post('/superadmin/login', credentials);
    return response.data;
  },

  async logout() {
    try {
      const response = await superAdminApiClient.post('/superadmin/logout');
      return response.data;
    } finally {
      localStorage.removeItem('superadmin_token');
      localStorage.removeItem('superadmin_user');
    }
  },

  async getMe() {
    const response = await superAdminApiClient.get('/superadmin/me');
    return response.data;
  },

  async forgotPassword(data) {
    const response = await superAdminApiClient.post('/superadmin/forgot-password', data);
    return response.data;
  },

  async resetPassword(data) {
    const response = await superAdminApiClient.post('/superadmin/reset-password', data);
    return response.data;
  },

  async updateProfile(data) {
    const response = await superAdminApiClient.put('/superadmin/profile', data);
    return response.data;
  },

  async changePassword(data) {
    const response = await superAdminApiClient.post('/superadmin/change-password', data);
    return response.data;
  },
};

export default superAdminAuthService;

