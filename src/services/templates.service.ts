import { api } from "./api";

export const templatesApi = {
  async list() {
    const res = await api.get(`/work-plan-templates`);
    return res.data;
  },

  async getById(id: string) {
    const res = await api.get(`/work-plan-templates/${id}`);
    return res.data;
  },

  async delete(id: string) {
    await api.delete(`/work-plan-templates/${id}`);
  },
};