import { AccessLevelPermission, ApiResponse, AssignPermissionsDto, Permission } from "../../types/rethinking/organization.types";
import { delay } from "./mocks.example.service";

let mockPermissions: Permission[] = [
  { id: 'p-1', code: 'create_zonals', name: 'Crear Zonales', category: 'zonals', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'p-2', code: 'edit_zonals', name: 'Editar Zonales', category: 'zonals', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'p-3', code: 'delete_zonals', name: 'Eliminar Zonales', category: 'zonals', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'p-4', code: 'create_teams', name: 'Crear Equipos', category: 'teams', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'p-5', code: 'edit_teams', name: 'Editar Equipos', category: 'teams', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'p-6', code: 'assign_tasks', name: 'Asignar Tareas', category: 'tasks', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'p-7', code: 'view_own_tasks', name: 'Ver Tareas Propias', category: 'tasks', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'p-8', code: 'update_task_status', name: 'Actualizar Estado', category: 'tasks', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'p-9', code: 'view_all_reports', name: 'Ver Todos los Reportes', category: 'reports', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'p-10', code: 'view_team_reports', name: 'Ver Reportes del Equipo', category: 'reports', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

let mockAccessLevelPermissions: AccessLevelPermission[] = [
  { id: 'alp-1', accessLevelId: 'al-1', permissionId: 'p-1', createdAt: new Date().toISOString() },
  { id: 'alp-2', accessLevelId: 'al-1', permissionId: 'p-2', createdAt: new Date().toISOString() },
  { id: 'alp-3', accessLevelId: 'al-1', permissionId: 'p-3', createdAt: new Date().toISOString() },
  { id: 'alp-4', accessLevelId: 'al-2', permissionId: 'p-4', createdAt: new Date().toISOString() },
  { id: 'alp-5', accessLevelId: 'al-3', permissionId: 'p-10', createdAt: new Date().toISOString() },
  { id: 'alp-6', accessLevelId: 'al-4', permissionId: 'p-7', createdAt: new Date().toISOString() },
];

export const permissionsService = {
  async getAll(): Promise<ApiResponse<Permission[]>> {
    await delay();
    return { data: mockPermissions, success: true };
  },

  async getByAccessLevel(accessLevelId: string): Promise<ApiResponse<Permission[]>> {
    await delay();
    const alPermissions = mockAccessLevelPermissions.filter(alp => alp.accessLevelId === accessLevelId);
    const permissions = alPermissions.map(alp => mockPermissions.find(p => p.id === alp.permissionId)).filter(Boolean) as Permission[];
    return { data: permissions, success: true };
  },

  async assignToAccessLevel(data: AssignPermissionsDto): Promise<ApiResponse<void>> {
    await delay();
    mockAccessLevelPermissions = mockAccessLevelPermissions.filter(alp => alp.accessLevelId !== data.accessLevelId);
    data.permissionIds.forEach(permissionId => {
      mockAccessLevelPermissions.push({
        id: `alp-${Date.now()}-${permissionId}`,
        accessLevelId: data.accessLevelId,
        permissionId,
        createdAt: new Date().toISOString(),
      });
    });
    return { data: undefined, success: true, message: 'Permisos asignados' };
  },
};
