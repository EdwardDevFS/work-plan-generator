import { Role } from "./roles-permissions.types";
import { CreateUserZonalAssignmentDto, UserZonalAssignment } from "./user-zonal-assigments.types";

export interface User {
  id: string;
  tenantId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  roles?: Role[];
  zonalAssignments?: UserZonalAssignment[];
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleIds: string[];
  zonalAssignments?: CreateUserZonalAssignmentDto[];
}

export interface UpdateUserDto extends Partial<Omit<CreateUserDto, 'password'>> {
  isActive?: boolean;
}