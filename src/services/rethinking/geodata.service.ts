import {
  Country,
  Department,
  Province,
  District,
  GetCountriesParams,
  GetDepartmentsParams,
  GetProvincesParams,
  GetDistrictsParams,
} from '../../types/rethinking/geodata.types';
import { api } from '../api';


export const geodataService = {
  getCountries: async (params?: GetCountriesParams): Promise<Country[]> => {
    const response = await api.get<Country[]>(`/geodata/countries`, {
      params,
    });
    return response.data;
  },

  getDepartments: async (params?: GetDepartmentsParams): Promise<Department[]> => {
    const response = await api.get<Department[]>(`/geodata/departments`, {
      params,
    });
    return response.data;
  },

  getProvinces: async (params?: GetProvincesParams): Promise<Province[]> => {
    const response = await api.get<Province[]>(`/geodata/provinces`, {
      params,
    });
    return response.data;
  },

  getDistricts: async (params?: GetDistrictsParams): Promise<District[]> => {
    const response = await api.get<District[]>(`/geodata/districts`, {
      params,
    });
    return response.data;
  },
};