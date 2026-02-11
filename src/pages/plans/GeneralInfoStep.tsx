import React, { useState, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { MultiSelect } from 'primereact/multiselect';
import { WorkPlanFormData, WorkPlanTemplate } from '../../types/workplan.types';
import { storesService } from '../../services/stores.service';
import { useAuth } from '../../contexts/AuthContext';
import { usersService } from '../../services/users.service';
import { User } from '../../types';
import { Store } from '../../types/store.types';
import { Checkbox } from 'primereact/checkbox';
import { Card } from 'primereact/card';
import { v4 as uuidv4 } from 'uuid';
import { Message } from 'primereact/message';
import { templatesApi } from '../../services/templates.service';

interface Props {
  formData: WorkPlanFormData;
  updateFormData: (data: Partial<WorkPlanFormData>) => void;
  onNext: () => void;
}

const GeneralInfoStep: React.FC<Props> = ({ formData, updateFormData, onNext }) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<WorkPlanTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const weekDays = [
    { label: 'Lunes', value: 1 },
    { label: 'Martes', value: 2 },
    { label: 'Miércoles', value: 3 },
    { label: 'Jueves', value: 4 },
    { label: 'Viernes', value: 5 },
    { label: 'Sábado', value: 6 },
    { label: 'Domingo', value: 0 },
  ];

  useEffect(() => {
    console.log("asdkmasdmkad")
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const templatesResponse = await templatesApi.list();
      const templatesArray = Array.isArray(templatesResponse) ? templatesResponse : [];
      setTemplates(templatesArray);

      storesService
        .getAll({ tenantId: user?.tenantId, limit: 50, page: 1, isActive: true })
        .then(res => {
          console.log(res)
          setStores(res.data.data)
        });

      usersService
        .getAll({ tenantId: user?.tenantId, limit: 50, page: 1 })
        .then(res => {
          const usersWithFullName = res.data.data.map(u => ({
            ...u,
            fullName: `${u.firstName} ${u.lastName}`,
          }));
          setUsers(usersWithFullName);
        });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = async (templateId: string | null) => {
    if (!templateId) 
      {
      updateFormData({ templateId: undefined });
      return;
    }

    try {
      const template = await templatesApi.getById(templateId);
      
      const selectedStores = stores.filter(s => 
        template.formData.selectedStoreIds?.includes(s.id)
      );
      const selectedUsers = users.filter(u => 
        template.formData.selectedUserIds?.includes(u.id)
      );

      updateFormData({
        templateId,
        planName: template.formData.planName,
        description: template.formData.description,
        deadline: template.formData.deadline ? new Date(template.formData.deadline) : null,
        selectedStores,
        selectedUsers,
        workDays: template.formData.workDays || [1, 2, 3, 4, 5],
        workTimeSlots: template.formData.workTimeSlots?.map((slot: any) => ({
          id: uuidv4(),
          start: slot.start,
          end: slot.end,
        })) || [{ id: uuidv4(), start: '08:00', end: '17:00' }],
      });

      alert(`Plantilla "${template.templateName}" cargada`);
    } catch (error) {
      alert('Error al cargar plantilla');
    }
  };

  const addTimeSlot = () => {
    updateFormData({
      workTimeSlots: [...formData.workTimeSlots, { id: uuidv4(), start: '08:00', end: '17:00' }]
    });
  };

  const removeTimeSlot = (id: string) => {
    if (formData.workTimeSlots.length <= 1) return alert('Debe haber al menos una franja');
    updateFormData({
      workTimeSlots: formData.workTimeSlots.filter(s => s.id !== id)
    });
  };

  const updateTimeSlot = (id: string, field: 'start' | 'end', value: string) => {
    updateFormData({
      workTimeSlots: formData.workTimeSlots.map(s =>
        s.id === id ? { ...s, [field]: value } : s
      )
    });
  };

  const handleNext = () => {
    if (!formData.planName?.trim()) return alert('Ingresa nombre del plan');
    if (!formData.description?.trim()) return alert('Ingresa descripción');
    if (!formData.deadline) return alert('Selecciona fecha límite');
    if (formData.selectedStores.length === 0) return alert('Selecciona al menos un local');
    if (formData.selectedUsers.length === 0) return alert('Selecciona al menos un usuario');
    if (formData.workDays.length === 0) return alert('Selecciona al menos un día');
    if (formData.workTimeSlots.length === 0) return alert('Agrega al menos una franja horaria');
    onNext();
  };

  return (
    <div className="space-y-2">
      {/* Header Section - Mejorado */}
      <div className="pt-4 border-b border-gray-200">
        <h3 className="text-3xl font-bold text-gray-900">Información General</h3>
        <p className="text-gray-600 mt-2 text-lg">Configura los datos básicos del plan de trabajo</p>
      </div>

      {/* Template Section - Mejorado con mejor espaciado */}
      <Card className="shadow-sm">
        <div className="">
          <div className="flex items-center gap-3">
            <i className="pi pi-file text-2xl text-blue-600"></i>
            <h4 className="text-xl font-semibold text-gray-900">Plantilla (Opcional)</h4>
          </div>
          
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              Seleccionar plantilla existente
            </label>
            <Dropdown
              value={formData.templateId}
              options={[
                { label: 'Sin plantilla - Crear desde cero', value: null },
                ...templates.map(t => ({
                  label: `${t.templateName} (${t.totalActivities} actividades, ${t.estimatedDays} días)`,
                  value: t.id,
                }))
              ]}
              onChange={(e) => handleTemplateChange(e.value)}
              placeholder="Selecciona una plantilla"
              className="w-full"
              loading={loading}
            />
            {formData.templateId && (
              <Message 
                severity="info" 
                text="✓ Plantilla cargada exitosamente. Puedes modificar cualquier valor a continuación." 
                className="mt-3"
              />
            )}
          </div>
        </div>
      </Card>

      {/* Basic Info Section - Mejorado */}
      <Card className="shadow-sm">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <i className="pi pi-pencil text-2xl text-blue-600"></i>
            <h4 className="text-xl font-semibold text-gray-900">Información Básica</h4>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre del Plan <span className="text-red-500">*</span>
              </label>
              <InputText
                value={formData.planName}
                onChange={(e) => updateFormData({ planName: e.target.value })}
                placeholder="Ej: Plan Instalaciones Febrero 2026"
                className="w-full"
              />
              <small className="text-gray-500 mt-1 block">
                Ingresa un nombre descriptivo para identificar este plan
              </small>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Descripción <span className="text-red-500">*</span>
              </label>
              <InputTextarea
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                placeholder="Describe el objetivo y alcance de este plan de trabajo..."
                rows={4}
                className="w-full"
              />
              <small className="text-gray-500 mt-1 block">
                Proporciona detalles sobre qué se realizará en este plan
              </small>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fecha Límite <span className="text-red-500">*</span>
              </label>
              <Calendar
                value={formData.deadline}
                onChange={(e) => updateFormData({ deadline: e.value as Date })}
                dateFormat="dd/mm/yy"
                minDate={new Date()}
                showIcon
                className="w-full"
                placeholder="Selecciona la fecha límite"
              />
              <small className="text-gray-500 mt-1 block">
                Fecha máxima para completar todas las actividades
              </small>
            </div>
          </div>
        </div>
      </Card>

      {/* Selection Section - Mejorado */}
      <Card className="shadow-sm">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <i className="pi pi-users text-2xl text-blue-600"></i>
            <h4 className="text-xl font-semibold text-gray-900">Selección de Recursos</h4>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Locales <span className="text-red-500">*</span>
              </label>
              <MultiSelect
                value={formData.selectedStores}
                options={stores}
                onChange={(e) => updateFormData({ selectedStores: e.value })}
                optionLabel="name"
                placeholder="Selecciona uno o más locales"
                filter
                display="chip"
                className="w-full"
                showSelectAll
              />
              <small className="text-gray-500 mt-1 block">
                {formData.selectedStores.length > 0 
                  ? `${formData.selectedStores.length} local(es) seleccionado(s)`
                  : 'Selecciona los locales donde se ejecutará el plan'}
              </small>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Trabajadores <span className="text-red-500">*</span>
              </label>
              <MultiSelect
                value={formData.selectedUsers}
                options={users}
                onChange={(e) => updateFormData({ selectedUsers: e.value })}
                optionLabel="fullName"
                placeholder="Selecciona uno o más trabajadores"
                filter
                display="chip"
                className="w-full"
                showSelectAll
              />
              <small className="text-gray-500 mt-1 block">
                {formData.selectedUsers.length > 0 
                  ? `${formData.selectedUsers.length} trabajador(es) seleccionado(s)`
                  : 'Selecciona el personal que participará en el plan'}
              </small>
            </div>
          </div>
        </div>
      </Card>

      {/* Work Days Section - Mejorado */}
      <Card className="shadow-sm">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <i className="pi pi-calendar text-2xl text-blue-600"></i>
            <h4 className="text-xl font-semibold text-gray-900">Días Laborables</h4>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              Selecciona los días de la semana <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {weekDays.map(day => (
                <div 
                  key={day.value} 
                  className={`
                    flex items-center gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer
                    ${formData.workDays.includes(day.value) 
                      ? 'bg-blue-50 border-blue-500 shadow-sm' 
                      : 'bg-white border-gray-200 hover:border-gray-300'}
                  `}
                  onClick={() => {
                    const checked = !formData.workDays.includes(day.value);
                    updateFormData({
                      workDays: checked
                        ? [...formData.workDays, day.value]
                        : formData.workDays.filter(d => d !== day.value)
                    });
                  }}
                >
                  <Checkbox
                    inputId={`day-${day.value}`}
                    checked={formData.workDays.includes(day.value)}
                    onChange={(e) => {
                      updateFormData({
                        workDays: e.checked
                          ? [...formData.workDays, day.value]
                          : formData.workDays.filter(d => d !== day.value)
                      });
                    }}
                  />
                  <label htmlFor={`day-${day.value}`} className="cursor-pointer font-medium text-gray-700">
                    {day.label}
                  </label>
                </div>
              ))}
            </div>
            <small className="text-gray-500 mt-3 block">
              {formData.workDays.length > 0 
                ? `${formData.workDays.length} día(s) seleccionado(s)`
                : 'Selecciona al menos un día de trabajo'}
            </small>
          </div>
        </div>
      </Card>

      {/* Time Slots Section - Mejorado */}
      <Card className="shadow-sm">
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <i className="pi pi-clock text-2xl text-blue-600"></i>
              <h4 className="text-xl font-semibold text-gray-900">Horarios Generales</h4>
            </div>
            <Button 
              label="Agregar Franja" 
              icon="pi pi-plus" 
              size="small" 
              onClick={addTimeSlot} 
              outlined 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              Franjas horarias de trabajo <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {formData.workTimeSlots.map((slot, index) => (
                <div 
                  key={slot.id} 
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-2 text-gray-600 min-w-[100px]">
                    <i className="pi pi-clock"></i>
                    <span className="font-medium">Franja {index + 1}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Inicio</label>
                      <InputText
                        type="time"
                        value={slot.start}
                        onChange={(e) => updateTimeSlot(slot.id, 'start', e.target.value)}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="flex items-center justify-center pt-5">
                      <i className="pi pi-arrow-right text-gray-400"></i>
                    </div>
                    
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Fin</label>
                      <InputText
                        type="time"
                        value={slot.end}
                        onChange={(e) => updateTimeSlot(slot.id, 'end', e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {formData.workTimeSlots.length > 1 && (
                    <Button 
                      icon="pi pi-trash" 
                      rounded 
                      text 
                      severity="danger" 
                      onClick={() => removeTimeSlot(slot.id)}
                      tooltip="Eliminar franja"
                      tooltipOptions={{ position: 'top' }}
                    />
                  )}
                </div>
              ))}
            </div>
            <small className="text-gray-500 mt-3 block">
              Define las franjas horarias generales. Algunas actividades pueden tener horarios personalizados.
            </small>
          </div>
        </div>
      </Card>

      {/* Navigation - Mejorado */}
      <div className="flex justify-end pt-8 border-t border-gray-200">
        <Button 
          label="Siguiente Paso" 
          icon="pi pi-arrow-right" 
          iconPos="right" 
          onClick={handleNext} 
          size="large"
          className="px-8"
        />
      </div>
    </div>
  );
};

export default GeneralInfoStep;