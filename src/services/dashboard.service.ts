import { DashboardMetrics, RecentActivity, TopPerformer } from '../types/dashboard.types';
import { api } from './api';

interface DashboardMetricsParams {
  tenantId?: string;
  month?: number;
  year?: number;
}

interface RecentActivityParams {
  tenantId?: string;
  limit?: number;
}

interface TopPerformersParams {
  tenantId?: string;
  month?: number;
  year?: number;
  limit?: number;
}

export const dashboardService = {
  /**
   * Obtiene todas las métricas del dashboard
   * @param params - Parámetros de consulta (tenantId requerido, month y year opcionales)
   * @returns Promise<DashboardMetrics>
   */
  getMetrics: (params: DashboardMetricsParams) =>
    api.get<DashboardMetrics>('/dashboard/metrics', { params }),

  /**
   * Obtiene la actividad reciente del tenant
   * @param params - Parámetros de consulta (tenantId requerido, limit opcional)
   * @returns Promise<RecentActivity[]>
   */
  getRecentActivity: (params: RecentActivityParams) =>
    api.get<RecentActivity[]>('/dashboard/recent-activity', { params }),

  /**
   * Obtiene el ranking de mejores supervisores
   * @param params - Parámetros de consulta (tenantId requerido, month, year y limit opcionales)
   * @returns Promise<TopPerformer[]>
   */
  getTopPerformers: (params: TopPerformersParams) =>
    api.get<TopPerformer[]>('/dashboard/top-performers', { params }),
};
