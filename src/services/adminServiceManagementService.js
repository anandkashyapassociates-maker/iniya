import { adminApi, superAdminApi } from './apiClient';

const getClient = () => {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/superadmin')) {
    return { client: superAdminApi, prefix: '/superadmin/services-management' };
  }
  return { client: adminApi, prefix: '/admin/services-management' };
};

export const adminServiceManagementService = {
  // Tree
  getTree: async (params = {}) => {
    const { client, prefix } = getClient();
    const res = await client.get(`${prefix}/tree`, { params });
    return res.data;
  },

  // Categories
  getCategories: async (params = {}) => {
    const { client, prefix } = getClient();
    const res = await client.get(`${prefix}/categories`, { params });
    return res.data;
  },
  createCategory: async (data) => {
    const { client, prefix } = getClient();
    const res = await client.post(`${prefix}/categories`, data);
    return res.data;
  },
  updateCategory: async (id, data) => {
    const { client, prefix } = getClient();
    const res = await client.put(`${prefix}/categories/${id}`, data);
    return res.data;
  },
  deleteCategory: async (id) => {
    const { client, prefix } = getClient();
    const res = await client.delete(`${prefix}/categories/${id}`);
    return res.data;
  },

  // Sub-Categories
  getSubCategories: async (params = {}) => {
    const { client, prefix } = getClient();
    const res = await client.get(`${prefix}/sub-categories`, { params });
    return res.data;
  },
  createSubCategory: async (data) => {
    const { client, prefix } = getClient();
    const res = await client.post(`${prefix}/sub-categories`, data);
    return res.data;
  },
  updateSubCategory: async (id, data) => {
    const { client, prefix } = getClient();
    const res = await client.put(`${prefix}/sub-categories/${id}`, data);
    return res.data;
  },
  deleteSubCategory: async (id) => {
    const { client, prefix } = getClient();
    const res = await client.delete(`${prefix}/sub-categories/${id}`);
    return res.data;
  },

  // Services
  getServices: async (params = {}) => {
    const { client, prefix } = getClient();
    const res = await client.get(`${prefix}/services`, { params });
    return res.data;
  },
  createService: async (data) => {
    const { client, prefix } = getClient();
    const res = await client.post(`${prefix}/services`, data);
    return res.data;
  },
  updateService: async (id, data) => {
    const { client, prefix } = getClient();
    const res = await client.put(`${prefix}/services/${id}`, data);
    return res.data;
  },
  deleteService: async (id) => {
    const { client, prefix } = getClient();
    const res = await client.delete(`${prefix}/services/${id}`);
    return res.data;
  },
};

export default adminServiceManagementService;
