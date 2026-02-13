import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Password } from 'primereact/password';
import { Icon } from '@iconify/react';
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

  const actionBodyTemplate = (rowData: User) => (
    <div className="flex gap-2">
      <Button 
        icon={<Icon icon="mdi:pencil" className="text-base" />}
        className="!border-none !outline-none p-2 text-blue-600 hover:bg-blue-50 rounded-lg" 
        style={{ boxShadow: 'none' }}
        text
        onClick={() => openEdit(rowData)} 
      />
      <Button 
        icon={<Icon icon="mdi:delete" className="text-base" />}
        className="!border-none !outline-none p-2 text-red-600 hover:bg-red-50 rounded-lg" 
        style={{ boxShadow: 'none' }}
        text
        onClick={() => deleteUser(rowData)} 
      />
    </div>
  );

  const statusBodyTemplate = (rowData: User) => (
    <Tag 
      value={rowData.isActive ? 'Activo' : 'Inactivo'} 
      severity={rowData.isActive ? 'success' : 'danger'}
      className="text-xs px-3 py-1"
    />
  );

  const rolesBodyTemplate = (rowData: User) => (
    <div className="flex gap-1 flex-wrap">
      {rowData.roles?.map(role => (
        <Tag key={role.id} value={role.name} className="text-xs px-2 py-1 bg-blue-100 text-blue-700" />
      ))}
    </div>
  );

  return (
    <div className="p-4">
      <Toast ref={toast} />
      
      {/* Header Section */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <p className="text-lg text-gray-500 -mt-5">Administre los usuarios del sistema</p>
      </div>

       <div className="pb-5 border-b border-gray-200 bg-gray-50">
          <Button 
            label="Nuevo Usuario" 
            icon={<Icon icon="mdi:plus" className="text-lg" />}
            className="!border-none !outline-none bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium"
            style={{ boxShadow: 'none' }}
            onClick={openNew} 
          />
        </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Toolbar */}
       
        
        {/* DataTable */}
        <DataTable
          value={users}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          className="text-sm custom-datatable"
          emptyMessage="No hay usuarios registrados"
          stripedRows
        >
          <Column 
            field="username" 
            header="Usuario" 
            sortable 
            className="font-medium text-gray-900"
          />
          <Column 
            field="firstName" 
            header="Nombre" 
            sortable 
            body={(rowData) => `${rowData.firstName} ${rowData.lastName}`}
            className="text-gray-700"
          />
          <Column 
            field="email" 
            header="Email" 
            sortable 
            className="text-gray-600"
          />
          <Column 
            header="Roles" 
            body={rolesBodyTemplate} 
          />
          <Column 
            field="departmentName" 
            header="Ubicación" 
            body={(rowData) => `${rowData.departmentName || ''}`}
            className="text-gray-600 text-xs"
          />
          <Column 
            header="Estado" 
            body={statusBodyTemplate} 
            style={{ width: '100px' }}
          />
          <Column 
            header="Acciones" 
            body={actionBodyTemplate} 
            style={{ width: '120px' }}
            className="text-center"
          />
        </DataTable>
      </div>

      {/* Dialog */}
     <Dialog
        visible={dialogVisible}
        style={{ width: '650px' }}
        header={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon icon={editingUser ? "mdi:account-edit" : "mdi:account-plus"} className="text-blue-700 text-xl" />
            </div>
            <div className="leading-tight">
              <h2 className="text-lg font-semibold text-gray-900 mb-0">
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {editingUser ? 'Modifique la información del usuario' : 'Complete los datos del nuevo usuario'}
              </p>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <div className="space-y-4 mt-4">
          {/* Información Personal */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Icon icon="mdi:account-circle" className="text-gray-500" />
              Información Personal
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Nombre</label>
                <InputText
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Ingrese nombre"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Apellido</label>
                <InputText
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Ingrese apellido"
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Credenciales */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Icon icon="mdi:key" className="text-gray-500" />
              Credenciales de Acceso
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Usuario</label>
                <InputText
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Ingrese usuario"
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Email</label>
                <InputText
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ingrese email"
                  className="text-sm"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Contraseña</label>
                  <Password
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Ingrese contraseña"
                    toggleMask
                    feedback={false}
                    className="text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Roles */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Icon icon="mdi:shield-account" className="text-gray-500" />
              Permisos y Roles
            </h3>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Roles</label>
              <MultiSelect
                value={formData.roleIds}
                options={roles}
                onChange={(e) => setFormData({ ...formData, roleIds: e.value })}
                optionLabel="name"
                optionValue="id"
                placeholder="Seleccione roles"
                display="chip"
                className="w-full text-sm"
              />
            </div>
          </div>

          {/* Ubicación Geográfica */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Icon icon="mdi:map-marker" className="text-gray-500" />
              Ubicación Geográfica
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Departamento</label>
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
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Provincia</label>
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
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Distrito</label>
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
            label="Guardar" 
            icon={<Icon icon="mdi:check" className="text-base mr-2" />}
            className="!border-none !outline-none bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
            style={{ boxShadow: 'none' }}
            onClick={saveUser} 
            loading={loading} 
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
        `}</style>
    </div>
  );
};