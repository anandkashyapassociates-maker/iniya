import { superAdminApiClient } from '../auth/superAdminAuthService';

export const vendorManagementService = {
  /**
   * Fetch paginated list of vendors with optional search, vendor_type, status, city, and sorting filters.
   */
  async getVendors(params = {}) {
    const response = await superAdminApiClient.get('/superadmin/vendors', { params });
    return response.data;
  },

  /**
   * Fetch single vendor details by ID.
   */
  async getVendor(id) {
    const response = await superAdminApiClient.get(`/superadmin/vendors/${id}`);
    return response.data;
  },

  /**
   * Create a new Vendor.
   */
  async createVendor(data) {
    const response = await superAdminApiClient.post('/superadmin/vendors', data);
    return response.data;
  },

  /**
   * Update an existing Vendor.
   */
  async updateVendor(id, data) {
    const response = await superAdminApiClient.put(`/superadmin/vendors/${id}`, data);
    return response.data;
  },

  /**
   * Update Vendor status (active, inactive, blocked).
   */
  async updateVendorStatus(id, status) {
    const payload = typeof status === 'string'
      ? { status }
      : { status: status ? 'active' : 'inactive' };
    const response = await superAdminApiClient.patch(`/superadmin/vendors/${id}/status`, payload);
    return response.data;
  },

  /**
   * Preview next available Vendor Code (e.g. VEN-0001).
   */
  async getPreviewCode() {
    const response = await superAdminApiClient.get('/superadmin/vendors/preview-code');
    return response.data;
  },

  /**
   * Get list of unique vendor types.
   */
  async getVendorTypes() {
    const response = await superAdminApiClient.get('/superadmin/vendors/types');
    return response.data;
  },
};

export default vendorManagementService;

