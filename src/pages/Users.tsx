import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Toast } from 'primereact/toast';
import { confirmDialog } from 'primereact/confirmdialog';
import { Tag } from 'primereact/tag';
import { MultiSelect } from 'primereact/multiselect';
import { Icon } from '@iconify/react';
import { Chip } from 'primereact/chip';
import { Divider } from 'primereact/divider';
import { usersService } from '../services/users.service';
import { rolesService } from '../services/roles.service';
import { useTenant } from '../contexts/TenantContext';
import { User, CreateUserDto, UpdateUserDto, Role, View } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { viewsService } from '../services/view.service';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [viewsDialogVisible, setViewsDialogVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [availableViews, setAvailableViews] = useState<View[]>([]);
  const [defaultViews, setDefaultViews] = useState<View[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedViews, setSelectedViews] = useState<string[]>([]);
  const [loadingViews, setLoadingViews] = useState(false);
  
  const { user } = useAuth();
  const toast = useRef<Toast>(null);
  const { selectedTenant, tenantInfo } = useTenant();
  const realTenant = selectedTenant ?? user?.tenantId;

  const [formData, setFormData] = useState<CreateUserDto & { id?: string }>({
    tenantId: realTenant,
    username: '',
    email: '',
    rolesIds: [],
    password: '',
    firstName: '',
    lastName: '',
  });

  const loadUsers = async (page: number = 1, limit: number = 10) => {
    if (!realTenant) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Por favor selecciona un tenant',
        life: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await usersService.getAll({ page, limit, tenantId: realTenant });
      setUsers(response.data.data);
      setTotalRecords(response.data.total);
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar usuarios',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableRoles = async () => {
    if (!realTenant) return;

    try {
      const response = await rolesService.getAll({ 
        page: 1, 
        limit: 100, 
        tenantId: realTenant 
      });
      setAvailableRoles(response.data.data);
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar roles disponibles',
        life: 3000,
      });
    }
  };

  const loadAvailableViews = async () => {
    if (!realTenant) return;

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
    if (realTenant) {
      loadUsers(1, rows);
      loadAvailableRoles();
      loadAvailableViews();
    }
  }, [realTenant]);

  const onPage = (event: any) => {
    const page = Math.floor(event.first / event.rows) + 1;
    setFirst(event.first);
    setRows(event.rows);
    loadUsers(page, event.rows);
  };

  const openNew = () => {
    setFormData({
      tenantId: realTenant ?? user?.tenantId,
      username: '',
      email: '',
      rolesIds: [],
      password: '',
      firstName: '',
      lastName: '',
    });
    setSelectedRoles([]);
    setIsEdit(false);
    setDialogVisible(true);
  };

  const openEdit = (user: User) => {
    setFormData({
      tenantId: realTenant ?? user?.tenantId,
      id: user.id,
      username: user.username,
      email: user.email,
      rolesIds: user.roles?.map(r => r.id) || [],
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
    });
    setSelectedUser(user);
    setSelectedRoles(user.roles?.map(r => r.id) || []);
    setIsEdit(true);
    setDialogVisible(true);
  };

  const openViewsDialog = async (user: User) => {
    setSelectedUser(user);
    setLoadingViews(true);
    setViewsDialogVisible(true);

    try {
      const [userViewsResponse, defaultViewsResponse] = await Promise.all([
        viewsService.getRoleViews(),
        viewsService.getDefaultViewsForUser(user.id, realTenant)
      ]);

      setSelectedViews(userViewsResponse.data.map((v: View) => v.id));
      setDefaultViews(defaultViewsResponse.data);
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar vistas del usuario',
        life: 3000,
      });
    } finally {
      setLoadingViews(false);
    }
  };

  const hideDialog = () => {
    setDialogVisible(false);
    setSelectedUser(null);
    setSelectedRoles([]);
  };

  const hideViewsDialog = () => {
    setViewsDialogVisible(false);
    setSelectedUser(null);
    setSelectedViews([]);
    setDefaultViews([]);
  };

  const saveUser = async () => {
    try {
      if (isEdit && formData.id) {
        const updateData: UpdateUserDto = {
          username: formData.username,
          email: formData.email,
          rolesIds: formData.rolesIds,
          firstName: formData.firstName,
          lastName: formData.lastName,
        };
        await usersService.update(formData.id, updateData);

        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Usuario actualizado correctamente',
          life: 3000,
        });
      } else {
        const response = await usersService.create(formData);
        
        if (selectedRoles.length > 0 && response.data.id) {
          await usersService.assignRole(response.data.id, { roles: selectedRoles });
        }

        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Usuario creado correctamente',
          life: 3000,
        });
      }
      hideDialog();
      loadUsers(Math.floor(first / rows) + 1, rows);
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'Error al guardar usuario',
        life: 3000,
      });
    }
  };

  const saveViews = async () => {
    if (!selectedUser) return;

    try {
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Vistas actualizadas correctamente',
        life: 3000,
      });
      
      hideViewsDialog();
      loadUsers(Math.floor(first / rows) + 1, rows);
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'Error al actualizar vistas',
        life: 3000,
      });
    }
  };

  const confirmDelete = (user: User) => {
    confirmDialog({
      message: `¿Está seguro de eliminar al usuario ${user.username}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => deleteUser(user.id),
    });
  };

  const deleteUser = async (id: string) => {
    try {
      await usersService.delete(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Usuario eliminado correctamente',
        life: 3000,
      });
      loadUsers(Math.floor(first / rows) + 1, rows);
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar usuario',
        life: 3000,
      });
    }
  };

  const rolesBodyTemplate = (rowData: User) => {
    if (!rowData.roles || rowData.roles.length === 0) {
      return <span className="text-gray-400 text-sm italic">Sin roles asignados</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {rowData.roles.map((role) => (
          <Tag
            key={role?.id}
            value={role.name}
            className="text-xs px-2 py-1 bg-blue-100 text-blue-700"
          />
        ))}
      </div>
    );
  };

  const actionBodyTemplate = (rowData: User) => {
    return (
      <div className="flex gap-2">
        <Button
          icon={<Icon icon="mdi:eye" className="text-base" />}
          className="!border-none !outline-none p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
          style={{ boxShadow: 'none' }}
          text
          onClick={() => openViewsDialog(rowData)}
          tooltip="Gestionar Vistas"
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          icon={<Icon icon="mdi:pencil" className="text-base" />}
          className="!border-none !outline-none p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
          style={{ boxShadow: 'none' }}
          text
          onClick={() => openEdit(rowData)}
          tooltip="Editar Usuario"
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

  const statusBodyTemplate = (rowData: User) => {
    return (
      <Tag
        value={rowData.isActive ? 'Activo' : 'Inactivo'}
        severity={rowData.isActive ? 'success' : 'danger'}
        className="text-xs px-3 py-1"
      />
    );
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />

      {/* Header Section */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-2">
          <Icon icon="mdi:account-multiple" className="text-blue-600" />
          Gestión de Usuarios
        </h1>
        <div className="flex items-center gap-2 -mt-5">
          {realTenant && tenantInfo?.name && (
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
            label="Nuevo Usuario"
            icon={<Icon icon="mdi:plus" className="text-lg" />}
            className="!border-none !outline-none bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium"
            style={{ boxShadow: 'none' }}
            onClick={openNew}
            disabled={!realTenant}
          />
        </div>

        {/* DataTable */}
        <DataTable
          value={users}
          lazy
          paginator
          first={first}
          rows={rows}
          totalRecords={totalRecords}
          onPage={onPage}
          loading={loading}
          className="text-sm custom-datatable"
          emptyMessage="No se encontraron usuarios"
          rowsPerPageOptions={[5, 10, 25, 50]}
          stripedRows
        >
          <Column 
            field="username" 
            header="Usuario" 
            sortable 
            className="font-medium text-gray-900"
            style={{ minWidth: '150px' }}
          />
          <Column 
            field="email" 
            header="Email" 
            sortable 
            className="text-gray-700"
            style={{ minWidth: '200px' }}
          />
          <Column 
            field="firstName" 
            header="Nombre" 
            sortable 
            className="text-gray-700"
            style={{ minWidth: '150px' }}
          />
          <Column 
            field="lastName" 
            header="Apellido" 
            sortable 
            className="text-gray-700"
            style={{ minWidth: '150px' }}
          />
          <Column
            field="roles"
            header="Roles Asignados"
            body={rolesBodyTemplate}
            style={{ minWidth: '250px' }}
          />
          <Column 
            field="isActive" 
            header="Estado" 
            body={statusBodyTemplate}
            style={{ minWidth: '100px' }}
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
              <Icon icon={isEdit ? 'mdi:account-edit' : 'mdi:account-plus'} className="text-blue-700 text-xl" />
            </div>
            <div className="leading-tight">
              <h2 className="text-lg font-semibold text-gray-900 mb-0">
                {isEdit ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {isEdit ? 'Modifique la información del usuario' : 'Complete los datos del nuevo usuario'}
              </p>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <div className="space-y-4 mt-4">
          {/* Credenciales */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Icon icon="mdi:key" className="text-gray-500" />
              Credenciales de Acceso
            </h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Usuario *
                  </label>
                  <InputText
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Ej: jdoe"
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Email *
                  </label>
                  <InputText
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="usuario@ejemplo.com"
                    className="text-sm"
                  />
                </div>
              </div>

              {!isEdit && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Contraseña *
                  </label>
                  <Password
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    toggleMask
                    placeholder="••••••••"
                    feedback={false}
                    className="text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Información Personal */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Icon icon="mdi:account-circle" className="text-gray-500" />
              Información Personal
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Nombre *
                </label>
                <InputText
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Nombre"
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Apellido *
                </label>
                <InputText
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Apellido"
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Roles */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Icon icon="mdi:shield-account" className="text-gray-500" />
              Roles
            </h3>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Roles
              </label>
              <MultiSelect
                value={formData.rolesIds}
                options={availableRoles}
                onChange={(e) => setFormData({ ...formData, rolesIds: e.value })}
                optionLabel="name"
                optionValue="id"
                placeholder="Seleccionar roles"
                display="chip"
                className="w-full text-sm"
                filter
                filterPlaceholder="Buscar roles..."
              />
              <small className="text-gray-500 mt-2 block text-xs">
                Los roles definen las vistas predeterminadas del usuario
              </small>
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
            label={isEdit ? 'Actualizar' : 'Crear Usuario'}
            icon={<Icon icon="mdi:check" className="text-base mr-2" />}
            className="!border-none !outline-none bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
            style={{ boxShadow: 'none' }}
            onClick={saveUser}
          />
        </div>
      </Dialog>

      {/* Dialog Gestionar Vistas */}
      <Dialog
        visible={viewsDialogVisible}
        style={{ width: '750px' }}
        header={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon icon="mdi:eye-settings" className="text-purple-700 text-xl" />
            </div>
            <div className="leading-tight">
              <h2 className="text-lg font-semibold text-gray-900 mb-0">
                Gestionar Vistas
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedUser?.username}
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
              <i className="pi pi-spin pi-spinner text-4xl text-purple-500"></i>
              <p className="text-gray-600 mt-3 text-sm">Cargando configuración de vistas...</p>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <div className="flex items-start gap-2">
                  <Icon icon="mdi:information" className="text-blue-600 text-xl mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900 mb-1 text-sm">Configuración de Vistas</p>
                    <p className="text-xs text-blue-800">
                      Las vistas seleccionadas determinarán qué secciones verá este usuario en el menú lateral.
                      Las vistas marcadas por defecto provienen de sus roles asignados.
                    </p>
                  </div>
                </div>
              </div>

              {defaultViews.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon icon="mdi:shield-star" className="text-purple-600 text-xl" />
                    <h3 className="font-semibold text-purple-900 text-sm">
                      Vistas Predeterminadas por Roles ({defaultViews.length})
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {defaultViews.map(view => (
                      <Chip
                        key={view.id}
                        label={view.label}
                        icon={<Icon icon={view.icon} className="mr-1" />}
                        className="bg-purple-100 text-purple-800 border border-purple-300 text-xs"
                      />
                    ))}
                  </div>
                  <small className="text-purple-700 mt-2 block text-xs">
                    Estas vistas provienen de los roles asignados al usuario
                  </small>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Icon icon="mdi:view-dashboard" className="text-gray-500" />
                  Seleccionar Vistas Personalizadas
                </h3>
                
                <div>
                  <MultiSelect
                    value={selectedViews}
                    options={availableViews}
                    onChange={(e) => setSelectedViews(e.value)}
                    optionLabel="label"
                    optionValue="id"
                    placeholder="Seleccionar vistas para este usuario"
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
                </div>
              </div>

              {selectedViews.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon icon="mdi:check-circle" className="text-green-600 text-xl" />
                    <h3 className="font-semibold text-green-900 text-sm">
                      Vistas Activas ({selectedViews.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {availableViews
                      .filter(view => selectedViews.includes(view.id))
                      .map(view => (
                        <div key={view.id} className="flex items-center gap-2 bg-white p-2 rounded border border-green-300">
                          <Icon icon={view.icon} className="text-green-600 text-lg" />
                          <span className="text-xs font-medium text-gray-800">{view.label}</span>
                        </div>
                      ))}
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
            label="Guardar Cambios"
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
        .custom-datatable .p-datatable-thead > tr > th.p-highlight {
          background-color: #1f2937 !important;
          color: white !important;
          border-top-left-radius: 0.5rem !important;
          border-top-right-radius: 0.5rem !important;
        }
        
        .custom-datatable .p-datatable-thead > tr > th.p-highlight .p-column-title {
          color: white !important;
        }
        
        .custom-datatable .p-datatable-thead > tr > th.p-highlight .p-sortable-column-icon {
          color: white !important;
        }
        
        .custom-datatable .p-datatable-thead > tr > th.p-highlight .p-column-filter-menu-button {
          color: white !important;
        }
      `}</style>
    </div>
  );
};

export default Users;