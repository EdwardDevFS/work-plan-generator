import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Panel } from 'primereact/panel';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Icon } from '@iconify/react';
import { DepartmentAutocomplete } from '../../components/common/geodata/DepartmentAutocomplete';
import { ProvinceAutocomplete } from '../../components/common/geodata/ProvinceAutocomplete';
import { DistrictAutocomplete } from '../../components/common/geodata/DistrictAutocomplete';
import { Department, Province, District } from '../../types/rethinking/geodata.types';
import { Zonal, CreateZonalDto, CreateHeadquartersDto, CreateWorkplaceDto } from '../../types/rethinking/organization.types';
import { zonalsService } from '../../services/rethinking/zonals.service';

interface HeadquarterForm extends CreateHeadquartersDto {
  tempId: string;
}

interface WorkplaceForm extends CreateWorkplaceDto {
  tempId: string;
}

export const ZonalsManagement: React.FC = () => {
  const toast = React.useRef<Toast>(null);
  const [zonals, setZonals] = useState<Zonal[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingZonal, setEditingZonal] = useState<Zonal | null>(null);
  
  // Form state
  const [zonalName, setZonalName] = useState('');
  const [zonalDescription, setZonalDescription] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  
  const [headquarters, setHeadquarters] = useState<HeadquarterForm[]>([]);
  const [currentHq, setCurrentHq] = useState<Partial<HeadquarterForm>>({});
  const [currentWorkplace, setCurrentWorkplace] = useState<Partial<WorkplaceForm>>({});
  const [editingHqIndex, setEditingHqIndex] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await zonalsService.getAll('tenant-1');
      setZonals(response.data);
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al cargar zonales' });
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditingZonal(null);
    resetForm();
    setDialogVisible(true);
  };

  const resetForm = () => {
    setZonalName('');
    setZonalDescription('');
    setSelectedDepartment(null);
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setHeadquarters([]);
    setCurrentHq({});
    setCurrentWorkplace({});
    setEditingHqIndex(null);
  };

  const hideDialog = () => {
    setDialogVisible(false);
  };

  const addHeadquarter = () => {
    if (!currentHq.name) {
      toast.current?.show({ severity: 'warn', summary: 'Advertencia', detail: 'Ingrese nombre de la sede' });
      return;
    }

    if (!currentHq.workplaces || currentHq.workplaces.length === 0) {
      toast.current?.show({ severity: 'warn', summary: 'Advertencia', detail: 'Agregue al menos un local de trabajo' });
      return;
    }

    const newHq: HeadquarterForm = {
      tempId: `hq-${Date.now()}`,
      name: currentHq.name!,
      description: currentHq.description,
      address: currentHq.address,
      workplaces: currentHq.workplaces || [],
    };

    if (editingHqIndex !== null) {
      const updated = [...headquarters];
      updated[editingHqIndex] = newHq;
      setHeadquarters(updated);
      setEditingHqIndex(null);
    } else {
      setHeadquarters([...headquarters, newHq]);
    }

    setCurrentHq({});
  };

  const addWorkplace = () => {
    if (!currentWorkplace.name) {
      toast.current?.show({ severity: 'warn', summary: 'Advertencia', detail: 'Ingrese nombre del local' });
      return;
    }

    const newWorkplace: WorkplaceForm = {
      tempId: `wp-${Date.now()}`,
      name: currentWorkplace.name!,
      code: currentWorkplace.code,
      address: currentWorkplace.address,
    };

    setCurrentHq({
      ...currentHq,
      workplaces: [...(currentHq.workplaces || []), newWorkplace],
    });
    setCurrentWorkplace({});
  };

  const removeWorkplace = (tempId: string) => {
    setCurrentHq({
      ...currentHq,
      workplaces: currentHq.workplaces?.filter(wp => wp.tempId !== tempId),
    });
  };

  const removeHeadquarter = (tempId: string) => {
    setHeadquarters(headquarters.filter(hq => hq.tempId !== tempId));
  };

  const editHeadquarter = (index: number) => {
    setCurrentHq(headquarters[index]);
    setEditingHqIndex(index);
  };

  const saveZonal = async () => {
    if (!zonalName || !selectedDistrict) {
      toast.current?.show({ severity: 'warn', summary: 'Advertencia', detail: 'Complete todos los campos requeridos' });
      return;
    }

    if (headquarters.length === 0) {
      toast.current?.show({ severity: 'warn', summary: 'Advertencia', detail: 'Agregue al menos una sede' });
      return;
    }

    setLoading(true);
    try {
      const zonalData: CreateZonalDto = {
        name: zonalName,
        description: zonalDescription,
        idDepartment: selectedDepartment!.idDepartment,
        idProvince: selectedProvince!.idProvince,
        idDistrict: selectedDistrict.idDistrict,
        headquarters: headquarters.map(hq => ({
          name: hq.name,
          description: hq.description,
          address: hq.address,
          workplaces: hq.workplaces,
        })),
      };

      await zonalsService.create(zonalData, 'tenant-1');
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Zonal creado exitosamente' });
      hideDialog();
      loadData();
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al guardar' });
    } finally {
      setLoading(false);
    }
  };

  const deleteZonal = async (zonal: Zonal) => {
    if (window.confirm('¿Está seguro de eliminar este zonal?')) {
      try {
        await zonalsService.delete(zonal.id);
        toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Zonal eliminado' });
        loadData();
      } catch (error) {
        toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al eliminar' });
      }
    }
  };

  const actionBodyTemplate = (rowData: Zonal) => (
    <div className="flex gap-2">
      <Button 
        icon={<Icon icon="mdi:delete" className="text-base" />}
        className="!border-none !outline-none p-2 text-red-600 hover:bg-red-50 rounded-lg" 
        style={{ boxShadow: 'none' }}
        text
        onClick={() => deleteZonal(rowData)} 
      />
    </div>
  );

  const statusBodyTemplate = (rowData: Zonal) => (
    <Tag 
      value={rowData.isActive ? 'Activo' : 'Inactivo'} 
      severity={rowData.isActive ? 'success' : 'danger'}
      className="text-xs px-3 py-1"
    />
  );

  return (
    <div className="p-4">
      <Toast ref={toast} />
      
      {/* Header Section */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-900">Gestión de Zonales</h1>
        <p className="text-lg text-gray-500 -mt-5">Administre zonales, sedes y locales de trabajo</p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Toolbar */}
        <div className="pb-5 border-b border-gray-200 bg-gray-50">
          <Button 
            label="Nuevo Zonal" 
            icon={<Icon icon="mdi:plus" className="text-lg" />}
            className="!border-none !outline-none bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium"
            style={{ boxShadow: 'none' }}
            onClick={openNew} 
          />
        </div>
        
        {/* DataTable */}
        <DataTable
          value={zonals}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          className="text-sm custom-datatable"
          emptyMessage="No hay zonales registrados"
          stripedRows
        >
          <Column 
            field="name" 
            header="Nombre" 
            sortable 
            className="font-medium text-gray-900"
          />
          <Column 
            field="description" 
            header="Descripción"
            className="text-gray-700"
          />
          <Column 
            field="departmentName" 
            header="Ubicación" 
            body={(rowData) => `${rowData.districtName || ''}`}
            className="text-gray-600 text-xs"
          />
          <Column 
            header="Estado" 
            body={statusBodyTemplate}
            style={{ width: '100px' }}
          />
          <Column 
            header="Acciones" 
            body={actionBodyTemplate} 
            style={{ width: '100px' }}
            className="text-center"
          />
        </DataTable>
      </div>

      {/* Dialog */}
      <Dialog
        visible={dialogVisible}
        style={{ width: '900px' }}
        header={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon icon="mdi:map-marker-multiple" className="text-blue-700 text-xl" />
            </div>
            <div className="leading-tight">
              <h2 className="text-lg font-semibold text-gray-900 mb-0">Nuevo Zonal</h2>
              <p className="text-xs text-gray-500 mt-0.5">Complete la información del zonal, sedes y locales</p>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <div className="space-y-4 mt-4">
          {/* Información del Zonal */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Icon icon="mdi:information" className="text-gray-500" />
              Información del Zonal
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Nombre del Zonal *</label>
                <InputText
                  value={zonalName}
                  onChange={(e) => setZonalName(e.target.value)}
                  placeholder="Ej: PCM Tacna"
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Descripción</label>
                <InputTextarea
                  value={zonalDescription}
                  onChange={(e) => setZonalDescription(e.target.value)}
                  rows={3}
                  placeholder="Descripción del zonal"
                  className="text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Departamento *</label>
                  <DepartmentAutocomplete
                    value={selectedDepartment}
                    onChange={(dept) => {
                      setSelectedDepartment(dept);
                      setSelectedProvince(null);
                      setSelectedDistrict(null);
                    }}
                    countryId={1}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Provincia *</label>
                  <ProvinceAutocomplete
                    value={selectedProvince}
                    onChange={(prov) => {
                      setSelectedProvince(prov);
                      setSelectedDistrict(null);
                    }}
                    departmentId={selectedDepartment?.idDepartment}
                    disabled={!selectedDepartment}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Distrito *</label>
                  <DistrictAutocomplete
                    value={selectedDistrict}
                    onChange={setSelectedDistrict}
                    provinceId={selectedProvince?.idProvince}
                    disabled={!selectedProvince}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sedes */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Icon icon="mdi:office-building" className="text-gray-500" />
              Sedes y Locales de Trabajo
            </h3>
            
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3 text-sm">
                {editingHqIndex !== null ? 'Editar Sede' : 'Agregar Nueva Sede'}
              </h4>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Nombre *</label>
                    <InputText
                      value={currentHq.name || ''}
                      onChange={(e) => setCurrentHq({ ...currentHq, name: e.target.value })}
                      placeholder="Ej: Sede Ciudad Nueva"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Dirección</label>
                    <InputText
                      value={currentHq.address || ''}
                      onChange={(e) => setCurrentHq({ ...currentHq, address: e.target.value })}
                      placeholder="Dirección de la sede"
                      className="text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Descripción</label>
                  <InputTextarea
                    value={currentHq.description || ''}
                    onChange={(e) => setCurrentHq({ ...currentHq, description: e.target.value })}
                    rows={2}
                    placeholder="Descripción de la sede"
                    className="text-sm"
                  />
                </div>

                {/* Locales de trabajo */}
                <div className="border-t border-blue-200 pt-3 mt-3">
                  <h5 className="font-semibold text-gray-700 mb-2 text-xs">Locales de Trabajo (Mínimo 1) *</h5>
                  
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <InputText
                      value={currentWorkplace.name || ''}
                      onChange={(e) => setCurrentWorkplace({ ...currentWorkplace, name: e.target.value })}
                      placeholder="Nombre del local"
                      className="text-sm"
                    />
                    <InputText
                      value={currentWorkplace.code || ''}
                      onChange={(e) => setCurrentWorkplace({ ...currentWorkplace, code: e.target.value })}
                      placeholder="Código"
                      className="text-sm"
                    />
                    <Button
                      label="Agregar Local"
                      icon={<Icon icon="mdi:plus" className="text-base mr-2" />}
                      className="!border-none !outline-none bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium"
                      style={{ boxShadow: 'none' }}
                      onClick={addWorkplace}
                    />
                  </div>

                  {currentHq.workplaces && currentHq.workplaces.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {currentHq.workplaces.map((wp) => (
                        <div key={wp.tempId} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                          <div>
                            <span className="font-medium text-sm">{wp.name}</span>
                            {wp.code && <span className="text-xs text-gray-500 ml-2">({wp.code})</span>}
                          </div>
                          <Button
                            icon={<Icon icon="mdi:delete" className="text-base" />}
                            className="!border-none !outline-none p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            style={{ boxShadow: 'none' }}
                            text
                            onClick={() => removeWorkplace(wp.tempId)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  {editingHqIndex !== null && (
                    <Button
                      label="Cancelar"
                      icon={<Icon icon="mdi:close" className="text-base mr-2" />}
                      className="!border-none !outline-none text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm"
                      style={{ boxShadow: 'none' }}
                      text
                      onClick={() => {
                        setCurrentHq({});
                        setEditingHqIndex(null);
                      }}
                    />
                  )}
                  <Button
                    label={editingHqIndex !== null ? 'Actualizar Sede' : 'Agregar Sede'}
                    icon={<Icon icon="mdi:check" className="text-base mr-2" />}
                    className="!border-none !outline-none bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    style={{ boxShadow: 'none' }}
                    onClick={addHeadquarter}
                  />
                </div>
              </div>
            </div>

            {/* Lista de sedes agregadas */}
            {headquarters.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-gray-700 mb-3 text-sm">Sedes Agregadas ({headquarters.length})</h4>
                <Accordion>
                  {headquarters.map((hq, index) => (
                    <AccordionTab
                      key={hq.tempId}
                      header={
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium text-sm">{hq.name}</span>
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              icon={<Icon icon="mdi:pencil" className="text-base" />}
                              className="!border-none !outline-none p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              style={{ boxShadow: 'none' }}
                              text
                              onClick={() => editHeadquarter(index)}
                            />
                            <Button
                              icon={<Icon icon="mdi:delete" className="text-base" />}
                              className="!border-none !outline-none p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              style={{ boxShadow: 'none' }}
                              text
                              onClick={() => removeHeadquarter(hq.tempId)}
                            />
                          </div>
                        </div>
                      }
                    >
                      <div className="space-y-2">
                        {hq.description && (
                          <p className="text-sm text-gray-600">{hq.description}</p>
                        )}
                        {hq.address && (
                          <p className="text-sm text-gray-600">📍 {hq.address}</p>
                        )}
                        <div>
                          <h5 className="font-semibold text-sm mb-2">Locales ({hq.workplaces.length})</h5>
                          <ul className="list-disc list-inside space-y-1">
                            {hq.workplaces.map((wp) => (
                              <li key={wp.tempId} className="text-sm">
                                {wp.name} {wp.code && `(${wp.code})`}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </AccordionTab>
                  ))}
                </Accordion>
              </div>
            )}
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
            onClick={hideDialog} 
          />
          <Button 
            label="Crear Zonal" 
            icon={<Icon icon="mdi:check" className="text-base mr-2" />}
            className="!border-none !outline-none bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
            style={{ boxShadow: 'none' }}
            onClick={saveZonal} 
            loading={loading} 
          />
        </div>
      </Dialog>

      {/* Estilos personalizados para el DataTable */}
      <style>{`
        .custom-datatable .p-datatable-thead > tr > th.p-highlight {
          background-color: #1f2937 !important;
          color: white !important;
          border-top-left-radius: 0.5rem !important;
          border-top-right-radius: 0.5rem !important;
        }
        
        .custom-datatable .p-datatable-thead > tr > th.p-highlight .p-column-title {
          color: white !important;
        }
        
        .custom-datatable .p-datatable-thead > tr > th.p-highlight .p-sortable-column-icon {
          color: white !important;
        }
        
        .custom-datatable .p-datatable-thead > tr > th.p-highlight .p-column-filter-menu-button {
          color: white !important;
        }
      `}</style>
    </div>
  );
};