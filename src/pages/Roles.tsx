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
import { Card } from 'primereact/card';
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
          icon={<Icon icon="mdi:view-dashboard-variant" className="text-lg" />}
          className="p-button-rounded p-button-text p-button-info"
          onClick={() => openViewsDialog(rowData)}
          tooltip="Configurar Vistas"
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          icon={<Icon icon="mdi:pencil" className="text-lg" />}
          className="p-button-rounded p-button-text p-button-warning"
          onClick={() => openEdit(rowData)}
          tooltip="Editar Rol"
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          icon={<Icon icon="mdi:delete" className="text-lg" />}
          className="p-button-rounded p-button-text p-button-danger"
          onClick={() => confirmDelete(rowData)}
          tooltip="Eliminar"
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    );
  };

  const dialogFooter = (
    <div className="flex justify-end gap-2">
      <Button
        label="Cancelar"
        icon={<Icon icon="mdi:close" />}
        onClick={hideDialog}
        className="p-button-text p-button-secondary"
      />
      <Button
        label={isEdit ? 'Actualizar' : 'Crear Rol'}
        icon={<Icon icon="mdi:content-save" />}
        onClick={saveRole}
        className="p-button-primary"
      />
    </div>
  );

  const viewsDialogFooter = (
    <div className="flex justify-end gap-2">
      <Button
        label="Cancelar"
        icon={<Icon icon="mdi:close" />}
        onClick={hideViewsDialog}
        className="p-button-text p-button-secondary"
      />
      <Button
        label="Guardar Configuración"
        icon={<Icon icon="mdi:content-save" />}
        onClick={saveViews}
        disabled={loadingViews}
        className="p-button-primary"
      />
    </div>
  );

  return (
    <div className="p-6">
      <Toast ref={toast} />
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1 flex items-center gap-2">
              <Icon icon="mdi:shield-account" className="text-purple-600" />
              Gestión de Roles
            </h1>
            {selectedTenant && (
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Icon icon="mdi:office-building" className="text-xs" />
                {tenantInfo?.name}
              </p>
            )}
          </div>
          <Button
            label="Nuevo Rol"
            icon={<Icon icon="mdi:shield-plus" />}
            onClick={openNew}
            className="p-button-success"
          />
        </div>
      </div>

      <Card>
        <DataTable
          value={roles}
          lazy
          paginator
          first={first}
          rows={rows}
          totalRecords={totalRecords}
          onPage={onPage}
          loading={loading}
          className="p-datatable-sm"
          emptyMessage="No se encontraron roles"
          rowsPerPageOptions={[5, 10, 25, 50]}
          stripedRows
          showGridlines
        >
          <Column 
            field="name" 
            header="Nombre del Rol" 
            sortable 
            style={{ minWidth: '200px' }}
          />
          <Column 
            field="description" 
            header="Descripción" 
            sortable 
            style={{ minWidth: '300px' }}
          />
          <Column 
            body={actionBodyTemplate} 
            exportable={false} 
            style={{ width: '150px' }}
            header="Acciones"
          />
        </DataTable>
      </Card>

      <Dialog
        visible={dialogVisible}
        style={{ width: '600px' }}
        header={
          <div className="flex items-center gap-2">
            <Icon icon={isEdit ? 'mdi:pencil' : 'mdi:shield-plus'} className="text-2xl text-purple-600" />
            <span>{isEdit ? 'Editar Rol' : 'Crear Nuevo Rol'}</span>
          </div>
        }
        modal
        className="p-fluid"
        footer={dialogFooter}
        onHide={hideDialog}
      >
        <div className="space-y-4">
          <div className="field">
            <label htmlFor="name" className="block mb-2 font-semibold text-gray-700">
              <Icon icon="mdi:shield-account" className="mr-1" />
              Nombre del Rol *
            </label>
            <InputText
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              autoFocus
              placeholder="Ej: Supervisor"
            />
          </div>

          <div className="field">
            <label htmlFor="description" className="block mb-2 font-semibold text-gray-700">
              <Icon icon="mdi:text" className="mr-1" />
              Descripción *
            </label>
            <InputTextarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              required
              placeholder="Describe las responsabilidades y permisos de este rol..."
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        visible={viewsDialogVisible}
        style={{ width: '700px' }}
        header={
          <div className="flex items-center gap-2">
            <Icon icon="mdi:cog" className="text-2xl text-indigo-600" />
            <span>Configurar Vistas - {selectedRole?.name}</span>
          </div>
        }
        modal
        className="p-fluid"
        footer={viewsDialogFooter}
        onHide={hideViewsDialog}
      >
        <div className="space-y-4">
          {loadingViews ? (
            <div className="text-center py-8">
              <i className="pi pi-spin pi-spinner text-4xl text-indigo-500"></i>
              <p className="text-gray-600 mt-3">Cargando configuración de vistas...</p>
            </div>
          ) : (
            <>
              <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded">
                <div className="flex items-start gap-2">
                  <Icon icon="mdi:information" className="text-indigo-600 text-xl mt-0.5" />
                  <div>
                    <p className="font-semibold text-indigo-900 mb-1">Vistas Predeterminadas</p>
                    <p className="text-sm text-indigo-800">
                      Estas vistas se asignarán automáticamente a todos los usuarios que tengan este rol.
                      Los usuarios pueden personalizar sus vistas posteriormente de forma individual.
                    </p>
                  </div>
                </div>
              </div>

              <div className="field">
                <label htmlFor="views" className="block mb-3 font-semibold text-gray-800 text-lg">
                  <Icon icon="mdi:view-grid" className="mr-2" />
                  Seleccionar Vistas Predeterminadas
                </label>
                <MultiSelect
                  id="views"
                  value={selectedViews}
                  options={availableViews}
                  onChange={(e) => setSelectedViews(e.value)}
                  optionLabel="label"
                  optionValue="id"
                  placeholder="Seleccionar vistas para este rol"
                  display="chip"
                  className="w-full"
                  filter
                  filterPlaceholder="Buscar vistas..."
                  itemTemplate={(option) => (
                    <div className="flex items-center gap-2">
                      <Icon icon={option.icon} className="text-lg" />
                      <span>{option.label}</span>
                    </div>
                  )}
                />
                <small className="text-gray-500 mt-2 block">
                  Selecciona las vistas que verán por defecto los usuarios con este rol
                </small>
              </div>

              {selectedViews.length > 0 && (
                <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon icon="mdi:eye-check" className="text-indigo-600 text-xl" />
                    <h3 className="font-semibold text-indigo-900">
                      Vistas Configuradas ({selectedViews.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {availableViews
                      .filter(view => selectedViews.includes(view.id))
                      .map(view => (
                        <div key={view.id} className="flex items-center gap-2 bg-white p-2 rounded border border-indigo-300">
                          <Icon icon={view.icon} className="text-indigo-600 text-lg" />
                          <span className="text-sm font-medium text-gray-800">{view.label}</span>
                        </div>
                      ))}
                  </div>
                  <Divider />
                  <p className="text-sm text-indigo-700">
                    <Icon icon="mdi:lightbulb" className="mr-1" />
                    Estas vistas aparecerán automáticamente en el menú de usuarios con el rol "{selectedRole?.name}"
                  </p>
                </Card>
              )}

              {selectedViews.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                  <div className="flex items-center gap-2">
                    <Icon icon="mdi:alert" className="text-yellow-600 text-xl" />
                    <p className="text-sm text-yellow-800">
                      No hay vistas configuradas. Los usuarios con este rol no tendrán acceso predeterminado a ninguna vista.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Dialog>
    </div>
  );
};

export default Roles;