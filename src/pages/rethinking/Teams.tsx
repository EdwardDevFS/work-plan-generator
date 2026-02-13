import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { confirmDialog } from 'primereact/confirmdialog';
import { Icon } from '@iconify/react';
import { Team, CreateTeamDto, UpdateTeamDto } from '../../types/rethinking/teams.types';
import { User } from '../../types/rethinking/users.types';
import { Zonal } from '../../types/rethinking/zonal.types';
import { teamsService } from '../../services/rethinking/teams.service';
import { usersService } from '../../services/rethinking/users.service';
import { zonalsService } from '../../services/rethinking/zonals.service';
import { useAuth } from '../../contexts/AuthContext';

const Teams: React.FC = () => {
  const { user } = useAuth();
  const toast = useRef<Toast>(null);

  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [zonals, setZonals] = useState<Zonal[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const [formData, setFormData] = useState<CreateTeamDto>({
    name: '',
    description: '',
    supervisorId: undefined,
    zonalId: undefined,
    memberIds: [],
  });

  useEffect(() => {
    loadData();
  }, [user?.tenantId]);

  const loadData = async () => {
    if (!user?.tenantId) return;
    
    setLoading(true);
    try {
      const [teamsRes, usersRes, zonalsRes] = await Promise.all([
        teamsService.getAll(user.tenantId),
        usersService.getAll(user.tenantId),
        zonalsService.getAll(user.tenantId),
      ]);
      
      setTeams(teamsRes.data);
      setUsers(usersRes.data);
      setZonals(zonalsRes.data);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los datos',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setFormData({
      name: '',
      description: '',
      supervisorId: undefined,
      zonalId: undefined,
      memberIds: [],
    });
    setIsEdit(false);
    setSelectedTeam(null);
    setDialogVisible(true);
  };

  const openEdit = (team: Team) => {
    setFormData({
      name: team.name,
      description: team.description || '',
      supervisorId: team.supervisorId,
      zonalId: team.zonalId,
      memberIds: [],
    });
    setIsEdit(true);
    setSelectedTeam(team);
    setDialogVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'El nombre es obligatorio',
        life: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      if (isEdit && selectedTeam) {
        await teamsService.update(selectedTeam.id, formData as UpdateTeamDto);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Equipo actualizado correctamente',
          life: 3000,
        });
      } else {
        await teamsService.create(formData, user!.tenantId);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Equipo creado correctamente',
          life: 3000,
        });
      }
      
      setDialogVisible(false);
      loadData();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo guardar el equipo',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (team: Team) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el equipo "${team.name}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: () => handleDelete(team.id),
    });
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await teamsService.delete(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Equipo eliminado correctamente',
        life: 3000,
      });
      loadData();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo eliminar el equipo',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const userOptions = users.map(u => ({
    label: `${u.firstName} ${u.lastName}`,
    value: u.id,
  }));

  const zonalOptions = zonals.map(z => ({
    label: z.name,
    value: z.id,
  }));

  const statusBodyTemplate = (rowData: Team) => {
    return (
      <Tag
        value={rowData.isActive ? 'Activo' : 'Inactivo'}
        severity={rowData.isActive ? 'success' : 'danger'}
        className="text-xs px-3 py-1"
      />
    );
  };

  const supervisorBodyTemplate = (rowData: Team) => {
    if (!rowData.supervisorId) return <span className="text-gray-400 text-sm">Sin asignar</span>;
    const supervisor = users.find(u => u.id === rowData.supervisorId);
    return supervisor ? (
      <div className="flex items-center gap-2">
        <Icon icon="mdi:account" className="text-blue-600" />
        <span className="text-sm">{`${supervisor.firstName} ${supervisor.lastName}`}</span>
      </div>
    ) : (
      <span className="text-gray-400 text-sm">-</span>
    );
  };

  const zonalBodyTemplate = (rowData: Team) => {
    if (!rowData.zonalId) return <span className="text-gray-400 text-sm">Sin asignar</span>;
    const zonal = zonals.find(z => z.id === rowData.zonalId);
    return zonal ? (
      <div className="flex items-center gap-2">
        <Icon icon="mdi:map-marker" className="text-green-600" />
        <span className="text-sm">{zonal.name}</span>
      </div>
    ) : (
      <span className="text-gray-400 text-sm">-</span>
    );
  };

  const actionsBodyTemplate = (rowData: Team) => {
    return (
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
          onClick={() => confirmDelete(rowData)}
        />
      </div>
    );
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />

      {/* Header Section */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-900">Gestión de Equipos</h1>
        <p className="text-lg text-gray-500 -mt-5">Administra los equipos de trabajo del sistema</p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Toolbar */}
        <div className="pb-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <Button
            label="Nuevo Equipo"
            icon={<Icon icon="mdi:plus" className="text-lg" />}
            className="!border-none !outline-none bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium"
            style={{ boxShadow: 'none' }}
            onClick={openNew}
          />
          <Button
            icon={<Icon icon="mdi:refresh" className="text-lg" />}
            className="!border-none !outline-none p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            style={{ boxShadow: 'none' }}
            text
            onClick={loadData}
          />
        </div>

        {/* DataTable */}
        <DataTable
          value={teams}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          emptyMessage="No se encontraron equipos"
          className="text-sm custom-datatable"
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
            header="Supervisor" 
            body={supervisorBodyTemplate}
          />
          <Column 
            header="Zonal Asignado" 
            body={zonalBodyTemplate}
          />
          <Column 
            header="Estado" 
            body={statusBodyTemplate}
            style={{ width: '100px' }}
          />
          <Column 
            header="Acciones" 
            body={actionsBodyTemplate}
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
              <Icon icon={isEdit ? "mdi:account-group" : "mdi:account-multiple-plus"} className="text-blue-700 text-xl" />
            </div>
            <div className="leading-tight">
              <h2 className="text-lg font-semibold text-gray-900 mb-0">
                {isEdit ? 'Editar Equipo' : 'Nuevo Equipo'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {isEdit ? 'Modifique la información del equipo' : 'Complete los datos del nuevo equipo'}
              </p>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={() => setDialogVisible(false)}
      >
        <div className="space-y-4 mt-4">
          {/* Información del Equipo */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Icon icon="mdi:information" className="text-gray-500" />
              Información del Equipo
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <InputText
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Equipo Norte, Equipo Sur"
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Descripción
                </label>
                <InputTextarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Descripción del equipo"
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Asignaciones */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Icon icon="mdi:account-supervisor" className="text-gray-500" />
              Asignaciones
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Supervisor
                </label>
                <Dropdown
                  value={formData.supervisorId}
                  options={userOptions}
                  onChange={(e) => setFormData({ ...formData, supervisorId: e.value })}
                  placeholder="Seleccionar supervisor"
                  className="w-full text-sm"
                  showClear
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Zonal Asignado
                </label>
                <Dropdown
                  value={formData.zonalId}
                  options={zonalOptions}
                  onChange={(e) => setFormData({ ...formData, zonalId: e.value })}
                  placeholder="Seleccionar zonal"
                  className="w-full text-sm"
                  showClear
                />
              </div>
            </div>
          </div>

          {/* Miembros del Equipo */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Icon icon="mdi:account-multiple" className="text-gray-500" />
              Miembros del Equipo
            </h3>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Miembros
              </label>
              <MultiSelect
                value={formData.memberIds}
                options={userOptions}
                onChange={(e) => setFormData({ ...formData, memberIds: e.value })}
                placeholder="Seleccionar miembros"
                className="w-full text-sm"
                display="chip"
              />
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
            onClick={() => setDialogVisible(false)}
          />
          <Button
            label={isEdit ? 'Actualizar' : 'Crear'}
            icon={<Icon icon="mdi:check" className="text-base mr-2" />}
            className="!border-none !outline-none bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
            style={{ boxShadow: 'none' }}
            onClick={handleSave}
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

export default Teams;