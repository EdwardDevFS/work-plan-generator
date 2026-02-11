import { AccessLevel, ApiResponse, CreateAccessLevelDto, UpdateAccessLevelDto } from "../../types/rethinking/organization.types";
import { delay } from "./mocks.example.service";

export let mockAccessLevels: AccessLevel[] = [
  {
    id: 'al-1',
    code: 'FULL',
    name: 'Acceso Completo',
    description: 'Acceso total al sistema',
    zonalScope: 'all',
    headquarterScope: 'all',
    workplaceScope: 'all',
    teamScope: 'all',
    workerScope: 'all',
    metricsScope: 'all',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'al-2',
    code: 'ZONAL',
    name: 'Acceso Zonal',
    description: 'Acceso a sede asignada y equipos',
    zonalScope: 'assigned',
    headquarterScope: 'assigned',
    workplaceScope: 'from_headquarters',
    teamScope: 'from_headquarters',
    workerScope: 'from_headquarters',
    metricsScope: 'from_headquarters',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'al-3',
    code: 'SUPERVISION',
    name: 'Acceso de Supervisión',
    description: 'Acceso a su equipo',
    zonalScope: 'none',
    headquarterScope: 'none',
    workplaceScope: 'none',
    teamScope: 'assigned',
    workerScope: 'from_team',
    metricsScope: 'from_team',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'al-4',
    code: 'BASIC',
    name: 'Acceso Básico',
    description: 'Acceso a tareas propias',
    zonalScope: 'none',
    headquarterScope: 'none',
    workplaceScope: 'none',
    teamScope: 'none',
    workerScope: 'self',
    metricsScope: 'self',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const accessLevelsService = {
  async getAll(): Promise<ApiResponse<AccessLevel[]>> {
    await delay();
    return { data: mockAccessLevels, success: true };
  },

  async getById(id: string): Promise<ApiResponse<AccessLevel>> {
    await delay();
    const item = mockAccessLevels.find(al => al.id === id);
    if (!item) throw new Error('Nivel de acceso no encontrado');
    return { data: item, success: true };
  },

  async create(data: CreateAccessLevelDto): Promise<ApiResponse<AccessLevel>> {
    await delay();
    const newItem: AccessLevel = {
      id: `al-${Date.now()}`,
      ...data,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockAccessLevels.push(newItem);
    return { data: newItem, success: true, message: 'Nivel de acceso creado' };
  },

  async update(id: string, data: UpdateAccessLevelDto): Promise<ApiResponse<AccessLevel>> {
    await delay();
    const index = mockAccessLevels.findIndex(al => al.id === id);
    if (index === -1) throw new Error('Nivel de acceso no encontrado');
    mockAccessLevels[index] = { ...mockAccessLevels[index], ...data, updatedAt: new Date().toISOString() };
    return { data: mockAccessLevels[index], success: true, message: 'Nivel de acceso actualizado' };
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    await delay();
    mockAccessLevels = mockAccessLevels.filter(al => al.id !== id);
    return { data: undefined, success: true, message: 'Nivel de acceso eliminado' };
  },
};