import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { confirmDialog } from 'primereact/confirmdialog';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Icon } from '@iconify/react';
import { tenantsService } from '../services/tenants.service';
import { Tenant, CreateTenantDto } from '../types';
import { eventBus, EVENTS } from '../components/common/eventBus';

const Tenants: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const toast = useRef<Toast>(null);

  const [formData, setFormData] = useState<CreateTenantDto & { id?: string }>({
    name: '',
    legalName: '',
    country: '',
    city: '',
    address: '',
    email: '',
    phone: '',
  });

  const loadTenants = async (page: number = 1, limit: number = 10) => {
    setLoading(true);
    eventBus.dispatchEvent(
      new CustomEvent(EVENTS.TENANT_CREATED, {})
    );
    try {
      const response = await tenantsService.getAll({ page, limit });
      setTenants(response.data.data);
      setTotalRecords(response.data.total);
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar clientes',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants(1, rows);
  }, []);

  const onPage = (event: any) => {
    const page = Math.floor(event.first / event.rows) + 1;
    setFirst(event.first);
    setRows(event.rows);
    loadTenants(page, event.rows);
  };

  const openNew = () => {
    setFormData({
      name: '',
      legalName: '',
      country: '',
      city: '',
      address: '',
      email: '',
      phone: '',
    });
    setIsEdit(false);
    setDialogVisible(true);
  };

  const openEdit = (tenant: Tenant) => {
    setFormData({
      id: tenant.id,
      name: tenant.name,
      legalName: tenant.legalName || '',
      country: tenant.country || '',
      city: tenant.city || '',
      address: tenant.address || '',
      email: tenant.email || '',
      phone: tenant.phone || '',
    });
    eventBus.dispatchEvent(
      new CustomEvent(EVENTS.TENANT_CREATED, {})
    );

    setIsEdit(true);
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
  };

  const saveTenant = async () => {
    try {
      const dataToSend: CreateTenantDto = {
        name: formData.name,
        legalName: formData.legalName || undefined,
        country: formData.country || undefined,
        city: formData.city || undefined,
        address: formData.address || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
      };

      if (isEdit && formData.id) {
        await tenantsService.update(formData.id, dataToSend);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Cliente actualizado correctamente',
          life: 3000,
        });
      } else {
        await tenantsService.create(dataToSend);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Cliente creado correctamente',
          life: 3000,
        });
      }
      hideDialog();
      loadTenants(Math.floor(first / rows) + 1, rows);
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'Error al guardar cliente',
        life: 3000,
      });
    }
  };

  const confirmDelete = (tenant: Tenant) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el cliente "${tenant.name}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => deleteTenant(tenant.id),
    });
  };

  const deleteTenant = async (id: string) => {
    try {
      await tenantsService.delete(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Cliente eliminado correctamente',
        life: 3000,
      });
      loadTenants(Math.floor(first / rows) + 1, rows);
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar cliente',
        life: 3000,
      });
    }
  };

  const actionBodyTemplate = (rowData: Tenant) => {
    return (
      <div className="flex gap-2">
        <Button
          icon={<Icon icon="mdi:pencil" className="text-base" />}
          className="!border-none !outline-none p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
          style={{ boxShadow: 'none' }}
          text
          onClick={() => openEdit(rowData)}
          tooltip="Editar"
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          icon={<Icon icon="mdi:delete" className="text-base" />}
          className="!border-none !outline-none p-2 text-red-600 hover:bg-red-50 rounded-lg"
          style={{ boxShadow: 'none' }}
          text
          onClick={() => confirmDelete(rowData)}
          tooltip="Eliminar"
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    );
  };

  const dateBodyTemplate = (rowData: Tenant, field: 'createdAt' | 'updatedAt') => {
    return (
      <span className="text-xs text-gray-600">
        {new Date(rowData[field]).toLocaleDateString('es-PE', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </span>
    );
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Header Section */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-900">Gestión de Clientes</h1>
        <p className="text-lg text-gray-500 -mt-5">Administre los clientes del sistema</p>
      </div>

      {/* Toolbar */}
      <div className="pb-5 border-b border-gray-200 bg-gray-50">
        <Button
          label="Nuevo Cliente"
          icon={<Icon icon="mdi:plus" className="text-lg" />}
          className="!border-none !outline-none bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium"
          style={{ boxShadow: 'none' }}
          onClick={openNew}
        />
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <DataTable
          value={tenants}
          lazy
          paginator
          first={first}
          rows={rows}
          totalRecords={totalRecords}
          onPage={onPage}
          loading={loading}
          rowsPerPageOptions={[5, 10, 25]}
          className="text-sm custom-datatable"
          emptyMessage="No se encontraron clientes"
          stripedRows
        >
          <Column
            field="name"
            header="Nombre"
            sortable
            className="font-medium text-gray-900"
          />
          <Column
            field="legalName"
            header="Razón Social"
            sortable
            className="text-gray-700"
          />
          <Column
            field="email"
            header="Email"
            sortable
            className="text-gray-600"
          />
          <Column
            field="phone"
            header="Teléfono"
            sortable
            className="text-gray-600"
          />
          <Column
            field="city"
            header="Ciudad"
            sortable
            className="text-gray-600"
          />
          <Column
            field="createdAt"
            header="Fecha Creación"
            body={(data) => dateBodyTemplate(data, 'createdAt')}
            sortable
          />
          <Column
            body={actionBodyTemplate}
            header="Acciones"
            className="text-center"
            style={{ width: '120px' }}
          />
        </DataTable>
      </div>

      {/* Dialog */}
      <Dialog
        visible={dialogVisible}
        style={{ width: '650px' }}
        header={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon icon={isEdit ? "mdi:pencil" : "mdi:domain-plus"} className="text-blue-700 text-xl" />
            </div>
            <div className="leading-tight">
              <h2 className="text-lg font-semibold text-gray-900 mb-0">
                {isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {isEdit ? 'Modifique la información del cliente' : 'Complete los datos del nuevo cliente'}
              </p>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <div className="space-y-4 mt-4">
          {/* Información General */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Icon icon="mdi:information-outline" className="text-gray-500" />
              Información General
            </h3>

            <div className="space-y-3">
              <div>
                <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1.5">
                  Nombre del Cliente <span className="text-red-500">*</span>
                </label>
                <InputText
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-sm"
                  placeholder="Ingrese el nombre del cliente"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="legalName" className="block text-xs font-medium text-gray-700 mb-1.5">
                  Razón Social
                </label>
                <InputText
                  id="legalName"
                  value={formData.legalName}
                  onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  className="text-sm"
                  placeholder="Ingrese la razón social"
                />
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Icon icon="mdi:email-outline" className="text-gray-500" />
              Información de Contacto
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <InputText
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="text-sm"
                  placeholder="ejemplo@correo.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-xs font-medium text-gray-700 mb-1.5">
                  Teléfono
                </label>
                <InputText
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="text-sm"
                  placeholder="+51 999 999 999"
                />
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Icon icon="mdi:map-marker" className="text-gray-500" />
              Ubicación
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="country" className="block text-xs font-medium text-gray-700 mb-1.5">
                    País
                  </label>
                  <InputText
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="text-sm"
                    placeholder="Perú"
                  />
                </div>

                <div>
                  <label htmlFor="city" className="block text-xs font-medium text-gray-700 mb-1.5">
                    Ciudad
                  </label>
                  <InputText
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="text-sm"
                    placeholder="Lima"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-xs font-medium text-gray-700 mb-1.5">
                  Dirección
                </label>
                <InputText
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="text-sm"
                  placeholder="Ingrese la dirección completa"
                />
              </div>
            </div>
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
            label="Guardar"
            icon={<Icon icon="mdi:check" className="text-base mr-2" />}
            className="!border-none !outline-none bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
            style={{ boxShadow: 'none' }}
            onClick={saveTenant}
          />
        </div>
      </Dialog>

      {/* Estilos personalizados para el DataTable */}
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

export default Tenants;
