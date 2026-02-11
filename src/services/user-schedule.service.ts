import { UserScheduleDetail } from "../types/workplan.types";
import { api } from "./api";

export const userSchedulesApi = {
  async getByUser(userId: string, month?: Date): Promise<UserScheduleDetail[]> {
    const params = month ? { month: month.toISOString() } : {};
    const res = await api.get(`/user-schedules/${userId}`, { params });
    return res.data;
  },

  async getByUserAndPlan(userId: string, planId: string): Promise<UserScheduleDetail> {
    const res = await api.get(`/user-schedules/${userId}/plans/${planId}`);
    return res.data;
  },
};