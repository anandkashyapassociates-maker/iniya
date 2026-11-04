import { adminApi } from './apiClient';

export const staffAppointmentService = {
  /**
   * Get all appointment sessions assigned to the logged-in staff member.
   */
  async getMyAppointments(params = {}) {
    const response = await adminApi.get('/admin/my-appointments', { params });
    return response.data;
  },

  /**
   * Get single appointment session details for staff with all information and images.
   */
  async getAppointmentDetails(id) {
    const response = await adminApi.get(`/admin/my-appointments/${id}`);
    return response.data;
  },

  /**
   * Update session status & optional patient payment (pending, in_progress, completed, cancelled).
   */
  async updateSessionStatus(id, payload) {
    const body = typeof payload === 'string' ? { status: payload } : payload;
    const response = await adminApi.patch(`/admin/my-appointments/${id}/status`, body);
    return response.data;
  },

  /**
   * Upload or update clinical session image.
   */
  async uploadSessionImage(id, formDataOrPayload) {
    const isFormData = formDataOrPayload instanceof FormData;
    const response = await adminApi.post(`/admin/my-appointments/${id}/image`, formDataOrPayload, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  },
};

export default staffAppointmentService;
