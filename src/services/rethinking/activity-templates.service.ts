import { ActivityTemplate, ApiResponse, CreateActivityTemplateDto, SubactivityTemplate, UpdateActivityTemplateDto } from "../../types/rethinking/organization.types";
import { delay } from "./mocks.example.service";

let mockActivityTemplates: ActivityTemplate[] = [];
let mockSubactivities: SubactivityTemplate[] = [];

export const activityTemplatesService = {
  async getAll(tenantId: string): Promise<ApiResponse<ActivityTemplate[]>> {
    await delay();
    const templatesWithSubs = mockActivityTemplates.map(template => ({
      ...template,
      subactivities: mockSubactivities.filter(sub => sub.activityTemplateId === template.id),
    }));
    return { data: templatesWithSubs, success: true };
  },

  async create(data: CreateActivityTemplateDto, tenantId: string): Promise<ApiResponse<ActivityTemplate>> {
    await delay();
    const templateId = `template-${Date.now()}`;
    const newTemplate: ActivityTemplate = {
      id: templateId,
      tenantId,
      name: data.name,
      description: data.description,
      estimatedDurationMinutes: data.estimatedDurationMinutes,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockActivityTemplates.push(newTemplate);

    data.subactivities.forEach(sub => {
      mockSubactivities.push({
        id: `sub-${Date.now()}-${Math.random()}`,
        activityTemplateId: templateId,
        name: sub.name,
        description: sub.description,
        executionOrder: sub.executionOrder,
        isMandatory: sub.isMandatory,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    return { data: newTemplate, success: true, message: 'Plantilla de actividad creada' };
  },

  async update(
    id: string,
    data: UpdateActivityTemplateDto
  ): Promise<ApiResponse<ActivityTemplate>> {
    await delay();

    const index = mockActivityTemplates.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Plantilla no encontrada');

    const { subactivities, ...rest } = data;

    mockActivityTemplates[index] = {
      ...mockActivityTemplates[index],
      ...rest,
      subactivities: subactivities
        ? subactivities.map((sa, i) => ({
            id: crypto.randomUUID(),
            activityTemplateId: id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...sa,
          }))
        : mockActivityTemplates[index].subactivities,
      updatedAt: new Date().toISOString(),
    };

    return {
      data: mockActivityTemplates[index],
      success: true,
      message: 'Plantilla actualizada',
    };
  },


  async delete(id: string): Promise<ApiResponse<void>> {
    await delay();
    mockActivityTemplates = mockActivityTemplates.filter(t => t.id !== id);
    mockSubactivities = mockSubactivities.filter(sub => sub.activityTemplateId !== id);
    return { data: undefined, success: true, message: 'Plantilla eliminada' };
  },
};