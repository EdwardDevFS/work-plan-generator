import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { confirmDialog } from 'primereact/confirmdialog';
import { FormField } from '../../types/form.types';
import { formService } from '../../services/forms.service';
import { Icon } from '@iconify/react';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

interface FormFieldListProps {
  formId: string;
  onEditField: (field: FormField) => void;
  onCreateField: () => void;
  onPreview: (fields: FormField[]) => void;
  refreshTrigger?: number;
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: 'Texto',
  textarea: 'Área de texto',
  number: 'Número',
  autocomplete: 'Autocompletado',
  select: 'Lista desplegable',
  multiselect: 'Selección múltiple',
  checkbox: 'Casilla',
  radio: 'Botones radio',
  date: 'Fecha',
  time: 'Hora',
  file: 'Archivo',
  photo: 'Foto'
};

const FormFieldList: React.FC<FormFieldListProps> = ({
  formId,
  onEditField,
  onCreateField,
  onPreview,
  refreshTrigger
}) => {
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const toast = useRef<Toast>(null);

  // ========== LOAD FIELDS ==========
  const loadFields = useCallback(async () => {
    if (!formId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await formService.getFormFields(formId);
      setFields(data.sort((a, b) => a.order - b.order));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al cargar los campos';
      setError(errorMessage);
      console.error('Error loading fields:', err);
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    loadFields();
  }, [loadFields, refreshTrigger]);

  // ========== TOAST HELPER ==========
  const showToast = useCallback((
    severity: 'success' | 'error' | 'info' | 'warn',
    summary: string,
    detail: string
  ) => {
    toast.current?.show({ severity, summary, detail });
  }, []);

  // ========== DELETE FIELD ==========
  const handleDelete = useCallback((field: FormField) => {
    confirmDialog({
      message: `¿Estás seguro de que deseas eliminar el campo "${field.label}"?`,
      header: 'Confirmar eliminación',
      icon: <Icon icon="mdi:alert" className="text-red-500" />,
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await formService.deleteFormField(field.id);
          showToast('success', 'Éxito', 'Campo eliminado correctamente');
          loadFields();
        } catch (err: any) {
          const errorMessage = err.response?.data?.message || 'Error al eliminar el campo';
          showToast('error', 'Error', errorMessage);
          console.error('Error deleting field:', err);
        }
      }
    });
  }, [loadFields, showToast]);

  // ========== REORDER FIELDS ==========
  const handleMoveUp = useCallback(async (field: FormField, index: number) => {
    if (index === 0) return;

    const prevField = fields[index - 1];
    
    try {
      await Promise.all([
        formService.updateFormField(field.id, { order: prevField.order }),
        formService.updateFormField(prevField.id, { order: field.order })
      ]);
      
      showToast('success', 'Éxito', 'Campos reordenados correctamente');
      loadFields();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al reordenar campos';
      showToast('error', 'Error', errorMessage);
      console.error('Error moving field up:', err);
    }
  }, [fields, loadFields, showToast]);

  const handleMoveDown = useCallback(async (field: FormField, index: number) => {
    if (index === fields.length - 1) return;

    const nextField = fields[index + 1];
    
    try {
      await Promise.all([
        formService.updateFormField(field.id, { order: nextField.order }),
        formService.updateFormField(nextField.id, { order: field.order })
      ]);
      
      showToast('success', 'Éxito', 'Campos reordenados correctamente');
      loadFields();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al reordenar campos';
      showToast('error', 'Error', errorMessage);
      console.error('Error moving field down:', err);
    }
  }, [fields, loadFields, showToast]);

  // ========== COLUMN TEMPLATES ==========
  const typeBodyTemplate = useCallback((field: FormField) => {
    const label = FIELD_TYPE_LABELS[field.type] || field.type;
    return <Tag value={label} className="bg-blue-100 text-blue-800" />;
  }, []);

  const requiredBodyTemplate = useCallback((field: FormField) => {
    return field.required ? (
      <Tag value="Sí" severity="danger" />
    ) : (
      <Tag value="No" severity="secondary" />
    );
  }, []);

  const actionsBodyTemplate = useCallback((field: FormField, options: any) => {
    const index = options.rowIndex;

    return (
      <div className="flex gap-2">
        <Button
          icon={<Icon icon="mdi:arrow-up" />}
          className="p-button-rounded p-button-text p-button-sm"
          onClick={() => handleMoveUp(field, index)}
          disabled={index === 0}
          tooltip="Mover arriba"
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          icon={<Icon icon="mdi:arrow-down" />}
          className="p-button-rounded p-button-text p-button-sm"
          onClick={() => handleMoveDown(field, index)}
          disabled={index === fields.length - 1}
          tooltip="Mover abajo"
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          icon={<Icon icon="mdi:pencil" />}
          className="p-button-rounded p-button-text p-button-sm"
          onClick={() => onEditField(field)}
          tooltip="Editar"
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          icon={<Icon icon="mdi:delete" />}
          className="p-button-rounded p-button-text p-button-sm p-button-danger"
          onClick={() => handleDelete(field)}
          tooltip="Eliminar"
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    );
  }, [fields.length, handleMoveUp, handleMoveDown, onEditField, handleDelete]);

  // ========== TABLE HEADER ==========
  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-between">
      <div className="flex gap-2">
        <Button
          label="Agregar Campo"
          icon={<Icon icon="mdi:plus" />}
          onClick={onCreateField}
          className="p-button-success"
        />
        <Button
          label="Vista Previa"
          icon={<Icon icon="mdi:eye" />}
          onClick={() => onPreview(fields)}
          className="p-button-info"
          disabled={fields.length === 0}
        />
      </div>
    </div>
  );

  // ========== RENDER STATES ==========
  if (loading) {
    return <LoadingSpinner message="Cargando campos..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadFields} />;
  }

  // ========== MAIN RENDER ==========
  return (
    <div className="card">
      <Toast ref={toast} />

      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Campos del Formulario
        </h2>
        <p className="text-gray-600">
          Configura los campos personalizados para este formulario
        </p>
      </div>

      <DataTable
        value={fields}
        header={header}
        emptyMessage="No hay campos configurados. Crea el primero."
        className="p-datatable-gridlines"
        responsiveLayout="scroll"
        stripedRows
      >
        <Column 
          field="order" 
          header="Orden" 
          style={{ width: '80px' }} 
          sortable 
        />
        <Column 
          field="name" 
          header="Nombre" 
          sortable 
        />
        <Column 
          field="label" 
          header="Etiqueta" 
          sortable 
        />
        <Column 
          field="type" 
          header="Tipo" 
          body={typeBodyTemplate} 
        />
        <Column 
          field="required" 
          header="Requerido" 
          body={requiredBodyTemplate} 
          style={{ width: '120px' }} 
        />
        <Column
          body={actionsBodyTemplate}
          exportable={false}
          style={{ minWidth: '200px' }}
          header="Acciones"
        />
      </DataTable>
    </div>
  );
};

export default FormFieldList;