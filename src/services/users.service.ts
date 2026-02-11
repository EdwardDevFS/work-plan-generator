import { User, PaginatedResponse, PaginationParams, CreateUserDto, UpdateUserDto, Role, TenantPaginatedRequest  } from '../types';
import { api } from './api';

export interface AutocompleteSearch
{
  search?: string;
  tenantId?: string;
}

export interface ItemComboBaseDto
{
  key: string;
  text: string;
  description: string;
}

export interface AssignRolesDto {
  roles: string[];
}

export const usersService = {
  getAll: (params?: TenantPaginatedRequest) =>
    api.get<PaginatedResponse<User>>('/users', { params }),

  getUsersCombo: (params?: AutocompleteSearch) =>
    api.get<ItemComboBaseDto[]>('/users/combo', { params }),

  getById: (id: string) =>
    api.get<User>(`/users/${id}`),

  create: (data: CreateUserDto) =>
    api.post<User>('/users', data),

  update: (id: string, data: UpdateUserDto) =>
    api.put<User>(`/users/${id}`, data),

  delete: (id: string) =>
    api.delete(`/users/${id}`),

  getRoles: (id: string) =>
    api.get<Role[]>(`/users/${id}/roles`),

  assignRole: (userId: string, data: AssignRolesDto) =>
    api.post<User>(`/users/${userId}/roles`, data),

  removeRole: (userId: string, roleId: string) =>
    api.delete<User>(`/users/${userId}/roles/${roleId}`),
};
