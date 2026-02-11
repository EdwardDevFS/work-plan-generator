import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { Tag } from 'primereact/tag';
import { Panel } from 'primereact/panel';
import { Accordion, AccordionTab } from 'primereact/accordion';
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

  const leftToolbarTemplate = () => (
    <Button label="Nuevo Zonal" icon="pi pi-plus" className="p-button-success" onClick={openNew} />
  );

  const actionBodyTemplate = (rowData: Zonal) => (
    <div className="flex gap-2">
      <Button icon="pi pi-trash" className="p-button-rounded p-button-danger p-button-sm" onClick={() => deleteZonal(rowData)} />
    </div>
  );

  const statusBodyTemplate = (rowData: Zonal) => (
    <Tag value={rowData.isActive ? 'Activo' : 'Inactivo'} severity={rowData.isActive ? 'success' : 'danger'} />
  );

  return (
    <div className="p-6">
      <Toast ref={toast} />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Zonales</h1>
        <p className="text-gray-600 mt-2">Administre zonales, sedes y locales de trabajo</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Toolbar className="mb-4 border-none" left={leftToolbarTemplate} />
        
        <DataTable
          value={zonals}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          className="p-datatable-sm"
          emptyMessage="No hay zonales registrados"
        >
          <Column field="name" header="Nombre" sortable />
          <Column field="description" header="Descripción" />
          <Column field="departmentName" header="Ubicación" body={(rowData) => `${rowData.districtName || ''}`} />
          <Column header="Estado" body={statusBodyTemplate} />
          <Column header="Acciones" body={actionBodyTemplate} style={{ width: '100px' }} />
        </DataTable>
      </div>

      <Dialog
        visible={dialogVisible}
        style={{ width: '900px' }}
        header="Nuevo Zonal"
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <div className="space-y-6">
          {/* Información del Zonal */}
          <Panel header="Información del Zonal" className="mb-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Zonal *</label>
                <InputText
                  value={zonalName}
                  onChange={(e) => setZonalName(e.target.value)}
                  placeholder="Ej: PCM Tacna"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <InputTextarea
                  value={zonalDescription}
                  onChange={(e) => setZonalDescription(e.target.value)}
                  rows={3}
                  placeholder="Descripción del zonal"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Departamento *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Provincia *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Distrito *</label>
                  <DistrictAutocomplete
                    value={selectedDistrict}
                    onChange={setSelectedDistrict}
                    provinceId={selectedProvince?.idProvince}
                    disabled={!selectedProvince}
                  />
                </div>
              </div>
            </div>
          </Panel>

          {/* Sedes */}
          <Panel header="Sedes y Locales de Trabajo" className="mb-4">
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">
                {editingHqIndex !== null ? 'Editar Sede' : 'Agregar Nueva Sede'}
              </h4>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                    <InputText
                      value={currentHq.name || ''}
                      onChange={(e) => setCurrentHq({ ...currentHq, name: e.target.value })}
                      placeholder="Ej: Sede Ciudad Nueva"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                    <InputText
                      value={currentHq.address || ''}
                      onChange={(e) => setCurrentHq({ ...currentHq, address: e.target.value })}
                      placeholder="Dirección de la sede"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <InputTextarea
                    value={currentHq.description || ''}
                    onChange={(e) => setCurrentHq({ ...currentHq, description: e.target.value })}
                    rows={2}
                    placeholder="Descripción de la sede"
                  />
                </div>

                {/* Locales de trabajo */}
                <div className="border-t pt-3 mt-3">
                  <h5 className="font-semibold text-gray-700 mb-2">Locales de Trabajo (Mínimo 1) *</h5>
                  
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <InputText
                      value={currentWorkplace.name || ''}
                      onChange={(e) => setCurrentWorkplace({ ...currentWorkplace, name: e.target.value })}
                      placeholder="Nombre del local"
                    />
                    <InputText
                      value={currentWorkplace.code || ''}
                      onChange={(e) => setCurrentWorkplace({ ...currentWorkplace, code: e.target.value })}
                      placeholder="Código"
                    />
                    <Button
                      label="Agregar Local"
                      icon="pi pi-plus"
                      className="p-button-sm"
                      onClick={addWorkplace}
                    />
                  </div>

                  {currentHq.workplaces && currentHq.workplaces.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {currentHq.workplaces.map((wp) => (
                        <div key={wp.tempId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium">{wp.name}</span>
                            {wp.code && <span className="text-sm text-gray-500 ml-2">({wp.code})</span>}
                          </div>
                          <Button
                            icon="pi pi-trash"
                            className="p-button-rounded p-button-danger p-button-sm p-button-text"
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
                      icon="pi pi-times"
                      className="p-button-text p-button-sm"
                      onClick={() => {
                        setCurrentHq({});
                        setEditingHqIndex(null);
                      }}
                    />
                  )}
                  <Button
                    label={editingHqIndex !== null ? 'Actualizar Sede' : 'Agregar Sede'}
                    icon="pi pi-check"
                    className="p-button-sm"
                    onClick={addHeadquarter}
                  />
                </div>
              </div>
            </div>

            {/* Lista de sedes agregadas */}
            {headquarters.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-gray-700 mb-3">Sedes Agregadas ({headquarters.length})</h4>
                <Accordion>
                  {headquarters.map((hq, index) => (
                    <AccordionTab
                      key={hq.tempId}
                      header={
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">{hq.name}</span>
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              icon="pi pi-pencil"
                              className="p-button-rounded p-button-info p-button-sm p-button-text"
                              onClick={() => editHeadquarter(index)}
                            />
                            <Button
                              icon="pi pi-trash"
                              className="p-button-rounded p-button-danger p-button-sm p-button-text"
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
          </Panel>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button label="Cancelar" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
          <Button label="Crear Zonal" icon="pi pi-check" onClick={saveZonal} loading={loading} />
        </div>
      </Dialog>
    </div>
  );
};