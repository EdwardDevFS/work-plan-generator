import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { Chart } from 'primereact/chart';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import { Skeleton } from 'primereact/skeleton';
import { Toast } from 'primereact/toast';
import { Icon } from '@iconify/react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboard.service';
import { DashboardMetrics, RecentActivity, TopPerformer } from '../types/dashboard.types';
import { useTenant } from '../contexts/TenantContext';

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { selectedTenant } = useTenant();
  const realTenant = selectedTenant ?? user?.tenantId;
  const toast = useRef<Toast>(null);

  useEffect(() => {
    loadDashboardData();
  }, [realTenant]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Llamadas paralelas a la API
      const [metricsData, activitiesData, performersData] = await Promise.all([
        (await dashboardService.getMetrics({ tenantId: realTenant })).data,
        (await dashboardService.getRecentActivity({ tenantId: realTenant, limit: 8 })).data,
        (await dashboardService.getTopPerformers({ tenantId: realTenant, limit: 5 })).data
      ]);

      setMetrics(metricsData);
      setActivities(activitiesData);
      setTopPerformers(performersData);
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      // Opcional: Mostrar toast de error
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'Error al cargar el dashboard'
      });
    } finally {
      setLoading(false);
    }
  };

  // Chart configurations
  const getUsersByRoleChartData = () => {
    if (!metrics) return {};
    
    return {
      labels: metrics.users.byRole.map(r => r.name),
      datasets: [
        {
          data: metrics.users.byRole.map(r => r.count),
          backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'],
          borderWidth: 0
        }
      ]
    };
  };

  const getStoresByPriorityChartData = () => {
    if (!metrics) return {};
    
    return {
      labels: metrics.stores.byPriority.map(p => p.priority),
      datasets: [
        {
          label: 'Locales',
          data: metrics.stores.byPriority.map(p => p.count),
          backgroundColor: ['#EF4444', '#F59E0B', '#10B981'],
          borderWidth: 0
        }
      ]
    };
  };

  const getRouteStatusChartData = () => {
    if (!metrics) return {};
    
    return {
      labels: metrics.routes.byStatus.map(s => s.status),
      datasets: [
        {
          label: 'Planes',
          data: metrics.routes.byStatus.map(s => s.count),
          backgroundColor: '#3B82F6',
          borderWidth: 0
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 15
        }
      }
    }
  };

  const barChartOptions = {
    ...chartOptions,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 20
        }
      }
    }
  };

  // Templates
  const activityTypeIcon = (activity: RecentActivity) => {
    const icons = {
      user: 'mdi:account',
      store: 'mdi:store',
      form: 'mdi:form-select',
      route: 'mdi:map-marker-path'
    };
    
    const colors = {
      user: 'text-blue-500',
      store: 'text-green-500',
      form: 'text-purple-500',
      route: 'text-orange-500'
    };

    return (
      <Icon 
        icon={icons[activity.type]} 
        className={`${colors[activity.type]} text-2xl`} 
      />
    );
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Hace menos de 1 hora';
    if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (days === 1) return 'Hace 1 día';
    return `Hace ${days} días`;
  };

  const performerNameTemplate = (performer: TopPerformer) => {
    return (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
          {performer.userName.split(' ').map(n => n[0]).join('')}
        </div>
        <span className="font-medium">{performer.userName}</span>
      </div>
    );
  };

  const completionRateTemplate = (performer: TopPerformer) => {
    const severity = performer.completionRate >= 95 ? 'success' : 
                    performer.completionRate >= 90 ? 'warning' : 'danger';
    return (
      <div>
        <ProgressBar 
          value={performer.completionRate} 
          showValue={false}
          className="h-2 mb-1"
        />
        <Tag value={`${performer.completionRate}%`} severity={severity} />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton width="300px" height="2rem" className="mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <Skeleton width="100%" height="100px" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="p-6">
      <Toast ref={toast} />
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Analítico</h1>
        <p className="text-gray-600 mt-2">
          Vista general del rendimiento y métricas clave
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Usuarios Activos */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Usuarios Activos</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.users.active}</p>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.users.recentLogins} con login reciente
              </p>
            </div>
            <div className="bg-blue-500 p-4 rounded-lg">
              <Icon icon="mdi:account-check" className="text-white text-3xl" />
            </div>
          </div>
        </Card>

        {/* Locales Totales */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Locales Activas</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.stores.active}</p>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.stores.averageVisitFrequency.toFixed(1)} visitas/mes promedio
              </p>
            </div>
            <div className="bg-green-500 p-4 rounded-lg">
              <Icon icon="mdi:store-check" className="text-white text-3xl" />
            </div>
          </div>
        </Card>

        {/* Tasa de Finalización */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Tasa de Finalización</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.routes.completionRate}%</p>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.routes.currentMonthPlans} planes este mes
              </p>
            </div>
            <div className="bg-purple-500 p-4 rounded-lg">
              <Icon icon="mdi:chart-line" className="text-white text-3xl" />
            </div>
          </div>
        </Card>

        {/* Crecimiento de Visitas */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Crecimiento</p>
              <p className="text-3xl font-bold text-green-600">
                +{metrics.performance.visitGrowth.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.performance.storesVisitedThisMonth} visitas este mes
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-4 rounded-lg">
              <Icon icon="mdi:trending-up" className="text-white text-3xl" />
            </div>
          </div>
        </Card>
      </div>

      {/* Alert Cards */}
      {(metrics.performance.overdueVisits > 0 || metrics.performance.pendingVisits > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {metrics.performance.overdueVisits > 0 && (
            <Card className="bg-red-50 border border-red-200">
              <div className="flex items-center gap-3">
                <Icon icon="mdi:alert-circle" className="text-red-600 text-3xl" />
                <div>
                  <p className="font-semibold text-red-900">
                    {metrics.performance.overdueVisits} visitas vencidas
                  </p>
                  <p className="text-sm text-red-700">
                    Requieren atención inmediata
                  </p>
                </div>
              </div>
            </Card>
          )}
          
          {metrics.performance.pendingVisits > 0 && (
            <Card className="bg-orange-50 border border-orange-200">
              <div className="flex items-center gap-3">
                <Icon icon="mdi:clock-alert" className="text-orange-600 text-3xl" />
                <div>
                  <p className="font-semibold text-orange-900">
                    {metrics.performance.pendingVisits} visitas pendientes
                  </p>
                  <p className="text-sm text-orange-700">
                    Programadas para este mes
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Usuarios por Rol */}
        <Card title="Distribución de Usuarios" className="shadow-sm">
          <div style={{ height: '250px' }}>
            <Chart 
              type="doughnut" 
              data={getUsersByRoleChartData()} 
              options={chartOptions}
            />
          </div>
        </Card>

        {/* Locales por Prioridad */}
        <Card title="Locales por Prioridad" className="shadow-sm">
          <div style={{ height: '250px' }}>
            <Chart 
              type="doughnut" 
              data={getStoresByPriorityChartData()} 
              options={chartOptions}
            />
          </div>
        </Card>

        {/* Estado de Rutas */}
        <Card title="Estado de Planes de Ruta" className="shadow-sm">
          <div style={{ height: '250px' }}>
            <Chart 
              type="bar" 
              data={getRouteStatusChartData()} 
              options={barChartOptions}
            />
          </div>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card title="Mejores Supervisores del Mes" className="shadow-sm">
          <DataTable value={topPerformers} className="text-sm">
            <Column 
              field="userName" 
              header="Supervisor" 
              body={performerNameTemplate}
            />
            <Column 
              field="storesVisited" 
              header="Locales" 
              body={(data) => (
                <span className="font-semibold text-blue-600">{data.storesVisited}</span>
              )}
            />
            <Column 
              field="completionRate" 
              header="Finalización" 
              body={completionRateTemplate}
            />
            <Column 
              field="averageVisitDuration" 
              header="Duración Avg" 
              body={(data) => `${data.averageVisitDuration} min`}
            />
          </DataTable>
        </Card>

        {/* Recent Activity */}
        <Card title="Actividad Reciente" className="shadow-sm">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {activities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-start gap-3 pb-4 border-b last:border-b-0 hover:bg-gray-50 p-2 rounded transition-colors"
              >
                <div className="mt-1">
                  {activityTypeIcon(activity)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.action}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Icon icon="mdi:account" className="text-gray-400 text-xs" />
                    <span className="text-xs text-gray-500">{activity.user}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;