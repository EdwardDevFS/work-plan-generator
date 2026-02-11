import React, { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';
import { SelectButton } from 'primereact/selectbutton';
import { MultiSelect } from 'primereact/multiselect';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { Icon } from '@iconify/react';
import { Badge } from 'primereact/badge';
import { Divider } from 'primereact/divider';
import { Chip } from 'primereact/chip';
import { v4 as uuidv4 } from 'uuid';
import { WorkPlanFormData, StoreActivity, AssignmentMode, Activity, WorkTimeSlot } from '../../types/workplan.types';
import { Store } from '../../types/store.types';
import { activitiesApi } from '../../services/activities.service';
import { Message } from 'primereact/message';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { usersService } from '../../services/users.service';
import { User } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  formData: WorkPlanFormData;
  updateFormData: (data: Partial<WorkPlanFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Interface temporal para el formulario que combina campos de Activity y StoreActivity
interface ActivityFormData {
  activityName: string;
  description: string;
  estimatedTimePerTask: number;
  isRepetitive: boolean;
  repetitions: number;
  supervisor?: User;
  assignmentMode: AssignmentMode;
  assignedUsers: User[];
  hasCustomSchedule: boolean;
  customTimeSlots: WorkTimeSlot[];
  authorizedUserIds: string[];
}

const StoreActivitiesStep: React.FC<Props> = ({ formData, updateFormData, onNext, onBack }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [editingActivity, setEditingActivity] = useState<StoreActivity | null>(null);
  const [formState, setFormState] = useState<ActivityFormData>({
    activityName: '',
    description: '',
    estimatedTimePerTask: 60,
    isRepetitive: false,
    repetitions: 1,
    assignmentMode: AssignmentMode.AUTOMATIC,
    assignedUsers: [],
    hasCustomSchedule: false,
    customTimeSlots: [],
    authorizedUserIds: [],
  });
  const { user } = useAuth();

  const modeOptions = [
    { label: 'Automático', value: AssignmentMode.AUTOMATIC, icon: 'mdi:lightning-bolt' },
    { label: 'Manual', value: AssignmentMode.MANUAL, icon: 'mdi:account-multiple' },
  ];

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const data = await activitiesApi.list();
      setActivities(data);
      
      const res = await usersService.getAll({ tenantId: user?.tenantId, limit: 1000, page: 1 });
      const usersWithFullName = res.data.data.map(u => ({
        ...u,
        fullName: `${u.firstName} ${u.lastName}`,
      }));
      setUsers(usersWithFullName);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const getStoreActivities = (storeId: string) => {
    return formData.storeActivities.filter(a => a.store.id === storeId);
  };

  const allStoresHaveActivities = () => {
    return formData.selectedStores.every(store => 
      getStoreActivities(store.id).length > 0
    );
  };

  const getStoresWithoutActivities = () => {
    return formData.selectedStores.filter(store => 
      getStoreActivities(store.id).length === 0
    );
  };

  const handleLoadFromTemplate = (activity: Activity | null) => {
    if (!activity) {
      setFormState({
        activityName: '',
        description: '',
        estimatedTimePerTask: 60,
        isRepetitive: false,
        repetitions: 1,
        assignmentMode: AssignmentMode.AUTOMATIC,
        assignedUsers: [],
        hasCustomSchedule: false,
        customTimeSlots: [],
        authorizedUserIds: [],
      });
      return;
    }
    
    setFormState({
      ...formState,
      activityName: activity.activityName,
      description: activity.description || '',
      estimatedTimePerTask: activity.estimatedTimePerTask,
      isRepetitive: activity.isRepetitive,
      repetitions: activity.isRepetitive ? activity.defaultRepetitions : 1,
      hasCustomSchedule: activity.hasCustomSchedule || false,
      customTimeSlots: activity.customTimeSlots?.map(slot => ({
        id: uuidv4(),
        start: slot.start,
        end: slot.end
      })) || [],
      authorizedUserIds: activity.authorizedUsers?.map(u => u.id) || [],
    });
  };

  const handleAddActivity = (store: Store) => {
    setCurrentStore(store);
    setEditingActivity(null);
    setFormState({
      activityName: '',
      description: '',
      estimatedTimePerTask: 60,
      isRepetitive: false,
      repetitions: 1,
      assignmentMode: AssignmentMode.AUTOMATIC,
      assignedUsers: [],
      hasCustomSchedule: false,
      customTimeSlots: [],
      authorizedUserIds: [],
    });
    setShowDialog(true);
  };

  const handleEditActivity = (activity: StoreActivity) => {
    setCurrentStore(activity.store);
    setEditingActivity(activity);
    
    // Convertir StoreActivity a ActivityFormData para edición
    // Extraer los campos del activity anidado
    const activityData = activity.activity;
    
    setFormState({
      activityName: activityData.activityName,
      description: activityData.description || '',
      estimatedTimePerTask: activityData.estimatedTimePerTask,
      isRepetitive: activityData.isRepetitive,
      repetitions: activity.repetitions,
      supervisor: activity.supervisor,
      assignmentMode: activity.assignmentMode,
      assignedUsers: activity.assignedUsers,
      hasCustomSchedule: activity.hasCustomSchedule,
      customTimeSlots: activity.customTimeSlots,
      authorizedUserIds: activityData.authorizedUserIds || [],
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!formState.activityName?.trim()) return alert('Ingresa el nombre de la actividad');
    if (!formState.estimatedTimePerTask || formState.estimatedTimePerTask <= 0) {
      return alert('Ingresa un tiempo estimado válido');
    }
    if (formState.assignmentMode === AssignmentMode.MANUAL && !formState.assignedUsers?.length) {
      return alert('Asigna usuarios en modo manual');
    }

    // Crear el objeto Activity que irá dentro de StoreActivity
    const activityObject: Activity = {
      activityName: formState.activityName,
      description: formState.description,
      estimatedTimePerTask: formState.estimatedTimePerTask,
      isRepetitive: formState.isRepetitive,
      defaultRepetitions: formState.repetitions,
      hasCustomSchedule: formState.hasCustomSchedule,
      customTimeSlots: formState.hasCustomSchedule ? formState.customTimeSlots.map(slot => ({
        start: slot.start,
        end: slot.end
      })) : [],
      authorizedUserIds: formState.authorizedUserIds,
    };

    // Crear el StoreActivity completo que se enviará al backend
    const storeActivity: StoreActivity = {
      id: editingActivity?.id || uuidv4(),
      store: currentStore!,
      activity: activityObject,
      supervisor: formState.supervisor,
      repetitions: formState.repetitions,
      assignmentMode: formState.assignmentMode,
      assignedUsers: formState.assignedUsers,
      hasCustomSchedule: formState.hasCustomSchedule,
      customTimeSlots: formState.hasCustomSchedule ? formState.customTimeSlots : [],
    };

    updateFormData({
      storeActivities: editingActivity
        ? formData.storeActivities.map(a => a.id === editingActivity.id ? storeActivity : a)
        : [...formData.storeActivities, storeActivity]
    });
    setShowDialog(false);
  };

  const addTimeSlot = () => {
    setFormState({
      ...formState,
      customTimeSlots: [
        ...formState.customTimeSlots,
        { id: uuidv4(), start: '08:00', end: '17:00' }
      ]
    });
  };

  const removeTimeSlot = (id: string) => {
    if (formState.customTimeSlots.length <= 1) {
      return alert('Debe haber al menos una franja horaria');
    }
    setFormState({
      ...formState,
      customTimeSlots: formState.customTimeSlots.filter(s => s.id !== id)
    });
  };

  const updateTimeSlot = (id: string, field: 'start' | 'end', value: string) => {
    setFormState({
      ...formState,
      customTimeSlots: formState.customTimeSlots.map(s =>
        s.id === id ? { ...s, [field]: value } : s
      )
    });
  };

  const handleDeleteActivity = (id: string) => {
    if (confirm('¿Eliminar actividad?')) {
      updateFormData({
        storeActivities: formData.storeActivities.filter(a => a.id !== id)
      });
    }
  };

  const handleNext = () => {
    if (!allStoresHaveActivities()) {
      const storesWithout = getStoresWithoutActivities();
      alert(`Las siguientes Locales necesitan al menos 1 actividad:\n${storesWithout.map(s => s.name).join('\n')}`);
      return;
    }
    onNext();
  };

  const totalActivities = formData.storeActivities.length;
  const storesWithActivities = formData.selectedStores.filter(s => getStoreActivities(s.id).length > 0).length;
  const totalTime = formData.storeActivities.reduce((sum, a) => 
    sum + (a.activity.estimatedTimePerTask * a.repetitions), 0
  );

  const getSelectedUsersDisplay = () => {
    if (!formState.authorizedUserIds || formState.authorizedUserIds.length === 0) {
      return null;
    }

    const selectedUsers = users.filter(u => formState.authorizedUserIds?.includes(u.id));
    
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
    <div className="space-y-6 pb-8">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Icon icon="mdi:clipboard-list" className="text-indigo-600" />
            Actividades por Local
          </h3>
          <p className="text-gray-600">
            Configura las tareas que se realizarán en cada local seleccionado
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
              <Icon icon="mdi:format-list-checks" className="text-3xl text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-700 font-medium">Total Actividades</p>
              <p className="text-3xl font-bold text-blue-900">{totalActivities}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
              <Icon icon="mdi:store-check" className="text-3xl text-white" />
            </div>
            <div>
              <p className="text-sm text-green-700 font-medium">Locales Configurados</p>
              <p className="text-3xl font-bold text-green-900">
                {storesWithActivities} / {formData.selectedStores.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center shadow-md">
              <Icon icon="mdi:clock-fast" className="text-3xl text-white" />
            </div>
            <div>
              <p className="text-sm text-purple-700 font-medium">Tiempo Total</p>
              <p className="text-3xl font-bold text-purple-900">
                {Math.floor(totalTime / 60)}h {totalTime % 60}m
              </p>
            </div>
          </div>
        </Card>
      </div>

      {!allStoresHaveActivities() && (
        <Message
          severity="warn"
          className="w-full"
          content={
            <div className="flex items-center gap-3">
              <Icon icon="mdi:alert" className="text-xl" />
              <div>
                <p className="font-semibold">Configuración incompleta</p>
                <p className="text-sm mt-1">
                  {getStoresWithoutActivities().length} local(es) necesitan al menos 1 actividad
                </p>
              </div>
            </div>
          }
        />
      )}

      <Card className="shadow-sm">
        <Accordion multiple activeIndex={[0]}>
          {formData.selectedStores.map((store) => {
            const storeActivities = getStoreActivities(store.id);
            const hasActivities = storeActivities.length > 0;

            return (
              <AccordionTab
                key={store.id}
                header={
                  <div className="flex justify-between items-center w-full pr-6">
                    <div className="flex items-center gap-4">
                      <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center shadow-sm
                        ${hasActivities ? 'bg-green-100' : 'bg-orange-100'}
                      `}>
                        <Icon 
                          icon="mdi:store-marker" 
                          className={`text-2xl ${hasActivities ? 'text-green-600' : 'text-orange-600'}`}
                        />
                      </div>
                      <div>
                        <p className="font-bold text-lg text-gray-900">{store.name}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Icon icon="mdi:map-marker" className="text-xs" />
                          {store.address}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {hasActivities ? (
                        <Badge 
                          value={`${storeActivities.length} actividad${storeActivities.length > 1 ? 'es' : ''}`}
                          severity="success"
                        />
                      ) : (
                        <Badge 
                          value="Sin actividades" 
                          severity="danger"
                        />
                      )}
                    </div>
                  </div>
                }
              >
                <div className="pt-4 space-y-4">
                  {storeActivities.length === 0 ? (
                    <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-12 text-center border-2 border-orange-200">
                      <Icon icon="mdi:alert-circle-outline" className="text-7xl text-orange-500 mb-4" />
                      <h4 className="text-2xl font-bold text-orange-900 mb-2">
                        Este local necesita actividades
                      </h4>
                      <p className="text-orange-700 mb-6 max-w-md mx-auto">
                        Agrega al menos una actividad para continuar con la configuración del plan de trabajo
                      </p>
                      <Button
                        label="Agregar Primera Actividad"
                        icon={<Icon icon="mdi:plus-circle" />}
                        onClick={() => handleAddActivity(store)}
                        className="p-button-warning p-button-lg"
                      />
                    </div>
                  ) : (
                    <>
                      <DataTable 
                        value={storeActivities} 
                        className="border rounded-lg overflow-hidden"
                        stripedRows
                        showGridlines
                      >
                        <Column 
                          field="activity.activityName" 
                          header="Actividad"
                          style={{ minWidth: '250px' }}
                          body={(r) => (
                            <div>
                              <div className="font-semibold text-gray-900 mb-1">
                                {r.activity.activityName}
                              </div>
                              {r.activity.description && (
                                <div className="text-xs text-gray-500 line-clamp-2">
                                  {r.activity.description}
                                </div>
                              )}
                            </div>
                          )}
                        />
                        <Column
                          header="Tipo"
                          style={{ width: '120px' }}
                          body={(r) => (
                            r.activity.isRepetitive ? (
                              <div className="flex items-center gap-2">
                                <Icon icon="mdi:repeat" className="text-green-600" />
                                <span className="text-sm font-medium text-green-700">
                                  {r.repetitions}x
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Icon icon="mdi:numeric-1-circle" className="text-blue-600" />
                                <span className="text-sm font-medium text-blue-700">Única</span>
                              </div>
                            )
                          )}
                        />
                        <Column
                          header="Tiempo Total"
                          style={{ width: '140px' }}
                          body={(r) => (
                            <div className="flex items-center gap-2">
                              <Icon icon="mdi:clock-outline" className="text-gray-500" />
                              <span className="font-semibold">
                                {r.activity.estimatedTimePerTask * r.repetitions} min
                              </span>
                            </div>
                          )}
                        />
                        <Column
                          header="Horario"
                          style={{ width: '140px' }}
                          body={(r) => r.hasCustomSchedule ? (
                            <Chip
                              label="Personalizado"
                              icon={<Icon icon="mdi:clock-time-four" className="mr-1" />}
                              className="bg-amber-100 text-amber-800 border border-amber-300 text-xs"
                            />
                          ) : (
                            <Chip
                              label="General"
                              icon={<Icon icon="mdi:calendar-clock" className="mr-1" />}
                              className="bg-gray-100 text-gray-700 border border-gray-300 text-xs"
                            />
                          )}
                        />
                        <Column
                          header="Asignación"
                          style={{ width: '140px' }}
                          body={(r) => r.assignmentMode === AssignmentMode.AUTOMATIC ? (
                            <Chip
                              label="Automático"
                              icon={<Icon icon="mdi:lightning-bolt" className="mr-1" />}
                              className="bg-green-100 text-green-800 border border-green-300 text-xs"
                            />
                          ) : (
                            <Chip
                              label="Manual"
                              icon={<Icon icon="mdi:account-multiple" className="mr-1" />}
                              className="bg-blue-100 text-blue-800 border border-blue-300 text-xs"
                            />
                          )}
                        />
                        <Column
                          header="Acciones"
                          style={{ width: '120px' }}
                          body={(r) => (
                            <div className="flex gap-2 justify-end">
                              <Button 
                                icon={<Icon icon="mdi:pencil" />}
                                className="p-button-rounded p-button-text p-button-warning"
                                onClick={() => handleEditActivity(r)}
                                tooltip="Editar"
                                tooltipOptions={{ position: 'top' }}
                              />
                              <Button 
                                icon={<Icon icon="mdi:delete" />}
                                className="p-button-rounded p-button-text p-button-danger"
                                onClick={() => handleDeleteActivity(r.id)}
                                tooltip="Eliminar"
                                tooltipOptions={{ position: 'top' }}
                              />
                            </div>
                          )}
                        />
                      </DataTable>
                      <div className="flex justify-end pt-2">
                        <Button
                          label="Agregar Otra Actividad"
                          icon={<Icon icon="mdi:plus" />}
                          onClick={() => handleAddActivity(store)}
                          className="p-button-outlined p-button-sm"
                        />
                      </div>
                    </>
                  )}
                </div>
              </AccordionTab>
            );
          })}
        </Accordion>
      </Card>

      <Dialog
        header={
          <div className="flex items-center gap-3">
            <Icon 
              icon={editingActivity ? 'mdi:pencil-box' : 'mdi:plus-box'} 
              className="text-2xl text-indigo-600" 
            />
            <span>{editingActivity ? 'Editar Actividad' : `Nueva Actividad - ${currentStore?.name}`}</span>
          </div>
        }
        visible={showDialog}
        style={{ width: '900px', maxWidth: '95vw' }}
        onHide={() => setShowDialog(false)}
        modal
        className="p-fluid"
      >
        <div className="space-y-5 pt-4">
          <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200">
            <div className="flex items-start gap-3 mb-4">
              <Icon icon="mdi:template" className="text-indigo-600 text-2xl mt-1" />
              <div className="flex-1">
                <label className="block text-sm font-semibold text-indigo-900 mb-2">
                  Cargar desde Plantilla (Opcional)
                </label>
                <Dropdown
                  value={null}
                  options={activities}
                  onChange={(e) => handleLoadFromTemplate(e.value)}
                  optionLabel="activityName"
                  placeholder="Selecciona una actividad predefinida como base"
                  className="w-full"
                  showClear
                  filter
                  itemTemplate={(option) => (
                    <div className="p-2">
                      <div className="font-semibold">{option.activityName}</div>
                      <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                      <div className="flex gap-2 mt-2">
                        <Tag value={`${option.estimatedTimePerTask} min`} severity="info" className="text-xs" />
                        {option.isRepetitive && (
                          <Tag value={`Repetitiva ${option.defaultRepetitions}x`} severity="success" className="text-xs" />
                        )}
                      </div>
                    </div>
                  )}
                />
                <small className="text-indigo-700 mt-2 block">
                  <Icon icon="mdi:information" className="mr-1" />
                  Al seleccionar una plantilla, se autocompletarán los campos, pero puedes editarlos libremente
                </small>
              </div>
            </div>
          </Card>

          <Divider />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Icon icon="mdi:text-box" className="mr-1" />
                Nombre de la Actividad *
              </label>
              <InputText
                value={formState.activityName}
                onChange={(e) => setFormState({ ...formState, activityName: e.target.value })}
                placeholder="Ej: Instalación de Switch de Red"
                className="w-full"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Icon icon="mdi:text" className="mr-1" />
                Descripción
              </label>
              <InputTextarea
                value={formState.description}
                onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                placeholder="Describe brevemente la actividad..."
                rows={3}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Icon icon="mdi:clock-outline" className="mr-1" />
                Tiempo Estimado *
              </label>
              <InputNumber
                value={formState.estimatedTimePerTask}
                onValueChange={(e) => setFormState({ ...formState, estimatedTimePerTask: e.value || 60 })}
                min={1}
                suffix=" minutos"
                className="w-full"
              />
            </div>

            <div className="flex flex-col justify-end">
              <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formState.isRepetitive}
                    onChange={(e) => setFormState({ ...formState, isRepetitive: e.checked || false })}
                    inputId="repetitive"
                  />
                  <label htmlFor="repetitive" className="cursor-pointer font-medium text-indigo-900">
                    <Icon icon="mdi:repeat" className="mr-1" />
                    Actividad Repetitiva
                  </label>
                </div>
              </div>
            </div>

            {formState.isRepetitive && (
              <div className="md:col-span-2">
                <Card className="bg-green-50 border border-green-200">
                  <label className="block text-sm font-semibold text-green-900 mb-2">
                    <Icon icon="mdi:counter" className="mr-1" />
                    Número de Repeticiones
                  </label>
                  <InputNumber
                    value={formState.repetitions}
                    onValueChange={(e) => setFormState({ ...formState, repetitions: e.value || 1 })}
                    min={1}
                    max={50}
                    showButtons
                    buttonLayout="horizontal"
                    incrementButtonIcon={<Icon icon="mdi:plus" />}
                    decrementButtonIcon={<Icon icon="mdi:minus" />}
                    className="w-full"
                  />
                  <small className="text-green-700 mt-2 block">
                    Tiempo total: {formState.estimatedTimePerTask * formState.repetitions} minutos
                  </small>
                </Card>
              </div>
            )}
          </div>

          <Divider />

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <Icon icon="mdi:account-cog" className="mr-1" />
              Modo de Asignación
            </label>
            <SelectButton
              value={formState.assignmentMode}
              options={modeOptions}
              onChange={(e) => setFormState({ ...formState, assignmentMode: e.value })}
              className="w-full"
              itemTemplate={(option) => (
                <div className="flex items-center gap-2 px-4">
                  <Icon icon={option.icon} />
                  <span>{option.label}</span>
                </div>
              )}
            />
            <small className="text-gray-600 mt-2 block">
              {formState.assignmentMode === AssignmentMode.AUTOMATIC 
                ? '⚡ El sistema asignará automáticamente los trabajadores disponibles'
                : '👤 Debes seleccionar manualmente los trabajadores que realizarán esta actividad'}
            </small>
          </div>

          {formState.assignmentMode === AssignmentMode.MANUAL && (
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
              <label className="block text-sm font-semibold text-purple-900 mb-3">
                <Icon icon="mdi:account-multiple-check" className="mr-1" />
                Trabajadores Asignados *
              </label>
              <MultiSelect
                value={formState.assignedUsers}
                options={users}
                onChange={(e) => setFormState({ ...formState, assignedUsers: e.value })}
                optionLabel="fullName"
                placeholder="Selecciona los trabajadores"
                display="chip"
                className="w-full"
                filter
                itemTemplate={(option) => (
                  <div className="flex items-center gap-2 p-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-xs font-semibold">
                      {option.firstName[0]}{option.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{option.fullName}</p>
                      <p className="text-xs text-gray-500">{option.email}</p>
                    </div>
                  </div>
                )}
              />
            </Card>
          )}

          <Divider />

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <Icon icon="mdi:account-lock" className="mr-1" />
              Restricción de Usuarios Autorizados
            </label>
            <MultiSelect
              value={formState.authorizedUserIds}
              options={users}
              onChange={(e) => setFormState({ ...formState, authorizedUserIds: e.value })}
              optionLabel="fullName"
              optionValue="id"
              placeholder="Selecciona usuarios autorizados (opcional)"
              display="chip"
              className="w-full"
              filter
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
            <small className="text-gray-600 mt-2 block">
              <Icon icon="mdi:information" className="mr-1" />
              Solo estos usuarios podrán ser asignados. Déjalo vacío para permitir cualquier usuario.
            </small>

            {getSelectedUsersDisplay()}
          </div>

          <Divider />

          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <Checkbox
                checked={formState.hasCustomSchedule}
                onChange={(e) => {
                  const checked = e.checked || false;
                  setFormState({ 
                    ...formState, 
                    hasCustomSchedule: checked,
                    customTimeSlots: checked ? (formState.customTimeSlots.length > 0 ? formState.customTimeSlots : [{ id: uuidv4(), start: '09:00', end: '17:00' }]) : []
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
              Define franjas horarias específicas para esta actividad
            </p>

            {formState.hasCustomSchedule && (
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border border-amber-300">
                  {formState.customTimeSlots.map((slot, index) => (
                    <div key={slot.id} className="flex gap-3 items-center mb-2 last:mb-0">
                      <div className="flex items-center gap-2 flex-1">
                        <Icon icon="mdi:clock-start" className="text-amber-600" />
                        <InputText 
                          type="time" 
                          value={slot.start} 
                          onChange={(e) => updateTimeSlot(slot.id, 'start', e.target.value)} 
                          className="flex-1" 
                        />
                      </div>
                      <Icon icon="mdi:arrow-right" className="text-gray-400" />
                      <div className="flex items-center gap-2 flex-1">
                        <Icon icon="mdi:clock-end" className="text-amber-600" />
                        <InputText 
                          type="time" 
                          value={slot.end} 
                          onChange={(e) => updateTimeSlot(slot.id, 'end', e.target.value)} 
                          className="flex-1" 
                        />
                      </div>
                      <Button 
                        icon={<Icon icon="mdi:delete" />}
                        className="p-button-rounded p-button-text p-button-danger"
                        onClick={() => removeTimeSlot(slot.id)}
                        disabled={formState.customTimeSlots.length === 1}
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
                  onClick={addTimeSlot}
                />
              </div>
            )}
          </Card>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button 
              label="Cancelar" 
              icon={<Icon icon="mdi:close" />}
              className="p-button-text p-button-secondary"
              onClick={() => setShowDialog(false)} 
            />
            <Button 
              label={editingActivity ? 'Actualizar Actividad' : 'Agregar Actividad'} 
              icon={<Icon icon="mdi:check" />}
              className="p-button-primary"
              onClick={handleSave}
            />
          </div>
        </div>
      </Dialog>

      <div className="flex justify-between pt-8 border-t border-gray-200">
        <Button 
          label="Paso Anterior" 
          icon={<Icon icon="mdi:arrow-left" />}
          onClick={onBack} 
          className="p-button-outlined p-button-secondary"
        />
        <Button
          label="Vista Previa"
          icon={<Icon icon="mdi:arrow-right" />}
          iconPos="right"
          onClick={handleNext}
          className="p-button-primary"
        />
      </div>
    </div>
  );
};

export default StoreActivitiesStep;