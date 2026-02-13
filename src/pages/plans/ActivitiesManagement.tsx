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
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Tag } from 'primereact/tag';
import { Chip } from 'primereact/chip';
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
      return <span className="text-gray-400 text-xs italic">Todos los usuarios</span>;
    }

    const displayLimit = 3;
    const visibleUsers = activity.authorizedUsers.slice(0, displayLimit);
    const remainingCount = activity.authorizedUsers.length - displayLimit;

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center -space-x-2">
          {visibleUsers.map((u) => (
            <div
              key={u.id}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold border-2 border-white shadow-sm"
              title={`${u.firstName} ${u.lastName}`}
            >
              {u.firstName[0]}{u.lastName[0]}
            </div>
          ))}
        </div>
        {remainingCount > 0 && (
          <Tag value={`+${remainingCount}`} className="text-xs px-2 py-1 bg-blue-100 text-blue-700" />
        )}
      </div>
    );
  };

  const typeTemplate = (activity: Activity) => {
    return activity.isRepetitive ? (
      <div className="flex items-center gap-1.5">
        <Icon icon="mdi:repeat" className="text-green-600 text-base" />
        <span className="text-xs font-medium text-green-700">
          {activity.defaultRepetitions}x
        </span>
      </div>
    ) : (
      <div className="flex items-center gap-1.5">
        <Icon icon="mdi:numeric-1-circle" className="text-blue-600 text-base" />
        <span className="text-xs font-medium text-blue-700">Única</span>
      </div>
    );
  };

  const timeTemplate = (activity: Activity) => {
    return (
      <div className="flex items-center gap-1.5">
        <Icon icon="mdi:clock-outline" className="text-gray-500 text-base" />
        <span className="text-xs font-medium text-gray-700">{activity.estimatedTimePerTask} min</span>
      </div>
    );
  };

  const scheduleTemplate = (activity: Activity) => {
    if (!activity.hasCustomSchedule) {
      return (
        <div className="flex items-center gap-1.5">
          <Icon icon="mdi:calendar-clock" className="text-gray-400 text-base" />
          <span className="text-xs text-gray-600">Estándar</span>
        </div>
      );
    }
    return (
      <div className="flex flex-wrap gap-1">
        {activity.customTimeSlots?.slice(0, 2).map((slot, i) => (
          <Tag
            key={i}
            value={`${slot.start} - ${slot.end}`}
            className="text-xs px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200"
          />
        ))}
        {activity.customTimeSlots && activity.customTimeSlots.length > 2 && (
          <Tag value={`+${activity.customTimeSlots.length - 2}`} className="text-xs px-2 py-1 bg-amber-100 text-amber-700" />
        )}
      </div>
    );
  };

  const actionsTemplate = (activity: Activity) => {
    return (
      <div className="flex gap-2">
        <Button 
          icon={<Icon icon="mdi:pencil" className="text-base" />}
          className="!border-none !outline-none p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
          style={{ boxShadow: 'none' }}
          text
          onClick={() => handleOpenDialog(activity)} 
        />
        <Button 
          icon={<Icon icon="mdi:delete" className="text-base" />}
          className="!border-none !outline-none p-2 text-red-600 hover:bg-red-50 rounded-lg"
          style={{ boxShadow: 'none' }}
          text
          onClick={() => handleDelete(activity)} 
        />
      </div>
    );
  };

  const getSelectedUsersDisplay = () => {
    if (!formData.authorizedUserIds || formData.authorizedUserIds.length === 0) {
      return null;
    }

    const selectedUsers = users.filter(u => formData.authorizedUserIds.includes(u.id));
    
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mt-3">
        <div className="flex items-center gap-2 mb-3">
          <Icon icon="mdi:account-group" className="text-gray-500 text-lg" />
          <h4 className="text-sm font-semibold text-gray-700">
            Usuarios Seleccionados ({selectedUsers.length})
          </h4>
        </div>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {selectedUsers.map(user => (
            <div 
              key={user.id}
              className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Header Section */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-900">Gestión de Actividades</h1>
        <p className="text-lg text-gray-500 -mt-5">Administra las actividades predefinidas para los planes de trabajo</p>
      </div>

      {/* Toolbar */}
      <div className="pb-5 border-b border-gray-200 bg-gray-50">
        <Button 
          label="Nueva Actividad" 
          icon={<Icon icon="mdi:plus" className="text-lg" />}
          className="!border-none !outline-none bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium"
          style={{ boxShadow: 'none' }}
          onClick={() => handleOpenDialog()} 
        />
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <DataTable 
          value={activities} 
          loading={loading} 
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          className="text-sm custom-datatable"
          emptyMessage="No hay actividades registradas"
          stripedRows
        >
          <Column 
            field="activityName" 
            header="Actividad" 
            sortable 
            className="font-medium text-gray-900"
            style={{ minWidth: '200px' }}
          />
          <Column 
            field="description" 
            header="Descripción" 
            className="text-gray-600"
            style={{ minWidth: '250px' }}
            body={(rowData) => (
              <span className="text-xs text-gray-600">
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
            className="text-center"
            style={{ width: '120px' }}
          />
        </DataTable>
      </div>

      {/* Dialog */}
      <Dialog
        visible={showDialog}
        style={{ width: '700px' }}
        header={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon icon={editingActivity ? "mdi:pencil" : "mdi:plus-circle"} className="text-blue-700 text-xl" />
            </div>
            <div className="leading-tight">
              <h2 className="text-lg font-semibold text-gray-900 mb-0">
                {editingActivity ? 'Editar Actividad' : 'Nueva Actividad'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {editingActivity ? 'Modifique la información de la actividad' : 'Complete los datos de la nueva actividad'}
              </p>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={() => setShowDialog(false)}
      >
        <div className="space-y-4 mt-4">
          {/* Información Básica */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Icon icon="mdi:information-outline" className="text-gray-500" />
              Información Básica
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Nombre de la Actividad *</label>
                <InputText
                  value={formData.activityName}
                  onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
                  placeholder="Ej: Instalación de Switch de Red"
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Descripción</label>
                <InputTextarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Describe brevemente la actividad..."
                  className="text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Tiempo Estimado (min) *</label>
                  <InputNumber
                    value={formData.estimatedTimePerTask}
                    onValueChange={(e) => setFormData({ ...formData, estimatedTimePerTask: e.value || 60 })}
                    min={1}
                    className="text-sm"
                  />
                </div>

                <div className="flex items-end">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 w-full">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.isRepetitive}
                        onChange={(e) => setFormData({ ...formData, isRepetitive: e.checked || false })}
                        inputId="repetitive"
                      />
                      <label htmlFor="repetitive" className="cursor-pointer text-xs font-medium text-blue-900">
                        <Icon icon="mdi:repeat" className="mr-1" />
                        Actividad Repetitiva
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {formData.isRepetitive && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <label className="block text-xs font-medium text-green-900 mb-1.5">
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
                    className="text-sm"
                  />
                  <small className="text-xs text-green-700 mt-1.5 block">
                    <Icon icon="mdi:information" className="mr-1" />
                    Número de veces que se debe realizar esta actividad
                  </small>
                </div>
              )}
            </div>
          </div>

          {/* Horario Personalizado */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
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
              <label htmlFor="customSchedule" className="cursor-pointer text-sm font-semibold text-gray-700">
                <Icon icon="mdi:calendar-clock" className="mr-1 text-base" />
                Horario Personalizado
              </label>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Define franjas horarias específicas en las que esta actividad puede realizarse
            </p>

            {formData.hasCustomSchedule && (
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  {(formData.customTimeSlots || []).map((slot, index) => (
                    <div key={index} className="flex gap-3 items-center mb-2 last:mb-0">
                      <div className="flex items-center gap-2 flex-1">
                        <Icon icon="mdi:clock-start" className="text-amber-600" />
                        <InputText 
                          type="time" 
                          value={slot.start} 
                          onChange={(e) => handleTimeSlotChange(index, 'start', e.target.value)} 
                          className="flex-1 text-sm" 
                        />
                      </div>
                      <Icon icon="mdi:arrow-right" className="text-gray-400" />
                      <div className="flex items-center gap-2 flex-1">
                        <Icon icon="mdi:clock-end" className="text-amber-600" />
                        <InputText 
                          type="time" 
                          value={slot.end} 
                          onChange={(e) => handleTimeSlotChange(index, 'end', e.target.value)} 
                          className="flex-1 text-sm" 
                        />
                      </div>
                      <Button 
                        icon={<Icon icon="mdi:delete" className="text-base" />}
                        className="!border-none !outline-none p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        style={{ boxShadow: 'none' }}
                        text
                        onClick={() => handleRemoveTimeSlot(index)}
                        disabled={(formData.customTimeSlots || []).length === 1}
                      />
                    </div>
                  ))}
                </div>
                
                <Button
                  label="Agregar Franja Horaria"
                  icon={<Icon icon="mdi:clock-plus" className="text-base" />}
                  className="!border-none !outline-none text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg text-sm w-full border border-amber-200"
                  style={{ boxShadow: 'none' }}
                  onClick={handleAddTimeSlot}
                />
                <div className="bg-amber-50 rounded-lg p-2 border border-amber-200">
                  <p className="text-xs text-amber-800 flex items-start gap-2">
                    <Icon icon="mdi:lightbulb-on" className="text-base mt-0.5 flex-shrink-0" />
                    <span>Esta actividad solo podrá planificarse dentro de las franjas horarias definidas</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Usuarios Autorizados */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Icon icon="mdi:shield-account" className="text-gray-500" />
              Autorización de Usuarios
            </h3>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Usuarios Autorizados</label>
              <MultiSelect
                value={formData.authorizedUserIds}
                options={users}
                onChange={(e) => setFormData({ ...formData, authorizedUserIds: e.value })}
                optionLabel="fullName"
                optionValue="id"
                placeholder="Selecciona los usuarios que pueden realizar esta actividad"
                filter
                display="chip"
                className="w-full text-sm"
                itemTemplate={(option) => (
                  <div className="flex items-center gap-2 p-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                      {option.firstName[0]}{option.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{option.fullName}</p>
                      <p className="text-xs text-gray-500">{option.email}</p>
                    </div>
                  </div>
                )}
              />
              <small className="text-xs text-gray-500 mt-1.5 block">
                <Icon icon="mdi:information" className="mr-1" />
                Si no seleccionas ningún usuario, todos podrán ser asignados a esta actividad
              </small>

              {getSelectedUsersDisplay()}
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
            onClick={() => setShowDialog(false)} 
          />
          <Button 
            label={editingActivity ? 'Actualizar' : 'Crear Actividad'} 
            icon={<Icon icon="mdi:check" className="text-base mr-2" />}
            className="!border-none !outline-none bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
            style={{ boxShadow: 'none' }}
            onClick={handleSave} 
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

export default ActivitiesManagement;