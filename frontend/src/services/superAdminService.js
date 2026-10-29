import { superAdminApi } from './apiClient';

export const superAdminService = {
  async getDashboard() {
    const response = await superAdminApi.get('/superadmin/dashboard');
    return response.data;
  },

  async getAdmins(params = {}) {
    const response = await superAdminApi.get('/superadmin/admins', { params });
    return response.data;
  },

  async getAdmin(id) {
    const response = await superAdminApi.get(`/superadmin/admins/${id}`);
    return response.data;
  },

  async createAdmin(data) {
    const response = await superAdminApi.post('/superadmin/admins', data);
    return response.data;
  },

  async updateAdmin(id, data) {
    const response = await superAdminApi.put(`/superadmin/admins/${id}`, data);
    return response.data;
  },

  async updateAdminStatus(id, isActive) {
    const response = await superAdminApi.patch(`/superadmin/admins/${id}/status`, {
      is_active: isActive,
    });
    return response.data;
  },

  async resetAdminPassword(id, payload = {}) {
    const response = await superAdminApi.post(`/superadmin/admins/${id}/password-reset`, payload);
    return response.data;
  },
};

export default superAdminService;

