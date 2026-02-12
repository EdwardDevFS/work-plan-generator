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
import { Card } from 'primereact/card';
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
        
        // if (selectedRoles.length > 0) {
        //   await usersService.assignRole(formData.id, { roles: selectedRoles });
        // }

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
      // if (selectedViews.length > 0) {
      //   await viewsService.updateUserViews(selectedUser.id, selectedViews, realTenant);
      // } else {
      //   await viewsService.deleteUserViews(selectedUser.id, realTenant);
      // }
      
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
          <Chip
            key={role?.id}
            label={role.name}
            className="bg-blue-50 text-blue-700 text-xs px-2 py-1"
            icon={<Icon icon="mdi:shield-account" className="text-2xl mr-1" />}
          />
        ))}
      </div>
    );
  };

  const actionBodyTemplate = (rowData: User) => {
    return (
      <div className="flex gap-2">
        <Button
          icon={<Icon icon="mdi:eye" className="text-lg" />}
          className="p-button-rounded p-button-text p-button-info"
          onClick={() => openViewsDialog(rowData)}
          tooltip="Gestionar Vistas"
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          icon={<Icon icon="mdi:pencil" className="text-lg" />}
          className="p-button-rounded p-button-text p-button-warning"
          onClick={() => openEdit(rowData)}
          tooltip="Editar Usuario"
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

  const statusBodyTemplate = (rowData: User) => {
    return (
      <Tag
        value={rowData.isActive ? 'Activo' : 'Inactivo'}
        severity={rowData.isActive ? 'success' : 'danger'}
        rounded
      />
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
        label={isEdit ? 'Actualizar' : 'Crear Usuario'}
        icon={<Icon icon="mdi:content-save" />}
        onClick={saveUser}
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
        label="Guardar Cambios"
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
              <Icon icon="mdi:account-multiple" className="text-blue-600" />
              Gestión de Usuarios
            </h1>
            {realTenant && (
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Icon icon="mdi:office-building" className="text-xs" />
                {tenantInfo?.name}
              </p>
            )}
          </div>
          <Button
            label="Nuevo Usuario"
            icon={<Icon icon="mdi:account-plus" />}
            onClick={openNew}
            disabled={!realTenant}
            className="p-button-success"
          />
        </div>
      </div>

      <Card>
        <DataTable
          value={users}
          lazy
          paginator
          first={first}
          rows={rows}
          totalRecords={totalRecords}
          onPage={onPage}
          loading={loading}
          className="p-datatable-sm"
          emptyMessage="No se encontraron usuarios"
          rowsPerPageOptions={[5, 10, 25, 50]}
          stripedRows
          showGridlines
        >
          <Column 
            field="username" 
            header="Usuario" 
            sortable 
            style={{ minWidth: '150px' }}
          />
          <Column 
            field="email" 
            header="Email" 
            sortable 
            style={{ minWidth: '200px' }}
          />
          <Column 
            field="firstName" 
            header="Nombre" 
            sortable 
            style={{ minWidth: '150px' }}
          />
          <Column 
            field="lastName" 
            header="Apellido" 
            sortable 
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
            <Icon icon={isEdit ? 'mdi:pencil' : 'mdi:account-plus'} className="text-2xl text-blue-600" />
            <span>{isEdit ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</span>
          </div>
        }
        modal
        className="p-fluid"
        footer={dialogFooter}
        onHide={hideDialog}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="field">
              <label htmlFor="username" className="block mb-2 font-semibold text-gray-700">
                <Icon icon="mdi:account" className="mr-1" />
                Usuario *
              </label>
              <InputText
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                placeholder="Ej: jdoe"
              />
            </div>

            <div className="field">
              <label htmlFor="email" className="block mb-2 font-semibold text-gray-700">
                <Icon icon="mdi:email" className="mr-1" />
                Email *
              </label>
              <InputText
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="usuario@ejemplo.com"
              />
            </div>
          </div>

          {!isEdit && (
            <div className="field">
              <label htmlFor="password" className="block mb-2 font-semibold text-gray-700">
                <Icon icon="mdi:lock" className="mr-1" />
                Contraseña *
              </label>
              <Password
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                toggleMask
                required
                placeholder="••••••••"
                feedback={false}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="field">
              <label htmlFor="firstName" className="block mb-2 font-semibold text-gray-700">
                <Icon icon="mdi:account-details" className="mr-1" />
                Nombre *
              </label>
              <InputText
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                placeholder="Nombre"
              />
            </div>

            <div className="field">
              <label htmlFor="lastName" className="block mb-2 font-semibold text-gray-700">
                Apellido *
              </label>
              <InputText
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                placeholder="Apellido"
              />
            </div>
          </div>

          <Divider />

          <div className="field">
            <label htmlFor="roles" className="block mb-2 font-semibold text-gray-700">
              <Icon icon="mdi:shield-account" className="mr-1" />
              Roles
            </label>
            {/* <pre>{JSON.stringify(formData, null, 2)}</pre> */}
            <MultiSelect
              id="roles"
              value={formData.rolesIds}
              options={availableRoles}
              onChange={(e) => setFormData({ ...formData, rolesIds: e.value })}
              optionLabel="name"
              optionValue="id"
              placeholder="Seleccionar roles"
              display="chip"
              className="w-full"
              filter
              filterPlaceholder="Buscar roles..."
            />
            <small className="text-gray-500 mt-1 block">
              Los roles definen las vistas predeterminadas del usuario
            </small>
          </div>
        </div>
      </Dialog>

      <Dialog
        visible={viewsDialogVisible}
        style={{ width: '700px' }}
        header={
          <div className="flex items-center gap-2">
            <Icon icon="mdi:eye-settings" className="text-2xl text-purple-600" />
            <span>Gestionar Vistas - {selectedUser?.username}</span>
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
              <i className="pi pi-spin pi-spinner text-4xl text-blue-500"></i>
              <p className="text-gray-600 mt-3">Cargando configuración de vistas...</p>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <div className="flex items-start gap-2">
                  <Icon icon="mdi:information" className="text-blue-600 text-xl mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900 mb-1">Configuración de Vistas</p>
                    <p className="text-sm text-blue-800">
                      Las vistas seleccionadas determinarán qué secciones verá este usuario en el menú lateral.
                      Las vistas marcadas por defecto provienen de sus roles asignados.
                    </p>
                  </div>
                </div>
              </div>

              {defaultViews.length > 0 && (
                <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon icon="mdi:shield-star" className="text-purple-600 text-xl" />
                    <h3 className="font-semibold text-purple-900">
                      Vistas Predeterminadas por Roles ({defaultViews.length})
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {defaultViews.map(view => (
                      <Chip
                        key={view.id}
                        label={view.label}
                        icon={<Icon icon={view.icon} className="mr-1" />}
                        className="bg-purple-100 text-purple-800 border border-purple-300"
                      />
                    ))}
                  </div>
                  <small className="text-purple-700 mt-2 block">
                    Estas vistas provienen de los roles asignados al usuario
                  </small>
                </Card>
              )}

              <div className="field">
                <label htmlFor="views" className="block mb-3 font-semibold text-gray-800 text-lg">
                  <Icon icon="mdi:view-dashboard" className="mr-2" />
                  Seleccionar Vistas Personalizadas
                </label>
                <MultiSelect
                  id="views"
                  value={selectedViews}
                  options={availableViews}
                  onChange={(e) => setSelectedViews(e.value)}
                  optionLabel="label"
                  optionValue="id"
                  placeholder="Seleccionar vistas para este usuario"
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
              </div>

              {selectedViews.length > 0 && (
                <Card className="bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon icon="mdi:check-circle" className="text-green-600 text-xl" />
                    <h3 className="font-semibold text-green-900">
                      Vistas Activas ({selectedViews.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {availableViews
                      .filter(view => selectedViews.includes(view.id))
                      .map(view => (
                        <div key={view.id} className="flex items-center gap-2 bg-white p-2 rounded border border-green-300">
                          <Icon icon={view.icon} className="text-green-600 text-lg" />
                          <span className="text-sm font-medium text-gray-800">{view.label}</span>
                        </div>
                      ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </Dialog>
    </div>
  );
};

export default Users;