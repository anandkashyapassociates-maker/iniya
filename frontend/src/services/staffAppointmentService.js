import { adminApi } from './apiClient';

export const staffAppointmentService = {
  /**
   * Get all appointments assigned to the logged-in staff member.
   */
  async getMyAppointments(params = {}) {
    const response = await adminApi.get('/admin/my-appointments', { params });
    return response.data;
  },

  /**
   * Get single appointment details for staff with all session information and images.
   */
  async getAppointmentDetails(id) {
    const response = await adminApi.get(`/admin/my-appointments/${id}`);
    return response.data;
  },
};

export default staffAppointmentService;

