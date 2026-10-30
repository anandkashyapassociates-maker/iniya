import { superAdminApiClient } from '../auth/superAdminAuthService';

export const staffManagementService = {
  /**
   * Fetch paginated list of staff members with optional search, department, status, and sorting filters.
   */
  async getStaff(params = {}) {
    const response = await superAdminApiClient.get('/superadmin/staff', { params });
    return response.data;
  },

  /**
   * Fetch single staff member details by ID.
   */
  async getStaffMember(id) {
    const response = await superAdminApiClient.get(`/superadmin/staff/${id}`);
    return response.data;
  },

  /**
   * Create a new Staff member.
   */
  async createStaff(data) {
    const response = await superAdminApiClient.post('/superadmin/staff', data);
    return response.data;
  },

  /**
   * Update an existing Staff member.
   */
  async updateStaff(id, data) {
    const response = await superAdminApiClient.put(`/superadmin/staff/${id}`, data);
    return response.data;
  },

  /**
   * Update Staff active/inactive/blocked status.
   */
  async updateStaffStatus(id, statusOrIsActive) {
    const payload = typeof statusOrIsActive === 'string'
      ? { status: statusOrIsActive }
      : { is_active: Boolean(statusOrIsActive) };
    const response = await superAdminApiClient.patch(`/superadmin/staff/${id}/status`, payload);
    return response.data;
  },

  /**
   * Preview next available Staff Code.
   */
  async getPreviewCode() {
    const response = await superAdminApiClient.get('/superadmin/staff/preview-code');
    return response.data;
  },

  /**
   * Get list of unique departments.
   */
  async getDepartments() {
    const response = await superAdminApiClient.get('/superadmin/staff/departments');
    return response.data;
  },
};

export default staffManagementService;

