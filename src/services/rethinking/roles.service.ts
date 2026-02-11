import { ApiResponse } from "../../types/rethinking/api-response.types";
import { CreateRoleDto, Role, UpdateRoleDto } from "../../types/rethinking/organization.types";
import { mockAccessLevels } from "./access-levels.service";
import { delay } from "./mocks.example.service";

let mockRoles: Role[] = [];

export const rolesService = {
  async getAll(tenantId: string): Promise<ApiResponse<Role[]>> {
    await delay();
    const rolesWithAccessLevel = mockRoles.map(role => ({
      ...role,
      accessLevel: mockAccessLevels.find(al => al.id === role.accessLevelId),
    }));
    return { data: rolesWithAccessLevel, success: true };
  },

  async create(data: CreateRoleDto, tenantId: string): Promise<ApiResponse<Role>> {
    await delay();
    const newRole: Role = {
      id: `role-${Date.now()}`,
      tenantId,
      ...data,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockRoles.push(newRole);
    return { data: newRole, success: true, message: 'Rol creado' };
  },

  async update(id: string, data: UpdateRoleDto): Promise<ApiResponse<Role>> {
    await delay();
    const index = mockRoles.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Rol no encontrado');
    mockRoles[index] = { ...mockRoles[index], ...data, updatedAt: new Date().toISOString() };
    return { data: mockRoles[index], success: true, message: 'Rol actualizado' };
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    await delay();
    mockRoles = mockRoles.filter(r => r.id !== id);
    return { data: undefined, success: true, message: 'Rol eliminado' };
  },
};