import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { FormField, FormFieldFormData, FormFieldOption } from '../../types/form.types';
import { formService } from '../../services/forms.service';
import { FORM_FIELD_TYPE_OPTIONS } from '../../utils/constants';
import { Icon } from '@iconify/react';

interface FormFieldEditorProps {
  visible: boolean;
  field?: FormField | null;
  formId: string; // NUEVO: necesario para crear campos
  onHide: () => void;
  onSave: () => void;
}

const FormFieldEditor: React.FC<FormFieldEditorProps> = ({ 
  visible, 
  field, 
  formId,
  onHide, 
  onSave 
}) => {
  const [formData, setFormData] = useState<FormFieldFormData>({
    name: '',
    label: '',
    type: 'text',
    placeholder: '',
    required: false,
    options: [],
    order: 1
  });

  const [loading, setLoading] = useState(false);
  const toast = useRef<Toast>(null);

  useEffect(() => {
    if (field) {
      setFormData({
        name: field.name,
        label: field.label,
        type: field.type,
        placeholder: field.placeholder || '',
        required: field.required,
        options: field.options || [],
        validations: field.validations,
        order: field.order
      });
    } else {
      setFormData({
        name: '',
        label: '',
        type: 'text',
        placeholder: '',
        required: false,
        options: [],
        order: 1
      });
    }
  }, [field, visible]);

  const needsOptions = ['select', 'multiselect', 'radio', 'autocomplete'].includes(formData.type);

  const handleAddOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [
        ...prev.options,
        { id: `opt_${Date.now()}`, label: '', value: '' }
      ]
    }));
  };

  const handleRemoveOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateOption = (index: number, field: keyof FormFieldOption, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === index ? { ...opt, [field]: value } : opt
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar opciones si son necesarias
      if (needsOptions && formData.options.length === 0) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Advertencia',
          detail: 'Debes agregar al menos una opción para este tipo de campo'
        });
        setLoading(false);
        return;
      }

      // Validar que las opciones tengan label y value
      if (needsOptions) {
        const invalidOptions = formData.options.some(opt => !opt.label || !opt.value);
        if (invalidOptions) {
          toast.current?.show({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'Todas las opciones deben tener etiqueta y valor'
          });
          setLoading(false);
          return;
        }
      }

      const submitData = {
        ...formData,
        options: needsOptions ? formData.options : undefined
      };

      if (field) {
        // Actualizar campo existente
        await formService.updateFormField(field.id, submitData);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Campo actualizado correctamente'
        });
      } else {
        // Crear nuevo campo
        await formService.createFormField({
          ...submitData,
          formId,
          options: submitData.options ?? []
        });
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Campo creado correctamente'
        });
      }
      
      onSave();
      onHide();
    } catch (err: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: err.response?.data?.message || 'Error al guardar el campo'
      });
    } finally {
      setLoading(false);
    }
  };

  const dialogHeader = (
    <div className="flex items-center gap-2">
      <Icon icon="mdi:form-select" className="text-blue-600" />
      <span>{field ? 'Editar Campo' : 'Nuevo Campo'}</span>
    </div>
  );

  const dialogFooter = (
    <div className="flex gap-2">
      <Button
        label="Cancelar"
        icon={<Icon icon="mdi:close" />}
        onClick={onHide}
        className="p-button-text"
        disabled={loading}
      />
      <Button
        label="Guardar"
        icon={<Icon icon="mdi:check" />}
        onClick={handleSubmit}
        loading={loading}
      />
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        visible={visible}
        style={{ width: '600px' }}
        header={dialogHeader}
        footer={dialogFooter}
        modal
        onHide={onHide}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="field">
            <label className="block text-sm font-medium mb-2">
              Nombre técnico *
            </label>
            <InputText
              value={formData.name}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                name: e.target.value.replace(/\s/g, '_').toLowerCase()
              }))}
              required
              className="w-full"
              placeholder="nombre_campo"
            />
            <small className="text-gray-500">Sin espacios, usar guiones bajos</small>
          </div>

          <div className="field">
            <label className="block text-sm font-medium mb-2">
              Etiqueta visible *
            </label>
            <InputText
              value={formData.label}
              onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              required
              className="w-full"
              placeholder="Etiqueta que verá el usuario"
            />
          </div>

          <div className="field">
            <label className="block text-sm font-medium mb-2">
              Tipo de campo *
            </label>
            <Dropdown
              value={formData.type}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                type: e.value,
                options: []
              }))}
              options={FORM_FIELD_TYPE_OPTIONS}
              className="w-full"
            />
          </div>

          <div className="field">
            <label className="block text-sm font-medium mb-2">
              Placeholder
            </label>
            <InputText
              value={formData.placeholder}
              onChange={(e) => setFormData(prev => ({ ...prev, placeholder: e.target.value }))}
              className="w-full"
              placeholder="Texto de ayuda"
            />
          </div>

          <div className="field">
            <label className="block text-sm font-medium mb-2">
              Orden
            </label>
            <InputNumber
              value={formData.order}
              onValueChange={(e) => setFormData(prev => ({ ...prev, order: e.value || 1 }))}
              min={1}
              className="w-full"
            />
          </div>

          <div className="field flex items-center gap-3">
            <InputSwitch
              checked={formData.required}
              onChange={(e) => setFormData(prev => ({ ...prev, required: e.value }))}
            />
            <label className="text-sm font-medium">
              Campo requerido
            </label>
          </div>

          {needsOptions && (
            <div className="field">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">
                  Opciones *
                </label>
                <Button
                  type="button"
                  label="Agregar opción"
                  icon={<Icon icon="mdi:plus" />}
                  onClick={handleAddOption}
                  className="p-button-sm"
                />
              </div>

              <div className="space-y-2">
                {formData.options.map((option, index) => (
                  <div key={option.id} className="flex gap-2">
                    <InputText
                      value={option.label}
                      onChange={(e) => handleUpdateOption(index, 'label', e.target.value)}
                      placeholder="Etiqueta"
                      className="flex-1"
                      required
                    />
                    <InputText
                      value={option.value}
                      onChange={(e) => handleUpdateOption(index, 'value', e.target.value)}
                      placeholder="Valor"
                      className="flex-1"
                      required
                    />
                    <Button
                      type="button"
                      icon={<Icon icon="mdi:delete" />}
                      className="p-button-rounded p-button-danger p-button-text"
                      onClick={() => handleRemoveOption(index)}
                    />
                  </div>
                ))}
                {formData.options.length === 0 && (
                  <p className="text-sm text-gray-500 italic">
                    No hay opciones. Agrega al menos una.
                  </p>
                )}
              </div>
            </div>
          )}
        </form>
      </Dialog>
    </>
  );
};

export default FormFieldEditor;