import React, { useEffect, useState, useMemo } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap, Circle } from 'react-leaflet';
import { Icon as LeafletIcon, LatLngBounds } from 'leaflet';
import { Icon } from '@iconify/react';
import { Tag } from 'primereact/tag';
import { Chip } from 'primereact/chip';
import { InputNumber } from 'primereact/inputnumber';
import { Dialog } from 'primereact/dialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { Timeline } from 'primereact/timeline';
import { Divider } from 'primereact/divider';
import { Skeleton } from 'primereact/skeleton';
import { Badge } from 'primereact/badge';
import { ToggleButton } from 'primereact/togglebutton';
import { SelectButton } from 'primereact/selectbutton';
import { Tooltip } from 'primereact/tooltip';
import { 
  WorkPlanFormData, 
  WorkPlanPreviewResponse, 
  WorkerAssignment,
  DailySchedulePreview,
  ScheduledTask,
  ClusterInfo,
  GeoJSONGeometry
} from '../../types/workplan.types';
import 'leaflet/dist/leaflet.css';
import { workPlansApi } from '../../services/work-plan-api.service';

interface Props {
  formData: WorkPlanFormData;
  onBack: () => void;
  onGenerate: () => void;
}

// ============================================================================
// COMPONENTE: Ajustador automático de bounds del mapa
// ============================================================================
const MapBoundsAdjuster: React.FC<{ bounds: LatLngBounds | null }> = ({ bounds }) => {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  
  return null;
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const PreviewStep: React.FC<Props> = ({ formData, onBack, onGenerate }) => {
  const [preview, setPreview] = useState<WorkPlanPreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  
  // Estados de UI
  const [selectedWorker, setSelectedWorker] = useState<WorkerAssignment | null>(null);
  const [selectedDay, setSelectedDay] = useState<DailySchedulePreview | null>(null);
  const [hoveredWorkerId, setHoveredWorkerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [mapView, setMapView] = useState<'all' | 'clusters' | 'worker'>('all');
  const [showStoreMarkers, setShowStoreMarkers] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  
  // Simulación
  const [tempWorkerCount, setTempWorkerCount] = useState<number>(formData.selectedUsers.length);
  const [simulatedWorkers, setSimulatedWorkers] = useState<number>(formData.selectedUsers.length);

  // ============================================================================
  // ICONOS LEAFLET
  // ============================================================================
  const storeIcon = new LeafletIcon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzNiIgaGVpZ2h0PSIzNiIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjMUI1RUQxIiBkPSJNMjAgNEg0djJoMTZWNE0yMCAxOEg0djJoMTZ2LTJNNC0yaDIwdjJINFYtMloiLz48L3N2Zz4=',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });

  const clusterIcon = new LeafletIcon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDI0IDI0Ij48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI4IiBmaWxsPSIjRkY5ODAwIiBvcGFjaXR5PSIwLjMiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI1IiBmaWxsPSIjRkY5ODAwIi8+PC9zdmc+',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24]
  });

  // ============================================================================
  // PALETA DE COLORES PARA TRABAJADORES
  // ============================================================================
  const WORKER_COLORS = [
    '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', 
    '#06B6D4', '#EC4899', '#F97316', '#14B8A6', '#6366F1',
    '#84CC16', '#F43F5E', '#8B5CF6', '#0EA5E9', '#D946EF'
  ];

  // ============================================================================
  // CARGA INICIAL
  // ============================================================================
  useEffect(() => {
    loadPreview();
  }, []);

  const loadPreview = async (workers?: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await workPlansApi.preview(formData, workers);
      setPreview(data);
      if (workers) {
        setSimulatedWorkers(workers);
        setTempWorkerCount(workers);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar vista previa');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateWorkers = async () => {
    if (tempWorkerCount === simulatedWorkers) return;
    await loadPreview(tempWorkerCount);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await onGenerate();
    } finally {
      setGenerating(false);
    }
  };

  // ============================================================================
  // UTILIDADES
  // ============================================================================
  const formatTime = (min: number): string => {
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('es-ES', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    }).format(date);
  };

  const getEfficiencyColor = (score: number): 'success' | 'warning' | 'danger' => {
    if (score >= 70) return 'success';
    if (score >= 50) return 'warning';
    return 'danger';
  };

  const geoJSONToLeaflet = (geometry: GeoJSONGeometry | null): [number, number][] => {
    if (!geometry || geometry.type !== 'LineString') return [];
    return (geometry.coordinates as number[][]).map(coord => [coord[1], coord[0]]);
  };

  // ============================================================================
  // CÁLCULO DE BOUNDS DEL MAPA
  // ============================================================================
  const calculateMapBounds = useMemo((): LatLngBounds | null => {
    if (!preview) return null;
    
    const allCoords: [number, number][] = [];
    
    // Agregar centroides de clusters
    (preview.clusters ?? []).forEach(cluster => {
      allCoords.push([cluster.centroid.lat, cluster.centroid.lng]);
    });
    
    // Agregar todas las tareas de trabajo
    (preview.workerAssignments ?? []).forEach(worker => {
      worker.dailySchedules.forEach(day => {
        day.tasks?.filter(t => t.type === 'WORK').forEach(task => {
          allCoords.push([task.coordinates.lat, task.coordinates.lng]);
        });
      });
    });
    
    if (allCoords.length === 0) return null;
    
    return new LatLngBounds(allCoords);
  }, [preview]);

  // ============================================================================
  // RUTAS FILTRADAS SEGÚN VISTA
  // ============================================================================
  const filteredRoutes = useMemo(() => {
    if (!preview) return [];
    
    if (mapView === 'worker' && selectedWorker) {
      return [selectedWorker];
    }
    
    if (hoveredWorkerId) {
      return preview.workerAssignments.filter(w => w.userId === hoveredWorkerId);
    }
    
    return preview.workerAssignments;
  }, [preview, mapView, selectedWorker, hoveredWorkerId]);

  // ============================================================================
  // LOADING STATE
  // ============================================================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Card className="w-full max-w-2xl shadow-2xl">
          <div className="text-center space-y-6 py-8">
            <div className="flex justify-center">
              <div className="relative">
                <ProgressSpinner 
                  style={{ width: '120px', height: '120px' }}
                  strokeWidth="4"
                  className="text-blue-600"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon icon="mdi:brain" className="text-5xl text-blue-600 animate-pulse" />
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Optimizando Plan de Trabajo
              </h2>
              <p className="text-lg text-gray-600">
                Analizando {formData.selectedStores.length} locales con {tempWorkerCount} trabajador{tempWorkerCount !== 1 ? 'es' : ''}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon icon="mdi:check-circle" className="text-2xl text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Clustering Geográfico</p>
                  <p className="text-sm text-gray-600">Agrupando locales por proximidad</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon icon="mdi:check-circle" className="text-2xl text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Matriz de Distancias OSRM</p>
                  <p className="text-sm text-gray-600">Calculando rutas reales</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 animate-spin">
                  <Icon icon="mdi:loading" className="text-2xl text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Optimización VROOM</p>
                  <p className="text-sm text-gray-600">Generando rutas óptimas...</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================
  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-l-4 border-red-500 bg-red-50">
          <div className="flex items-start gap-4">
            <Icon icon="mdi:alert-circle" className="text-4xl text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-red-900 mb-2">Error al Generar Preview</h3>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </Card>
        <div className="flex gap-3">
          <Button 
            label="Volver" 
            icon={<Icon icon="mdi:arrow-left" />}
            onClick={onBack} 
            outlined 
            size="large"
          />
          <Button 
            label="Reintentar" 
            icon={<Icon icon="mdi:refresh" />}
            onClick={() => loadPreview()}
            size="large"
            severity="info"
          />
        </div>
      </div>
    );
  }

  if (!preview) return null;

  const mapBounds = calculateMapBounds;

  // ============================================================================
  // RENDER PRINCIPAL
  // ============================================================================
  return (
    <div className="space-y-6 pb-12">
      {/* ====================================================================== */}
      {/* HEADER EJECUTIVO */}
      {/* ====================================================================== */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <Icon icon="mdi:clipboard-text" className="text-4xl" />
              <div>
                <h1 className="text-4xl font-bold">{preview.planSummary?.planName || 'Plan de Trabajo'}</h1>
                {/* <p className="text-blue-100 text-lg mt-1">
                  Vista previa generada con IA
                </p> */}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="mdi:store" className="text-2xl" />
                  <p className="text-sm text-blue-100">Locales</p>
                </div>
                <p className="text-3xl font-bold">{preview.planSummary?.totalStores || 0}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="mdi:account-group" className="text-2xl" />
                  <p className="text-sm text-blue-100">Trabajadores</p>
                </div>
                <p className="text-3xl font-bold">{preview.planSummary?.totalUsers || 0}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="mdi:calendar-check" className="text-2xl" />
                  <p className="text-sm text-blue-100">Días Estimados</p>
                </div>
                <p className="text-3xl font-bold">{preview.planSummary?.estimatedDays || 0}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="mdi:chart-line" className="text-2xl" />
                  <p className="text-sm text-blue-100">Eficiencia</p>
                </div>
                <p className="text-3xl font-bold">{preview.planSummary?.efficiency || 0}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* STATUS DEL PLAN */}
      {/* ====================================================================== */}
      {preview.planSummary?.isOnSchedule ? (
        <Card className="border-l-4 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <Icon icon="mdi:check-circle" className="text-4xl text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-green-900 mb-2">
                ✓ Plan Viable - Dentro del Plazo
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-600 mb-1">Tiempo de Trabajo</p>
                  <p className="text-xl font-bold text-green-700">{formatTime(preview.planSummary?.totalWorkMinutes ?? 0)}</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-600 mb-1">Tiempo de Viaje</p>
                  <p className="text-xl font-bold text-purple-700">{formatTime(preview.planSummary?.totalTravelMinutes ?? 0)}</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-600 mb-1">Días Disponibles</p>
                  <p className="text-xl font-bold text-blue-700">{preview.planSummary?.workingDaysAvailable ?? 0}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="border-l-4 border-orange-500 bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <Icon icon="mdi:alert" className="text-4xl text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-orange-900 mb-2">
                ⚠ Ajuste de Recursos Necesario
              </h3>
              <p className="text-orange-800 text-lg mb-4">
                Se requieren <strong>{preview.planSummary?.workersNeeded ?? '?'} trabajadores</strong> para cumplir el deadline.
                Actualmente tienes <strong>{preview.planSummary?.totalUsers ?? 0}</strong>.
              </p>
              <div className="bg-white rounded-lg p-4 inline-block">
                <p className="text-sm text-gray-600">Diferencia requerida</p>
                <p className="text-3xl font-bold text-orange-600">
                  +{(preview.planSummary?.workersNeeded ?? 0) - (preview.planSummary?.totalUsers ?? 0)} trabajadores
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ====================================================================== */}
      {/* WARNINGS */}
      {/* ====================================================================== */}
      {(preview.warnings ?? []).length > 0 && (
        <div className="space-y-3">
          {(preview.warnings ?? []).map((warning: string, idx: number) => (
            <Card key={idx} className="border-l-4 border-yellow-500 bg-yellow-50">
              <div className="flex items-center gap-3">
                <Icon icon="mdi:alert-circle-outline" className="text-2xl text-yellow-600 flex-shrink-0" />
                <p className="text-yellow-900 font-medium">{warning}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ====================================================================== */}
      {/* SIMULADOR DE TRABAJADORES */}
      {/* ====================================================================== */}
      {preview.canSimulateWorkers && (
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center">
                  <Icon icon="mdi:account-cog" className="text-3xl text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Simulador de Personal</h3>
                  <p className="text-gray-600">Ajusta la cantidad de trabajadores y genera un nuevo preview</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <p className="text-sm font-semibold text-gray-700">Cantidad de Trabajadores:</p>
                  <InputNumber
                    value={tempWorkerCount}
                    onValueChange={(e) => setTempWorkerCount(e.value || 1)}
                    min={1}
                    max={Math.max(formData.selectedUsers.length * 3, 30)}
                    showButtons
                    buttonLayout="horizontal"
                    decrementButtonClassName="p-button-outlined p-button-secondary"
                    incrementButtonClassName="p-button-outlined p-button-secondary"
                    className="w-40"
                    size="large"
                  />
                  <Tag 
                    severity={tempWorkerCount === simulatedWorkers ? 'success' : 'info'}
                    value={tempWorkerCount === simulatedWorkers ? 'Actual' : 'Modificado'}
                  />
                </div>
                <Button
                  label="Generar Nuevo Preview"
                  icon={<Icon icon="mdi:refresh" />}
                  onClick={handleSimulateWorkers}
                  disabled={tempWorkerCount === simulatedWorkers || loading}
                  loading={loading}
                  severity="info"
                  size="large"
                  className="font-semibold"
                />
              </div>

              {(preview.suggestedWorkerCounts ?? []).length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Sugerencias Rápidas:</p>
                  <div className="flex gap-2 flex-wrap">
                    {(preview.suggestedWorkerCounts ?? []).map((count: number) => (
                      <Chip
                        key={count}
                        label={`${count} trabajador${count !== 1 ? 'es' : ''}`}
                        onClick={() => setTempWorkerCount(count)}
                        className={`cursor-pointer transition-all ${
                          count === tempWorkerCount
                            ? 'bg-indigo-600 text-white shadow-lg scale-105'
                            : 'bg-white text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ====================================================================== */}
      {/* MAPA INTERACTIVO */}
      {/* ====================================================================== */}
      <Card className="shadow-xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Icon icon="mdi:map" className="text-3xl text-blue-600" />
              Mapa de Rutas Optimizadas
            </h3>
            
            <div className="flex items-center gap-3 flex-wrap">
              <SelectButton
                value={mapView}
                onChange={(e) => setMapView(e.value)}
                options={[
                  { label: 'Todas', value: 'all', icon: 'mdi:view-grid' },
                  { label: 'Clusters', value: 'clusters', icon: 'mdi:group' },
                  { label: 'Trabajador', value: 'worker', icon: 'mdi:account' }
                ]}
                optionLabel="label"
                optionValue="value"
                className="text-sm"
              />
              
              <ToggleButton
                checked={showStoreMarkers}
                onChange={(e) => setShowStoreMarkers(e.value)}
                onLabel="Locales"
                offLabel="Locales"
                onIcon="pi pi-map-marker"
                offIcon="pi pi-map-marker"
                className="text-sm"
              />
              
              <ToggleButton
                checked={showRoutes}
                onChange={(e) => setShowRoutes(e.value)}
                onLabel="Rutas"
                offLabel="Rutas"
                onIcon="pi pi-directions"
                offIcon="pi pi-directions"
                className="text-sm"
              />
            </div>
          </div>

          <div className="h-[700px] rounded-2xl overflow-hidden border-2 border-gray-200 shadow-inner">
            <MapContainer
              center={[-12.0464, -77.0428]}
              zoom={6}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {mapBounds && <MapBoundsAdjuster bounds={mapBounds} />}
              
              {/* Clusters con círculos de radio */}
              {(mapView === 'all' || mapView === 'clusters') && (preview.clusters ?? []).map((cluster: ClusterInfo, idx: number) => (
                <React.Fragment key={cluster.id}>
                  <Circle
                    center={[cluster.centroid.lat, cluster.centroid.lng]}
                    radius={60000} // 60km
                    pathOptions={{
                      fillColor: '#FF9800',
                      fillOpacity: 0.1,
                      color: '#FF9800',
                      weight: 2,
                      opacity: 0.4,
                      dashArray: '5, 10'
                    }}
                  />
                  <Marker
                    position={[cluster.centroid.lat, cluster.centroid.lng]}
                    icon={clusterIcon}
                  >
                    <Popup>
                      <div className="p-3 min-w-[250px]">
                        <h4 className="font-bold text-lg mb-3 text-orange-700 flex items-center gap-2">
                          <Icon icon="mdi:map-marker-radius" />
                          Zona Geográfica {idx + 1}
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Locales:</span>
                            <strong className="text-gray-900">{cluster.storeCount}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Actividades:</span>
                            <strong className="text-gray-900">{cluster.totalActivities}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tiempo Total:</span>
                            <strong className="text-green-700">{formatTime(cluster.totalMinutes)}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Días Estimados:</span>
                            <strong className="text-blue-700">{cluster.estimatedDays}</strong>
                          </div>
                          {cluster.primaryCity && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Ciudad:</span>
                              <strong className="text-gray-900">{cluster.primaryCity}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              ))}

              {/* Rutas de Trabajadores */}
              {showRoutes && filteredRoutes.map((worker: WorkerAssignment, wIdx: number) => {
                const color = WORKER_COLORS[wIdx % WORKER_COLORS.length];
                const isHovered = hoveredWorkerId === worker.userId;
                const isSelected = selectedWorker?.userId === worker.userId;
                
                return (worker.dailySchedules ?? []).map((day: DailySchedulePreview, dIdx: number) => {
                  const geometry = day.fullRouteGeometry || day.routeGeometry;
                  if (!geometry) return null;
                  
                  const coords = geoJSONToLeaflet(geometry);
                  if (coords.length === 0) return null;
                  
                  return (
                    <Polyline
                      key={`${worker.userId}-${dIdx}`}
                      positions={coords}
                      pathOptions={{
                        color: color,
                        weight: isHovered || isSelected ? 6 : 3,
                        opacity: isHovered || isSelected ? 1 : 0.7
                      }}
                      eventHandlers={{
                        click: () => {
                          setSelectedWorker(worker);
                          setSelectedDay(day);
                        }
                      }}
                    >
                      <Popup>
                        <div className="p-3 min-w-[250px]">
                          <h4 className="font-bold text-base mb-2 flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: color }}
                            />
                            {worker.userName}
                          </h4>
                          <div className="space-y-2 text-sm">
                            <p className="text-gray-700 font-semibold">{formatDate(day.date)}</p>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Locales:</span>
                              <strong>{day.storesVisited}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Trabajo:</span>
                              <strong className="text-green-700">{formatTime(day.totalWorkMinutes)}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Viaje:</span>
                              <strong className="text-purple-700">{formatTime(day.totalTravelMinutes)}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Distancia:</span>
                              <strong className="text-blue-700">{day.totalDistanceKm} km</strong>
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </Polyline>
                  );
                });
              })}

              {/* Markers de Tiendas */}
              {showStoreMarkers && selectedDay && (selectedDay.tasks ?? [])
                .filter(t => t.type === 'WORK')
                .map((task: ScheduledTask, idx: number) => (
                  <Marker
                    key={`task-${idx}`}
                    position={[task.coordinates.lat, task.coordinates.lng]}
                    icon={storeIcon}
                  >
                    <Popup>
                      <div className="p-3">
                        <h4 className="font-bold text-base mb-2">{task.storeName}</h4>
                        <div className="space-y-1 text-sm">
                          <p className="text-gray-700">{task.taskName}</p>
                          <p className="text-xs text-gray-500">{task.storeAddress}</p>
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                            <Icon icon="mdi:clock-outline" className="text-blue-600" />
                            <span className="font-semibold">{task.startTime} - {task.endTime}</span>
                          </div>
                          {task.taskNumber && task.totalRepetitions && (
                            <Tag 
                              value={`Repetición ${task.taskNumber}/${task.totalRepetitions}`}
                              severity="info"
                              className="text-xs mt-2"
                            />
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
            </MapContainer>
          </div>

          {/* Leyenda Interactiva */}
          <div className="bg-gray-50 rounded-xl p-6">
            <p className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Icon icon="mdi:palette" />
              Leyenda de Trabajadores
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {(preview.workerAssignments ?? []).map((worker: WorkerAssignment, idx: number) => {
                const color = WORKER_COLORS[idx % WORKER_COLORS.length];
                const isHovered = hoveredWorkerId === worker.userId;
                const isSelected = selectedWorker?.userId === worker.userId;
                
                return (
                  <div
                    key={worker.userId}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-blue-100 shadow-md scale-105' 
                        : isHovered 
                          ? 'bg-gray-100' 
                          : 'bg-white hover:bg-gray-50'
                    }`}
                    onMouseEnter={() => setHoveredWorkerId(worker.userId)}
                    onMouseLeave={() => setHoveredWorkerId(null)}
                    onClick={() => {
                      setSelectedWorker(worker);
                      setMapView('worker');
                    }}
                  >
                    <div 
                      className="w-5 h-5 rounded-full flex-shrink-0 shadow-sm" 
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{worker.userName}</p>
                      <p className="text-xs text-gray-600">{worker.metrics.totalDays} días</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* ====================================================================== */}
      {/* TABS: TRABAJADORES / CRONOGRAMA */}
      {/* ====================================================================== */}
      <Card className="shadow-xl">
        <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
          {/* ================================================================ */}
          {/* TAB: DISTRIBUCIÓN POR TRABAJADOR */}
          {/* ================================================================ */}
          <TabPanel 
            header={
              <div className="flex items-center gap-2">
                <Icon icon="mdi:account-group" className="text-xl" />
                <span>Distribución por Trabajador ({(preview.workerAssignments ?? []).length})</span>
              </div>
            }
          >
            <div className="space-y-6">
              {(preview.workerAssignments ?? []).map((worker: WorkerAssignment, idx: number) => (
                <Card 
                  key={worker.userId}
                  className="bg-gradient-to-br from-white to-gray-50 shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="space-y-6">
                    {/* Header del Trabajador */}
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg"
                          style={{ backgroundColor: WORKER_COLORS[idx % WORKER_COLORS.length] }}
                        >
                          {worker.userName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">{worker.userName}</h3>
                          <p className="text-gray-600 mt-1">
                            {worker.metrics?.totalDays ?? 0} días laborables • {worker.metrics?.totalStores ?? 0} locales
                          </p>
                        </div>
                      </div>
                      <Tag 
                        severity={getEfficiencyColor(worker.metrics?.efficiencyScore ?? 0)}
                        value={`${worker.metrics?.efficiencyScore ?? 0}% eficiencia`}
                        className="text-lg px-4 py-2"
                      />
                    </div>

                    {/* Métricas Detalladas */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-green-50 rounded-xl p-4 border-l-4 border-green-500">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon icon="mdi:briefcase" className="text-xl text-green-600" />
                          <p className="text-xs font-semibold text-green-700">Tiempo Trabajo</p>
                        </div>
                        <p className="text-2xl font-bold text-green-900">{formatTime(worker.metrics?.totalWorkMinutes ?? 0)}</p>
                      </div>

                      <div className="bg-purple-50 rounded-xl p-4 border-l-4 border-purple-500">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon icon="mdi:car" className="text-xl text-purple-600" />
                          <p className="text-xs font-semibold text-purple-700">Tiempo Viaje</p>
                        </div>
                        <p className="text-2xl font-bold text-purple-900">{formatTime(worker.metrics?.totalTravelMinutes ?? 0)}</p>
                      </div>

                      <div className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-500">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon icon="mdi:map-marker-distance" className="text-xl text-blue-600" />
                          <p className="text-xs font-semibold text-blue-700">Distancia</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-900">{worker.metrics?.totalDistanceKm ?? 0} km</p>
                      </div>

                      <div className="bg-indigo-50 rounded-xl p-4 border-l-4 border-indigo-500">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon icon="mdi:checkbox-marked-circle" className="text-xl text-indigo-600" />
                          <p className="text-xs font-semibold text-indigo-700">Actividades</p>
                        </div>
                        <p className="text-2xl font-bold text-indigo-900">{worker.metrics?.totalActivities ?? 0}</p>
                      </div>
                    </div>

                    {/* Timeline de Días */}
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Icon icon="mdi:calendar-month" />
                        Cronograma Detallado
                      </h4>
                      
                      <Timeline 
                        value={worker.dailySchedules ?? []}
                        align="alternate"
                        className="customized-timeline"
                        marker={(item: DailySchedulePreview) => (
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full text-white font-bold shadow-lg">
                            {worker.dailySchedules.indexOf(item) + 1}
                          </div>
                        )}
                        content={(item: DailySchedulePreview) => (
                          <Card className="shadow-md hover:shadow-xl transition-shadow cursor-pointer" onClick={() => {
                            setSelectedDay(item);
                            setSelectedWorker(worker);
                          }}>
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h5 className="font-bold text-gray-900 text-lg">{formatDate(item.date)}</h5>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {item.startTime} - {item.endTime}
                                  </p>
                                </div>
                                {item.requiresOvernightStay && (
                                  <Tag severity="warning" icon="pi pi-moon" value="Estadía" />
                                )}
                              </div>

                              <div className="grid grid-cols-3 gap-3">
                                <div className="bg-gray-50 rounded-lg p-2">
                                  <p className="text-xs text-gray-600">Locales</p>
                                  <p className="font-bold text-gray-900">{item.storesVisited}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-2">
                                  <p className="text-xs text-gray-600">Trabajo</p>
                                  <p className="font-bold text-green-700">{formatTime(item.totalWorkMinutes)}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-2">
                                  <p className="text-xs text-gray-600">Viaje</p>
                                  <p className="font-bold text-purple-700">{formatTime(item.totalTravelMinutes)}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Icon icon="mdi:clipboard-list" />
                                <span>{item.activitiesCompleted} actividades • {item.totalDistanceKm} km</span>
                              </div>
                            </div>
                          </Card>
                        )}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabPanel>

          {/* ================================================================ */}
          {/* TAB: CLUSTERS GEOGRÁFICOS */}
          {/* ================================================================ */}
          <TabPanel 
            header={
              <div className="flex items-center gap-2">
                <Icon icon="mdi:map-marker-radius" className="text-xl" />
                <span>Zonas Geográficas ({(preview.clusters ?? []).length})</span>
              </div>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(preview.clusters ?? []).map((cluster: ClusterInfo, idx: number) => (
                <Card key={cluster.id} className="bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md">
                        {idx + 1}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Zona {idx + 1}</h3>
                        {cluster.primaryCity && (
                          <p className="text-gray-600">{cluster.primaryCity}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Locales</p>
                        <p className="text-2xl font-bold text-gray-900">{cluster.storeCount}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Actividades</p>
                        <p className="text-2xl font-bold text-gray-900">{cluster.totalActivities}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Tiempo Total</p>
                        <p className="text-xl font-bold text-green-700">{formatTime(cluster.totalMinutes)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Días Estimados</p>
                        <p className="text-2xl font-bold text-blue-700">{cluster.estimatedDays}</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Coordenadas del Centro</p>
                      <p className="text-sm font-mono text-gray-900">
                        {cluster.centroid.lat.toFixed(4)}, {cluster.centroid.lng.toFixed(4)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabPanel>
        </TabView>
      </Card>

      {/* ====================================================================== */}
      {/* MODAL: DÍA SELECCIONADO */}
      {/* ====================================================================== */}
      <Dialog
        header={selectedDay ? formatDate(selectedDay.date) : ''}
        visible={!!selectedDay}
        onHide={() => setSelectedDay(null)}
        style={{ width: '90vw', maxWidth: '1200px' }}
        breakpoints={{ '960px': '95vw' }}
        maximizable
      >
        {selectedDay && (
          <div className="space-y-6">
            {/* Resumen del Día */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                <div className="flex items-center gap-3">
                  <Icon icon="mdi:store" className="text-3xl text-blue-600" />
                  <div>
                    <p className="text-xs text-blue-700">Locales</p>
                    <p className="text-2xl font-bold text-blue-900">{selectedDay.storesVisited}</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100">
                <div className="flex items-center gap-3">
                  <Icon icon="mdi:briefcase" className="text-3xl text-green-600" />
                  <div>
                    <p className="text-xs text-green-700">Trabajo</p>
                    <p className="text-2xl font-bold text-green-900">{formatTime(selectedDay.totalWorkMinutes)}</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                <div className="flex items-center gap-3">
                  <Icon icon="mdi:car" className="text-3xl text-purple-600" />
                  <div>
                    <p className="text-xs text-purple-700">Viaje</p>
                    <p className="text-2xl font-bold text-purple-900">{formatTime(selectedDay.totalTravelMinutes)}</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
                <div className="flex items-center gap-3">
                  <Icon icon="mdi:map-marker-distance" className="text-3xl text-orange-600" />
                  <div>
                    <p className="text-xs text-orange-700">Distancia</p>
                    <p className="text-2xl font-bold text-orange-900">{selectedDay.totalDistanceKm} km</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Tareas del Día */}
            <div>
              <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Icon icon="mdi:format-list-numbered" />
                Secuencia de Tareas ({(selectedDay.tasks ?? []).length})
              </h4>
              
              <div className="space-y-3">
                {(selectedDay.tasks ?? []).map((task: ScheduledTask, idx: number) => (
                  <Card 
                    key={idx}
                    className={`${
                      task.type === 'WORK'
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500'
                        : 'bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500'
                    } hover:shadow-lg transition-shadow`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-lg text-gray-900 shadow-md flex-shrink-0">
                        {task.sequenceNumber}
                      </div>
                      
                      <div className="flex-1">
                        {task.type === 'WORK' ? (
                          <>
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h5 className="font-bold text-lg text-gray-900">{task.taskName}</h5>
                                <p className="text-gray-700 flex items-center gap-2 mt-1">
                                  <Icon icon="mdi:store" />
                                  {task.storeName}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">{task.storeAddress}</p>
                              </div>
                              {task.taskNumber && task.totalRepetitions && (
                                <Tag 
                                  value={`${task.taskNumber}/${task.totalRepetitions}`}
                                  severity="info"
                                  className="text-sm"
                                />
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <h5 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                              <Icon icon="mdi:car" />
                              Viaje entre Locales
                            </h5>
                            <p className="text-gray-700 mt-2">
                              {task.fromStoreName} → {task.storeName}
                            </p>
                          </>
                        )}

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Icon icon="mdi:clock-outline" className="text-blue-600" />
                              <span className="font-semibold">{task.startTime} - {task.endTime}</span>
                            </div>
                            <Tag value={formatTime(task.durationMinutes)} severity="secondary" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* ====================================================================== */}
      {/* NAVEGACIÓN */}
      {/* ====================================================================== */}
      <div className="flex justify-between items-center pt-8 border-t-2 border-gray-200">
        <Button 
          label="Paso Anterior" 
          icon={<Icon icon="mdi:arrow-left" />}
          onClick={onBack} 
          outlined 
          size="large"
          severity="secondary"
          className="font-semibold"
        />
        <Button
          label={generating ? "Generando Plan..." : "Confirmar y Generar Plan"}
          icon={generating ? <Icon icon="mdi:loading" className="animate-spin" /> : <Icon icon="mdi:check-circle" />}
          iconPos="right"
          onClick={handleGenerate}
          severity="success"
          size="large"
          disabled={generating}
          loading={generating}
          className="font-bold text-lg px-8"
        />
      </div>
    </div>
  );
};

export default PreviewStep;