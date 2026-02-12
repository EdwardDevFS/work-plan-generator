import { View } from "../types";
import { api } from "./api";

export const viewsService = {


  getDefaultViewsForUser: (userId: string, tenantId?: string) => {
    return api.get(`/user-views/${userId}/defaults`, {params: {tenantId: tenantId}});
  },

  getRoleViews: () => {
    return api.get(`/role-views/`);
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