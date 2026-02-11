import { DailyRouteExecution, MonthlyPlan, VisitDetail } from '../types/itinerary.types';
import { api } from './api';


export const itineraryService = {
  // Obtener planes mensuales por supervisor
  getMonthlyPlans: async (params: {
    tenantId: string;
    supervisorId: string;
    month?: number;
    year?: number;
  }): Promise<MonthlyPlan[]> => {
    const queryParams = new URLSearchParams({
      tenantId: params.tenantId,
      supervisorId: params.supervisorId,
      ...(params.month && { month: String(params.month) }),
      ...(params.year && { year: String(params.year) }),
    });

    return (await api.get(`/routes/plans?${queryParams}`)).data;
  },
  
  // Obtener un plan mensual específico
  getMonthlyPlanById: async (planId: string): Promise<MonthlyPlan> => {
    return await api.get(`/routes/plans/${planId}`);
  },

  // Crear un plan mensual
  createMonthlyPlan: async (planData: {
    tenantId?: string;
    month: number;
    year: number;
    supervisorId: string;
    baseLatitude: number;
    baseLongitude: number;
  }): Promise<MonthlyPlan> => {

    return await api.post(`/routes/plans/`, planData);
  },

  // Eliminar un plan mensual
  deleteMonthlyPlan: async (planId: string): Promise<void> => {
    return await api.delete(`/routes/plans/${planId}`);
  },

  async getDailyExecutionsByMonthlyPlan(monthlyPlanId: string): Promise<DailyRouteExecution[]> {
    const response = await api.get<DailyRouteExecution[]>(
      `/daily-executions/monthly-plan/${monthlyPlanId}`
    );
    return response.data;
  },

  async getVisitsByDailyRoute(dailyRouteExecutionId: string): Promise<VisitDetail[]> {
    const response = await api.get<VisitDetail[]>(
      `/visits/daily-route/${dailyRouteExecutionId}`
    );
    return response.data;
  }
};