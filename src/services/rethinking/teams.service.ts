import { ApiResponse, CreateTeamDto, Team, UpdateTeamDto } from "../../types/rethinking/organization.types";
import { delay } from "./mocks.example.service";
import { mockUsers } from "./users.service";

let mockTeams: Team[] = [];

export const teamsService = {
  async getAll(tenantId: string): Promise<ApiResponse<Team[]>> {
    await delay();
    return { data: mockTeams, success: true };
  },

  async create(data: CreateTeamDto, tenantId: string): Promise<ApiResponse<Team>> {
    await delay();
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      tenantId,
      headquartersId: data.headquartersId,
      name: data.name,
      description: data.description,
      supervisorId: data.supervisorId,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockTeams.push(newTeam);

    // Assign users to team
    data.memberIds.forEach(memberId => {
      const userIndex = mockUsers.findIndex(u => u.id === memberId);
      if (userIndex !== -1) {
        mockUsers[userIndex].teamId = newTeam.id;
      }
    });

    return { data: newTeam, success: true, message: 'Equipo creado' };
  },

  async update(id: string, data: UpdateTeamDto): Promise<ApiResponse<Team>> {
    await delay();
    const index = mockTeams.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Equipo no encontrado');
    mockTeams[index] = { ...mockTeams[index], ...data, updatedAt: new Date().toISOString() };
    return { data: mockTeams[index], success: true, message: 'Equipo actualizado' };
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    await delay();
    mockTeams = mockTeams.filter(t => t.id !== id);
    return { data: undefined, success: true, message: 'Equipo eliminado' };
  },
};