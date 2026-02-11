import { ActivityTemplate, SubactivityTemplate } from "./activity-template.types";
import { ActivityStatus, NotificationType, SubactivityStatus } from "./domain.types";
import { User } from "./users.types";
import { WorkPlan } from "./work-plans.types";
import { Zonal } from "./zonal.types";

export interface ActivityInstance {
  id: string;
  tenantId: string;
  templateId: string;
  template?: ActivityTemplate;
  workPlanId: string;
  workPlan?: WorkPlan;
  zonalId: string;
  zonal?: Zonal;
  assignedToId: string;
  assignedTo?: User;
  status: ActivityStatus;
  estimatedDurationMinutes: number;
  startedAt?: string;
  completedAt?: string;
  actualDurationMinutes?: number;
  exceededTime: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  subactivityInstances?: SubactivityInstance[];
}

export interface SubactivityInstance {
  id: string;
  templateId: string;
  template?: SubactivityTemplate;
  activityInstanceId: string;
  executionOrder: number;
  status: SubactivityStatus;
  completedAt?: string;
  completedOutOfOrder: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// NOTIFICATIONS
// ==========================================

export interface ActivityNotification {
  id: string;
  tenantId: string;
  activityInstanceId: string;
  activityInstance?: ActivityInstance;
  type: NotificationType;
  message: string;
  recipientId: string;
  recipient?: User;
  isRead: boolean;
  createdAt: string;
}