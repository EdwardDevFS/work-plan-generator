export interface Zonal {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  parentZonalId?: string;
  parentZonal?: Zonal;
  childZonals?: Zonal[];
  country?: string;
  department?: string;
  province?: string;
  district?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateZonalDto {
  name: string;
  description?: string;
  parentZonalId?: string;
  country?: string;
  department?: string;
  province?: string;
  district?: string;
}

export interface UpdateZonalDto extends Partial<CreateZonalDto> {
  isActive?: boolean;
}