import { api } from './api';
import { Store, StoreFormData } from '../types/store.types';

export const storeService = {
  async getStores(): Promise<Store[]> {
    const response = await api.get<Store[]>('/stores');
    return response.data;
  },

  async getStoreById(id: string): Promise<Store> {
    const response = await api.get<Store>(`/stores/${id}`);
    return response.data;
  },

  async createStore(storeData: StoreFormData): Promise<Store> {
    const response = await api.post<Store>('/stores', storeData);
    return response.data;
  },

  async updateStore(id: string, storeData: Partial<StoreFormData>): Promise<Store> {
    const response = await api.put<Store>(`/stores/${id}`, storeData);
    return response.data;
  },

  async deleteStore(id: string): Promise<void> {
    await api.delete(`/stores/${id}`);
  }
};