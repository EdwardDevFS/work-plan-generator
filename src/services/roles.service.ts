import { api } from './api';
import { Role, PaginatedResponse, PaginationParams, UpdateRoleDto, User, TenantPaginatedRequest } from '../types';

interface CreateRoleDto {

  name: string;
  description: string;
  viewIds: string[];

}

export const rolesService = {
  getAll: (params?: TenantPaginatedRequest) =>
    api.get<PaginatedResponse<Role>>('/roles', { params }),

  getById: (id: string) =>
    api.get<Role>(`/roles/${id}`),

  create: (data: CreateRoleDto) =>
    api.post<Role>('/roles', data),

  update: (id: string, data: UpdateRoleDto) =>
    api.put<Role>(`/roles/${id}`, data),

  delete: (id: string) =>
    api.delete(`/roles/${id}`),

  getUsers: (id: string) =>
    api.get<User[]>(`/roles/${id}/users`),
};