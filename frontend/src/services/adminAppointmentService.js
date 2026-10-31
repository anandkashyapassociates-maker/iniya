import { adminApi } from './apiClient';

export const adminAppointmentService = {
  getAppointments(params = {}) {
    return adminApi.get('/admin/appointments', { params }).then(r => r.data);
  },
  getStats() {
    return adminApi.get('/admin/appointments/stats').then(r => r.data);
  },
  create(data) {
    return adminApi.post('/admin/appointments', data).then(r => r.data);
  },
  get(id) {
    return adminApi.get(`/admin/appointments/${id}`).then(r => r.data);
  },
  update(id, data) {
    return adminApi.put(`/admin/appointments/${id}`, data).then(r => r.data);
  },
  delete(id) {
    return adminApi.delete(`/admin/appointments/${id}`).then(r => r.data);
  },
  reschedule(id, data) {
    return adminApi.post(`/admin/appointments/${id}/reschedule`, data).then(r => r.data);
  },
  cancel(id, data) {
    return adminApi.post(`/admin/appointments/${id}/cancel`, data).then(r => r.data);
  },
  assignStaff(id, data) {
    return adminApi.post(`/admin/appointments/${id}/assign-staff`, data).then(r => r.data);
  },
  updateStatus(id, data) {
    return adminApi.patch(`/admin/appointments/${id}/status`, data).then(r => r.data);
  },
  staffOptions() {
    return adminApi.get('/admin/staff-options').then(r => r.data);
  },
  customerOptions() {
    return adminApi.get('/admin/customer-options').then(r => r.data);
  },
};

export default adminAppointmentService;
