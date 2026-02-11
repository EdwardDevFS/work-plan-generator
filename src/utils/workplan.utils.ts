// utils/workplan.utils.ts

import { WorkPlanFormData, LocationData, PlanEstimate, WorkHours } from '../types/workplan.types';

/**
 * Calcula las horas laborables en un día
 */
export const calculateDailyWorkHours = (workHours: WorkHours): number => {
  const [startHour, startMin] = workHours.start.split(':').map(Number);
  const [endHour, endMin] = workHours.end.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return (endMinutes - startMinutes) / 60;
};

/**
 * Calcula el tiempo total de tareas en minutos
 */
export const calculateTotalTaskTime = (locations: LocationData[]): number => {
  return locations.reduce((total, location) => {
    return total + (location.estimatedTimePerTask * location.repetitions);
  }, 0);
};

/**
 * Estima el tiempo de viaje total (simplificado)
 * En producción, esto debería calcularse con OSRM
 */
export const estimateTotalTravelTime = (
  locations: LocationData[],
  averageMinutesPerLocation: number = 30
): number => {
  return locations.length * averageMinutesPerLocation;
};

/**
 * Calcula la estimación completa del plan
 */
export const calculatePlanEstimate = (formData: WorkPlanFormData): PlanEstimate => {
  const totalTaskTime = calculateTotalTaskTime(formData.locations);
  const totalTravelTime = estimateTotalTravelTime(formData.locations);
  const totalTime = totalTaskTime + totalTravelTime;

  // Calcular minutos laborables por día
  const dailyWorkMinutes = calculateDailyWorkHours(formData.workHours) * 60;

  // Días laborables por semana
  const workDaysPerWeek = formData.workDays.length;

  // Estimar días necesarios
  const minutesPerWeek = dailyWorkMinutes * workDaysPerWeek;
  const weeksNeeded = totalTime / minutesPerWeek;
  const estimatedDays = Math.ceil(weeksNeeded * workDaysPerWeek);

  // Calcular días hasta la fecha límite
  const now = new Date();
  const deadline = formData.deadline || new Date();
  const daysUntilDeadline = Math.ceil(
    (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Determinar trabajadores necesarios
  const workersNeeded = Math.max(
    1,
    Math.ceil(estimatedDays / Math.max(1, daysUntilDeadline))
  );

  return {
    totalTaskTime,
    totalTravelTime,
    totalTime,
    estimatedDays,
    workersNeeded,
    isOnSchedule: estimatedDays <= daysUntilDeadline,
    daysUntilDeadline
  };
};

/**
 * Formatea minutos a formato legible (Xh Ym)
 */
export const formatMinutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${mins}m`;
  }
};

/**
 * Formatea una fecha a formato local
 */
export const formatDate = (date: Date | null, locale: string = 'es-PE'): string => {
  if (!date) return 'No definida';
  
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium'
  }).format(date);
};

/**
 * Formatea una fecha con hora
 */
export const formatDateTime = (date: Date | null, locale: string = 'es-PE'): string => {
  if (!date) return 'No definida';
  
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
};

/**
 * Valida que la fecha límite sea futura
 */
export const isValidDeadline = (deadline: Date | null): boolean => {
  if (!deadline) return false;
  return deadline.getTime() > new Date().getTime();
};

/**
 * Valida el horario de trabajo
 */
export const isValidWorkHours = (workHours: WorkHours): boolean => {
  const [startHour, startMin] = workHours.start.split(':').map(Number);
  const [endHour, endMin] = workHours.end.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return endMinutes > startMinutes;
};

/**
 * Genera un ID único para una ubicación
 */
export const generateLocationId = (): string => {
  return `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Obtiene el nombre del día de la semana
 */
export const getWeekDayName = (dayIndex: number, locale: string = 'es'): string => {
  const days = {
    es: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  };
  
  return days[locale as keyof typeof days]?.[dayIndex] || days.es[dayIndex];
};

/**
 * Calcula el progreso del formulario (0-100)
 */
export const calculateFormProgress = (formData: WorkPlanFormData): number => {
  let progress = 0;
  
  // Paso 1: Información general (40%)
  if (formData.activityName) progress += 10;
  if (formData.description) progress += 10;
  if (formData.deadline) progress += 10;
  if (formData.workDays.length > 0) progress += 10;
  
  // Paso 2: Ubicaciones (40%)
  const expectedLocations = formData.totalLocations;
  const actualLocations = formData.locations.length;
  progress += (actualLocations / expectedLocations) * 40;
  
  // Paso 3: Completitud de ubicaciones (20%)
  const completeLocations = formData.locations.filter(loc => 
    loc.locationName && 
    loc.address && 
    loc.taskName && 
    loc.estimatedTimePerTask > 0
  ).length;
  progress += (completeLocations / Math.max(1, actualLocations)) * 20;
  
  return Math.min(100, Math.round(progress));
};

/**
 * Valida una ubicación completa
 */
export const validateLocation = (location: Partial<LocationData>): string[] => {
  const errors: string[] = [];
  
  if (!location.locationName?.trim()) {
    errors.push('El nombre de la ubicación es requerido');
  }
  
  if (!location.address?.trim()) {
    errors.push('La dirección es requerida');
  }
  
  if (!location.taskName?.trim()) {
    errors.push('El nombre de la tarea es requerido');
  }
  
  if (location.isRepetitive && (!location.repetitions || location.repetitions < 1)) {
    errors.push('El número de repeticiones debe ser mayor a 0');
  }
  
  if (!location.estimatedTimePerTask || location.estimatedTimePerTask < 1) {
    errors.push('El tiempo estimado debe ser mayor a 0');
  }
  
  return errors;
};

/**
 * Exporta los datos del formulario a JSON
 */
export const exportToJSON = (formData: WorkPlanFormData): string => {
  return JSON.stringify(formData, null, 2);
};

/**
 * Importa datos de JSON al formulario
 */
export const importFromJSON = (jsonString: string): WorkPlanFormData | null => {
  try {
    const data = JSON.parse(jsonString);
    // Convertir fechas de string a Date
    if (data.deadline) {
      data.deadline = new Date(data.deadline);
    }
    return data as WorkPlanFormData;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return null;
  }
};

/**
 * Crea un resumen textual del plan
 */
export const generatePlanSummary = (formData: WorkPlanFormData): string => {
  const estimate = calculatePlanEstimate(formData);
  
  return `
Plan de Trabajo: ${formData.activityName}

Descripción: ${formData.description}

Recursos:
- Ubicaciones: ${formData.locations.length}
- Trabajadores: ${formData.totalWorkers}
- Días laborables: ${formData.workDays.map(d => getWeekDayName(d)).join(', ')}
- Horario: ${formData.workHours.start} - ${formData.workHours.end}

Estimaciones:
- Tiempo en tareas: ${formatMinutesToTime(estimate.totalTaskTime)}
- Tiempo en traslados: ~${formatMinutesToTime(estimate.totalTravelTime)}
- Tiempo total: ${formatMinutesToTime(estimate.totalTime)}
- Días estimados: ${estimate.estimatedDays}
- Trabajadores sugeridos: ${estimate.workersNeeded}

Estado: ${estimate.isOnSchedule ? '✓ A tiempo' : '⚠ Requiere ajuste'}
Fecha límite: ${formatDate(formData.deadline)}
  `.trim();
};