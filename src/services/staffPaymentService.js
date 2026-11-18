import { adminApi } from './apiClient';

export const staffPaymentService = {
  /**
   * Get paginated Payout vouchers and overall financial summary for the logged-in staff member.
   */
  async getMyPayments(params = {}) {
    const response = await adminApi.get('/admin/my-payments', { params });
    return response.data;
  },

  /**
   * Get paginated clinical session earnings breakdown for the logged-in staff member.
   */
  async getSessionCommissions(params = {}) {
    const response = await adminApi.get('/admin/my-payments/sessions', { params });
    return response.data;
  },

  /**
   * Get single payout voucher detail for staff member.
   */
  async getVoucherDetails(id) {
    const response = await adminApi.get(`/admin/my-payments/voucher/${id}`);
    return response.data;
  },
};

export default staffPaymentService;
