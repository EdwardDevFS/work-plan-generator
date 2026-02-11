import { PaginatedResponse, User } from '../types';
import { CreateStoreDto, PaginationParams, Store, UpdateStoreDto } from '../types/store.types';
import { api } from './api';

export const storesService = {
  getAll: (params?: PaginationParams & { isActive?: boolean }) =>
    api.get<PaginatedResponse<Store>>('/stores', { params }),

  getByTenant: (tenantId: string, params?: PaginationParams) =>
    api.get<PaginatedResponse<Store>>(`/stores/tenant/${tenantId}`, { params }),

  getById: (id: string) =>
    api.get<Store>(`/stores/${id}`),

  create: (data: CreateStoreDto) =>
    api.post<Store>('/stores', data),

  update: (id: string, data: UpdateStoreDto) =>
    api.put<Store>(`/stores/${id}`, data),

  delete: (id: string) =>
    api.delete(`/stores/${id}`),

  getUsers: (id: string) =>
    api.get<User[]>(`/stores/${id}/users`),

  assignUser: (storeId: string, userId: string) =>
    api.post<Store>(`/stores/${storeId}/users`, { userId }),

  removeUser: (storeId: string, userId: string) =>
    api.delete<Store>(`/stores/${storeId}/users/${userId}`),
};