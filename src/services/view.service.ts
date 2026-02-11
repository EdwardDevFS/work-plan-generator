import { View } from "../types";
import { api } from "./api";

export const viewsService = {
  getUserViews: (userId: string, tenantId?: string) => {
    return api.get(`/user-views/${userId}`, {params: {tenantId: tenantId}});
  },

  getDefaultViewsForUser: (userId: string, tenantId?: string) => {
    return api.get(`/user-views/${userId}/defaults`, {params: {tenantId: tenantId}});
  },

  createUserViews: (userId: string, viewIds: string[], tenantId?: string) => {
    return api.post(`/user-views`, { userId, viewIds, tenantId });
  },

  updateUserViews: (userId: string, viewIds: string[], tenantId?: string) => {
    return api.put(`/user-views/${userId}`, { viewIds, tenantId });
  },

  deleteUserViews: (userId: string, tenantId?: string) => {
    return api.delete(`/user-views/${userId}`, {params: {tenantId: tenantId}});
  },

  getRoleViews: (roleId: string, tenantId?: string) => {
    return api.get(`/role-views/${roleId}`, {params: {tenantId: tenantId}});
  },

  createRoleViews: (roleId: string, viewIds: string[], tenantId?: string) => {
    return api.post(`/role-views`, { roleId, viewIds, tenantId });
  },

  updateRoleViews: (roleId: string, viewIds: string[], tenantId?: string) => {
    return api.put(`/role-views/${roleId}`, { viewIds, tenantId });
  },

  deleteRoleViews: (roleId: string, tenantId?: string) => {
    return api.delete(`/role-views/${roleId}`, { params: tenantId });
  },

  getAllViews: () => {
    return api.get(`/views`);
  },
};