import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { Tag } from 'primereact/tag';
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
    accessLevelId: '',
  });

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
    setFormData({ name: '', description: '', accessLevelId: '' });
    setDialogVisible(true);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      accessLevelId: role.accessLevelId,
    });
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
  };

  const saveRole = async () => {
    if (!formData.name || !formData.accessLevelId) {
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

  const leftToolbarTemplate = () => (
    <Button label="Nuevo Rol" icon="pi pi-plus" className="p-button-success" onClick={openNew} />
  );

  const actionBodyTemplate = (rowData: Role) => (
    <div className="flex gap-2">
      <Button icon="pi pi-pencil" className="p-button-rounded p-button-info p-button-sm" onClick={() => openEdit(rowData)} />
      <Button icon="pi pi-trash" className="p-button-rounded p-button-danger p-button-sm" onClick={() => deleteRole(rowData)} />
    </div>
  );

  const statusBodyTemplate = (rowData: Role) => (
    <Tag value={rowData.isActive ? 'Activo' : 'Inactivo'} severity={rowData.isActive ? 'success' : 'danger'} />
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
      />
    );
  };

  return (
    <div className="p-6">
      <Toast ref={toast} />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Roles</h1>
        <p className="text-gray-600 mt-2">Administre los roles y sus niveles de acceso</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Toolbar className="mb-4 border-none" left={leftToolbarTemplate} />
        
        <DataTable
          value={roles}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          className="p-datatable-sm"
          emptyMessage="No hay roles registrados"
        >
          <Column field="name" header="Nombre" sortable />
          <Column field="description" header="Descripción" />
          <Column header="Nivel de Acceso" body={accessLevelBodyTemplate} />
          <Column header="Estado" body={statusBodyTemplate} />
          <Column header="Acciones" body={actionBodyTemplate} style={{ width: '120px' }} />
        </DataTable>
      </div>

      <Dialog
        visible={dialogVisible}
        style={{ width: '500px' }}
        header={editingRole ? 'Editar Rol' : 'Nuevo Rol'}
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
            <InputText
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Coordinador Regional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
            <InputTextarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Descripción del rol"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nivel de Acceso *</label>
            <Dropdown
              value={formData.accessLevelId}
              options={accessLevels}
              onChange={(e) => setFormData({ ...formData, accessLevelId: e.value })}
              optionLabel="name"
              optionValue="id"
              placeholder="Seleccione nivel de acceso"
              className="w-full"
            />
            {formData.accessLevelId && (
              <div className="mt-2 p-3 bg-blue-50 rounded text-sm">
                <p className="text-blue-900">
                  {accessLevels.find(al => al.id === formData.accessLevelId)?.description}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button label="Cancelar" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
          <Button label="Guardar" icon="pi pi-check" onClick={saveRole} loading={loading} />
        </div>
      </Dialog>
    </div>
  );
};