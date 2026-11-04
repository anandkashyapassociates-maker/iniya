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
    } catch (err) {
      console.warn('Admin logout API notice:', err);
      return null;
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

  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('image', file);
    const response = await adminApi.post('/admin/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async changePassword(data) {
    const response = await adminApi.post('/admin/change-password', data);
    return response.data;
  },
};

export default adminAuthService;

