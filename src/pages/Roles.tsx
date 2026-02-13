import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { confirmDialog } from 'primereact/confirmdialog';
import { Icon } from '@iconify/react';
import { MultiSelect } from 'primereact/multiselect';
import { Chip } from 'primereact/chip';
import { Divider } from 'primereact/divider';
import { rolesService } from '../services/roles.service';
import { Role, CreateRoleDto, UpdateRoleDto, View } from '../types';
import { useTenant } from '../contexts/TenantContext';
import { useAuth } from '../contexts/AuthContext';
import { viewsService } from '../services/view.service';

const Roles: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [viewsDialogVisible, setViewsDialogVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [availableViews, setAvailableViews] = useState<View[]>([]);
  const [selectedViews, setSelectedViews] = useState<string[]>([]);
  const [loadingViews, setLoadingViews] = useState(false);
  const toast = useRef<Toast>(null);
  const { selectedTenant, tenantInfo } = useTenant();
  const { user } = useAuth();
  const realTenant = selectedTenant ?? user?.tenantId;

  const [formData, setFormData] = useState<CreateRoleDto & { id?: string }>({
    tenantId: realTenant,
    name: '',
    description: '',
  });

  const loadRoles = async (page: number = 1, limit: number = 10) => {
    setLoading(true);
    try {
      const response = await rolesService.getAll({ page, limit, tenantId: selectedTenant });
      setRoles(response.data.data);
      setTotalRecords(response.data.total);
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar roles',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableViews = async () => {
    if (!selectedTenant) return;

    try {
      const response = await viewsService.getAllViews();
      
      setAvailableViews(response.data);
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar vistas disponibles',
        life: 3000,
      });
    }
  };

  useEffect(() => {
    if (selectedTenant) {
      loadRoles(1, rows);
      loadAvailableViews();
    }
  }, [selectedTenant]);

  const onPage = (event: any) => {
    const page = Math.floor(event.first / event.rows) + 1;
    setFirst(event.first);
    setRows(event.rows);
    loadRoles(page, event.rows);
  };

  const openNew = () => {
    setFormData({
      tenantId: selectedTenant ?? user?.tenantId,
      name: '',
      description: '',
    });
    setIsEdit(false);
    setDialogVisible(true);
  };

  const openEdit = (role: Role) => {
    setFormData({
      tenantId: selectedTenant ?? user?.tenantId,
      id: role.id,
      name: role.name,
      description: role.description,
    });
    setSelectedRole(role);
    setIsEdit(true);
    setDialogVisible(true);
  };

  const openViewsDialog = async (role: Role) => {
    setSelectedRole(role);
    setLoadingViews(true);
    setViewsDialogVisible(true);

    try {
      const response = await viewsService.getRoleViews(role.id, realTenant);
      setSelectedViews(response.data.map((v: View) => v.id));
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar vistas del rol',
        life: 3000,
      });
    } finally {
      setLoadingViews(false);
    }
  };

  const hideDialog = () => {
    setDialogVisible(false);
    setSelectedRole(null);
  };

  const hideViewsDialog = () => {
    setViewsDialogVisible(false);
    setSelectedRole(null);
    setSelectedViews([]);
  };

  const saveRole = async () => {
    try {
      if (isEdit && formData.id) {
        const updateData: UpdateRoleDto = {
          name: formData.name,
          description: formData.description,
        };
        await rolesService.update(formData.id, updateData);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Rol actualizado correctamente',
          life: 3000,
        });
      } else {
        await rolesService.create(formData);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Rol creado correctamente',
          life: 3000,
        });
      }
      hideDialog();
      loadRoles(Math.floor(first / rows) + 1, rows);
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'Error al guardar rol',
        life: 3000,
      });
    }
  };

  const saveViews = async () => {
    if (!selectedRole) return;

    try {
      if (selectedViews.length > 0) {
        await viewsService.updateRoleViews(selectedRole.id, selectedViews, realTenant);
      } else {
        await viewsService.deleteRoleViews(selectedRole.id, realTenant);
      }
      
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Vistas predeterminadas actualizadas correctamente',
        life: 3000,
      });
      
      hideViewsDialog();
      loadRoles(Math.floor(first / rows) + 1, rows);
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'Error al actualizar vistas',
        life: 3000,
      });
    }
  };

  const confirmDelete = (role: Role) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el rol "${role.name}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => deleteRole(role.id),
    });
  };

  const deleteRole = async (id: string) => {
    try {
      await rolesService.delete(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Rol eliminado correctamente',
        life: 3000,
      });
      loadRoles(Math.floor(first / rows) + 1, rows);
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar rol',
        life: 3000,
      });
    }
  };

  const actionBodyTemplate = (rowData: Role) => {
    return (
      <div className="flex gap-2">
        <Button
          icon={<Icon icon="mdi:view-dashboard-variant" className="text-base " />}
          className="!border-none !outline-none p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
          style={{ boxShadow: 'none' }}
          text
          onClick={() => openViewsDialog(rowData)}
          tooltip="Configurar Vistas"
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          icon={<Icon icon="mdi:pencil" className="text-base" />}
          className="!border-none !outline-none p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
          style={{ boxShadow: 'none' }}
          text
          onClick={() => openEdit(rowData)}
          tooltip="Editar Rol"
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          icon={<Icon icon="mdi:delete" className="text-base" />}
          className="!border-none !outline-none p-2 text-red-600 hover:bg-red-50 rounded-lg"
          style={{ boxShadow: 'none' }}
          text
          onClick={() => confirmDelete(rowData)}
          tooltip="Eliminar"
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    );
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />
      
      {/* Header Section */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-2">
          <Icon icon="mdi:shield-account" className="text-blue-600" />
          Gestión de Role
        </h1>
        <div className="flex items-center gap-2 -mt-5">
          {selectedTenant && tenantInfo?.name && (
            <p className="text-lg text-gray-500 flex items-center gap-2">
              <Icon icon="mdi:office-building" className="text-sm" />
              {tenantInfo.name}
            </p>
          )}
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Toolbar */}
        <div className="pb-5 border-b border-gray-200 bg-gray-50">
          <Button
            label="Nuevo Rol"
            icon={<Icon icon="mdi:plus" className="text-lg" />}
            className="!border-none !outline-none bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium"
            style={{ boxShadow: 'none' }}
            onClick={openNew}
          />
        </div>

        {/* DataTable */}
        <DataTable
          value={roles}
          lazy
          paginator
          first={first}
          rows={rows}
          totalRecords={totalRecords}
          onPage={onPage}
          loading={loading}
          className="text-sm custom-datatable"
          emptyMessage="No se encontraron roles"
          rowsPerPageOptions={[5, 10, 25, 50]}
          stripedRows
        >
          <Column 
            field="name" 
            header="Nombre del Rol" 
            sortable 
            className="font-medium text-gray-900"
            style={{ minWidth: '200px' }}
          />
          <Column 
            field="description" 
            header="Descripción" 
            sortable 
            className="text-gray-700"
            style={{ minWidth: '300px' }}
          />
          <Column 
            body={actionBodyTemplate} 
            exportable={false} 
            style={{ width: '180px' }}
            header="Acciones"
            className="text-center"
          />
        </DataTable>
      </div>

      {/* Dialog Crear/Editar */}
      <Dialog
        visible={dialogVisible}
        style={{ width: '650px' }}
        header={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon icon={isEdit ? 'mdi:shield-edit' : 'mdi:shield-plus'} className="text-blue-700 text-xl" />
            </div>
            <div className="leading-tight">
              <h2 className="text-lg font-semibold text-gray-900 mb-0">
                {isEdit ? 'Editar Rol' : 'Crear Nuevo Rol'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {isEdit ? 'Modifique la información del rol' : 'Complete los datos del nuevo rol'}
              </p>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <div className="space-y-4 mt-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Icon icon="mdi:shield-account" className="text-gray-500" />
              Información del Rol
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Nombre del Rol *
                </label>
                <InputText
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Supervisor"
                  className="text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Descripción *
                </label>
                <InputTextarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="Describe las responsabilidades y permisos de este rol..."
                  className="text-sm"
                />
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
            onClick={hideDialog}
          />
          <Button
            label={isEdit ? 'Actualizar' : 'Crear Rol'}
            icon={<Icon icon="mdi:check" className="text-base mr-2" />}
            className="!border-none !outline-none bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
            style={{ boxShadow: 'none' }}
            onClick={saveRole}
          />
        </div>
      </Dialog>

      {/* Dialog Configurar Vistas */}
      <Dialog
        visible={viewsDialogVisible}
        style={{ width: '750px' }}
        header={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon icon="mdi:cog" className="text-indigo-700 text-xl" />
            </div>
            <div className="leading-tight">
              <h2 className="text-lg font-semibold text-gray-900 mb-0">
                Configurar Vistas
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedRole?.name}
              </p>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={hideViewsDialog}
      >
        <div className="space-y-4 mt-4">
          {loadingViews ? (
            <div className="text-center py-8">
              <i className="pi pi-spin pi-spinner text-4xl text-indigo-500"></i>
              <p className="text-gray-600 mt-3 text-sm">Cargando configuración de vistas...</p>
            </div>
          ) : (
            <>
              <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded">
                <div className="flex items-start gap-2">
                  <Icon icon="mdi:information" className="text-indigo-600 text-xl mt-0.5" />
                  <div>
                    <p className="font-semibold text-indigo-900 mb-1 text-sm">Vistas Predeterminadas</p>
                    <p className="text-xs text-indigo-800">
                      Estas vistas se asignarán automáticamente a todos los usuarios que tengan este rol.
                      Los usuarios pueden personalizar sus vistas posteriormente de forma individual.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Icon icon="mdi:view-grid" className="text-gray-500" />
                  Seleccionar Vistas Predeterminadas
                </h3>
                
                <div>
                  <MultiSelect
                    value={selectedViews}
                    options={availableViews}
                    onChange={(e) => setSelectedViews(e.value)}
                    optionLabel="label"
                    optionValue="id"
                    placeholder="Seleccionar vistas para este rol"
                    display="chip"
                    className="w-full text-sm"
                    filter
                    filterPlaceholder="Buscar vistas..."
                    itemTemplate={(option) => (
                      <div className="flex items-center gap-2">
                        <Icon icon={option.icon} className="text-lg" />
                        <span className="text-sm">{option.label}</span>
                      </div>
                    )}
                  />
                  <small className="text-gray-500 mt-2 block text-xs">
                    Selecciona las vistas que verán por defecto los usuarios con este rol
                  </small>
                </div>
              </div>

              {selectedViews.length > 0 && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon icon="mdi:eye-check" className="text-indigo-600 text-xl" />
                    <h3 className="font-semibold text-indigo-900 text-sm">
                      Vistas Configuradas ({selectedViews.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {availableViews
                      .filter(view => selectedViews.includes(view.id))
                      .map(view => (
                        <div key={view.id} className="flex items-center gap-2 bg-white p-2 rounded border border-indigo-300">
                          <Icon icon={view.icon} className="text-indigo-600 text-lg" />
                          <span className="text-xs font-medium text-gray-800">{view.label}</span>
                        </div>
                      ))}
                  </div>
                  <Divider />
                  <p className="text-xs text-indigo-700">
                    <Icon icon="mdi:lightbulb" className="mr-1" />
                    Estas vistas aparecerán automáticamente en el menú de usuarios con el rol "{selectedRole?.name}"
                  </p>
                </div>
              )}

              {selectedViews.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                  <div className="flex items-center gap-2">
                    <Icon icon="mdi:alert" className="text-yellow-600 text-xl" />
                    <p className="text-xs text-yellow-800">
                      No hay vistas configuradas. Los usuarios con este rol no tendrán acceso predeterminado a ninguna vista.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <Button
            label="Cancelar"
            icon={<Icon icon="mdi:close" className="text-base mr-2" />}
            className="!border-none !outline-none text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm"
            style={{ boxShadow: 'none' }}
            text
            onClick={hideViewsDialog}
          />
          <Button
            label="Guardar Configuración"
            icon={<Icon icon="mdi:check" className="text-base mr-2" />}
            className="!border-none !outline-none bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
            style={{ boxShadow: 'none' }}
            onClick={saveViews}
            disabled={loadingViews}
          />
        </div>
      </Dialog>

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

        /* Bordes redondeados en las esquinas superiores */
        .custom-datatable .p-datatable-thead > tr > th:first-child {
          border-top-left-radius: 0.5rem !important;
        }
        
        .custom-datatable .p-datatable-thead > tr > th:last-child {
          border-top-right-radius: 0.5rem !important;
        }
      `}</style>
    </div>
  );
};

export default Roles;