import { AssignmentType } from "./domain.types";
import { Zonal } from "./zonal.types";

export interface UserZonalAssignment {
  id: string;
  userId: string;
  zonalId: string;
  zonal?: Zonal;
  assignmentType: AssignmentType;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserZonalAssignmentDto {
  zonalId: string;
  assignmentType: AssignmentType;
}