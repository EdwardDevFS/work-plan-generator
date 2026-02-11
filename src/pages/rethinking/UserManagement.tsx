import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { Tag } from 'primereact/tag';
import { Password } from 'primereact/password';
import { DepartmentAutocomplete } from '../../components/common/geodata/DepartmentAutocomplete';
import { ProvinceAutocomplete } from '../../components/common/geodata/ProvinceAutocomplete';
import { DistrictAutocomplete } from '../../components/common/geodata/DistrictAutocomplete';
import { Department, Province, District } from '../../types/rethinking/geodata.types';
import { User, Role, CreateUserDto, UpdateUserDto } from '../../types/rethinking/organization.types';
import { usersService } from '../../services/rethinking/users.service'; 
import { rolesService } from '../../services/rethinking/roles.service';

export const UsersManagement: React.FC = () => {
  const toast = React.useRef<Toast>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    roleIds: [] as string[],
  });
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        usersService.getAll('tenant-1'),
        rolesService.getAll('tenant-1'),
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al cargar datos' });
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditingUser(null);
    setFormData({ username: '', email: '', password: '', firstName: '', lastName: '', roleIds: [] });
    setSelectedDepartment(null);
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setDialogVisible(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      roleIds: user.roles?.map(r => r.id) || [],
    });
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
  };

  const saveUser = async () => {
    if (!selectedDistrict) {
      toast.current?.show({ severity: 'warn', summary: 'Advertencia', detail: 'Seleccione ubicación completa' });
      return;
    }

    setLoading(true);
    try {
      const userData = {
        ...formData,
        idDepartment: selectedDepartment!.idDepartment,
        idProvince: selectedProvince!.idProvince,
        idDistrict: selectedDistrict.idDistrict,
      };

      if (editingUser) {
        await usersService.update(editingUser.id, userData as UpdateUserDto);
        toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Usuario actualizado' });
      } else {
        await usersService.create(userData as CreateUserDto, 'tenant-1');
        toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Usuario creado' });
      }
      hideDialog();
      loadData();
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al guardar' });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (user: User) => {
    if (window.confirm('¿Está seguro de eliminar este usuario?')) {
      try {
        await usersService.delete(user.id);
        toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Usuario eliminado' });
        loadData();
      } catch (error) {
        toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al eliminar' });
      }
    }
  };

  const leftToolbarTemplate = () => (
    <Button label="Nuevo Usuario" icon="pi pi-plus" className="p-button-success" onClick={openNew} />
  );

  const actionBodyTemplate = (rowData: User) => (
    <div className="flex gap-2">
      <Button icon="pi pi-pencil" className="p-button-rounded p-button-info p-button-sm" onClick={() => openEdit(rowData)} />
      <Button icon="pi pi-trash" className="p-button-rounded p-button-danger p-button-sm" onClick={() => deleteUser(rowData)} />
    </div>
  );

  const statusBodyTemplate = (rowData: User) => (
    <Tag value={rowData.isActive ? 'Activo' : 'Inactivo'} severity={rowData.isActive ? 'success' : 'danger'} />
  );

  const rolesBodyTemplate = (rowData: User) => (
    <div className="flex gap-1 flex-wrap">
      {rowData.roles?.map(role => (
        <Tag key={role.id} value={role.name} className="text-xs" />
      ))}
    </div>
  );

  return (
    <div className="p-6">
      <Toast ref={toast} />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
        <p className="text-gray-600 mt-2">Administre los usuarios del sistema</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Toolbar className="mb-4 border-none" left={leftToolbarTemplate} />
        
        <DataTable
          value={users}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          className="p-datatable-sm"
          emptyMessage="No hay usuarios registrados"
        >
          <Column field="username" header="Usuario" sortable />
          <Column field="firstName" header="Nombre" sortable body={(rowData) => `${rowData.firstName} ${rowData.lastName}`} />
          <Column field="email" header="Email" sortable />
          <Column header="Roles" body={rolesBodyTemplate} />
          <Column field="departmentName" header="Ubicación" body={(rowData) => `${rowData.departmentName || ''}`} />
          <Column header="Estado" body={statusBodyTemplate} />
          <Column header="Acciones" body={actionBodyTemplate} style={{ width: '120px' }} />
        </DataTable>
      </div>

      <Dialog
        visible={dialogVisible}
        style={{ width: '600px' }}
        header={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
              <InputText
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Ingrese nombre"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Apellido</label>
              <InputText
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Ingrese apellido"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
            <InputText
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Ingrese usuario"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <InputText
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Ingrese email"
            />
          </div>

          {!editingUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
              <Password
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Ingrese contraseña"
                toggleMask
                feedback={false}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
            <MultiSelect
              value={formData.roleIds}
              options={roles}
              onChange={(e) => setFormData({ ...formData, roleIds: e.value })}
              optionLabel="name"
              optionValue="id"
              placeholder="Seleccione roles"
              display="chip"
              className="w-full"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Ubicación Geográfica</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Departamento</label>
                <DepartmentAutocomplete
                  value={selectedDepartment}
                  onChange={(dept) => {
                    setSelectedDepartment(dept);
                    setSelectedProvince(null);
                    setSelectedDistrict(null);
                  }}
                  countryId={1}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Provincia</label>
                <ProvinceAutocomplete
                  value={selectedProvince}
                  onChange={(prov) => {
                    setSelectedProvince(prov);
                    setSelectedDistrict(null);
                  }}
                  departmentId={selectedDepartment?.idDepartment}
                  disabled={!selectedDepartment}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Distrito</label>
                <DistrictAutocomplete
                  value={selectedDistrict}
                  onChange={setSelectedDistrict}
                  provinceId={selectedProvince?.idProvince}
                  disabled={!selectedProvince}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button label="Cancelar" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
          <Button label="Guardar" icon="pi pi-check" onClick={saveUser} loading={loading} />
        </div>
      </Dialog>
    </div>
  );
};