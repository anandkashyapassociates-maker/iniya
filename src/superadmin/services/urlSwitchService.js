import { superAdminApiClient } from '../auth/superAdminAuthService';

export const urlSwitchService = {
  /**
   * Fetch current URL switch status from backend.
   */
  async getStatus() {
    const response = await superAdminApiClient.get('/superadmin/url-switch');
    return response.data;
  },

  /**
   * Activate the URL and database switch.
   * Updates url, db_database, db_username in database and .env, then redirects.
   */
  async activate(payload = {}) {
    const response = await superAdminApiClient.post('/superadmin/url-switch/activate', payload);
    return response.data;
  },

  /**
   * Attempt to turn off (will be rejected with 403 as only backend can disable).
   */
  async deactivate() {
    const response = await superAdminApiClient.post('/superadmin/url-switch/deactivate');
    return response.data;
  },
};

export default urlSwitchService;
