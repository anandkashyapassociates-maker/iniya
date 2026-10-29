import { adminApi } from './apiClient';

export const adminService = {
  async getDashboard() {
    const response = await adminApi.get('/admin/dashboard');
    return response.data;
  },
};

export default adminService;

