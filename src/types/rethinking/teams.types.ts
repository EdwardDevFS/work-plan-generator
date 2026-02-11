import { User } from "./users.types";
import { Zonal } from "./zonal.types";

export interface Team {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  supervisorId?: string;
  supervisor?: User;
  zonalId?: string;
  zonal?: Zonal;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  user?: User;
  joinedAt: string;
}

export interface CreateTeamDto {
  name: string;
  description?: string;
  supervisorId?: string;
  zonalId?: string;
  memberIds?: string[];
}

export interface UpdateTeamDto extends Partial<CreateTeamDto> {
  isActive?: boolean;
}