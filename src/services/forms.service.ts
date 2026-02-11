import axios from 'axios';
import { CreateFormFieldRequest, CreateFormRequest, Form, FormField, UpdateFormFieldRequest, UpdateFormRequest } from '../types/form.types';
import { api } from './api';
import { PaginatedResponse } from '../types';


class FormService {
  // ========== FORMS ==========
  
  async getForms(tenantId?: string): Promise<PaginatedResponse<Form>> {
    const params = tenantId ? { tenantId } : {};
    const response = await api.get(`/forms`, { params });
    return response.data;
  }

  async getFormById(id: string): Promise<Form> {
    const response = await api.get(`/forms/${id}`);
    return response.data;
  }

  async createForm(data: CreateFormRequest): Promise<Form> {
    const response = await api.post(`/forms`, data);
    return response.data;
  }

  async updateForm(id: string, data: UpdateFormRequest): Promise<Form> {
    const response = await api.put(`/forms/${id}`, data);
    return response.data;
  }

  async deleteForm(id: string): Promise<void> {
    await api.delete(`/forms/${id}`);
  }

  // ========== FORM FIELDS ==========
  
  async getFormFields(formId?: string): Promise<FormField[]> {
    if (formId) {
      const response = await api.get(`/form-fields/by-form/${formId}`);
      return response.data;
    }
    // Si no hay formId, asumimos que hay un form activo global
    // o necesitarías ajustar esta lógica según tu caso de uso
    throw new Error('formId is required to get form fields');
  }

  async getFormFieldById(id: string): Promise<FormField> {
    const response = await api.get(`/form-fields/${id}`);
    return response.data;
  }

  async createFormField(data: CreateFormFieldRequest): Promise<FormField> {
    const response = await api.post(`/form-fields`, data);
    return response.data;
  }

  async updateFormField(id: string, data: UpdateFormFieldRequest): Promise<FormField> {
    const response = await api.put(`/form-fields/${id}`, data);
    return response.data;
  }

  async deleteFormField(id: string): Promise<void> {
    await api.delete(`/form-fields/${id}`);
  }
}

export const formService = new FormService();