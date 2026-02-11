import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import { Dropdown } from 'primereact/dropdown';
import { Icon } from '@iconify/react';
import { Badge } from 'primereact/badge';
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
    } finally {
      setLoading(false);
    }
  };

  const loadWorkers = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    try {
      const schedules = await workPlansApi.getUserSchedules(selectedPlan.id);
      
      // NO CARGAR DETALLES - usar solo el summary que ya viene
      const workersData: WorkerWithSchedule[] = schedules.map((schedule) => {
        // El progreso real se calculará cuando el usuario haga clic en "Ver Calendario"
        // Aquí solo mostramos 0% como placeholder
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

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const workerNameTemplate = (worker: WorkerWithSchedule) => (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
        {worker.user.firstName[0]}{worker.user.lastName[0]}
      </div>
      <div>
        <div className="font-semibold text-gray-900">
          {worker.user.firstName} {worker.user.lastName}
        </div>
        <div className="text-xs text-gray-500">{worker.user.email}</div>
      </div>
    </div>
  );

  const roleTemplate = (worker: WorkerWithSchedule) => (
    <Tag 
      value={worker.role} 
      severity="info" 
      icon={<Icon icon="mdi:shield-account" className="mr-1" />}
      className="text-xs"
    />
  );

  const statsTemplate = (worker: WorkerWithSchedule) => (
    <div className="grid grid-cols-3 gap-2">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-2 rounded-lg border border-blue-200 text-center">
        <Icon icon="mdi:calendar-today" className="text-blue-600 text-lg mb-1 mx-auto" />
        <div className="text-xs font-semibold text-blue-900">{worker.summary.totalDays}</div>
        <div className="text-xs text-blue-700">días</div>
      </div>
      <div className="bg-gradient-to-br from-green-50 to-green-100 p-2 rounded-lg border border-green-200 text-center">
        <Icon icon="mdi:store" className="text-green-600 text-lg mb-1 mx-auto" />
        <div className="text-xs font-semibold text-green-900">{worker.summary.totalStores}</div>
        <div className="text-xs text-green-700">locales</div>
      </div>
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-2 rounded-lg border border-purple-200 text-center">
        <Icon icon="mdi:clipboard-list" className="text-purple-600 text-lg mb-1 mx-auto" />
        <div className="text-xs font-semibold text-purple-900">{worker.summary.totalActivities}</div>
        <div className="text-xs text-purple-700">tareas</div>
      </div>
    </div>
  );

  const progressTemplate = (worker: WorkerWithSchedule) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-gray-700">
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
      icon={<Icon icon="mdi:calendar-month" className="mr-2" />}
      className="p-button-sm p-button-outlined p-button-primary"
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
    <div className="h-full overflow-y-hidden">
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <Icon icon="mdi:calendar-check" className="text-indigo-600" />
                Planes de Trabajo
              </h1>
              <p className="text-gray-600">
                Gestiona y visualiza los itinerarios de tu equipo
              </p>
            </div>
            
            <Button
              label="Crear Nuevo Plan"
              icon={<Icon icon="mdi:plus" />}
              className="p-button-success"
              onClick={() => setShowCreateForm(true)}
            />
          </div>

          {workPlans.length > 0 && (
            <Card className="shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Icon icon="mdi:file-document" className="mr-1" />
                    Plan Activo
                  </label>
                  <Dropdown
                    value={selectedPlan}
                    options={workPlans}
                    onChange={(e) => setSelectedPlan(e.value)}
                    optionLabel="planName"
                    placeholder="Selecciona un plan"
                    className="w-full"
                    filter
                    itemTemplate={(option) => (
                      <div className="flex items-center justify-between p-2">
                        <div>
                          <div className="font-semibold">{option.planName}</div>
                          <div className="text-xs text-gray-500">{option.description}</div>
                        </div>
                        <Tag
                          value={getPlanStatusConfig(option.status).label}
                          severity={getPlanStatusConfig(option.status).severity}
                          className="ml-2"
                        />
                      </div>
                    )}
                  />
                </div>

                {selectedPlan && (
                  <div className="flex items-center gap-2">
                    <Tag
                      value={getPlanStatusConfig(selectedPlan.status).label}
                      severity={getPlanStatusConfig(selectedPlan.status).severity}
                      icon={<Icon icon={getPlanStatusConfig(selectedPlan.status).icon} className="mr-1" />}
                      className="text-sm"
                    />
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {selectedPlan && (
          <div className="mb-6">
            <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg border-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <Icon icon="mdi:account-group" className="text-4xl mb-2 opacity-90 mx-auto" />
                  <div className="text-sm opacity-90 font-medium uppercase tracking-wide">
                    Trabajadores
                  </div>
                  <div className="text-3xl font-bold mt-1">
                    {selectedPlan.metrics?.totalUsers || 0}
                  </div>
                </div>
                <div className="text-center">
                  <Icon icon="mdi:store" className="text-4xl mb-2 opacity-90 mx-auto" />
                  <div className="text-sm opacity-90 font-medium uppercase tracking-wide">
                    Locales
                  </div>
                  <div className="text-3xl font-bold mt-1">
                    {selectedPlan.metrics?.totalStores || 0}
                  </div>
                </div>
                <div className="text-center">
                  <Icon icon="mdi:clipboard-list" className="text-4xl mb-2 opacity-90 mx-auto" />
                  <div className="text-sm opacity-90 font-medium uppercase tracking-wide">
                    Actividades
                  </div>
                  <div className="text-3xl font-bold mt-1">
                    {selectedPlan.metrics?.totalActivities || 0}
                  </div>
                </div>
                <div className="text-center">
                  <Icon icon="mdi:calendar-range" className="text-4xl mb-2 opacity-90 mx-auto" />
                  <div className="text-sm opacity-90 font-medium uppercase tracking-wide">
                    Días
                  </div>
                  <div className="text-3xl font-bold mt-1">
                    {selectedPlan.metrics?.estimatedDays || 0}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        <Card className="max-h-full shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Icon icon="mdi:account-hard-hat" className="text-2xl text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-800">Equipo Asignado</h2>
            {workers.length > 0 && (
              <Badge value={workers.length} severity="info" className="ml-2" />
            )}
          </div>

          <DataTable
            value={workers}
            loading={loading}
            emptyMessage={
              <div className="text-center py-12">
                <Icon icon="mdi:account-off" className="text-6xl text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No hay trabajadores asignados a este plan</p>
              </div>
            }
            stripedRows
            showGridlines
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
          >
            <Column
              header="Trabajador"
              body={workerNameTemplate}
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
              style={{ minWidth: '150px' }}
            />
          </DataTable>
        </Card>
      </div>
    </div>
  );
};

export default WorkPlansPage;