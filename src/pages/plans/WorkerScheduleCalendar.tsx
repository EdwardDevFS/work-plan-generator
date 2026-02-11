import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Timeline } from 'primereact/timeline';
import { Divider } from 'primereact/divider';
import { Icon } from '@iconify/react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { DailySchedule, UserScheduleDetail, WorkTask } from '../../types/workplan.types';
import { workPlansApi } from '../../services/work-plan-api.service';
import { formatTime, isWithinGeofence } from '../../services/workplan-adapter.service';
import { WorkerWithSchedule } from './WorkPlansPage';

interface Props {
  worker: WorkerWithSchedule;
  onBack: () => void;
}

const GEOFENCE_RADIUS = 200; // metros
// Simular ubicación actual del usuario (en producción vendría de GPS)
const MOCK_CURRENT_LOCATION = { lat: -11.4928096, lng: -77.2079659 }; // PCM HUARAL para demo

// Componente para actualizar el centro del mapa dinámicamente
const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
};

const WorkerScheduleCalendar: React.FC<Props> = ({ worker, onBack }) => {
  const [scheduleDetail, setScheduleDetail] = useState<UserScheduleDetail | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDaySchedule, setSelectedDaySchedule] = useState<DailySchedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-12.0464, -77.0428]);
  const [mapZoom, setMapZoom] = useState(13);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    loadScheduleDetail();
  }, [worker]);

  useEffect(() => {
    if (scheduleDetail) {
      updateSelectedDaySchedule();
    }
  }, [selectedDate, scheduleDetail]);

  const loadScheduleDetail = async () => {
    setLoading(true);
    try {
      const detail = await workPlansApi.getUserScheduleDetail(
        worker.workPlan.id,
        worker.user.id
      );
      setScheduleDetail(detail);
      
      if (detail.dailySchedules.length > 0) {
        const firstDay = new Date(detail.dailySchedules[0].date);
        setSelectedDate(firstDay);
        setCurrentMonth(firstDay);
      }
    } catch (error) {
      console.error('Error loading schedule detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSelectedDaySchedule = () => {
    if (!scheduleDetail) return;
    const daySchedule = scheduleDetail.dailySchedules.find((ds) =>
      isSameDay(new Date(ds.date), selectedDate)
    );
    setSelectedDaySchedule(daySchedule || null);
    
    // Si hay un schedule para este día, cambiar a vista detalle y centrar mapa
    if (daySchedule) {
      setShowCalendar(false);
      // Filtrar solo tareas de TRABAJO para centrar el mapa
      const workTasks = daySchedule.tasks.filter(t => t.taskType === 'WORK');
      if (workTasks.length > 0) {
        const firstTask = workTasks[0];
        setMapCenter([firstTask.coordinates.lat, firstTask.coordinates.lng]);
        setMapZoom(13);
      }
    }
  };

  const handleTaskClick = (task: WorkTask) => {
    setSelectedTaskId(task.id);
    setMapCenter([task.coordinates.lat, task.coordinates.lng]);
    setMapZoom(16);
  };

  const handleBackClick = () => {
    if (showCalendar) {
      onBack();
    } else {
      setShowCalendar(true);
      setSelectedTaskId(null);
    }
  };

  const checkWithinGeofence = (taskCoords: { lat: number; lng: number }): boolean => {
    return isWithinGeofence(MOCK_CURRENT_LOCATION, taskCoords, GEOFENCE_RADIUS);
  };

  const getTaskStatusConfig = (
    status: string,
    taskCoords?: { lat: number; lng: number }
  ) => {
    // Si está en progreso Y dentro del geofence, mostrar "Trabajando en el Sitio"
    if (status === 'IN_PROGRESS' && taskCoords && checkWithinGeofence(taskCoords)) {
      return {
        severity: 'success',
        label: 'Trabajando en el Sitio',
        icon: 'mdi:briefcase-check',
        pulse: true,
      };
    }

    const configs: Record<string, any> = {
      PENDING: {
        severity: 'warning',
        label: 'Pendiente',
        icon: 'mdi:clock-outline',
        pulse: false,
      },
      IN_PROGRESS: {
        severity: 'info',
        label: 'En Tránsito',
        icon: 'mdi:car',
        pulse: true,
      },
      COMPLETED: {
        severity: 'success',
        label: 'Completado',
        icon: 'mdi:check-circle',
        pulse: false,
      },
      SKIPPED: {
        severity: 'danger',
        label: 'Omitido',
        icon: 'mdi:close-circle',
        pulse: false,
      },
    };
    return configs[status] || configs.PENDING;
  };

  const markerIcon = (color: string) =>
    new L.DivIcon({
      html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <div className="bg-white">
        <div className="grid grid-cols-7 gap-2 mb-3">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
            <div key={day} className="text-center font-bold text-xs text-gray-600 p-2 bg-gray-100 rounded-lg">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const daySchedule = scheduleDetail?.dailySchedules.find((ds) =>
              isSameDay(new Date(ds.date), day)
            );
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);

            let className = "min-h-[100px] p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 ";
            
            if (!isCurrentMonth) {
              className += "opacity-30 bg-gray-50 cursor-default";
            } else if (isTodayDate) {
              className += "border-blue-500 bg-blue-50 shadow-md";
            } else if (daySchedule) {
              className += "border-green-300 bg-green-50 hover:shadow-lg hover:border-green-400";
            } else {
              className += "bg-white border-gray-200 hover:bg-gray-50";
            }
            
            if (isSelected) {
              className += " border-purple-500 bg-purple-50 shadow-lg ring-2 ring-purple-300";
            }

            return (
              <div
                key={day.toString()}
                onClick={() => daySchedule && setSelectedDate(day)}
                className={className}
              >
                {daySchedule && (
                  <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${
                    daySchedule.status === 'COMPLETED' ? 'bg-green-500' :
                    daySchedule.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                    'bg-yellow-500'
                  }`}></div>
                )}
                
                <div className={`text-xl font-bold mb-1 ${isTodayDate ? 'text-blue-600' : 'text-gray-700'}`}>
                  {format(day, 'd')}
                </div>
                {daySchedule && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs font-semibold text-green-700">
                      <Icon icon="mdi:clipboard-list" className="text-sm" />
                      {daySchedule.workTasks} tareas
                    </div>
                    <div className="text-xs font-mono text-gray-600">
                      {daySchedule.startTime} - {daySchedule.endTime}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDailyView = () => {
    if (!selectedDaySchedule) {
      return (
        <div className="text-center py-12">
          <Icon icon="mdi:calendar-blank" className="text-6xl text-gray-300 mb-3" />
          <h3 className="text-lg font-semibold text-gray-400">
            No hay actividades programadas para este día
          </h3>
        </div>
      );
    }

    const previousDay = subDays(selectedDate, 1);
    const nextDay = addDays(selectedDate, 1);
    const hasPrevious = scheduleDetail?.dailySchedules.some((ds) =>
      isSameDay(new Date(ds.date), previousDay)
    );
    const hasNext = scheduleDetail?.dailySchedules.some((ds) =>
      isSameDay(new Date(ds.date), nextDay)
    );

    // Decodificar geometría de ruta completa
    const routeCoordinates = selectedDaySchedule.routeGeometry 
      ? JSON.parse(selectedDaySchedule.routeGeometry).coordinates.map((coord: number[]) => [coord[1], coord[0]])
      : [];

    // Filtrar solo tareas de TRABAJO para el timeline (excluir TRAVEL)
    const workTasks = selectedDaySchedule.tasks.filter(t => t.taskType === 'WORK');

    return (
      <div className="space-y-4">
        {/* Navigation Header */}
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white shadow-lg">
          <Button
            icon="pi pi-chevron-left"
            label={format(previousDay, 'd MMM', { locale: es })}
            onClick={() => hasPrevious && setSelectedDate(previousDay)}
            disabled={!hasPrevious}
            className="p-button-text text-white text-sm"
          />
          <div className="text-center">
            <h2 className="text-2xl font-bold">
              {isToday(selectedDate) ? 'HOY' : format(selectedDate, 'EEEE', { locale: es }).toUpperCase()}
            </h2>
            <p className="text-sm opacity-90">
              {format(selectedDate, 'd MMMM yyyy', { locale: es })}
            </p>
          </div>
          <Button
            icon="pi pi-chevron-right"
            iconPos="right"
            label={format(nextDay, 'd MMM', { locale: es })}
            onClick={() => hasNext && setSelectedDate(nextDay)}
            disabled={!hasNext}
            className="p-button-text text-white text-sm"
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <Icon icon="mdi:clock-outline" className="text-3xl text-blue-600" />
            <div>
              <div className="text-xs text-gray-500 font-semibold">Horario</div>
              <div className="text-sm font-bold text-gray-900 font-mono">
                {selectedDaySchedule.startTime} - {selectedDaySchedule.endTime}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <Icon icon="mdi:briefcase" className="text-3xl text-purple-600" />
            <div>
              <div className="text-xs text-gray-500 font-semibold">Trabajo</div>
              <div className="text-sm font-bold text-gray-900 font-mono">{formatTime(selectedDaySchedule.totalWorkMinutes)}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <Icon icon="mdi:car" className="text-3xl text-orange-600" />
            <div>
              <div className="text-xs text-gray-500 font-semibold">Viaje</div>
              <div className="text-sm font-bold text-gray-900 font-mono">{formatTime(selectedDaySchedule.totalTravelMinutes)}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <Icon icon="mdi:clipboard-list" className="text-3xl text-green-600" />
            <div>
              <div className="text-xs text-gray-500 font-semibold">Tareas</div>
              <div className="text-sm font-bold text-gray-900 font-mono">{selectedDaySchedule.workTasks}</div>
            </div>
          </div>
        </div>

        {/* Main Content: TaskList + Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Task List */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-md max-h-[700px] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b flex items-center gap-2">
              <Icon icon="mdi:format-list-checks" className="text-purple-600" />
              Itinerario del Día
            </h3>
            <style>{`
              .p-timeline-event-opposite {
                display: none !important;
              }
              .p-timeline-event-content {
                width: 100% !important;
              }
              .p-timeline.p-timeline-left .p-timeline-event-content {
                text-align: left !important;
              }
            `}</style>
            <Timeline
              value={workTasks}
              className="w-full"
              align="left"
              content={(task: WorkTask) => {
                const config = getTaskStatusConfig(task.status, task.coordinates);
                const isSelected = selectedTaskId === task.id;
                return (
                  <Card 
                    className={`mb-4 border rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer w-full ${
                      isSelected ? 'border-purple-500 ring-2 ring-purple-300 shadow-lg' : 'border-gray-200'
                    }`}
                    onClick={() => handleTaskClick(task)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-700 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {task.sequenceOrder}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 truncate">{task.store?.name}</h4>
                        <p className="text-xs text-gray-500 truncate">{task.store?.address}</p>
                      </div>
                      <Tag
                        value={config.label}
                        severity={config.severity}
                        className={`text-xs ${config.pulse ? 'animate-pulse' : ''}`}
                      />
                    </div>

                    <Divider className="my-2" />

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Icon icon="mdi:clipboard-text" className="text-base text-blue-600" />
                        <span className="text-gray-600">Tarea:</span>
                        <span className="font-semibold text-gray-900">{task.taskName}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Icon icon="mdi:clock-time-four" className="text-base text-purple-600" />
                        <span className="text-gray-600">Horario:</span>
                        <span className="font-semibold text-gray-900 font-mono">
                          {task.startTime} - {task.endTime}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Icon icon="mdi:timer-sand" className="text-base text-green-600" />
                        <span className="text-gray-600">Duración:</span>
                        <span className="font-semibold text-green-600 font-mono">
                          {formatTime(task.timePerRepetition)}
                        </span>
                      </div>

                      {task.totalRepetitions > 1 && (
                        <div className="flex items-center gap-2">
                          <Icon icon="mdi:repeat" className="text-base text-indigo-600" />
                          <span className="text-gray-600">Repeticiones:</span>
                          <span className="font-semibold text-indigo-600">
                            {task.completedRepetitions} / {task.totalRepetitions}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({task.progressPercent}%)
                          </span>
                        </div>
                      )}

                      {task.hasCustomSchedule && (
                        <div className="bg-yellow-50 p-2 rounded-lg border border-yellow-300 flex items-center gap-2 mt-2">
                          <Icon icon="mdi:clock-alert" className="text-base text-orange-700" />
                          <span className="font-semibold text-orange-900 text-xs">Horario Especial</span>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              }}
              marker={(task: WorkTask) => {
                const config = getTaskStatusConfig(task.status, task.coordinates);
                const bgColor = config.severity === 'success' ? 'bg-green-500' : 
                              config.severity === 'info' ? 'bg-blue-500' : 
                              config.severity === 'warning' ? 'bg-yellow-500' : 'bg-red-500';
                return (
                  <div className={`w-10 h-10 rounded-full ${bgColor} text-white flex items-center justify-center text-lg shadow-lg ${config.pulse ? 'animate-pulse' : ''}`}>
                    <Icon icon={config.icon} />
                  </div>
                );
              }}
            />
          </div>

          {/* Map */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b flex items-center gap-2">
              <Icon icon="mdi:map-marker-radius" className="text-red-500" />
              Mapa de Rutas
            </h3>
            <div className="h-[650px] rounded-xl overflow-hidden border-2 border-gray-300 shadow-inner">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%' }}
              >
                <MapUpdater center={mapCenter} zoom={mapZoom} />
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Marcador de ubicación actual del usuario */}
                <Marker
                  position={[MOCK_CURRENT_LOCATION.lat, MOCK_CURRENT_LOCATION.lng]}
                  icon={markerIcon('#3b82f6')}
                >
                  <Popup>
                    <div className="p-2">
                      <div className="font-bold text-sm flex items-center gap-2">
                        <Icon icon="mdi:account-circle" className="text-blue-600" />
                        Tu Ubicación Actual
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Lat: {MOCK_CURRENT_LOCATION.lat.toFixed(6)}<br/>
                        Lng: {MOCK_CURRENT_LOCATION.lng.toFixed(6)}
                      </div>
                    </div>
                  </Popup>
                </Marker>

                {/* Ruta completa del día */}
                {routeCoordinates.length > 1 && (
                  <Polyline
                    positions={routeCoordinates}
                    color="#8b5cf6"
                    weight={3}
                    opacity={0.7}
                  />
                )}

                {/* Tareas de TRABAJO y geofences */}
                {workTasks.map((task) => {
                  const isInGeofence = checkWithinGeofence(task.coordinates);
                  const statusConfig = getTaskStatusConfig(task.status, task.coordinates);
                  const isSelected = selectedTaskId === task.id;
                  
                  // Decodificar segmento de ruta individual si existe
                  let segmentCoords: [number, number][] = [];
                  if (task.travelInfo?.segmentGeometry) {
                    segmentCoords = task.travelInfo.segmentGeometry.coordinates.map(
                      (coord: number[]) => [coord[1], coord[0]] as [number, number]
                    );
                  } else if (task.segmentGeometry) {
                    try {
                      const parsed = JSON.parse(task.segmentGeometry);
                      segmentCoords = parsed.coordinates.map(
                        (coord: number[]) => [coord[1], coord[0]] as [number, number]
                      );
                    } catch (e) {
                      // Ignorar error de parsing
                    }
                  }
                  
                  return (
                    <React.Fragment key={task.id}>
                      {/* Geofence (área de 200m alrededor de cada punto) */}
                      <Circle
                        center={[task.coordinates.lat, task.coordinates.lng]}
                        radius={GEOFENCE_RADIUS}
                        pathOptions={{
                          color: isSelected ? '#8b5cf6' : isInGeofence ? '#10b981' : '#94a3b8',
                          fillColor: isSelected ? '#8b5cf6' : isInGeofence ? '#10b981' : '#94a3b8',
                          fillOpacity: isSelected ? 0.2 : 0.1,
                          weight: isSelected ? 3 : 2,
                          dashArray: '5, 5',
                        }}
                      />

                      {/* Segmento de ruta hacia esta tarea */}
                      {segmentCoords.length > 1 && (
                        <Polyline
                          positions={segmentCoords}
                          color={isSelected ? '#8b5cf6' : '#f59e0b'}
                          weight={isSelected ? 4 : 2}
                          opacity={isSelected ? 0.8 : 0.5}
                          dashArray="5, 10"
                        />
                      )}

                      {/* Marcador de la tarea */}
                      <Marker
                        position={[task.coordinates.lat, task.coordinates.lng]}
                        icon={markerIcon(
                          isSelected ? '#8b5cf6' :
                          task.status === 'COMPLETED' ? '#10b981' :
                          task.status === 'IN_PROGRESS' ? '#3b82f6' : '#f59e0b'
                        )}
                        eventHandlers={{
                          click: () => handleTaskClick(task),
                        }}
                      >
                        <Popup>
                          <div className="min-w-[240px] p-2">
                            <div className="flex justify-between items-center mb-2">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-700 text-white font-bold flex items-center justify-center text-sm">
                                #{task.sequenceOrder}
                              </div>
                              <Tag value={statusConfig.label} severity={statusConfig.severity} className="text-xs" />
                            </div>
                            <h4 className="text-sm font-bold text-gray-900 mb-1">{task.store?.name}</h4>
                            <p className="text-xs text-gray-600 mb-3">{task.store?.address}</p>
                            <div className="bg-gray-50 p-2 rounded-lg space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Tarea:</span>
                                <span className="font-semibold">{task.taskName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Horario:</span>
                                <span className="font-semibold font-mono">{task.startTime} - {task.endTime}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Duración:</span>
                                <span className="font-semibold font-mono">{formatTime(task.timePerRepetition)}</span>
                              </div>
                              {task.totalRepetitions > 1 && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Progreso:</span>
                                  <span className="font-semibold text-green-600">
                                    {task.completedRepetitions}/{task.totalRepetitions} ({task.progressPercent}%)
                                  </span>
                                </div>
                              )}
                              {isInGeofence && task.status === 'IN_PROGRESS' && (
                                <div className="bg-green-500 text-white p-2 rounded-lg font-bold text-center mt-2 animate-pulse">
                                  ✓ Dentro del área de trabajo
                                </div>
                              )}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    </React.Fragment>
                  );
                })}
              </MapContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 p-5 bg-white rounded-xl shadow-md border border-gray-200">
        <Button
          icon="pi pi-arrow-left"
          label={showCalendar ? "Volver a Lista" : "Volver al Calendario"}
          className="p-button-text text-sm"
          onClick={handleBackClick}
        />
        <div className="flex-1 text-center">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
            {worker.user.roles.some(x => x.name === 'Supervisor') && <Icon icon="mdi:account-hard-hat" className="text-blue-600" />}
            {worker.user.firstName} {worker.user.lastName}
          </h1>
          <p className="text-sm text-gray-600">{worker.user.email}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Plan Activo</div>
          <div className="text-sm font-semibold text-gray-900">{worker.workPlan.planName}</div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {showCalendar ? (
          <Card className="rounded-xl border border-gray-200 shadow-md">
            <div className="flex justify-between items-center mb-4 pb-3 border-b">
              <Button
                icon="pi pi-chevron-left"
                onClick={() => setCurrentMonth(subDays(currentMonth, 30))}
                className="p-button-text"
              />
              <h3 className="text-xl font-bold text-gray-900">
                {format(currentMonth, 'MMMM yyyy', { locale: es }).toUpperCase()}
              </h3>
              <Button
                icon="pi pi-chevron-right"
                onClick={() => setCurrentMonth(addDays(currentMonth, 30))}
                className="p-button-text"
              />
            </div>
            {renderCalendar()}
          </Card>
        ) : (
          <Card className="rounded-xl border border-gray-200 shadow-md">
            {renderDailyView()}
          </Card>
        )}
      </div>
    </div>
  );
};

export default WorkerScheduleCalendar;