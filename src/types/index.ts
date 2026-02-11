export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface TenantPaginatedRequest extends PaginationParams{
  tenantId?: string | null;
  role?: string | null;
}
export interface View {
  id: string;
  key: string;
  label: string;
  icon: string;
  path: string;
  displayOrder: number;
  isActive: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface User {
  id: string;
  username: string;
  fullName?: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  tenantId: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tenant {
  id: string;
  name: string;
  legalName?: string;
  country?: string;
  city?: string;
  address?: string;
  email?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTenantDto {
  name: string;
  legalName?: string;
  country?: string;
  city?: string;
  address?: string;
  email?: string;
  phone?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Store {
  id: string;
  tenantId: string;
  name: string;
  observation: string;
  address?: string;
  latitude: number;
  longitude: number;
  monthlyVisitFrequency: number;
  visitDurationMinutes: number;
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  users?: User[];
}

export interface CreateUserDto {
  tenantId?: string;
  username: string;
  email: string;
  rolesIds: string[];
  password: string;
  firstName: string;
  lastName: string;
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  rolesIds?: string[];
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}


export interface UpdateTenantDto extends CreateTenantDto{
}

export interface CreateRoleDto {
  tenantId?: string;
  name: string;
  description: string;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
}

export interface CreateStoreDto {
  tenantId?: string;
  name: string;
  observation: string;
  address?: string;
  latitude: number;
  longitude: number;
  monthlyVisitFrequency?: number;
  visitDurationMinutes?: number;
  priority?: number;
}

export interface UpdateStoreDto {
  name?: string;
  observation?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  monthlyVisitFrequency?: number;
  visitDurationMinutes?: number;
  priority?: number;
  isActive?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[],
  isActive: boolean;
  tenantId: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tenant {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
