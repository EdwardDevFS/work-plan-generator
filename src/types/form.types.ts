
export interface FormFieldOption {
  id: string;
  label: string;
  value: string;
}

export interface FormFieldValidations {
  min?: number;
  max?: number;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: string;
  formId: string;
  placeholder?: string;
  required: boolean;
  options?: FormFieldOption[];
  validations?: FormFieldValidations;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Form {
  id: string;
  name: string;
  description: string;
  tenantId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  formFields?: FormField[];
}

export interface FormFieldFormData {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  required: boolean;
  options: FormFieldOption[];
  validations?: FormFieldValidations;
  order: number;
}

export interface CreateFormFieldRequest extends FormFieldFormData {
  formId: string;
}

export interface UpdateFormFieldRequest {
  name?: string;
  label?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  options?: FormFieldOption[];
  validations?: FormFieldValidations;
  order?: number;
}

export interface CreateFormRequest {
  name: string;
  description: string;
  tenantId: string;
  isActive?: boolean;
  formFields?: Omit<FormFieldFormData, 'order'>[];
}

export interface UpdateFormRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}