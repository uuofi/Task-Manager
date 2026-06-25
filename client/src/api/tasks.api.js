import axiosClient from './axiosClient';

export const tasksApi = {
  async list(params = {}) {
    const { data } = await axiosClient.get('/tasks', { params });
    return data;
  },
  async board(projectId) {
    const { data } = await axiosClient.get(`/tasks/board/${projectId}`);
    return data.data;
  },
  async get(id) {
    const { data } = await axiosClient.get(`/tasks/${id}`);
    return data.data;
  },
  async create(payload) {
    const { data } = await axiosClient.post('/tasks', payload);
    return data.data;
  },
  async update(id, payload) {
    const { data } = await axiosClient.patch(`/tasks/${id}`, payload);
    return data.data;
  },
  async move(id, payload) {
    const { data } = await axiosClient.patch(`/tasks/${id}/move`, payload);
    return data.data;
  },
  async remove(id) {
    const { data } = await axiosClient.delete(`/tasks/${id}`);
    return data.data;
  },

  // Checklist
  async addChecklistItem(taskId, text) {
    const { data } = await axiosClient.post(`/tasks/${taskId}/checklist`, { text });
    return data.data;
  },
  async toggleChecklistItem(taskId, itemId) {
    const { data } = await axiosClient.patch(`/tasks/${taskId}/checklist/${itemId}`);
    return data.data;
  },
  async removeChecklistItem(taskId, itemId) {
    const { data } = await axiosClient.delete(`/tasks/${taskId}/checklist/${itemId}`);
    return data.data;
  },

  // Dependencies
  async addDependency(taskId, dependsOnId) {
    const { data } = await axiosClient.post(`/tasks/${taskId}/dependencies`, { dependsOnId });
    return data.data;
  },
  async removeDependency(taskId, dependsOnId) {
    const { data } = await axiosClient.delete(`/tasks/${taskId}/dependencies/${dependsOnId}`);
    return data.data;
  },

  // Comments
  async listComments(taskId) {
    const { data } = await axiosClient.get(`/tasks/${taskId}/comments`);
    return data.data;
  },
  async createComment(taskId, payload) {
    const { data } = await axiosClient.post(`/tasks/${taskId}/comments`, payload);
    return data.data;
  },

  // Attachments
  async listAttachments(taskId) {
    const { data } = await axiosClient.get(`/tasks/${taskId}/attachments`);
    return data.data;
  },
  async uploadAttachment(taskId, file) {
    const form = new FormData();
    form.append('file', file);
    const { data } = await axiosClient.post(`/tasks/${taskId}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  // Timer
  async getTimer(taskId) {
    const { data } = await axiosClient.get(`/tasks/${taskId}/timer`);
    return data.data;
  },
  async startTimer(taskId) {
    const { data } = await axiosClient.post(`/tasks/${taskId}/timer/start`);
    return data.data;
  },
  async pauseTimer(taskId) {
    const { data } = await axiosClient.post(`/tasks/${taskId}/timer/pause`);
    return data.data;
  },
  async resumeTimer(taskId) {
    const { data } = await axiosClient.post(`/tasks/${taskId}/timer/resume`);
    return data.data;
  },
  async stopTimer(taskId) {
    const { data } = await axiosClient.post(`/tasks/${taskId}/timer/stop`);
    return data.data;
  },
};

export default tasksApi;
