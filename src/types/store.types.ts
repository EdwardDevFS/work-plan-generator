export interface Store {
  id: string;
  tenantId: string;
  name: string;
  observation?: string;
  address: string;
  latitude: number;
  longitude: number;
  monthlyVisitFrequency: number;
  visitDurationMinutes: number;
  openingHour?: string;
  closingHour?: string;
  priority: 1 | 2 | 3;
  isActive: boolean;
  users?: User[];
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface CreateStoreDto {
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  observation?: string;
  monthlyVisitFrequency: number;
  visitDurationMinutes?: number;
  priority?: 1 | 2 | 3;
  tenantId?: string;
}

export interface UpdateStoreDto {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  observation?: string;
  monthlyVisitFrequency?: number;
  visitDurationMinutes?: number;
  priority?: 1 | 2 | 3;
  isActive?: boolean;
}


export interface PaginationParams {
  tenantId?: string;
  page?: number;
  limit?: number;
}

export interface MapPosition {
  lat: number;
  lng: number;
}