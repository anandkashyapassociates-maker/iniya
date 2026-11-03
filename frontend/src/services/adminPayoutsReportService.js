import { adminApi } from './apiClient';

export const adminPayoutsReportService = {
  /**
   * Fetch unified Payouts Reports Ledger with date range, staff, vendor, and account type filters.
   */
  async getLedger(params = {}) {
    const response = await adminApi.get('/admin/reports/payouts', { params });
    return response.data;
  },

  /**
   * Fetch active staff options for filtering.
   */
  async getStaffOptions() {
    const response = await adminApi.get('/admin/reports/payouts/staff-options');
    return response.data;
  },

  /**
   * Fetch active vendor options for filtering.
   */
  async getVendorOptions() {
    const response = await adminApi.get('/admin/reports/payouts/vendor-options');
    return response.data;
  },

  /**
   * Fetch a single Payout voucher by ID for view modal.
   */
  async getPayout(id) {
    const response = await adminApi.get(`/admin/reports/payouts/${id}`);
    return response.data;
  },
};

export default adminPayoutsReportService;
