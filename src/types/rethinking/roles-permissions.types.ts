import { RoleLevel } from "./domain.types";

export interface Role {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  level: RoleLevel;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  level: RoleLevel;
  permissions: string[];
}

export interface UpdateRoleDto extends Partial<CreateRoleDto> {
  isActive?: boolean;
}