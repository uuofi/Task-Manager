import axiosClient from './axiosClient';

/**
 * Auth API calls. Each returns the unwrapped `data` payload from the standard
 * API envelope ({ success, message, data }).
 */
export const authApi = {
  async register(payload) {
    const { data } = await axiosClient.post('/auth/register', payload);
    return data.data;
  },

  async login(payload) {
    const { data } = await axiosClient.post('/auth/login', payload);
    return data.data;
  },

  async logout() {
    const { data } = await axiosClient.post('/auth/logout');
    return data.data;
  },

  /** Exchanges the httpOnly refresh cookie for a new access token. */
  async refresh() {
    const { data } = await axiosClient.post('/auth/refresh');
    return data.data;
  },

  async me() {
    const { data } = await axiosClient.get('/auth/me');
    return data.data;
  },

  async forgotPassword(email) {
    const { data } = await axiosClient.post('/auth/forgot-password', { email });
    return data;
  },

  async resetPassword(payload) {
    const { data } = await axiosClient.post('/auth/reset-password', payload);
    return data;
  },
};

export default authApi;
