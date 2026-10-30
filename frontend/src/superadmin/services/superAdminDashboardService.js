import { superAdminApiClient } from '../auth/superAdminAuthService';

export const superAdminDashboardService = {
  /**
   * Fetch comprehensive Super Admin dashboard statistics and module overviews.
   */
  async getDashboard() {
    const response = await superAdminApiClient.get('/superadmin/dashboard');
    return response.data;
  },
};

export default superAdminDashboardService;

