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
    if (data instanceof FormData) {
      const response = await adminApi.post(`/admin/customers/${id}`, data);
      return response.data;
    }
    const response = await adminApi.put(`/admin/customers/${id}`, data);
    return response.data;
  },

  async deleteCustomer(id) {
    const response = await adminApi.delete(`/admin/customers/${id}`);
    return response.data;
  },

  // Category Management
  async getCategoryStats() {
    const response = await adminApi.get('/admin/categories/stats');
    return response.data;
  },

  async getCategories(params = {}) {
    const response = await adminApi.get('/admin/categories', { params });
    return response.data;
  },

  async getCategory(id) {
    const response = await adminApi.get(`/admin/categories/${id}`);
    return response.data;
  },

  async createCategory(data) {
    const response = await adminApi.post('/admin/categories', data);
    return response.data;
  },

  async updateCategory(id, data) {
    if (data instanceof FormData) {
      const response = await adminApi.post(`/admin/categories/${id}`, data);
      return response.data;
    }
    const response = await adminApi.put(`/admin/categories/${id}`, data);
    return response.data;
  },

  async deleteCategory(id) {
    const response = await adminApi.delete(`/admin/categories/${id}`);
    return response.data;
  },
};

export default adminService;
