import { superAdminApi } from './apiClient';

export const superAdminAuthService = {
  async login(credentials) {
    const response = await superAdminApi.post('/superadmin/login', credentials);
    return response.data;
  },

  async logout() {
    try {
      const response = await superAdminApi.post('/superadmin/logout');
      return response.data;
    } finally {
      localStorage.removeItem('superadmin_token');
      localStorage.removeItem('superadmin_user');
    }
  },

  async getMe() {
    const response = await superAdminApi.get('/superadmin/me');
    return response.data;
  },

  async forgotPassword(data) {
    const response = await superAdminApi.post('/superadmin/forgot-password', data);
    return response.data;
  },

  async resetPassword(data) {
    const response = await superAdminApi.post('/superadmin/reset-password', data);
    return response.data;
  },

  async updateProfile(data) {
    const response = await superAdminApi.put('/superadmin/profile', data);
    return response.data;
  },

  async changePassword(data) {
    const response = await superAdminApi.post('/superadmin/change-password', data);
    return response.data;
  },
};

export default superAdminAuthService;

