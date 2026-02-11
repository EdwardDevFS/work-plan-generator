import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { Toast } from 'primereact/toast';
import { confirmDialog } from 'primereact/confirmdialog';
import { ConfirmDialog } from 'primereact/confirmdialog';
import FormFieldList from '../components/forms/FormFieldList';
import FormFieldEditor from '../components/forms/FormFieldEditor';
import FormPreview from '../components/forms/FormPreview';
import { Form, FormField } from '../types/form.types';
import { formService } from '../services/forms.service';
import { Icon } from '@iconify/react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';


interface FormData {
  name: string;
  description: string;
  tenantId: string;
  isActive: boolean;
}

const INITIAL_FORM_DATA: FormData = {
  name: '',
  description: '',
  tenantId: '', 
  isActive: true
};

const Forms: React.FC = () => {
  // ========== STATE - FORMS LIST ==========
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(false);

  // ========== STATE - SELECTED FORM ==========
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [showFieldsView, setShowFieldsView] = useState(false);

  // ========== STATE - DIALOGS ==========
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // ========== STATE - EDITING ==========
  const [editingForm, setEditingForm] = useState<Form | null>(null);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [previewFields, setPreviewFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);

  // ========== STATE - REFRESH ==========
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const toast = useRef<Toast>(null);
  const { user } = useAuth();
  const { selectedTenant } = useTenant();
  const realTenant = selectedTenant ?? user?.tenantId;
  // ========== LOAD FORMS ==========
  useEffect(() => {
    loadForms();
  }, [realTenant]);

  const loadForms = async () => {
    try {
      setLoading(true);
      const data = await formService.getForms(realTenant);
      setForms(data.data);
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'Error al cargar formularios'
      });
      console.error('Error loading forms:', error);
    } finally {
      setLoading(false);
    }
  };

  // ========== FORM CRUD HANDLERS ==========
  const handleCreateForm = () => {
    setEditingForm(null);
    if(user?.tenantId){

      setFormData({
        ...INITIAL_FORM_DATA,
        tenantId: user?.tenantId // Reemplazar con el valor real
      });
      setShowFormDialog(true);
    }
  };

  const handleEditForm = (form: Form) => {
    setEditingForm(form);
    setFormData({
      name: form.name,
      description: form.description,
      tenantId: form.tenantId,
      isActive: form.isActive
    });
    setShowFormDialog(true);
  };

  const handleSaveForm = async () => {
    // Validación básica
    if (!formData.name.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'El nombre del formulario es requerido'
      });
      return;
    }

    if (!formData.description.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'La descripción del formulario es requerida'
      });
      return;
    }

    try {
      if (editingForm) {
        await formService.updateForm(editingForm.id, {
          name: formData.name,
          description: formData.description,
          isActive: formData.isActive
        });
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Formulario actualizado correctamente'
        });
      } else {
        await formService.createForm(formData);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Formulario creado correctamente'
        });
      }
      
      setShowFormDialog(false);
      setFormData(INITIAL_FORM_DATA);
      loadForms();
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'Error al guardar el formulario'
      });
      console.error('Error saving form:', error);
    }
  };

  const handleDeleteForm = (form: Form) => {
    confirmDialog({
      message: `¿Estás seguro de que deseas eliminar el formulario "${form.name}"?`,
      header: 'Confirmar eliminación',
      icon: <Icon icon="mdi:alert" className="text-red-500" />,
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await formService.deleteForm(form.id);
          toast.current?.show({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Formulario eliminado correctamente'
          });
          loadForms();
        } catch (error: any) {
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Error al eliminar el formulario'
          });
          console.error('Error deleting form:', error);
        }
      }
    });
  };

  const handleManageFields = (form: Form) => {
    setSelectedForm(form);
    setShowFieldsView(true);
  };

  // ========== FIELD CRUD HANDLERS ==========
  const handleCreateField = () => {
    setSelectedField(null);
    setShowFieldEditor(true);
  };

  const handleEditField = (field: FormField) => {
    setSelectedField(field);
    setShowFieldEditor(true);
  };

  const handlePreview = (fields: FormField[]) => {
    setPreviewFields(fields);
    setShowPreview(true);
  };

  const handleFieldEditorSave = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleBackToForms = () => {
    setShowFieldsView(false);
    setSelectedForm(null);
  };

  // ========== COLUMN TEMPLATES ==========
  const statusBodyTemplate = (form: Form) => {
    return form.isActive ? (
      <Tag value="Activo" severity="success" />
    ) : (
      <Tag value="Inactivo" severity="danger" />
    );
  };


  const actionsBodyTemplate = (form: Form) => {
    return (
      <div className="flex gap-2">
        <Button
          icon={<Icon icon="mdi:form-select" />}
          className="p-button-rounded p-button-text p-button-sm p-button-info"
          onClick={() => handleManageFields(form)}
          tooltip="Gestionar campos"
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          icon={<Icon icon="mdi:pencil" />}
          className="p-button-rounded p-button-text p-button-sm"
          onClick={() => handleEditForm(form)}
          tooltip="Editar"
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          icon={<Icon icon="mdi:delete" />}
          className="p-button-rounded p-button-text p-button-sm p-button-danger"
          onClick={() => handleDeleteForm(form)}
          tooltip="Eliminar"
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    );
  };

  // ========== TABLE HEADER ==========
  const tableHeader = (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-bold">Formularios</h2>
      <Button
        label="Nuevo Formulario"
        icon={<Icon icon="mdi:plus" />}
        onClick={handleCreateForm}
        className="p-button-success"
      />
    </div>
  );

  // ========== DIALOG FOOTER ==========
  const formDialogFooter = (
    <div className="flex gap-2 justify-end">
      <Button
        label="Cancelar"
        icon={<Icon icon="mdi:close" />}
        onClick={() => {
          setShowFormDialog(false);
          setFormData(INITIAL_FORM_DATA);
        }}
        className="p-button-text"
      />
      <Button
        label="Guardar"
        icon={<Icon icon="mdi:check" />}
        onClick={handleSaveForm}
      />
    </div>
  );

  // ========== MAIN RENDER ==========
  return (
    <div className="p-6">
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* VISTA: Lista de formularios */}
      {!showFieldsView && (
        <>
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gestión de Formularios
            </h1>
            <p className="text-gray-600">
              Administra los formularios y sus campos personalizados
            </p>
          </div>

          <DataTable
            value={forms}
            header={tableHeader}
            loading={loading}
            emptyMessage="No hay formularios creados"
            className="p-datatable-gridlines"
            responsiveLayout="scroll"
            stripedRows
          >
            <Column field="name" header="Nombre" sortable />
            <Column field="description" header="Descripción" />

            <Column 
              field="isActive" 
              header="Estado" 
              body={statusBodyTemplate} 
            />
            <Column
              body={actionsBodyTemplate}
              exportable={false}
              style={{ minWidth: '180px' }}
              header="Acciones"
            />
          </DataTable>
        </>
      )}

      {/* VISTA: Gestión de campos del formulario */}
      {showFieldsView && selectedForm && (
        <div>
          <div className="mb-4 flex items-center gap-4">
            <Button
              icon={<Icon icon="mdi:arrow-left" />}
              className="p-button-text"
              onClick={handleBackToForms}
              tooltip="Volver a formularios"
              tooltipOptions={{ position: 'right' }}
            />
            <div>
              <h2 className="text-2xl font-bold">{selectedForm.name}</h2>
              <p className="text-gray-600">{selectedForm.description}</p>
            </div>
          </div>
          <FormFieldList
            formId={selectedForm.id}
            onCreateField={handleCreateField}
            onEditField={handleEditField}
            onPreview={handlePreview}
            refreshTrigger={refreshTrigger}
          />
        </div>
      )}

      {/* DIALOG: Crear/Editar formulario */}
      <Dialog
        visible={showFormDialog}
        style={{ width: '500px' }}
        header={editingForm ? 'Editar Formulario' : 'Nuevo Formulario'}
        modal
        footer={formDialogFooter}
        onHide={() => {
          setShowFormDialog(false);
          setFormData(INITIAL_FORM_DATA);
        }}
      >
        <div className="space-y-4">
          <div className="field">
            <label htmlFor="form-name" className="block text-sm font-medium mb-2">
              Nombre *
            </label>
            <InputText
              id="form-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full"
              placeholder="Ingrese el nombre del formulario"
            />
          </div>

          <div className="field">
            <label htmlFor="form-description" className="block text-sm font-medium mb-2">
              Descripción *
            </label>
            <InputTextarea
              id="form-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full"
              rows={3}
              placeholder="Ingrese una descripción del formulario"
            />
          </div>

          {/* <div className="field">
            <label htmlFor="form-purpose" className="block text-sm font-medium mb-2">
              Propósito *
            </label>
            <Dropdown
              id="form-purpose"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.value })}
              options={FORM_PURPOSE_OPTIONS}
              className="w-full"
              placeholder="Seleccione el propósito"
            />
          </div> */}

          <div className="field flex items-center gap-3">
            <InputSwitch
              id="form-active"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.value })}
            />
            <label htmlFor="form-active" className="text-sm font-medium">
              Formulario activo
            </label>
          </div>
        </div>
      </Dialog>

      {/* DIALOG: Editor de campos */}
      {selectedForm && (
        <FormFieldEditor
          visible={showFieldEditor}
          field={selectedField}
          formId={selectedForm.id}
          onHide={() => {
            setShowFieldEditor(false);
            setSelectedField(null);
          }}
          onSave={handleFieldEditorSave}
        />
      )}

      {/* DIALOG: Vista previa */}
      <FormPreview
        visible={showPreview}
        fields={previewFields}
        onHide={() => {
          setShowPreview(false);
          setPreviewFields([]);
        }}
      />
    </div>
  );
};

export default Forms;