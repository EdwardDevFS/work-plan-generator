import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import { Dropdown } from 'primereact/dropdown';
import { Icon } from '@iconify/react';
import { Toast } from 'primereact/toast';
import WorkerScheduleCalendar from './WorkerScheduleCalendar';
import WorkPlanForm from './WorkPlanform';
import { UserScheduleListItem, WorkPlanListItem } from '../../types/workplan.types';
import { workPlansApi } from '../../services/work-plan-api.service';

export interface WorkerWithSchedule extends UserScheduleListItem {
  workPlan: WorkPlanListItem;
  progressPercentage: number;
  currentLocation: string;
  role: string;
}

const WorkPlansPage: React.FC = () => {
  const toast = React.useRef<Toast>(null);
  const [workPlans, setWorkPlans] = useState<WorkPlanListItem[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<WorkPlanListItem | null>(null);
  const [workers, setWorkers] = useState<WorkerWithSchedule[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<WorkerWithSchedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadWorkPlans();
  }, []);

  useEffect(() => {
    if (selectedPlan) {
      loadWorkers();
    }
  }, [selectedPlan]);

  const loadWorkPlans = async () => {
    setLoading(true);
    try {
      const plans = await workPlansApi.getWorkPlans();
      setWorkPlans(plans);
      if (plans.length > 0 && !selectedPlan) {
        setSelectedPlan(plans[0]);
      }
    } catch (error) {
      console.error('Error loading work plans:', error);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al cargar planes de trabajo' });
    } finally {
      setLoading(false);
    }
  };

  const loadWorkers = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    try {
      const schedules = await workPlansApi.getUserSchedules(selectedPlan.id);
      
      const workersData: WorkerWithSchedule[] = schedules.map((schedule) => {
        const progressPercentage = 0;

        return {
          ...schedule,
          workPlan: selectedPlan,
          progressPercentage,
          currentLocation: 'Sede Central',
          role: schedule.user.roles[0]?.name || 'Sin rol',
        };
      });

      setWorkers(workersData);
    } catch (error) {
      console.error('Error loading workers:', error);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al cargar trabajadores' });
    } finally {
      setLoading(false);
    }
  };

  const getPlanStatusConfig = (status: string) => {
    const configs: Record<string, { severity: any; label: string; icon: string }> = {
      DRAFT: { severity: 'secondary', label: 'Borrador', icon: 'mdi:file-document-edit' },
      APPROVED: { severity: 'info', label: 'Aprobado', icon: 'mdi:check-circle' },
      ACTIVE: { severity: 'success', label: 'Activo', icon: 'mdi:play-circle' },
      COMPLETED: { severity: 'success', label: 'Completado', icon: 'mdi:check-all' },
      CANCELLED: { severity: 'danger', label: 'Cancelado', icon: 'mdi:close-circle' },
    };
    return configs[status] || configs.DRAFT;
  };

  const workerNameTemplate = (worker: WorkerWithSchedule) => (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
        {worker.user.firstName[0]}{worker.user.lastName[0]}
      </div>
      <div>
        <div className="font-medium text-gray-900">
          {worker.user.firstName} {worker.user.lastName}
        </div>
        <div className="text-xs text-gray-500">{worker.user.email}</div>
      </div>
    </div>
  );

  const roleTemplate = (worker: WorkerWithSchedule) => (
    <Tag 
      value={worker.role} 
      className="text-xs px-2 py-1 bg-blue-100 text-blue-700"
    />
  );

  const statsTemplate = (worker: WorkerWithSchedule) => (
    <div className="flex gap-3">
      <div className="flex items-center gap-1.5 text-gray-600">
        <Icon icon="mdi:calendar-today" className="text-blue-600 text-base" />
        <span className="text-xs font-medium">{worker.summary.totalDays} días</span>
      </div>
      <div className="flex items-center gap-1.5 text-gray-600">
        <Icon icon="mdi:store" className="text-green-600 text-base" />
        <span className="text-xs font-medium">{worker.summary.totalStores} locales</span>
      </div>
      <div className="flex items-center gap-1.5 text-gray-600">
        <Icon icon="mdi:clipboard-list" className="text-purple-600 text-base" />
        <span className="text-xs font-medium">{worker.summary.totalActivities} tareas</span>
      </div>
    </div>
  );

  const progressTemplate = (worker: WorkerWithSchedule) => (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-gray-700">
          {worker.progressPercentage.toFixed(0)}%
        </span>
        <span className="text-xs text-gray-500">
          0 / {worker.summary.totalActivities}
        </span>
      </div>
      <ProgressBar
        value={worker.progressPercentage}
        showValue={false}
        className="h-2"
        color={worker.progressPercentage === 100 ? '#10b981' : worker.progressPercentage > 50 ? '#3b82f6' : '#f59e0b'}
      />
    </div>
  );

  const actionsTemplate = (worker: WorkerWithSchedule) => (
    <Button
      label="Ver Calendario"
      icon={<Icon icon="mdi:calendar-month" className="text-base" />}
      className="!border-none !outline-none text-blue-600 hover:bg-blue-50 rounded-lg text-sm p-2"
      style={{ boxShadow: 'none' }}
      text
      onClick={() => setSelectedWorker(worker)}
    />
  );

  if (showCreateForm) {
    return <WorkPlanForm onBack={() => setShowCreateForm(false)} />;
  }

  if (selectedWorker) {
    return (
      <WorkerScheduleCalendar
        worker={selectedWorker}
        onBack={() => setSelectedWorker(null)}
      />
    );
  }

  return (
    <div className="p-4">
      <Toast ref={toast} />
      
      {/* Header Section */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-900">Planes de Trabajo</h1>
        <p className="text-lg text-gray-500 -mt-5">Gestiona y visualiza los itinerarios de tu equipo</p>
      </div>

      {/* Selector de Plan y Toolbar */}
      <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Plan de Trabajo</label>
            <Dropdown
              value={selectedPlan}
              options={workPlans}
              onChange={(e) => setSelectedPlan(e.value)}
              optionLabel="planName"
              placeholder="Seleccione un plan"
              className="w-full text-sm"
              filter
              itemTemplate={(option) => (
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium text-gray-900">{option.planName}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                  <Tag
                    value={getPlanStatusConfig(option.status).label}
                    severity={getPlanStatusConfig(option.status).severity}
                    className="text-xs px-3 py-1 ml-2"
                  />
                </div>
              )}
            />
          </div>

          <Button
            label="Crear Nuevo Plan"
            icon={<Icon icon="mdi:plus" className="text-lg" />}
            className="!border-none !outline-none bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium"
            style={{ boxShadow: 'none' }}
            onClick={() => setShowCreateForm(true)}
          />
        </div>

        {/* Métricas del Plan */}
        {selectedPlan && (
          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Icon icon="mdi:account-group" className="text-blue-600 text-xl" />
                <span className="text-xs font-medium text-gray-700">Trabajadores</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{selectedPlan.metrics?.totalUsers || 0}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Icon icon="mdi:store" className="text-green-600 text-xl" />
                <span className="text-xs font-medium text-gray-700">Locales</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{selectedPlan.metrics?.totalStores || 0}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Icon icon="mdi:clipboard-list" className="text-purple-600 text-xl" />
                <span className="text-xs font-medium text-gray-700">Actividades</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{selectedPlan.metrics?.totalActivities || 0}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Icon icon="mdi:calendar-range" className="text-indigo-600 text-xl" />
                <span className="text-xs font-medium text-gray-700">Días Estimados</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{selectedPlan.metrics?.estimatedDays || 0}</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Card con DataTable */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Toolbar */}
        <div className="pb-5 border-b border-gray-200 bg-gray-50 px-6 pt-6">
          <div className="flex items-center gap-2">
            <Icon icon="mdi:account-hard-hat" className="text-gray-700 text-xl" />
            <h2 className="text-lg font-semibold text-gray-900">Equipo Asignado</h2>
            {workers.length > 0 && (
              <Tag value={workers.length} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 ml-2" />
            )}
          </div>
        </div>

        {/* DataTable */}
        <DataTable
          value={workers}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          className="text-sm custom-datatable"
          emptyMessage={
            <div className="text-center py-12">
              <Icon icon="mdi:account-off" className="text-6xl text-gray-300 mb-4" />
              <p className="text-gray-500">No hay trabajadores asignados a este plan</p>
            </div>
          }
          stripedRows
        >
          <Column
            header="Trabajador"
            body={workerNameTemplate}
            className="font-medium text-gray-900"
            style={{ minWidth: '250px' }}
          />
          <Column
            header="Rol"
            body={roleTemplate}
            style={{ minWidth: '120px' }}
          />
          <Column
            header="Estadísticas"
            body={statsTemplate}
            className="text-gray-700"
            style={{ minWidth: '280px' }}
          />
          <Column
            header="Progreso"
            body={progressTemplate}
            style={{ minWidth: '180px' }}
          />
          <Column
            header="Acciones"
            body={actionsTemplate}
            className="text-center"
            style={{ minWidth: '150px' }}
          />
        </DataTable>
      </div>
     
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

export default WorkPlansPage;