import { adminApi } from './apiClient';

export const adminService = {
  async getDashboard() {
    const response = await adminApi.get('/admin/dashboard');
    return response.data;
  },

  async getCustomerStats() {
    const response = await adminApi.get('/admin/customers/stats');
    return response.data;
  },

  async getCustomers(params = {}) {
    const response = await adminApi.get('/admin/customers', { params });
    return response.data;
  },

  async getCustomer(id) {
    const response = await adminApi.get(`/admin/customers/${id}`);
    return response.data;
  },

  async createCustomer(data) {
    const response = await adminApi.post('/admin/customers', data);
    return response.data;
  },

  async updateCustomer(id, data) {
    const response = await adminApi.put(`/admin/customers/${id}`, data);
    return response.data;
  },

  async deleteCustomer(id) {
    const response = await adminApi.delete(`/admin/customers/${id}`);
    return response.data;
  },
};

export default adminService;
