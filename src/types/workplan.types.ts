// types/workplan.types.ts - ACTUALIZADO PARA COINCIDIR CON BACKEND

import { User } from ".";
import { Store } from "./store.types";

/**
 * ============================================================================
 * GEOMETRÍA Y COORDENADAS
 * ============================================================================
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeoJSONGeometry {
  type: 'LineString' | 'Point' | 'Polygon';
  coordinates: number[][] | number[];
}

/**
 * ============================================================================
 * TIPOS PARA PREVIEW Y GENERACIÓN
 * ============================================================================
 */

export interface TimeSlot {
  start: string;
  end: string;
}

/**
 * ============================================================================
 * TIPOS PARA FORMULARIO
 * ============================================================================
 */

export interface WorkTimeSlot {
  id: string;
  start: string;
  end: string;
}

export interface WorkPlanTemplate {
  id: string;
  templateName: string;
  templateDescription?: string;
  formData: any;
  estimatedDays: number;
  totalStores: number;
  totalUsers: number;
  totalActivities: number;
  timesUsed: number;
  createdAt: Date;
}

export interface WorkPlanFormData {
  templateId?: string;
  planName: string;
  description: string;
  deadline: Date | null;
  selectedStores: Store[];
  selectedUsers: User[];
  workDays: number[];
  workTimeSlots: WorkTimeSlot[];
  storeActivities: StoreActivity[];
  saveAsTemplate?: boolean;
  templateName?: string;
  templateDescription?: string;
}

export interface StoreActivity {
  id: string;
  store: Store;
  activity: Activity;
  supervisor?: User;
  repetitions: number;
  assignmentMode: AssignmentMode;
  assignedUsers: User[];
  hasCustomSchedule: boolean;
  customTimeSlots: WorkTimeSlot[];
}

export enum AssignmentMode {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
}

export interface Activity {
  id?: string;
  tenantId?: string;
  activityName: string;
  description?: string;
  estimatedTimePerTask: number;
  isRepetitive: boolean;
  defaultRepetitions: number;
  hasCustomSchedule?: boolean;
  customTimeSlots: TimeSlot[];
  authorizedUserIds: string[];
  authorizedUsers?: User[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * ============================================================================
 * TIPOS PARA PLANES GENERADOS - ACTUALIZADOS DESDE BACKEND
 * ============================================================================
 */

export interface WorkPlanListItem {
  id: string;
  planName: string;
  description: string;
  deadline: string;
  status: 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  workDays: number[];
  workTimeSlots: { start: string; end: string }[];
  metrics?: {
    totalStores: number;
    totalUsers: number;
    totalActivities: number;
    totalWorkMinutes: number;
    totalTravelMinutes: number;
    estimatedDays: number;
    coveragePercent: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserScheduleListItem {
  id: string;
  user: User;
  summary: {
    totalDays: number;
    totalStores: number;
    totalActivities: number;
    totalWorkMinutes: number;
    totalTravelMinutes: number;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * WorkTask - ACTUALIZADO desde backend
 * Puede ser WORK o TRAVEL
 */
export interface WorkTask {
  id: string;
  dailyScheduleId: string;
  activityId: string | null;
  
  // Tipo y básicos
  taskType: 'WORK' | 'TRAVEL';
  taskName: string;
  sequenceOrder: number;
  
  // Store
  store: Store;
  coordinates: { lat: number; lng: number };
  
  // Repeticiones
  totalRepetitions: number;
  completedRepetitions: number;
  pendingRepetitions: number;
  progressPercent: number;
  
  // Tiempos
  timePerRepetition: number;
  totalEstimatedMinutes: number;
  startTime: string;
  endTime: string;
  
  // Viaje (solo si taskType = TRAVEL)
  travelInfo?: {
    fromStoreId: string;
    fromStoreName: string;
    toStoreId: string;
    toStoreName: string;
    distanceMeters: number;
    distanceKm: number;
    segmentGeometry: any | null;
  } | null;
  
  // Custom Schedule
  hasCustomSchedule: boolean;
  customTimeSlots: { start: string; end: string }[] | null;
  
  // Estado
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  
  // Propiedades calculadas para compatibilidad con frontend existente
  segmentGeometry?: string;
}

/**
 * DailySchedule - ACTUALIZADO desde backend
 */
export interface DailySchedule {
  id: string;
  date: string; // ISO format: YYYY-MM-DD
  dayOfWeek: number; // 0-6
  
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  
  totalWorkMinutes: number;
  totalTravelMinutes: number;
  
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  
  // Geometría de la ruta completa del día (GeoJSON)
  routeGeometry: string | null;
  
  // Tasks del día
  tasks: WorkTask[];
  
  // Métricas calculadas
  totalTasks: number;
  workTasks: number;
  travelTasks: number;
  
  storesVisited: number;
  totalDistanceKm: number;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * UserScheduleDetail - ACTUALIZADO desde backend
 */
export interface UserScheduleDetail {
  id: string;
  userId: string;
  workPlanId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    roles: Array<{ name: string }>;
  };
  workPlan: {
    id: string;
    planName: string;
    description: string;
    deadline: string;
    status: string;
  };
  summary: {
    totalDays: number;
    totalStores: number;
    totalActivities: number;
    totalWorkMinutes: number;
    totalTravelMinutes: number;
  };
  dailySchedules: DailySchedule[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ============================================================================
 * TIPOS PARA PREVIEW (mantenidos para compatibilidad)
 * ============================================================================
 */

export interface ScheduledTask {
  type: 'WORK' | 'TRAVEL';
  sequenceNumber: number;
  activityId?: string;
  store: Store;
  taskName?: string;
  taskNumber?: number;
  totalRepetitions?: number;
  fromStoreId?: string;
  fromStoreName?: string;
  toStoreId?: string;
  toStoreName?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  hasCustomSchedule?: boolean;
  customTimeSlots?: TimeSlot[];
  routeGeometry?: GeoJSONGeometry | null;
}

export interface ActivityExecution {
  activityId: string;
  taskName: string;
  taskNumber: number;
  totalRepetitions: number;
  estimatedMinutes: number;
  startTime: string;
  endTime: string;
  hasCustomSchedule: boolean;
  customTimeSlots?: TimeSlot[];
}

export interface StoreVisit {
  store: Store;
  arrivalTime: string;
  departureTime: string;
  travelFromPrevious: number;
  activities: ActivityExecution[];
  segmentGeometry?: GeoJSONGeometry | null;
}

export interface DailySchedulePreview {
  date: string;
  dayOfWeek: number;
  workerId: string;
  workerName: string;
  tasks: ScheduledTask[];
  cityName?: string;
  stores?: StoreVisit[];
  startTime: string;
  endTime: string;
  totalWorkMinutes: number;
  totalTravelMinutes: number;
  storesVisited: number;
  activitiesCompleted: number;
  totalDistanceKm: number;
  fullRouteGeometry?: GeoJSONGeometry | null;
  routeGeometry?: GeoJSONGeometry | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  requiresOvernightStay: boolean;
  overnightStay?: boolean;
}

export interface WorkerMetrics {
  totalDays: number;
  totalStores: number;
  totalActivities: number;
  totalWorkMinutes: number;
  totalTravelMinutes: number;
  totalDistanceKm: number;
  efficiencyScore: number;
  citiesVisited: string[];
  averageTasksPerDay: number;
  averageTravelTimePerDay: number;
}

export interface WorkerAssignment {
  userId: string;
  userName: string;
  userEmail?: string;
  dailySchedules: DailySchedulePreview[];
  metrics: WorkerMetrics;
  assignedClusters: string[];
}

export interface ClusterInfo {
  id: string;
  centroid: Coordinates;
  storeCount: number;
  totalActivities: number;
  totalMinutes: number;
  estimatedDays: number;
  primaryCity?: string;
}

export interface PlanSummary {
  planName: string;
  description?: string;
  totalStores: number;
  totalWorkers: number;
  totalUsers: number;
  totalActivities: number;
  totalWorkMinutes: number;
  totalTravelMinutes: number;
  estimatedDays: number;
  deadline: Date;
  workingDaysAvailable: number;
  isOnSchedule: boolean;
  workersNeeded: number;
  efficiency: number;
  estimatedTravelCostUSD?: number;
  estimatedOvernightStays?: number;
}

export interface WorkPlanPreviewResponse {
  planSummary: PlanSummary;
  workerAssignments: WorkerAssignment[];
  clusters: ClusterInfo[];
  warnings: string[];
  dailyWorkMinutes: number;
  workDays: number[];
  canSimulateWorkers: boolean;
  suggestedWorkerCounts: number[];
  currentWorkerCount: number;
}