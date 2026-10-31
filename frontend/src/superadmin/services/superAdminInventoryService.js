import { superAdminApi } from '../../services/apiClient';

export const superAdminInventoryService = {
  // ================= OVERVIEW & ANALYTICS =================
  async getOverview() {
    const response = await superAdminApi.get('/superadmin/inventory/overview');
    return response.data;
  },

  async getAdminReport() {
    const response = await superAdminApi.get('/superadmin/inventory/admin-report');
    return response.data;
  },

  // ================= ALL PRODUCTS =================
  async getProducts(params = {}) {
    const response = await superAdminApi.get('/superadmin/inventory/products', { params });
    return response.data;
  },

  async getProduct(id) {
    const response = await superAdminApi.get(`/superadmin/inventory/products/${id}`);
    return response.data;
  },

  async updateProduct(id, data) {
    const response = await superAdminApi.post(`/superadmin/inventory/products/${id}`, data);
    return response.data;
  },

  async updateProductStatus(id, status) {
    const response = await superAdminApi.patch(`/superadmin/inventory/products/${id}/status`, { status });
    return response.data;
  },

  async deleteProduct(id) {
    const response = await superAdminApi.delete(`/superadmin/inventory/products/${id}`);
    return response.data;
  },

  // ================= CATEGORIES =================
  async getCategories(params = {}) {
    const response = await superAdminApi.get('/superadmin/inventory/categories', { params });
    return response.data;
  },

  async updateCategory(id, data) {
    const response = await superAdminApi.post(`/superadmin/inventory/categories/${id}`, data);
    return response.data;
  },

  async deleteCategory(id) {
    const response = await superAdminApi.delete(`/superadmin/inventory/categories/${id}`);
    return response.data;
  },

  // ================= BRANDS =================
  async getBrands(params = {}) {
    const response = await superAdminApi.get('/superadmin/inventory/brands', { params });
    return response.data;
  },

  async updateBrand(id, data) {
    const response = await superAdminApi.post(`/superadmin/inventory/brands/${id}`, data);
    return response.data;
  },

  async deleteBrand(id) {
    const response = await superAdminApi.delete(`/superadmin/inventory/brands/${id}`);
    return response.data;
  },
};

export default superAdminInventoryService;
