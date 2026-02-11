export interface ActivityTemplate {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  estimatedDurationMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subactivityTemplates?: SubactivityTemplate[];
}

export interface SubactivityTemplate {
  id: string;
  activityTemplateId: string;
  name: string;
  description?: string;
  executionOrder: number;
  isMandatory: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityTemplateDto {
  name: string;
  description?: string;
  estimatedDurationMinutes: number;
  subactivities?: CreateSubactivityTemplateDto[];
}

export interface CreateSubactivityTemplateDto {
  name: string;
  description?: string;
  executionOrder: number;
  isMandatory: boolean;
}

export interface UpdateActivityTemplateDto extends Partial<CreateActivityTemplateDto> {
  isActive?: boolean;
}
