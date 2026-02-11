import { Activity } from "../types/workplan.types";
import { cleanObject } from "../utils/paramaters.helper";
import { api } from "./api";

export const activitiesApi = {
  async list(): Promise<Activity[]> {
    const res = await api.get(`/activities`);
    return res.data;
  },

  async create(data: Partial<Activity>): Promise<Activity> {
    const cleanedData = cleanObject(data);
	const res = await api.post(`/activities`, cleanedData);
    return res.data;
  },

  async update(id: string, data: Partial<Activity>): Promise<Activity> {
    const res = await api.put(`/activities/${id}`, data);
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/activities/${id}`);
  },
};

