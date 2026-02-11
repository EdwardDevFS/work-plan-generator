import React from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Checkbox } from 'primereact/checkbox';
import { RadioButton } from 'primereact/radiobutton';
import { Calendar } from 'primereact/calendar';
import { AutoComplete } from 'primereact/autocomplete';
import { FileUpload } from 'primereact/fileupload';
import { FormField } from '../../types/form.types';
import { Icon } from '@iconify/react';

interface FormPreviewProps {
  visible: boolean;
  fields: FormField[];
  onHide: () => void;
}

const FormPreview: React.FC<FormPreviewProps> = ({ visible, fields, onHide }) => {
  const renderField = (field: FormField) => {
    const baseProps = {
      id: field.name,
      placeholder: field.placeholder,
      required: field.required,
      className: 'w-full',
      disabled: true
    };

    switch (field.type) {
      case 'text':
        return <InputText {...baseProps} />;

      case 'textarea':
        return <InputTextarea {...baseProps} rows={4} />;

      case 'number':
        return <InputNumber {...baseProps} />;

      case 'select':
        return (
          <Dropdown
            {...baseProps}
            options={field.options}
            optionLabel="label"
          />
        );

      case 'multiselect':
        return (
          <MultiSelect
            {...baseProps}
            options={field.options}
            optionLabel="label"
            display="chip"
          />
        );

      case 'autocomplete':
        return (
          <AutoComplete
            {...baseProps}
            suggestions={field.options}
            field="label"
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <Checkbox inputId={field.name} checked={false} disabled />
            <label htmlFor={field.name} className="text-sm">
              {field.placeholder || 'Marcar si aplica'}
            </label>
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option.id} className="flex items-center gap-2">
                <RadioButton
                  inputId={`${field.name}_${option.id}`}
                  name={field.name}
                  value={option.value}
                  disabled
                />
                <label htmlFor={`${field.name}_${option.id}`} className="text-sm">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );

      case 'date':
        return <Calendar {...baseProps} dateFormat="dd/mm/yy" />;

      case 'time':
        return <Calendar {...baseProps} timeOnly />;

      case 'file':
        return (
          <FileUpload
            mode="basic"
            name={field.name}
            disabled
            className="w-full"
          />
        );

      case 'photo':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <Icon icon="mdi:camera" className="text-4xl text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Tomar o subir foto</p>
          </div>
        );

      default:
        return <InputText {...baseProps} />;
    }
  };

  const dialogHeader = (
    <div className="flex items-center gap-2">
      <Icon icon="mdi:eye" className="text-blue-600" />
      <span>Vista Previa del Formulario</span>
    </div>
  );

  return (
    <Dialog
      visible={visible}
      style={{ width: '700px', maxHeight: '80vh' }}
      header={dialogHeader}
      modal
      onHide={onHide}
    >
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Icon icon="mdi:information" className="text-blue-600 text-xl flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800 font-medium">Vista Previa</p>
              <p className="text-xs text-blue-700 mt-1">
                Esta es una representación visual del formulario. Los campos están deshabilitados.
              </p>
            </div>
          </div>
        </div>

        {fields.length === 0 ? (
          <div className="text-center py-8">
            <Icon icon="mdi:form-select" className="text-6xl text-gray-300 mb-4" />
            <p className="text-gray-500">No hay campos para mostrar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.id} className="field">
                <label htmlFor={field.name} className="block text-sm font-medium mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderField(field)}
                {field.type === 'number' && field.validations && (
                  <small className="text-gray-500 block mt-1">
                    {field.validations.min !== undefined && `Mín: ${field.validations.min}`}
                    {field.validations.min !== undefined && field.validations.max !== undefined && ' | '}
                    {field.validations.max !== undefined && `Máx: ${field.validations.max}`}
                  </small>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Dialog>
  );
};

export default FormPreview;
