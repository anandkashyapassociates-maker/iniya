import { superAdminApi } from '../../services/apiClient';

export const superAdminCategoryService = {
  async getCategoryStats() {
    const response = await superAdminApi.get('/superadmin/categories/stats');
    return response.data;
  },

  async getCategories(params = {}) {
    const response = await superAdminApi.get('/superadmin/categories', { params });
    return response.data;
  },

  async getCategory(id) {
    const response = await superAdminApi.get(`/superadmin/categories/${id}`);
    return response.data;
  },

  async deleteCategory(id) {
    const response = await superAdminApi.delete(`/superadmin/categories/${id}`);
    return response.data;
  },
};

export default superAdminCategoryService;

