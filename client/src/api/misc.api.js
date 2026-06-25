import axiosClient from './axiosClient';

export const commentsApi = {
  async update(id, body) {
    const { data } = await axiosClient.patch(`/comments/${id}`, { body });
    return data.data;
  },
  async remove(id) {
    const { data } = await axiosClient.delete(`/comments/${id}`);
    return data.data;
  },
  async react(id, emoji) {
    const { data } = await axiosClient.post(`/comments/${id}/react`, { emoji });
    return data.data;
  },
};

export const notificationsApi = {
  async list(params = {}) {
    const { data } = await axiosClient.get('/notifications', { params });
    return data;
  },
  async unreadCount() {
    const { data } = await axiosClient.get('/notifications/unread-count');
    return data.data.count;
  },
  async markRead(id) {
    const { data } = await axiosClient.patch(`/notifications/${id}/read`);
    return data.data;
  },
  async markAllRead() {
    const { data } = await axiosClient.post('/notifications/read-all');
    return data.data;
  },
  async remove(id) {
    const { data } = await axiosClient.delete(`/notifications/${id}`);
    return data.data;
  },
};

export const workspacesApi = {
  async mine() {
    const { data } = await axiosClient.get('/workspaces/mine');
    return data.data;
  },
  async current() {
    const { data } = await axiosClient.get('/workspaces/current');
    return data.data;
  },
  async update(payload) {
    const { data } = await axiosClient.patch('/workspaces/current', payload);
    return data.data;
  },
  async members() {
    const { data } = await axiosClient.get('/workspaces/current/members');
    return data.data;
  },
  async updateMemberRole(userId, role) {
    const { data } = await axiosClient.patch(`/workspaces/current/members/${userId}/role`, { role });
    return data.data;
  },
  async removeMember(userId) {
    const { data } = await axiosClient.delete(`/workspaces/current/members/${userId}`);
    return data.data;
  },
};

export const invitationsApi = {
  async create(payload) {
    const { data } = await axiosClient.post('/invitations', payload);
    return data.data;
  },
  async list() {
    const { data } = await axiosClient.get('/invitations');
    return data.data;
  },
  async accept(token) {
    const { data } = await axiosClient.post('/invitations/accept', { token });
    return data.data;
  },
  async respond(id, action) {
    const { data } = await axiosClient.post(`/invitations/${id}/respond`, { action });
    return data.data;
  },
  async revoke(id) {
    const { data } = await axiosClient.delete(`/invitations/${id}`);
    return data.data;
  },
};

export const suggestionsApi = {
  async create(payload) {
    const { data } = await axiosClient.post('/suggestions', payload);
    return data.data;
  },
  async received(params = {}) {
    const { data } = await axiosClient.get('/suggestions/received', { params });
    return data;
  },
  async sent(params = {}) {
    const { data } = await axiosClient.get('/suggestions/sent', { params });
    return data;
  },
  async accept(id, projectId) {
    const { data } = await axiosClient.post(`/suggestions/${id}/accept`, { projectId });
    return data.data;
  },
  async reject(id, note) {
    const { data } = await axiosClient.post(`/suggestions/${id}/reject`, { note });
    return data.data;
  },
};

export const activityApi = {
  async list(params = {}) {
    const { data } = await axiosClient.get('/activity', { params });
    return data;
  },
};

export const searchApi = {
  async query(q, type) {
    const { data } = await axiosClient.get('/search', { params: { q, type } });
    return data.data;
  },
};

export const dashboardApi = {
  async get() {
    const { data } = await axiosClient.get('/dashboard');
    return data.data;
  },
};

export const usersApi = {
  async updateProfile(payload) {
    const { data } = await axiosClient.patch('/users/me', payload);
    return data.data;
  },
  async changePassword(payload) {
    const { data } = await axiosClient.patch('/users/me/password', payload);
    return data.data;
  },
  async uploadAvatar(file) {
    const form = new FormData();
    form.append('avatar', file);
    const { data } = await axiosClient.post('/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },
};
