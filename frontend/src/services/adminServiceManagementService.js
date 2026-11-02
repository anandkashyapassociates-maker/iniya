import { adminApi } from './apiClient';

export const adminServiceManagementService = {
  // Tree
  getTree: async (params = {}) => {
    const res = await adminApi.get('/admin/services-management/tree', { params });
    return res.data;
  },

  // Categories
  getCategories: async (params = {}) => {
    const res = await adminApi.get('/admin/services-management/categories', { params });
    return res.data;
  },
  createCategory: async (data) => {
    const res = await adminApi.post('/admin/services-management/categories', data);
    return res.data;
  },
  updateCategory: async (id, data) => {
    const res = await adminApi.put(`/admin/services-management/categories/${id}`, data);
    return res.data;
  },
  deleteCategory: async (id) => {
    const res = await adminApi.delete(`/admin/services-management/categories/${id}`);
    return res.data;
  },

  // Sub-Categories
  getSubCategories: async (params = {}) => {
    const res = await adminApi.get('/admin/services-management/sub-categories', { params });
    return res.data;
  },
  createSubCategory: async (data) => {
    const res = await adminApi.post('/admin/services-management/sub-categories', data);
    return res.data;
  },
  updateSubCategory: async (id, data) => {
    const res = await adminApi.put(`/admin/services-management/sub-categories/${id}`, data);
    return res.data;
  },
  deleteSubCategory: async (id) => {
    const res = await adminApi.delete(`/admin/services-management/sub-categories/${id}`);
    return res.data;
  },

  // Services
  getServices: async (params = {}) => {
    const res = await adminApi.get('/admin/services-management/services', { params });
    return res.data;
  },
  createService: async (data) => {
    const res = await adminApi.post('/admin/services-management/services', data);
    return res.data;
  },
  updateService: async (id, data) => {
    const res = await adminApi.put(`/admin/services-management/services/${id}`, data);
    return res.data;
  },
  deleteService: async (id) => {
    const res = await adminApi.delete(`/admin/services-management/services/${id}`);
    return res.data;
  },
};

export default adminServiceManagementService;
