import React, { useState } from 'react';
import { Steps } from 'primereact/steps';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Icon } from '@iconify/react';
import GeneralInfoStep from './GeneralInfoStep';
import StoreActivitiesStep from './StoreActivitiesStep';
import PreviewStep from './PreviewStep';
import { WorkPlanFormData } from '../../types/workplan.types';
import { Toast } from 'primereact/toast';
import { workPlansApi } from '../../services/work-plan-api.service';
import { Checkbox } from 'primereact/checkbox';
import { confirmDialog } from 'primereact/confirmdialog';
import { ConfirmDialog } from 'primereact/confirmdialog';

const STORAGE_KEY = 'work_plan_draft';

interface WorkPlanFormProps {
  onBack: () => void;
}

const initialData: WorkPlanFormData = {
  planName: '',
  description: '',
  deadline: null,
  selectedStores: [],
  selectedUsers: [],
  workDays: [1, 2, 3, 4, 5],
  workTimeSlots: [{ id: crypto.randomUUID(), start: '08:00', end: '17:00' }],
  storeActivities: [],
};

const WorkPlanForm: React.FC<WorkPlanFormProps> = ({ onBack }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [formData, setFormData] = useState<WorkPlanFormData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.deadline) {
          parsed.deadline = new Date(parsed.deadline);
        }
        return parsed;
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
    return initialData;
  });
  
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const toast = React.useRef<Toast>(null);

  const steps = [
    { label: 'Información General', icon: 'pi pi-info-circle' },
    { label: 'Actividades por Tienda', icon: 'pi pi-list' },
    { label: 'Revisión Final', icon: 'pi pi-check' },
  ];

  const handleBack = () => {
    onBack();
  };

  React.useEffect(() => {
    try {
      const dataToSave = JSON.stringify(formData);
      localStorage.setItem(STORAGE_KEY, dataToSave);
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }, [formData]);

  const updateFormData = (data: Partial<WorkPlanFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleClearDraft = () => {
    confirmDialog({
      message: '¿Estás seguro de limpiar el borrador? Se perderá todo el progreso.',
      header: 'Confirmar Limpieza',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: () => {
        localStorage.removeItem(STORAGE_KEY);
        setFormData(initialData);
        setActiveIndex(0);
        toast.current?.show({
          severity: 'success',
          summary: 'Borrador Limpiado',
          detail: 'Formulario reseteado correctamente'
        });
      }
    });
  };

  const handleGenerate = async () => {
    try {
      const result = await workPlansApi.generate(
        formData,
        saveAsTemplate,
        saveAsTemplate ? formData.planName : undefined,
        saveAsTemplate ? formData.description : undefined
      );

      localStorage.removeItem(STORAGE_KEY);
      setFormData(initialData);
      setActiveIndex(0);
      setSaveAsTemplate(false);

      toast.current?.show({
        severity: 'success',
        summary: 'Plan Generado',
        detail: `Plan "${result.planName}" creado exitosamente`,
        life: 5000
      });

      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'Error al generar plan'
      });
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-[1400px] mx-auto">
        <Toast ref={toast} />
        <ConfirmDialog />

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Button
              label="Volver"
              icon={<Icon icon="mdi:arrow-left" />}
              onClick={handleBack}
              className="p-button-text p-button-secondary"
            />

            <Button
              label="Limpiar Borrador"
              icon={<Icon icon="mdi:delete-sweep" />}
              onClick={handleClearDraft}
              className="p-button-outlined p-button-danger"
              size="small"
            />
          </div>

          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
              <Icon icon="mdi:file-document-plus" className="text-indigo-600" />
              Crear Plan de Trabajo
            </h1>
            <p className="text-gray-600">
              Completa los pasos para crear un plan de trabajo optimizado
            </p>
          </div>

          <Card className="shadow-sm">
            <Steps
              model={steps}
              activeIndex={activeIndex}
              onSelect={(e) => setActiveIndex(e.index)}
              readOnly={false}
            />
          </Card>
        </div>

        <div>
          {activeIndex === 0 && (
            <GeneralInfoStep
              formData={formData}
              updateFormData={updateFormData}
              onNext={() => setActiveIndex(1)}
            />
          )}

          {activeIndex === 1 && (
            <StoreActivitiesStep
              formData={formData}
              updateFormData={updateFormData}
              onNext={() => setActiveIndex(2)}
              onBack={() => setActiveIndex(0)}
            />
          )}

          {activeIndex === 2 && (
            <div className="space-y-4">
              <PreviewStep
                formData={formData}
                onBack={() => setActiveIndex(1)}
                onGenerate={handleGenerate}
              />

              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={saveAsTemplate}
                    onChange={(e) => setSaveAsTemplate(e.checked || false)}
                    inputId="saveTemplate"
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor="saveTemplate" className="text-sm font-semibold text-blue-900 cursor-pointer block mb-1">
                      <Icon icon="mdi:content-save-cog" className="mr-1" />
                      Guardar como Plantilla Reutilizable
                    </label>
                    <p className="text-xs text-blue-700">
                      Se guardará toda la configuración para reutilizarla en futuros planes
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkPlanForm;