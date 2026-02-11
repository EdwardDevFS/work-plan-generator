import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { MultiSelect } from 'primereact/multiselect';
import { Checkbox } from 'primereact/checkbox';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Tag } from 'primereact/tag';
import { Chip } from 'primereact/chip';
import { Divider } from 'primereact/divider';
import { Badge } from 'primereact/badge';
import { Icon } from '@iconify/react';
import { Activity } from '../../types/workplan.types';
import { User } from '../../types';
import { activitiesApi } from '../../services/activities.service';
import { usersService } from '../../services/users.service';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';

const ActivitiesManagement: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = React.useRef<Toast>(null);
  const { selectedTenant } = useTenant();
  const { user } = useAuth();

  const [formData, setFormData] = useState<Activity>({
    activityName: '',
    description: '',
    estimatedTimePerTask: 60,
    isRepetitive: false,
    defaultRepetitions: 1,
    hasCustomSchedule: false,
    customTimeSlots: [],
    authorizedUserIds: [],
    tenantId: selectedTenant ?? user?.tenantId
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      activitiesApi.list().then(activitiesData => {
        setActivities(activitiesData);
      });
      
      usersService.getAll({ tenantId: user?.tenantId, limit: 1000, page: 1 })
        .then(res => {
          const usersWithFullName = res.data.data.map(u => ({
            ...u,
            fullName: `${u.firstName} ${u.lastName}`,
          }));
          setUsers(usersWithFullName);
        });
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al cargar datos' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (activity?: Activity) => {
    if (activity) {
      setEditingActivity(activity);
      setFormData({
        activityName: activity.activityName,
        description: activity.description || '',
        estimatedTimePerTask: activity.estimatedTimePerTask,
        isRepetitive: activity.isRepetitive,
        defaultRepetitions: activity.defaultRepetitions,
        hasCustomSchedule: activity.hasCustomSchedule || false,
        customTimeSlots: activity.customTimeSlots || [],
        authorizedUserIds: !activity?.authorizedUsers ? [] : activity?.authorizedUsers.map(u => u.id),
      });
    } else {
      setEditingActivity(null);
      setFormData({
        activityName: '',
        description: '',
        estimatedTimePerTask: 60,
        isRepetitive: false,
        defaultRepetitions: 1,
        hasCustomSchedule: false,
        customTimeSlots: [],
        authorizedUserIds: [],
      });
    }
    setShowDialog(true);
  };

  const handleAddTimeSlot = () => {
    const newTimeSlots = [...(formData.customTimeSlots || []), { start: '09:00', end: '17:00' }];
    setFormData({ ...formData, customTimeSlots: newTimeSlots });
  };

  const handleRemoveTimeSlot = (index: number) => {
    const newTimeSlots = formData.customTimeSlots?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, customTimeSlots: newTimeSlots });
  };

  const handleTimeSlotChange = (index: number, field: 'start' | 'end', value: string) => {
    const newTimeSlots = [...(formData.customTimeSlots || [])];
    newTimeSlots[index] = { ...newTimeSlots[index], [field]: value };
    setFormData({ ...formData, customTimeSlots: newTimeSlots });
  };

  const handleSave = async () => {
    if (!formData.activityName.trim()) {
      toast.current?.show({ severity: 'warn', summary: 'Advertencia', detail: 'Ingresa el nombre' });
      return;
    }

    try {
      const dataToSave = {
        ...formData,
        customTimeSlots: formData.hasCustomSchedule ? formData.customTimeSlots : undefined,
      };

      if (editingActivity && editingActivity.id) {
        await activitiesApi.update(editingActivity.id, dataToSave);
        toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Actividad actualizada' });
      } else {
        await activitiesApi.create(dataToSave);
        toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Actividad creada' });
      }
      setShowDialog(false);
      loadData();
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al guardar' });
    }
  };

  const handleDelete = (activity: Activity) => {
    confirmDialog({
      message: `¿Eliminar "${activity.activityName}"?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await activitiesApi.delete(activity?.id!);
          toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Actividad eliminada' });
          loadData();
        } catch (error) {
          toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al eliminar' });
        }
      },
    });
  };

  const usersTemplate = (activity: Activity) => {
    if (!activity.authorizedUsers || activity.authorizedUsers.length === 0) {
      return <span className="text-gray-400 text-sm italic">Todos los usuarios</span>;
    }

    const displayLimit = 3;
    const visibleUsers = activity.authorizedUsers.slice(0, displayLimit);
    const remainingCount = activity.authorizedUsers.length - displayLimit;

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center -space-x-2">
          {visibleUsers.map((u, index) => (
            <div
              key={u.id}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold border-2 border-white shadow-sm"
              title={`${u.firstName} ${u.lastName}`}
            >
              {u.firstName[0]}{u.lastName[0]}
            </div>
          ))}
        </div>
        {remainingCount > 0 && (
          <Badge 
            value={`+${remainingCount}`} 
            severity="info" 
            className="text-xs"
          />
        )}
      </div>
    );
  };

  const typeTemplate = (activity: Activity) => {
    return activity.isRepetitive ? (
      <div className="flex items-center gap-2">
        <Icon icon="mdi:repeat" className="text-green-600 text-lg" />
        <span className="text-sm font-medium text-green-700">
          {activity.defaultRepetitions}x
        </span>
      </div>
    ) : (
      <div className="flex items-center gap-2">
        <Icon icon="mdi:numeric-1-circle" className="text-blue-600 text-lg" />
        <span className="text-sm font-medium text-blue-700">Única</span>
      </div>
    );
  };

  const timeTemplate = (activity: Activity) => {
    return (
      <div className="flex items-center gap-2">
        <Icon icon="mdi:clock-outline" className="text-gray-500" />
        <span className="text-sm font-medium">{activity.estimatedTimePerTask} min</span>
      </div>
    );
  };

  const scheduleTemplate = (activity: Activity) => {
    if (!activity.hasCustomSchedule) {
      return (
        <div className="flex items-center gap-2">
          <Icon icon="mdi:calendar-clock" className="text-gray-400" />
          <span className="text-sm text-gray-600">Estándar</span>
        </div>
      );
    }
    return (
      <div className="flex flex-wrap gap-1">
        {activity.customTimeSlots?.slice(0, 2).map((slot, i) => (
          <Chip
            key={i}
            label={`${slot.start} - ${slot.end}`}
            icon={<Icon icon="mdi:clock-time-four-outline" className="mr-1" />}
            className="bg-amber-50 text-amber-800 border border-amber-200 text-xs px-2 py-1"
          />
        ))}
        {activity.customTimeSlots && activity.customTimeSlots.length > 2 && (
          <Badge 
            value={`+${activity.customTimeSlots.length - 2}`} 
            severity="warning"
            className="text-xs"
          />
        )}
      </div>
    );
  };

  const actionsTemplate = (activity: Activity) => {
    return (
      <div className="flex gap-2">
        <Button 
          icon={<Icon icon="mdi:pencil" className="text-lg" />}
          className="p-button-rounded p-button-text p-button-warning"
          onClick={() => handleOpenDialog(activity)} 
          tooltip="Editar"
          tooltipOptions={{ position: 'top' }}
        />
        <Button 
          icon={<Icon icon="mdi:delete" className="text-lg" />}
          className="p-button-rounded p-button-text p-button-danger"
          onClick={() => handleDelete(activity)} 
          tooltip="Eliminar"
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    );
  };

  const dialogFooter = (
    <div className="flex justify-end gap-2 pt-4 border-t">
      <Button 
        label="Cancelar" 
        icon={<Icon icon="mdi:close" />}
        className="p-button-text p-button-secondary"
        onClick={() => setShowDialog(false)} 
      />
      <Button 
        label={editingActivity ? 'Actualizar' : 'Crear Actividad'} 
        icon={<Icon icon="mdi:check" />}
        className="p-button-primary"
        onClick={handleSave} 
      />
    </div>
  );

  const getSelectedUsersDisplay = () => {
    if (!formData.authorizedUserIds || formData.authorizedUserIds.length === 0) {
      return null;
    }

    const selectedUsers = users.filter(u => formData.authorizedUserIds.includes(u.id));
    
    return (
      <Card className="bg-blue-50 border border-blue-200 mt-3">
        <div className="flex items-center gap-2 mb-3">
          <Icon icon="mdi:account-group" className="text-blue-600 text-xl" />
          <h4 className="font-semibold text-blue-900">
            Usuarios Autorizados ({selectedUsers.length})
          </h4>
        </div>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {selectedUsers.map(user => (
            <div 
              key={user.id}
              className="flex items-center gap-2 bg-white p-2 rounded border border-blue-200"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  return (
    <div className="p-6">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1 flex items-center gap-2">
              <Icon icon="mdi:clipboard-list" className="text-indigo-600" />
              Gestión de Actividades
            </h1>
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <Icon icon="mdi:information-outline" className="text-xs" />
              Administra las actividades predefinidas para los planes de trabajo
            </p>
          </div>
          <Button 
            label="Nueva Actividad" 
            icon={<Icon icon="mdi:plus" />}
            className="p-button-success"
            onClick={() => handleOpenDialog()} 
          />
        </div>
      </div>

      <Card>
        <DataTable 
          value={activities} 
          loading={loading} 
          stripedRows 
          showGridlines 
          emptyMessage="No hay actividades registradas"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
        >
          <Column 
            field="activityName" 
            header="Nombre de Actividad" 
            sortable 
            style={{ minWidth: '200px' }}
          />
          <Column 
            field="description" 
            header="Descripción" 
            style={{ minWidth: '250px' }}
            body={(rowData) => (
              <span className="text-sm text-gray-600">
                {rowData.description || <span className="italic text-gray-400">Sin descripción</span>}
              </span>
            )}
          />
          <Column 
            header="Tiempo" 
            body={timeTemplate} 
            sortable
            style={{ minWidth: '120px' }}
          />
          <Column 
            header="Tipo" 
            body={typeTemplate}
            style={{ minWidth: '100px' }}
          />
          <Column 
            header="Horario" 
            body={scheduleTemplate}
            style={{ minWidth: '180px' }}
          />
          <Column 
            header="Usuarios Autorizados" 
            body={usersTemplate}
            style={{ minWidth: '180px' }}
          />
          <Column 
            header="Acciones" 
            body={actionsTemplate} 
            style={{ width: '120px' }}
          />
        </DataTable>
      </Card>

      <Dialog
        header={
          <div className="flex items-center gap-2">
            <Icon 
              icon={editingActivity ? 'mdi:pencil' : 'mdi:plus-circle'} 
              className="text-2xl text-indigo-600" 
            />
            <span>{editingActivity ? 'Editar Actividad' : 'Nueva Actividad'}</span>
          </div>
        }
        visible={showDialog}
        style={{ width: '800px' }}
        onHide={() => setShowDialog(false)}
        footer={dialogFooter}
        className="p-fluid"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Icon icon="mdi:form-textbox" className="mr-1" />
                Nombre de la Actividad *
              </label>
              <InputText
                value={formData.activityName}
                onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
                placeholder="Ej: Instalación de Switch de Red"
                className="w-full"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Icon icon="mdi:text" className="mr-1" />
                Descripción
              </label>
              <InputTextarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Describe brevemente la actividad..."
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Icon icon="mdi:clock-outline" className="mr-1" />
                Tiempo Estimado *
              </label>
              <InputNumber
                value={formData.estimatedTimePerTask}
                onValueChange={(e) => setFormData({ ...formData, estimatedTimePerTask: e.value || 60 })}
                min={1}
                suffix=" minutos"
                className="w-full"
              />
            </div>

            <div className="flex flex-col justify-end">
              <div className="bg-indigo-50 p-3 rounded border border-indigo-200">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.isRepetitive}
                    onChange={(e) => setFormData({ ...formData, isRepetitive: e.checked || false })}
                    inputId="repetitive"
                  />
                  <label htmlFor="repetitive" className="cursor-pointer font-medium text-indigo-900">
                    <Icon icon="mdi:repeat" className="mr-1" />
                    Actividad Repetitiva
                  </label>
                </div>
              </div>
            </div>

            {formData.isRepetitive && (
              <div className="col-span-2">
                <Card className="bg-green-50 border border-green-200">
                  <label className="block text-sm font-semibold text-green-900 mb-2">
                    <Icon icon="mdi:counter" className="mr-1" />
                    Repeticiones por Defecto
                  </label>
                  <InputNumber
                    value={formData.defaultRepetitions}
                    onValueChange={(e) => setFormData({ ...formData, defaultRepetitions: e.value || 1 })}
                    min={1}
                    max={50}
                    showButtons
                    buttonLayout="horizontal"
                    incrementButtonIcon={<Icon icon="mdi:plus" />}
                    decrementButtonIcon={<Icon icon="mdi:minus" />}
                    className="w-full"
                  />
                  <small className="text-green-700 mt-2 block">
                    <Icon icon="mdi:information" className="mr-1" />
                    Número de veces que se debe realizar esta actividad
                  </small>
                </Card>
              </div>
            )}
          </div>

          <Divider />

          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <Checkbox
                checked={formData?.hasCustomSchedule ?? false}
                onChange={(e) => {
                  const checked = e.checked || false;
                  setFormData({ 
                    ...formData, 
                    hasCustomSchedule: checked,
                    customTimeSlots: checked ? (formData.customTimeSlots?.length > 0 ? formData.customTimeSlots : [{ start: '09:00', end: '17:00' }]) : []
                  });
                }}
                inputId="customSchedule"
              />
              <label htmlFor="customSchedule" className="cursor-pointer font-semibold text-amber-900">
                <Icon icon="mdi:calendar-clock" className="mr-1 text-lg" />
                Horario Personalizado
              </label>
            </div>
            <p className="text-sm text-amber-800 mb-3">
              Define franjas horarias específicas en las que esta actividad puede realizarse
            </p>

            {formData.hasCustomSchedule && (
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border border-amber-300">
                  {(formData.customTimeSlots || []).map((slot, index) => (
                    <div key={index} className="flex gap-3 items-center mb-2 last:mb-0">
                      <div className="flex items-center gap-2 flex-1">
                        <Icon icon="mdi:clock-start" className="text-amber-600" />
                        <InputText 
                          type="time" 
                          value={slot.start} 
                          onChange={(e) => handleTimeSlotChange(index, 'start', e.target.value)} 
                          className="flex-1" 
                        />
                      </div>
                      <Icon icon="mdi:arrow-right" className="text-gray-400" />
                      <div className="flex items-center gap-2 flex-1">
                        <Icon icon="mdi:clock-end" className="text-amber-600" />
                        <InputText 
                          type="time" 
                          value={slot.end} 
                          onChange={(e) => handleTimeSlotChange(index, 'end', e.target.value)} 
                          className="flex-1" 
                        />
                      </div>
                      <Button 
                        icon={<Icon icon="mdi:delete" />}
                        className="p-button-rounded p-button-text p-button-danger"
                        onClick={() => handleRemoveTimeSlot(index)}
                        disabled={(formData.customTimeSlots || []).length === 1}
                        tooltip="Eliminar franja"
                      />
                    </div>
                  ))}
                </div>
                
                <Button
                  label="Agregar Franja Horaria"
                  icon={<Icon icon="mdi:clock-plus" />}
                  className="p-button-outlined p-button-warning w-full"
                  size="small"
                  onClick={handleAddTimeSlot}
                />
                <div className="bg-amber-100 rounded p-2 border border-amber-300">
                  <p className="text-xs text-amber-900 flex items-start gap-2">
                    <Icon icon="mdi:lightbulb-on" className="text-base mt-0.5 flex-shrink-0" />
                    <span>Esta actividad solo podrá planificarse dentro de las franjas horarias definidas</span>
                  </p>
                </div>
              </div>
            )}
          </Card>

          <Divider />

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Icon icon="mdi:account-group" className="mr-1" />
              Usuarios Autorizados
            </label>
            <MultiSelect
              value={formData.authorizedUserIds}
              options={users}
              onChange={(e) => setFormData({ ...formData, authorizedUserIds: e.value })}
              optionLabel="fullName"
              optionValue="id"
              placeholder="Selecciona los usuarios que pueden realizar esta actividad"
              filter
              showSelectAll
              className="w-full"
              itemTemplate={(option) => (
                <div className="flex items-center gap-2 p-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                    {option.firstName[0]}{option.lastName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{option.fullName}</p>
                    <p className="text-xs text-gray-500">{option.email}</p>
                  </div>
                </div>
              )}
            />
            <small className="text-gray-500 mt-2 block">
              <Icon icon="mdi:information" className="mr-1" />
              Si no seleccionas ningún usuario, todos podrán ser asignados a esta actividad
            </small>

            {getSelectedUsersDisplay()}
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default ActivitiesManagement;