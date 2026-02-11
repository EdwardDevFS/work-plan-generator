// services/workplan-adapter.service.ts
// Adaptador para transformar datos del backend al formato esperado por el frontend

import { WorkTask, DailySchedule } from "../types/workplan.types";

/**
 * Adapta un WorkTask del backend al formato esperado por el frontend
 * Añade propiedades calculadas para compatibilidad con componentes existentes
 */
export function adaptWorkTask(task: any): WorkTask {
  // Calcular propiedades derivadas para compatibilidad
  const arrivalTime = task.startTime;
  const departureTime = task.endTime;
  
  // Para tareas WORK, el tiempo de tarea es timePerRepetition
  // Para tareas TRAVEL, el tiempo es totalEstimatedMinutes
  const taskMinutes = task.taskType === 'WORK' 
    ? task.timePerRepetition 
    : 0;
  
  const travelMinutes = task.taskType === 'TRAVEL' 
    ? task.totalEstimatedMinutes 
    : 0;
  
  // taskNumber es el sequenceOrder para compatibilidad
  const taskNumber = task.sequenceOrder;
  
  // Convertir segmentGeometry si existe
  let segmentGeometry = undefined;
  if (task.travelInfo?.segmentGeometry) {
    segmentGeometry = JSON.stringify(task.travelInfo.segmentGeometry);
  }
  
  return {
    ...task,
    // Propiedades adicionales para compatibilidad con frontend existente
    arrivalTime,
    departureTime,
    taskMinutes,
    travelMinutes,
    taskNumber,
    segmentGeometry,
  } as WorkTask;
}

/**
 * Adapta un DailySchedule del backend añadiendo propiedades calculadas
 */
export function adaptDailySchedule(schedule: any): DailySchedule {
  return {
    ...schedule,
    tasks: schedule.tasks.map(adaptWorkTask),
  };
}

/**
 * Calcula métricas de progreso para un trabajador
 * Usado en WorkPlansPage para mostrar el progreso
 */
export function calculateWorkerProgress(schedules: DailySchedule[]): {
  completedTasks: number;
  totalTasks: number;
  progressPercentage: number;
} {
  let completedTasks = 0;
  let totalTasks = 0;
  
  schedules.forEach(schedule => {
    schedule.tasks.forEach(task => {
      if (task.taskType === 'WORK') {
        totalTasks++;
        if (task.status === 'COMPLETED') {
          completedTasks++;
        }
      }
    });
  });
  
  const progressPercentage = totalTasks > 0 
    ? (completedTasks / totalTasks) * 100 
    : 0;
  
  return {
    completedTasks,
    totalTasks,
    progressPercentage,
  };
}

/**
 * Formatea minutos a formato legible (Xh Ym)
 */
export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

/**
 * Calcula la distancia entre dos puntos geográficos en metros
 * Usado para geofencing
 */
export function getDistanceInMeters(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 6371e3; // Radio de la tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Verifica si una ubicación está dentro de un geofence
 */
export function isWithinGeofence(
  currentLocation: { lat: number; lng: number },
  targetLocation: { lat: number; lng: number },
  radiusMeters: number = 200
): boolean {
  const distance = getDistanceInMeters(
    currentLocation.lat,
    currentLocation.lng,
    targetLocation.lat,
    targetLocation.lng
  );
  return distance <= radiusMeters;
}