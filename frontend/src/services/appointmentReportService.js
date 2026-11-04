import { adminApi, superAdminApi } from './apiClient';

/**
 * Service to handle Appointment & Session Reports for both Admin and SuperAdmin portals.
 */
export const appointmentReportService = {
  /**
   * Fetch Master Appointments-Wise Report.
   */
  async getAppointmentsReport(params = {}, role = 'admin') {
    const client = role === 'superadmin' ? superAdminApi : adminApi;
    const prefix = role === 'superadmin' ? '/superadmin' : '/admin';
    const response = await client.get(`${prefix}/reports/appointments`, { params });
    return response.data;
  },

  /**
   * Fetch Session-Wise Report.
   */
  async getSessionsReport(params = {}, role = 'admin') {
    const client = role === 'superadmin' ? superAdminApi : adminApi;
    const prefix = role === 'superadmin' ? '/superadmin' : '/admin';
    const response = await client.get(`${prefix}/reports/sessions`, { params });
    return response.data;
  },

  /**
   * Fetch Dropdown filter options (Staff, Sales Members, Services, Customers, Statuses).
   */
  async getFilterOptions(role = 'admin') {
    const client = role === 'superadmin' ? superAdminApi : adminApi;
    const prefix = role === 'superadmin' ? '/superadmin' : '/admin';
    const response = await client.get(`${prefix}/reports/appointments/filter-options`);
    return response.data;
  },
};

export default appointmentReportService;

