export interface DashboardMetrics {
  users: {
    total: number;
    active: number;
    inactive: number;
    recentLogins: number; // últimos 7 días
    byRole: { name: string; count: number }[];
  };
  stores: {
    total: number;
    active: number;
    inactive: number;
    byPriority: { priority: string; count: number }[];
    averageVisitFrequency: number;
  };
  forms: {
    total: number;
    active: number;
    averageFieldsPerForm: number;
  };
  routes: {
    totalPlans: number;
    byStatus: { status: string; count: number }[];
    currentMonthPlans: number;
    completionRate: number;
    averageStoresPerRoute: number;
  };
  performance: {
    storesVisitedThisMonth: number;
    storesVisitedLastMonth: number;
    visitGrowth: number; // porcentaje
    pendingVisits: number;
    overdueVisits: number;
  };
}

export interface RecentActivity {
  id: string;
  type: 'user' | 'store' | 'form' | 'route';
  action: string;
  description: string;
  timestamp: Date;
  user?: string;
}

export interface TopPerformer {
  userId: string;
  userName: string;
  storesVisited: number;
  completionRate: number;
  averageVisitDuration: number;
}