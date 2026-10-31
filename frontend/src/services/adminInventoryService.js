import { adminApi } from './apiClient';

export const adminInventoryService = {
  // ================= PRODUCTS =================
  async getProducts(params = {}) {
    const response = await adminApi.get('/admin/inventory/products', { params });
    return response.data;
  },

  async getProduct(id) {
    const response = await adminApi.get(`/admin/inventory/products/${id}`);
    return response.data;
  },

  async createProduct(data) {
    const response = await adminApi.post('/admin/inventory/products', data);
    return response.data;
  },

  async updateProduct(id, data) {
    const response = await adminApi.post(`/admin/inventory/products/${id}`, data);
    return response.data;
  },

  async deleteProduct(id) {
    const response = await adminApi.delete(`/admin/inventory/products/${id}`);
    return response.data;
  },

  // ================= CATEGORIES =================
  async getCategories(params = {}) {
    const response = await adminApi.get('/admin/inventory/categories', { params });
    return response.data;
  },

  async getCategoryDropdown() {
    const response = await adminApi.get('/admin/inventory/categories/dropdown');
    return response.data;
  },

  async getCategory(id) {
    const response = await adminApi.get(`/admin/inventory/categories/${id}`);
    return response.data;
  },

  async createCategory(data) {
    const response = await adminApi.post('/admin/inventory/categories', data);
    return response.data;
  },

  async updateCategory(id, data) {
    const response = await adminApi.post(`/admin/inventory/categories/${id}`, data);
    return response.data;
  },

  async deleteCategory(id) {
    const response = await adminApi.delete(`/admin/inventory/categories/${id}`);
    return response.data;
  },

  // ================= BRANDS =================
  async getBrands(params = {}) {
    const response = await adminApi.get('/admin/inventory/brands', { params });
    return response.data;
  },

  async getBrandDropdown() {
    const response = await adminApi.get('/admin/inventory/brands/dropdown');
    return response.data;
  },

  async getBrand(id) {
    const response = await adminApi.get(`/admin/inventory/brands/${id}`);
    return response.data;
  },

  async createBrand(data) {
    const response = await adminApi.post('/admin/inventory/brands', data);
    return response.data;
  },

  async updateBrand(id, data) {
    const response = await adminApi.post(`/admin/inventory/brands/${id}`, data);
    return response.data;
  },

  async deleteBrand(id) {
    const response = await adminApi.delete(`/admin/inventory/brands/${id}`);
    return response.data;
  },
};

export default adminInventoryService;
