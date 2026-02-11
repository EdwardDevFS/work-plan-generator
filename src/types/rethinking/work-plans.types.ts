import { ActivityInstance } from "./activity-instances.types";
import { WorkPlanStatus } from "./domain.types";
import { User } from "./users.types";
import { Zonal } from "./zonal.types";

export interface WorkPlan {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  mainZonalId: string;
  mainZonal?: Zonal;
  startDate: string;
  endDate: string;
  status: WorkPlanStatus;
  createdById: string;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
  workPlanZonals?: WorkPlanZonal[];
  activityInstances?: ActivityInstance[];
}

export interface WorkPlanZonal {
  id: string;
  workPlanId: string;
  zonalId: string;
  zonal?: Zonal;
  notes?: string;
  createdAt: string;
}

export interface CreateWorkPlanDto {
  name: string;
  description?: string;
  mainZonalId: string;
  secondaryZonalIds: string[];
  startDate: string;
  endDate: string;
  activityTemplateIds: string[];
}

export interface UpdateWorkPlanDto extends Partial<CreateWorkPlanDto> {
  status?: WorkPlanStatus;
}