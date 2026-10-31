import { superAdminApiClient } from '../auth/superAdminAuthService';

export const adminManagementService = {
  /**
   * Fetch paginated list of admins with optional search, status, and sorting filters.
   */
  async getAdmins(params = {}) {
    const response = await superAdminApiClient.get('/superadmin/admins', { params });
    return response.data;
  },

  /**
   * Fetch single admin details by ID.
   */
  async getAdmin(id) {
    const response = await superAdminApiClient.get(`/superadmin/admins/${id}`);
    return response.data;
  },

  /**
   * Create a new Admin account.
   */
  async createAdmin(data) {
    const response = await superAdminApiClient.post('/superadmin/admins', data);
    return response.data;
  },

  /**
   * Update an existing Admin account.
   */
  async updateAdmin(id, data) {
    const response = await superAdminApiClient.put(`/superadmin/admins/${id}`, data);
    return response.data;
  },

  /**
   * Update Admin status (active, inactive, blocked).
   */
  async updateAdminStatus(id, statusOrIsActive) {
    const payload = typeof statusOrIsActive === 'string'
      ? { status: statusOrIsActive }
      : { is_active: Boolean(statusOrIsActive) };
    const response = await superAdminApiClient.patch(`/superadmin/admins/${id}/status`, payload);
    return response.data;
  },

  /**
   * Reset Admin password.
   */
  async resetAdminPassword(id, payload = {}) {
    const response = await superAdminApiClient.post(`/superadmin/admins/${id}/password-reset`, payload);
    return response.data;
  },

  /**
   * Impersonate / Log in as an Admin directly from Superadmin.
   */
  async impersonateAdmin(id) {
    const response = await superAdminApiClient.post(`/superadmin/admins/${id}/impersonate`);
    return response.data;
  },
};

export default adminManagementService;

