// services/work-plan-api.service.ts - ACTUALIZADO

import { 
  UserScheduleDetail, 
  UserScheduleListItem, 
  WorkPlanFormData, 
  WorkPlanListItem, 
  WorkPlanPreviewResponse, 
  WorkTask,
  DailySchedule
} from "../types/workplan.types";
import { api } from "./api";
import { adaptWorkTask, adaptDailySchedule  } from "./workplan-adapter.service";

export const workPlansApi = {
  /**
   * Preview de un plan de trabajo antes de generarlo
   */
  async preview(formData: WorkPlanFormData, simulatedWorkers?: number): Promise<WorkPlanPreviewResponse> {
    const dto = convertFormToDTO(formData);
    
    const payload = simulatedWorkers 
      ? { ...dto, simulatedWorkers }
      : dto;
    
    const res = await api.post(`/work-plans/preview`, payload);
    return res.data;
  },

  /**
   * Generar un plan de trabajo
   */
  async generate(
    formData: WorkPlanFormData,
    saveAsTemplate: boolean,
    templateName?: string,
    templateDescription?: string
  ) {
    const dto = convertFormToDTO(formData);
    const res = await api.post(
      `/work-plans`,
      { ...dto, saveAsTemplate, templateName, templateDescription }
    );
    return res.data;
  },

  /**
   * Obtener lista de planes de trabajo
   */
  async getWorkPlans(status?: string): Promise<WorkPlanListItem[]> {
    const params = status ? { status } : {};
    const response = await api.get(`/work-plans`, { params });
    return response.data;
  },

  /**
   * Obtener detalle de un plan de trabajo por ID
   */
  async getWorkPlanById(id: string): Promise<any> {
    const response = await api.get(`/work-plans/${id}`);
    return response.data;
  },

  /**
   * Obtener lista de schedules de usuarios para un plan
   */
  async getUserSchedules(workPlanId: string): Promise<UserScheduleListItem[]> {
    const response = await api.get(`/work-plans/${workPlanId}/user-schedules`);
    return response.data;
  },

  /**
   * Obtener detalle completo del schedule de un usuario
   * ADAPTADO: transforma los datos del backend al formato esperado por el frontend
   */
  async getUserScheduleDetail(workPlanId: string, userId: string): Promise<UserScheduleDetail> {
    const response = await api.get(
      `/work-plans/${workPlanId}/user-schedules/${userId}`
    );
    
    const data = response.data;
    
    // Adaptar los dailySchedules para que tengan el formato correcto
    const adaptedSchedules = data.dailySchedules.map((schedule: any) => 
      adaptDailySchedule(schedule)
    );
    
    return {
      ...data,
      dailySchedules: adaptedSchedules,
    };
  },

  /**
   * Obtener un DailySchedule específico por ID
   */
  async getDailyScheduleById(scheduleId: string): Promise<DailySchedule> {
    const response = await api.get(`/daily-schedules/${scheduleId}`);
    return adaptDailySchedule(response.data);
  },

  /**
   * Obtener un WorkTask específico por ID
   */
  async getWorkTaskById(taskId: string): Promise<WorkTask> {
    const response = await api.get(`/work-tasks/${taskId}`);
    return adaptWorkTask(response.data);
  },

  /**
   * Obtener asignaciones de un task específico
   */
  async getTaskAssignments(taskId: string): Promise<any[]> {
    const response = await api.get(`/work-tasks/${taskId}/assignments`);
    return response.data;
  },

  /**
   * Actualizar el estado de una tarea
   */
  async updateTaskStatus(
    planId: string,
    taskId: string,
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'
  ): Promise<WorkTask> {
    const response = await api.patch(
      `/work-plans/${planId}/tasks/${taskId}/status`,
      { status }
    );
    return adaptWorkTask(response.data);
  },

  /**
   * Completar una tarea con datos de ejecución
   */
  async completeTask(
    planId: string,
    taskId: string,
    data: {
      actualDuration: number;
      notes?: string;
      photos?: string[];
    }
  ): Promise<WorkTask> {
    const response = await api.patch(
      `/work-plans/${planId}/tasks/${taskId}/complete`,
      data
    );
    return adaptWorkTask(response.data);
  },

  /**
   * Actualizar el estado de un plan de trabajo
   */
  async updatePlanStatus(
    planId: string,
    status: 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  ): Promise<WorkPlanListItem> {
    const response = await api.patch(
      `/work-plans/${planId}/status`,
      { status }
    );
    return response.data;
  },

  /**
   * Eliminar un plan de trabajo
   */
  async deletePlan(planId: string): Promise<void> {
    await api.delete(`/work-plans/${planId}`);
  },

  /**
   * Obtener vista mensual de un plan
   */
  async getMonthlyView(
    planId: string,
    month: string, // formato: YYYY-MM
    userId?: string
  ): Promise<any> {
    const params: any = { month };
    if (userId) {
      params.userId = userId;
    }
    const response = await api.get(
      `/work-plans/${planId}/monthly-view`,
      { params }
    );
    return response.data;
  },

  /**
   * Obtener dashboard de progreso de un plan
   */
  async getPlanProgressDashboard(planId: string): Promise<any> {
    const response = await api.get(
      `/work-plans/${planId}/progress-dashboard`
    );
    return response.data;
  },
};

/**
 * Convierte los datos del formulario al DTO esperado por el backend
 */
function convertFormToDTO(formData: WorkPlanFormData) {
  return {
    planName: formData.planName,
    description: formData.description,
    deadline: formData.deadline,
    selectedStoreIds: formData.selectedStores.map(s => s.id),
    selectedUserIds: formData.selectedUsers.map(u => u.id),
    workDays: formData.workDays,
    workTimeSlots: formData.workTimeSlots.map(slot => ({
      start: slot.start,
      end: slot.end,
    })),
    storeActivities: formData.storeActivities.map(sa => ({
      activityId: sa.id,
      storeId: sa.store.id,
      taskName: sa.activity.activityName,
      supervisorId: sa.supervisor?.id,
      isRepetitive: sa.activity.isRepetitive,
      repetitions: sa.repetitions,
      estimatedTimePerTask: sa.activity.estimatedTimePerTask,
      assignmentMode: sa.assignmentMode,
      assignedUserIds: sa.assignedUsers.map(u => u.id),
      hasCustomSchedule: sa.hasCustomSchedule,
      customTimeSlots: sa.hasCustomSchedule ? sa.customTimeSlots.map(slot => ({
        start: slot.start,
        end: slot.end,
      })) : undefined,
    })),
  };
}