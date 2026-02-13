import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
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
    if (user?.tenantId) {
      setFormData({
        ...INITIAL_FORM_DATA,
        tenantId: user?.tenantId
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
      <Tag value="Activo" severity="success" className="text-xs px-3 py-1" />
    ) : (
      <Tag value="Inactivo" severity="danger" className="text-xs px-3 py-1" />
    );
  };

  const actionsBodyTemplate = (form: Form) => {
    return (
      <div className="flex gap-2">
        <Button
          icon={<Icon icon="mdi:form-select" className="text-base" />}
          className="!border-none !outline-none p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
          style={{ boxShadow: 'none' }}
          text
          onClick={() => handleManageFields(form)}
          tooltip="Gestionar campos"
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          icon={<Icon icon="mdi:pencil" className="text-base" />}
          className="!border-none !outline-none p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
          style={{ boxShadow: 'none' }}
          text
          onClick={() => handleEditForm(form)}
          tooltip="Editar"
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          icon={<Icon icon="mdi:delete" className="text-base" />}
          className="!border-none !outline-none p-2 text-red-600 hover:bg-red-50 rounded-lg"
          style={{ boxShadow: 'none' }}
          text
          onClick={() => handleDeleteForm(form)}
          tooltip="Eliminar"
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    );
  };

  // ========== MAIN RENDER ==========
  return (
    <div className="p-4">
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* VISTA: Lista de formularios */}
      {!showFieldsView && (
        <>
          {/* Header Section */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900">Gestión de Formularios</h1>
            <p className="text-lg text-gray-500 -mt-5">Administra los formularios y sus campos personalizados</p>
          </div>

          {/* Toolbar */}
          <div className="pb-5 border-b border-gray-200 bg-gray-50">
            <Button
              label="Nuevo Formulario"
              icon={<Icon icon="mdi:plus" className="text-lg" />}
              className="!border-none !outline-none bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium"
              style={{ boxShadow: 'none' }}
              onClick={handleCreateForm}
            />
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <DataTable
              value={forms}
              loading={loading}
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 25]}
              className="text-sm custom-datatable"
              emptyMessage="No hay formularios creados"
              stripedRows
            >
              <Column
                field="name"
                header="Nombre"
                sortable
                className="font-medium text-gray-900"
              />
              <Column
                field="description"
                header="Descripción"
                className="text-gray-600"
              />
              <Column
                field="isActive"
                header="Estado"
                body={statusBodyTemplate}
                style={{ width: '100px' }}
              />
              <Column
                body={actionsBodyTemplate}
                header="Acciones"
                className="text-center"
                style={{ width: '180px' }}
              />
            </DataTable>
          </div>
        </>
      )}

      {/* VISTA: Gestión de campos del formulario */}
      {showFieldsView && selectedForm && (
        <div>
          <div className="mb-6 flex items-center gap-4">
            <Button
              icon={<Icon icon="mdi:arrow-left" className="text-lg" />}
              className="!border-none !outline-none text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg p-2"
              style={{ boxShadow: 'none' }}
              text
              onClick={handleBackToForms}
              tooltip="Volver a formularios"
              tooltipOptions={{ position: 'right' }}
            />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedForm.name}</h2>
              <p className="text-sm text-gray-600">{selectedForm.description}</p>
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
        style={{ width: '600px' }}
        header={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon icon={editingForm ? "mdi:pencil" : "mdi:plus-circle"} className="text-blue-700 text-xl" />
            </div>
            <div className="leading-tight">
              <h2 className="text-lg font-semibold text-gray-900 mb-0">
                {editingForm ? 'Editar Formulario' : 'Nuevo Formulario'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {editingForm ? 'Modifique la información del formulario' : 'Complete los datos del nuevo formulario'}
              </p>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={() => {
          setShowFormDialog(false);
          setFormData(INITIAL_FORM_DATA);
        }}
      >
        <div className="space-y-4 mt-4">
          {/* Información Básica */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Icon icon="mdi:information-outline" className="text-gray-500" />
              Información del Formulario
            </h3>

            <div className="space-y-3">
              <div>
                <label htmlFor="form-name" className="block text-xs font-medium text-gray-700 mb-1.5">
                  Nombre *
                </label>
                <InputText
                  id="form-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-sm"
                  placeholder="Ingrese el nombre del formulario"
                />
              </div>

              <div>
                <label htmlFor="form-description" className="block text-xs font-medium text-gray-700 mb-1.5">
                  Descripción *
                </label>
                <InputTextarea
                  id="form-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="text-sm"
                  rows={3}
                  placeholder="Ingrese una descripción del formulario"
                />
              </div>

              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center gap-3">
                  <InputSwitch
                    id="form-active"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.value })}
                  />
                  <label htmlFor="form-active" className="text-xs font-medium text-blue-900 cursor-pointer">
                    <Icon icon="mdi:check-circle" className="mr-1" />
                    Formulario activo
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <Button
            label="Cancelar"
            icon={<Icon icon="mdi:close" className="text-base mr-2" />}
            className="!border-none !outline-none text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm"
            style={{ boxShadow: 'none' }}
            text
            onClick={() => {
              setShowFormDialog(false);
              setFormData(INITIAL_FORM_DATA);
            }}
          />
          <Button
            label="Guardar"
            icon={<Icon icon="mdi:check" className="text-base mr-2" />}
            className="!border-none !outline-none bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
            style={{ boxShadow: 'none' }}
            onClick={handleSaveForm}
          />
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

      {/* Estilos personalizados para el DataTable */}
      <style>{`
        .custom-datatable .p-datatable-thead > tr > th {
          background-color: #1f2937 !important;
          color: white !important;
        }
        
        .custom-datatable .p-datatable-thead > tr > th .p-column-title {
          color: white !important;
        }
        
        .custom-datatable .p-datatable-thead > tr > th .p-sortable-column-icon {
          color: white !important;
        }
        
        .custom-datatable .p-datatable-thead > tr > th .p-column-filter-menu-button {
          color: white !important;
        }
      `}</style>
    </div>
  );
};

export default Forms;