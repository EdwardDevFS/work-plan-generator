import { jwtDecode } from 'jwt-decode';

export interface JwtPayload {
  userId: string;
  tenantId: string;
  roles: Array<{ id: string; name: string }>;
  iat: number;
  exp: number;
}

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwtDecode<JwtPayload>(token);
  } catch (error) {
    return null;
  }
};

export const isSystemAdmin = (roles: Array<{ id: string; name: string }>): boolean => {
  return roles.some(role => role.name === 'System Administrator');
};

export const isAdmin = (roles: Array<{ id: string; name: string }>): boolean => {
  return roles.some(role => role.name === 'Administrator');
};

export const hasRole = (roles: Array<{ id: string; name: string }>, roleName: string): boolean => {
  return roles.some(role => role.name === roleName);
};

export const canAccessTenants = (roles: Array<{ id: string; name: string }>): boolean => {
  return isSystemAdmin(roles);
};

export const canAccessOtherModules = (roles: Array<{ id: string; name: string }>): boolean => {
  return isAdmin(roles) || isSystemAdmin(roles);
};