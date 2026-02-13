import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { MultiSelect } from 'primereact/multiselect';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Icon } from '@iconify/react';
import { Role, AccessLevel, CreateRoleDto, UpdateRoleDto } from '../../types/rethinking/organization.types';
import { accessLevelsService } from '../../services/rethinking/access-levels.service';
import { rolesService } from '../../services/rethinking/roles.service';

export const RolesManagement: React.FC = () => {
  const toast = React.useRef<Toast>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [accessLevels, setAccessLevels] = useState<AccessLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    routes: [] as string[],
  });

  // Rutas de la aplicación basadas en tu menú
  const appRoutes = [
    { label: 'Clientes', value: '/clientes', icon: 'mdi:table' },
    { label: 'Usuarios', value: '/usuarios', icon: 'mdi:account-group' },
    { label: 'Roles', value: '/roles', icon: 'mdi:shield-account' },
    { label: 'Formularios', value: '/formularios', icon: 'mdi:file-document' },
    { label: 'Planes de trabajo', value: '/planes-trabajo', icon: 'mdi:strategy' },
    { label: 'Actividades laborales', value: '/actividades-laborales', icon: 'mdi:calendar-check' },
    { label: 'Gestión de Usuarios', value: '/gestion-usuarios', icon: 'mdi:account-cog' },
    { label: 'Gestión de Roles', value: '/gestion-roles', icon: 'mdi:shield-edit' },
    { label: 'Gestión de Zonales', value: '/gestion-zonales', icon: 'mdi:map-marker-radius' },
    { label: 'Equipos de trabajo', value: '/equipos-trabajo', icon: 'mdi:account-multiple' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesRes, accessLevelsRes] = await Promise.all([
        rolesService.getAll('tenant-1'),
        accessLevelsService.getAll(),
      ]);
      setRoles(rolesRes.data);
      setAccessLevels(accessLevelsRes.data);
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al cargar datos' });
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '', routes: [] });
    setDialogVisible(true);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      routes: role.routes || [],
    });
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
  };

  const saveRole = async () => {
    if (!formData.name || formData.routes.length === 0) {
      toast.current?.show({ severity: 'warn', summary: 'Advertencia', detail: 'Complete los campos requeridos' });
      return;
    }

    setLoading(true);
    try {
      if (editingRole) {
        await rolesService.update(editingRole.id, formData as UpdateRoleDto);
        toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Rol actualizado' });
      } else {
        await rolesService.create(formData as CreateRoleDto, 'tenant-1');
        toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Rol creado' });
      }
      hideDialog();
      loadData();
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al guardar' });
    } finally {
      setLoading(false);
    }
  };

  const deleteRole = async (role: Role) => {
    if (window.confirm('¿Está seguro de eliminar este rol?')) {
      try {
        await rolesService.delete(role.id);
        toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Rol eliminado' });
        loadData();
      } catch (error) {
        toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al eliminar' });
      }
    }
  };

  const actionBodyTemplate = (rowData: Role) => (
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
        onClick={() => deleteRole(rowData)} 
      />
    </div>
  );

  const statusBodyTemplate = (rowData: Role) => (
    <Tag 
      value={rowData.isActive ? 'Activo' : 'Inactivo'} 
      severity={rowData.isActive ? 'success' : 'danger'}
      className="text-xs px-3 py-1"
    />
  );

  const accessLevelBodyTemplate = (rowData: Role) => {
    const severityMap: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
      FULL: 'danger',
      ZONAL: 'warning',
      SUPERVISION: 'info',
      BASIC: 'success',
    };
    return (
      <Tag 
        value={rowData.accessLevel?.name || 'N/A'} 
        severity={severityMap[rowData.accessLevel?.code || 'BASIC']}
        className="text-xs px-3 py-1"
      />
    );
  };

  // Template para mostrar las rutas en el MultiSelect
  const routeOptionTemplate = (option: any) => {
    return (
      <div className="flex items-center gap-2">
        <Icon icon={option.icon} className="text-gray-600" />
        <span>{option.label}</span>
      </div>
    );
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />
      
      {/* Header Section */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-900">Gestión de Roles</h1>
        <p className="text-lg text-gray-500 -mt-5">Administre los roles y sus niveles de acceso</p>
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
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          className="text-sm custom-datatable"
          emptyMessage="No hay roles registrados"
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
            className="text-gray-700"
          />
          <Column 
            header="Nivel de Acceso" 
            body={accessLevelBodyTemplate}
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
              <Icon icon={editingRole ? "mdi:shield-edit" : "mdi:shield-plus"} className="text-blue-700 text-xl" />
            </div>
            <div className="leading-tight">
              <h2 className="text-lg font-semibold text-gray-900 mb-0">
                {editingRole ? 'Editar Rol' : 'Nuevo Rol'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {editingRole ? 'Modifique la información del rol' : 'Complete los datos del nuevo rol'}
              </p>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <div className="space-y-4 mt-4">
          {/* Información del Rol */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Icon icon="mdi:shield-account" className="text-gray-500" />
              Información del Rol
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Nombre *</label>
                <InputText
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Coordinador Regional"
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Descripción</label>
                <InputTextarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Descripción del rol"
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Accesos */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Icon icon="mdi:routes" className="text-gray-500" />
              Accesos
            </h3>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Rutas de Acceso *</label>
              <MultiSelect
                value={formData.routes}
                options={appRoutes}
                onChange={(e) => setFormData({ ...formData, routes: e.value })}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccione las rutas permitidas"
                className="w-full text-sm"
                display="chip"
                filter
                maxSelectedLabels={3}
                itemTemplate={routeOptionTemplate}
              />
              {formData.routes.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-blue-900 font-semibold text-xs mb-2">
                    {formData.routes.length} {formData.routes.length === 1 ? 'ruta seleccionada' : 'rutas seleccionadas'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {formData.routes.map((route, index) => {
                      const routeInfo = appRoutes.find(r => r.value === route);
                      return (
                        <div key={index} className="flex items-center gap-1.5 text-xs bg-white border border-blue-200 text-blue-800 px-2.5 py-1.5 rounded">
                          <Icon icon={routeInfo?.icon || 'mdi:link'} className="text-sm" />
                          <span>{routeInfo?.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
            onClick={saveRole} 
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