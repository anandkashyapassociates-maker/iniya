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

  // ================= INVENTORY STOCKS & REPLENISHMENT =================
  async getStocks(params = {}) {
    const response = await adminApi.get('/admin/inventory/stocks', { params });
    return response.data;
  },

  async getLowStock(params = {}) {
    const response = await adminApi.get('/admin/inventory/stocks/low-stock', { params });
    return response.data;
  },

  async getStockStats() {
    const response = await adminApi.get('/admin/inventory/stocks/stats');
    return response.data;
  },

  async getVendors() {
    const response = await adminApi.get('/admin/inventory/stocks/vendors');
    return response.data;
  },

  async addStock(id, data) {
    const response = await adminApi.post(`/admin/inventory/stocks/${id}/add`, data);
    return response.data;
  },

  async issueStock(id, data) {
    const response = await adminApi.post(`/admin/inventory/stocks/${id}/issue`, data);
    return response.data;
  },

  async updateStock(id, data) {
    const response = await adminApi.put(`/admin/inventory/stocks/${id}`, data);
    return response.data;
  },

  async getStockLogs(id) {
    const response = await adminApi.get(`/admin/inventory/stocks/${id}/logs`);
    return response.data;
  },
};

export default adminInventoryService;
