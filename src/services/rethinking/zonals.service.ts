import { ApiResponse, CreateZonalDto, Headquarters, UpdateZonalDto, Workplace, Zonal } from "../../types/rethinking/organization.types";
import { delay } from "./mocks.example.service";

let mockZonals: Zonal[] = [];
export let mockHeadquarters: Headquarters[] = [];
let mockWorkplaces: Workplace[] = [];

export const zonalsService = {
  async getAll(tenantId: string): Promise<ApiResponse<Zonal[]>> {
    await delay();
    return { data: mockZonals, success: true };
  },

  async getById(id: string): Promise<ApiResponse<Zonal>> {
    await delay();
    const item = mockZonals.find(z => z.id === id);
    if (!item) throw new Error('Zonal no encontrado');
    return { data: item, success: true };
  },

  async create(data: CreateZonalDto, tenantId: string): Promise<ApiResponse<Zonal>> {
    await delay();
    const zonalId = `zonal-${Date.now()}`;
    const newZonal: Zonal = {
      id: zonalId,
      tenantId,
      name: data.name,
      description: data.description,
      idDepartment: data.idDepartment,
      idProvince: data.idProvince,
      idDistrict: data.idDistrict,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockZonals.push(newZonal);

    // Create headquarters
    data.headquarters.forEach(hq => {
      const hqId = `hq-${Date.now()}-${Math.random()}`;
      const newHq: Headquarters = {
        id: hqId,
        zonalId,
        name: hq.name,
        description: hq.description,
        address: hq.address,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockHeadquarters.push(newHq);

      // Create workplaces
      hq.workplaces.forEach(wp => {
        mockWorkplaces.push({
          id: `wp-${Date.now()}-${Math.random()}`,
          tenantId,
          headquartersId: hqId,
          name: wp.name,
          code: wp.code,
          address: wp.address,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });
    });

    return { data: newZonal, success: true, message: 'Zonal creado exitosamente' };
  },

  async update(id: string, data: UpdateZonalDto): Promise<ApiResponse<Zonal>> {
    await delay();
    const index = mockZonals.findIndex(z => z.id === id);
    if (index === -1) throw new Error('Zonal no encontrado');
    mockZonals[index] = { ...mockZonals[index], ...data, updatedAt: new Date().toISOString() };
    return { data: mockZonals[index], success: true, message: 'Zonal actualizado' };
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    await delay();
    mockZonals = mockZonals.filter(z => z.id !== id);
    mockHeadquarters = mockHeadquarters.filter(hq => hq.zonalId !== id);
    return { data: undefined, success: true, message: 'Zonal eliminado' };
  },
};