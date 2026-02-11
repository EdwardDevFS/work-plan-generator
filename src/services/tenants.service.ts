import { api } from './api';
import { Tenant, PaginatedResponse, PaginationParams, CreateTenantDto, UpdateTenantDto, User } from '../types';
import { ItemComboBaseDto } from './users.service';

export const tenantsService = {
  getAll: (params?: PaginationParams) =>
    api.get<PaginatedResponse<Tenant>>('/tenants', { params }),

  getById: (id: string) =>
    api.get<Tenant>(`/tenants/${id}`),
  
  getByIdWithoutRestriction: (id: string) =>
    api.get<Tenant>(`/tenants/${id}/safe-detail`),

  getCombo: (search?: string) =>
    api.get<ItemComboBaseDto[]>('/tenants/combo', { 
      params: search ? { search } : undefined 
    }),

  create: (data: CreateTenantDto) =>
    api.post<Tenant>('/tenants', data),

  update: (id: string, data: UpdateTenantDto) =>
    api.put<Tenant>(`/tenants/${id}`, data),

  delete: (id: string) =>
    api.delete(`/tenants/${id}`),

  getUsers: (id: string) =>
    api.get<User[]>(`/tenants/${id}/users`),

  assignUser: (tenantId: string, userId: string) =>
    api.post<Tenant>(`/tenants/${tenantId}/users`, { userId }),

  removeUser: (tenantId: string, userId: string) =>
    api.delete<Tenant>(`/tenants/${tenantId}/users/${userId}`),
};