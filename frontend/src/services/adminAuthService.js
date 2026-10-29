import { adminApi } from './apiClient';

export const adminAuthService = {
  async login(credentials) {
    const response = await adminApi.post('/admin/login', credentials);
    return response.data;
  },

  async logout() {
    try {
      const response = await adminApi.post('/admin/logout');
      return response.data;
    } finally {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    }
  },

  async getMe() {
    const response = await adminApi.get('/admin/me');
    return response.data;
  },

  async forgotPassword(data) {
    const response = await adminApi.post('/admin/forgot-password', data);
    return response.data;
  },

  async resetPassword(data) {
    const response = await adminApi.post('/admin/reset-password', data);
    return response.data;
  },

  async updateProfile(data) {
    const response = await adminApi.put('/admin/profile', data);
    return response.data;
  },

  async changePassword(data) {
    const response = await adminApi.post('/admin/change-password', data);
    return response.data;
  },
};

export default adminAuthService;

