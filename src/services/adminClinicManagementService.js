import { adminApi } from './apiClient';

export const adminClinicManagementService = {
  /**
   * Fetch paginated list of staff members for the admin's clinic.
   */
  async getStaff(params = {}) {
    const response = await adminApi.get('/admin/clinic-management/staff', { params });
    return response.data;
  },

  /**
   * Fetch single staff member details.
   */
  async getStaffMember(id) {
    const response = await adminApi.get(`/admin/clinic-management/staff/${id}`);
    return response.data;
  },

  /**
   * Fetch staff departments list.
   */
  async getStaffDepartments() {
    const response = await adminApi.get('/admin/clinic-management/staff/departments');
    return response.data;
  },

  /**
   * Fetch paginated list of sales members for the admin's clinic.
   */
  async getSalesMembers(params = {}) {
    const response = await adminApi.get('/admin/clinic-management/sales-members', { params });
    return response.data;
  },

  /**
   * Fetch single sales member details.
   */
  async getSalesMember(id) {
    const response = await adminApi.get(`/admin/clinic-management/sales-members/${id}`);
    return response.data;
  },

  /**
   * Fetch sales departments list.
   */
  async getSalesDepartments() {
    const response = await adminApi.get('/admin/clinic-management/sales-members/departments');
    return response.data;
  },

  /**
   * Fetch sales territories list.
   */
  async getSalesTerritories() {
    const response = await adminApi.get('/admin/clinic-management/sales-members/territories');
    return response.data;
  },
};

export default adminClinicManagementService;
