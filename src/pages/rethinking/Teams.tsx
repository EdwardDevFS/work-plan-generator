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
import { Toolbar } from 'primereact/toolbar';
import { confirmDialog } from 'primereact/confirmdialog';
import { Icon } from '@iconify/react';
import { Team,CreateTeamDto, UpdateTeamDto } from '../../types/rethinking/teams.types';
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
      />
    );
  };

  const supervisorBodyTemplate = (rowData: Team) => {
    if (!rowData.supervisorId) return <span className="text-gray-400">Sin asignar</span>;
    const supervisor = users.find(u => u.id === rowData.supervisorId);
    return supervisor ? (
      <div className="flex items-center gap-2">
        <Icon icon="lucide:user" className="text-blue-600" />
        <span>{`${supervisor.firstName} ${supervisor.lastName}`}</span>
      </div>
    ) : (
      <span className="text-gray-400">-</span>
    );
  };

  const zonalBodyTemplate = (rowData: Team) => {
    if (!rowData.zonalId) return <span className="text-gray-400">Sin asignar</span>;
    const zonal = zonals.find(z => z.id === rowData.zonalId);
    return zonal ? (
      <div className="flex items-center gap-2">
        <Icon icon="lucide:map-pin" className="text-green-600" />
        <span>{zonal.name}</span>
      </div>
    ) : (
      <span className="text-gray-400">-</span>
    );
  };

  const actionsBodyTemplate = (rowData: Team) => {
    return (
      <div className="flex gap-2">
        <Button
          icon={<Icon icon="lucide:edit" />}
          className="p-button-rounded p-button-text p-button-sm"
          onClick={() => openEdit(rowData)}
          tooltip="Editar"
        />
        <Button
          icon={<Icon icon="lucide:trash-2" />}
          className="p-button-rounded p-button-text p-button-danger p-button-sm"
          onClick={() => confirmDelete(rowData)}
          tooltip="Eliminar"
        />
      </div>
    );
  };

  const leftToolbarTemplate = () => {
    return (
      <div className="flex gap-2">
        <Button
          label="Nuevo Equipo"
          icon={<Icon icon="lucide:plus" />}
          onClick={openNew}
          className="p-button-success"
        />
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <div className="flex gap-2">
        <Button
          icon={<Icon icon="lucide:refresh-cw" />}
          onClick={loadData}
          tooltip="Actualizar"
          className="p-button-outlined"
        />
      </div>
    );
  };

  const dialogFooter = (
    <div className="flex justify-end gap-2">
      <Button
        label="Cancelar"
        icon={<Icon icon="lucide:x" />}
        onClick={() => setDialogVisible(false)}
        className="p-button-text"
      />
      <Button
        label={isEdit ? 'Actualizar' : 'Crear'}
        icon={<Icon icon="lucide:check" />}
        onClick={handleSave}
        loading={loading}
      />
    </div>
  );

  return (
    <div className="p-6">
      <Toast ref={toast} />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestión de Equipos</h1>
        <p className="text-gray-600">Administra los equipos de trabajo del sistema</p>
      </div>

      <Toolbar
        className="mb-4 border rounded-lg"
        left={leftToolbarTemplate}
        right={rightToolbarTemplate}
      />

      <div className="bg-white rounded-lg shadow">
        <DataTable
          value={teams}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          emptyMessage="No se encontraron equipos"
          className="p-datatable-sm"
        >
          <Column field="name" header="Nombre" sortable />
          <Column field="description" header="Descripción" />
          <Column header="Supervisor" body={supervisorBodyTemplate} />
          <Column header="Zonal Asignado" body={zonalBodyTemplate} />
          <Column header="Estado" body={statusBodyTemplate} />
          <Column header="Acciones" body={actionsBodyTemplate} />
        </DataTable>
      </div>

      <Dialog
        visible={dialogVisible}
        style={{ width: '600px' }}
        header={isEdit ? 'Editar Equipo' : 'Nuevo Equipo'}
        modal
        className="p-fluid"
        footer={dialogFooter}
        onHide={() => setDialogVisible(false)}
      >
        <div className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre <span className="text-red-500">*</span>
            </label>
            <InputText
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Equipo Norte, Equipo Sur"
              className="w-full"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <InputTextarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Descripción del equipo"
              className="w-full"
            />
          </div>

          {/* Supervisor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supervisor
            </label>
            <Dropdown
              value={formData.supervisorId}
              options={userOptions}
              onChange={(e) => setFormData({ ...formData, supervisorId: e.value })}
              placeholder="Seleccionar supervisor"
              className="w-full"
              showClear
            />
          </div>

          {/* Zonal Asignado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zonal Asignado
            </label>
            <Dropdown
              value={formData.zonalId}
              options={zonalOptions}
              onChange={(e) => setFormData({ ...formData, zonalId: e.value })}
              placeholder="Seleccionar zonal"
              className="w-full"
              showClear
            />
          </div>

          {/* Miembros */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Miembros del Equipo
            </label>
            <MultiSelect
              value={formData.memberIds}
              options={userOptions}
              onChange={(e) => setFormData({ ...formData, memberIds: e.value })}
              placeholder="Seleccionar miembros"
              className="w-full"
              display="chip"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Teams;