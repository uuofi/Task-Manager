import axiosClient from './axiosClient';

export const projectsApi = {
  async list(params = {}) {
    const { data } = await axiosClient.get('/projects', { params });
    return data;
  },
  async get(id) {
    const { data } = await axiosClient.get(`/projects/${id}`);
    return data.data;
  },
  async create(payload) {
    const { data } = await axiosClient.post('/projects', payload);
    return data.data;
  },
  async update(id, payload) {
    const { data } = await axiosClient.patch(`/projects/${id}`, payload);
    return data.data;
  },
  async archive(id) {
    const { data } = await axiosClient.post(`/projects/${id}/archive`);
    return data.data;
  },
  async restore(id) {
    const { data } = await axiosClient.post(`/projects/${id}/restore`);
    return data.data;
  },
  async remove(id) {
    const { data } = await axiosClient.delete(`/projects/${id}`);
    return data.data;
  },
  async addMember(id, payload) {
    const { data } = await axiosClient.post(`/projects/${id}/members`, payload);
    return data.data;
  },
  async removeMember(id, userId) {
    const { data } = await axiosClient.delete(`/projects/${id}/members/${userId}`);
    return data.data;
  },
};

export default projectsApi;
