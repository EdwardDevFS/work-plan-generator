import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Timeline } from 'primereact/timeline';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';
import { ProgressSpinner } from 'primereact/progressspinner';
import { User } from '../../types';
import { UserScheduleDetail } from '../../types/workplan.types';
import { usersService } from '../../services/users.service';
import { useAuth } from '../../contexts/AuthContext';
import { userSchedulesApi } from '../../services/user-schedule.service';

const UserSchedules: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [schedules, setSchedules] = useState<UserScheduleDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const {user} = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadSchedules();
    }
  }, [selectedUser, selectedMonth]);

  const loadUsers = async () => {
    // TODO: GET /users
    usersService.getAll({ tenantId: user?.tenantId, limit: 50, page: 1 })
		.then(res => {
			const usersWithFullName = res.data.data.map(u => ({
				...u,
				fullName: `${u.firstName} ${u.lastName}`,
			}));
			setUsers(usersWithFullName);
		})
  };

  const loadSchedules = async () => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      const data = await userSchedulesApi.getByUser(selectedUser.id, selectedMonth);
      setSchedules(data);
    } catch (error) {
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const statusTag = (status: string) => {
    const map: any = {
      PENDING: { severity: 'warning', label: 'Pendiente' },
      IN_PROGRESS: { severity: 'info', label: 'En Progreso' },
      COMPLETED: { severity: 'success', label: 'Completado' },
      CANCELLED: { severity: 'danger', label: 'Cancelado' },
    };
    const config = map[status] || map.PENDING;
    return <Tag value={config.label} severity={config.severity} />;
  };

  const timelineContent = (schedule: any) => {
    return (
      <Card className="mb-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-lg">
              {new Intl.DateTimeFormat('es-PE', { dateStyle: 'full' }).format(new Date(schedule.date))}
            </h4>
            {statusTag(schedule.status)}
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Horario:</span>
              <p className="font-semibold">{schedule.startTime} - {schedule.endTime}</p>
            </div>
            <div>
              <span className="text-gray-600">Trabajo:</span>
              <p className="font-semibold">{formatTime(schedule.totalWorkMinutes)}</p>
            </div>
            <div>
              <span className="text-gray-600">Viaje:</span>
              <p className="font-semibold">{formatTime(schedule.totalTravelMinutes)}</p>
            </div>
          </div>

          <DataTable value={schedule.tasks} size="small">
            <Column
              field="arrivalTime"
              header="Hora"
              body={(task) => (
                <div className="text-xs">
                  <div className="font-semibold">{task.arrivalTime}</div>
                  <div className="text-gray-500">{task.departureTime}</div>
                </div>
              )}
              style={{ width: '80px' }}
            />
            <Column
              header="Local y Tarea"
              body={(task) => (
                <div>
                  <div className="font-semibold text-sm">{task.storeName}</div>
                  <div className="text-xs text-gray-600">{task.taskName}</div>
                  {task.hasCustomSchedule && (
                    <Tag severity="warning" value="Horario Especial" className="mt-1" />
                  )}
                </div>
              )}
            />
            <Column
              header="Tiempo"
              body={(task) => (
                <div className="text-xs">
                  {task.travelMinutes > 0 && (
                    <div className="text-orange-600">🚗 {formatTime(task.travelMinutes)}</div>
                  )}
                  <div>⚙️ {formatTime(task.taskMinutes)}</div>
                </div>
              )}
            />
            <Column header="Estado" body={(task) => statusTag(task.status)} />
          </DataTable>
        </div>
      </Card>
    );
  };

  if (!selectedUser) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-12">
            <i className="pi pi-user text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-semibold mb-2">Selecciona un Usuario</h3>
            <p className="text-gray-500 mb-6">Elige un usuario para ver sus itinerarios</p>
            <Dropdown
              value={selectedUser}
              options={users}
              onChange={(e) => setSelectedUser(e.value)}
              optionLabel={'fullName'}
              placeholder="Selecciona un usuario"
              className="w-80"
            />
          </div>
        </Card>
      </div>
    );
  }

  const allSchedules = schedules.flatMap(s => s.dailySchedules);
  const totalDays = allSchedules.length;
  const totalActivities = allSchedules.reduce((sum, d) => sum + d.tasks.length, 0);
  const totalWork = allSchedules.reduce((sum, d) => sum + d.totalWorkMinutes, 0);
  const totalTravel = allSchedules.reduce((sum, d) => sum + d.totalTravelMinutes, 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">
              Itinerarios de {selectedUser.firstName} {selectedUser.lastName}
            </h1>
            <p className="text-gray-600">{selectedUser.email}</p>
          </div>
          <Button
            label="Cambiar Usuario"
            icon="pi pi-user"
            outlined
            onClick={() => setSelectedUser(null)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Mes</label>
            <Calendar
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.value as Date)}
              view="month"
              dateFormat="mm/yy"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <ProgressSpinner />
        </div>
      ) : allSchedules.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <i className="pi pi-calendar text-4xl text-gray-300 mb-3"></i>
            <p className="text-gray-600">No hay itinerarios para este mes</p>
          </div>
        </Card>
      ) : (
        <TabView>
          <TabPanel header="Timeline" leftIcon="pi pi-list">
            <Timeline
              value={allSchedules}
              content={timelineContent}
              marker={(item) => (
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center">
                  {new Date(item.date).getDate()}
                </div>
              )}
            />
          </TabPanel>

          <TabPanel header="Tabla" leftIcon="pi pi-table">
            <DataTable value={allSchedules} paginator rows={10}>
              <Column
                field="date"
                header="Fecha"
                body={(row) => new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(new Date(row.date))}
                sortable
              />
              <Column field="startTime" header="Inicio" />
              <Column field="endTime" header="Fin" />
              <Column header="Total" body={(row) => formatTime(row.totalWorkMinutes)} />
              <Column header="Actividades" body={(row) => row.tasks.length} />
              <Column field="status" header="Estado" body={(row) => statusTag(row.status)} />
            </DataTable>
          </TabPanel>

          <TabPanel header="Resumen" leftIcon="pi pi-chart-bar">
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <div className="text-center">
                  <i className="pi pi-calendar text-4xl text-blue-500 mb-3"></i>
                  <p className="text-sm text-gray-600">Días</p>
                  <p className="text-3xl font-bold">{totalDays}</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <i className="pi pi-briefcase text-4xl text-green-500 mb-3"></i>
                  <p className="text-sm text-gray-600">Actividades</p>
                  <p className="text-3xl font-bold">{totalActivities}</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <i className="pi pi-clock text-4xl text-purple-500 mb-3"></i>
                  <p className="text-sm text-gray-600">Tiempo Trabajo</p>
                  <p className="text-3xl font-bold">{formatTime(totalWork)}</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <i className="pi pi-car text-4xl text-orange-500 mb-3"></i>
                  <p className="text-sm text-gray-600">Tiempo Viaje</p>
                  <p className="text-3xl font-bold">{formatTime(totalTravel)}</p>
                </div>
              </Card>
            </div>
          </TabPanel>
        </TabView>
      )}
    </div>
  );
};

export default UserSchedules;