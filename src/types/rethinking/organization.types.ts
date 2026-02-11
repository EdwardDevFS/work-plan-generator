// ==========================================
// ACCESS LEVELS & PERMISSIONS
// ==========================================

export interface AccessLevel {
  id: string;
  code: string;
  name: string;
  description?: string;
  zonalScope: string;
  headquarterScope: string;
  workplaceScope: string;
  teamScope: string;
  workerScope: string;
  metricsScope: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccessLevelPermission {
  id: string;
  accessLevelId: string;
  permissionId: string;
  permission?: Permission;
  createdAt: string;
}

export interface CreateAccessLevelDto {
  code: string;
  name: string;
  description?: string;
  zonalScope: string;
  headquarterScope: string;
  workplaceScope: string;
  teamScope: string;
  workerScope: string;
  metricsScope: string;
}

export interface UpdateAccessLevelDto extends Partial<CreateAccessLevelDto> {
  isActive?: boolean;
}

export interface AssignPermissionsDto {
  accessLevelId: string;
  permissionIds: string[];
}

// ==========================================
// ORGANIZATIONAL STRUCTURE
// ==========================================

export interface Zonal {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  idDepartment: number;
  idProvince: number;
  idDistrict: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  headquarters?: Headquarters[];
  departmentName?: string;
  provinceName?: string;
  districtName?: string;
}

export interface Headquarters {
  id: string;
  zonalId: string;
  zonal?: Zonal;
  name: string;
  description?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  workplaces?: Workplace[];
  teams?: Team[];
}

export interface Workplace {
  id: string;
  tenantId: string;
  headquartersId: string;
  headquarters?: Headquarters;
  name: string;
  code?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateZonalDto {
  name: string;
  description?: string;
  idDepartment: number;
  idProvince: number;
  idDistrict: number;
  headquarters: CreateHeadquartersDto[];
}

export interface CreateHeadquartersDto {
  name: string;
  description?: string;
  address?: string;
  workplaces: CreateWorkplaceDto[];
}

export interface CreateWorkplaceDto {
  name: string;
  code?: string;
  address?: string;
}

export interface UpdateZonalDto extends Partial<Omit<CreateZonalDto, 'headquarters'>> {
  isActive?: boolean;
}

export interface UpdateHeadquartersDto extends Partial<Omit<CreateHeadquartersDto, 'workplaces'>> {
  isActive?: boolean;
}

export interface UpdateWorkplaceDto extends Partial<CreateWorkplaceDto> {
  isActive?: boolean;
}

// ==========================================
// ROLES & USERS
// ==========================================

export interface Role {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  accessLevelId: string;
  accessLevel?: AccessLevel;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  tenantId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  idDepartment: number;
  idProvince: number;
  idDistrict: number;
  teamId?: string;
  team?: Team;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  roles?: Role[];
  departmentName?: string;
  provinceName?: string;
  districtName?: string;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  accessLevelId: string;
}

export interface UpdateRoleDto extends Partial<CreateRoleDto> {
  isActive?: boolean;
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  idDepartment: number;
  idProvince: number;
  idDistrict: number;
  roleIds: string[];
}

export interface UpdateUserDto extends Partial<Omit<CreateUserDto, 'password'>> {
  isActive?: boolean;
}

// ==========================================
// TEAMS
// ==========================================

export interface Team {
  id: string;
  tenantId: string;
  headquartersId: string;
  headquarters?: Headquarters;
  name: string;
  description?: string;
  supervisorId?: string;
  supervisor?: User;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  members?: User[];
}

export interface CreateTeamDto {
  headquartersId: string;
  name: string;
  description?: string;
  supervisorId: string;
  memberIds: string[];
}

export interface UpdateTeamDto extends Partial<CreateTeamDto> {
  isActive?: boolean;
}

// ==========================================
// ACTIVITIES & SUBACTIVITIES
// ==========================================

export interface ActivityTemplate {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  estimatedDurationMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subactivities?: SubactivityTemplate[];
}

export interface SubactivityTemplate {
  id: string;
  activityTemplateId: string;
  name: string;
  description?: string;
  executionOrder: number;
  isMandatory: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityTemplateDto {
  name: string;
  description?: string;
  estimatedDurationMinutes: number;
  subactivities: CreateSubactivityTemplateDto[];
}

export interface CreateSubactivityTemplateDto {
  name: string;
  description?: string;
  executionOrder: number;
  isMandatory: boolean;
}

export interface UpdateActivityTemplateDto extends Partial<CreateActivityTemplateDto> {
  isActive?: boolean;
}

// ==========================================
// API RESPONSES
// ==========================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}