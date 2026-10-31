import { adminApi } from './apiClient';

export const adminMasterAppointmentService = {
  // Master Appointments
  getMasterAppointments(params = {}) {
    return adminApi.get('/admin/master-appointments', { params }).then(r => r.data);
  },

  getStats() {
    return adminApi.get('/admin/master-appointments/stats').then(r => r.data);
  },

  getOptions() {
    return adminApi.get('/admin/master-appointments/options').then(r => r.data);
  },

  create(data) {
    return adminApi.post('/admin/master-appointments', data).then(r => r.data);
  },

  get(id) {
    return adminApi.get(`/admin/master-appointments/${id}`).then(r => r.data);
  },

  update(id, data) {
    return adminApi.put(`/admin/master-appointments/${id}`, data).then(r => r.data);
  },

  delete(id) {
    return adminApi.delete(`/admin/master-appointments/${id}`).then(r => r.data);
  },

  // Sessions under Master Appointment
  addSession(masterId, data) {
    return adminApi.post(`/admin/master-appointments/${masterId}/sessions`, data).then(r => r.data);
  },

  updateSession(sessionId, data) {
    return adminApi.put(`/admin/sessions/${sessionId}`, data).then(r => r.data);
  },

  updateSessionStatus(sessionId, status) {
    return adminApi.patch(`/admin/sessions/${sessionId}/status`, { status }).then(r => r.data);
  },

  deleteSession(sessionId) {
    return adminApi.delete(`/admin/sessions/${sessionId}`).then(r => r.data);
  },

  // Session Reschedule (Strict Pending Rule + DB Row Locked)
  rescheduleSession(sessionId, data) {
    return adminApi.post(`/admin/sessions/${sessionId}/reschedule`, data).then(r => r.data);
  },

  getRescheduleHistory(sessionId) {
    return adminApi.get(`/admin/sessions/${sessionId}/reschedule-history`).then(r => r.data);
  },

  // Calendar View
  getCalendarSessions(params = {}) {
    return adminApi.get('/admin/calendar/sessions', { params }).then(r => r.data);
  },
};

export default adminMasterAppointmentService;

