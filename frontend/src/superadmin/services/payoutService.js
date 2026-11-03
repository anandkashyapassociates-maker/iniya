import { superAdminApiClient } from '../auth/superAdminAuthService';

export const payoutService = {
  /**
   * Fetch aggregated Payout KPIs (total disbursed, counts, staff vs vendor, cash vs bank).
   */
  async getStats() {
    const response = await superAdminApiClient.get('/superadmin/payouts/stats');
    return response.data;
  },

  /**
   * Fetch active staff options for dropdown selection.
   */
  async getStaffOptions() {
    const response = await superAdminApiClient.get('/superadmin/payouts/staff-options');
    return response.data;
  },

  /**
   * Fetch active vendor options for dropdown selection.
   */
  async getVendorOptions() {
    const response = await superAdminApiClient.get('/superadmin/payouts/vendor-options');
    return response.data;
  },

  /**
   * Fetch paginated list of staff payouts with filters and summary.
   */
  async getStaffPayouts(params = {}) {
    const response = await superAdminApiClient.get('/superadmin/payouts/staff', { params });
    return response.data;
  },

  /**
   * Disburse / Record a new Staff Payout.
   */
  async recordStaffPayout(data) {
    const response = await superAdminApiClient.post('/superadmin/payouts/staff', data);
    return response.data;
  },

  /**
   * Update an existing Staff Payout.
   */
  async updateStaffPayout(id, data) {
    const response = await superAdminApiClient.put(`/superadmin/payouts/staff/${id}`, data);
    return response.data;
  },

  /**
   * Fetch paginated list of vendor payouts with filters and summary.
   */
  async getVendorPayouts(params = {}) {
    const response = await superAdminApiClient.get('/superadmin/payouts/vendors', { params });
    return response.data;
  },

  /**
   * Disburse / Record a new Vendor Payout.
   */
  async recordVendorPayout(data) {
    const response = await superAdminApiClient.post('/superadmin/payouts/vendors', data);
    return response.data;
  },

  /**
   * Update an existing Vendor Payout.
   */
  async updateVendorPayout(id, data) {
    const response = await superAdminApiClient.put(`/superadmin/payouts/vendors/${id}`, data);
    return response.data;
  },

  /**
   * Fetch unified Payouts Ledger with date range, staff, vendor, and account type filters.
   */
  async getLedger(params = {}) {
    const response = await superAdminApiClient.get('/superadmin/payouts/ledger', { params });
    return response.data;
  },

  /**
   * Fetch a single Payout voucher by ID.
   */
  async getPayout(id) {
    const response = await superAdminApiClient.get(`/superadmin/payouts/${id}`);
    return response.data;
  },

  /**
   * Delete / Void a payout voucher.
   */
  async deletePayout(id) {
    const response = await superAdminApiClient.delete(`/superadmin/payouts/${id}`);
    return response.data;
  },
};

