import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { confirmDialog } from 'primereact/confirmdialog';
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
          detail: 'Tenant actualizado correctamente',
          life: 3000,
        });
      } else {
        await tenantsService.create(dataToSend);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Tenant creado correctamente',
          life: 3000,
        });
      }
      hideDialog();
      loadTenants(Math.floor(first / rows) + 1, rows);
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'Error al guardar tenant',
        life: 3000,
      });
    }
  };

  const confirmDelete = (tenant: Tenant) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el tenant "${tenant.name}"?`,
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
        detail: 'Tenant eliminado correctamente',
        life: 3000,
      });
      loadTenants(Math.floor(first / rows) + 1, rows);
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar tenant',
        life: 3000,
      });
    }
  };

  const actionBodyTemplate = (rowData: Tenant) => {
    return (
      <div className="flex gap-2">
        <Button
          icon={<Icon icon="mdi:pencil" />}
          className="p-button-rounded p-button-text p-button-info"
          onClick={() => openEdit(rowData)}
          tooltip="Editar"
        />
        <Button
          icon={<Icon icon="mdi:delete" />}
          className="p-button-rounded p-button-text p-button-danger"
          onClick={() => confirmDelete(rowData)}
          tooltip="Eliminar"
        />
      </div>
    );
  };

  const dateBodyTemplate = (rowData: Tenant, field: 'createdAt' | 'updatedAt') => {
    return new Date(rowData[field]).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const dialogFooter = (
    <div>
      <Button
        label="Cancelar"
        icon={<Icon icon="mdi:close" />}
        onClick={hideDialog}
        className="p-button-text"
      />
      <Button
        label="Guardar"
        icon={<Icon icon="mdi:content-save" />}
        onClick={saveTenant}
        autoFocus
      />
    </div>
  );

  return (
    <div className="p-6">
      <Toast ref={toast} />
      
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <Button
          label="Nuevo cliente"
          icon={<Icon icon="mdi:plus" />}
          onClick={openNew}
        />
      </div>

      <DataTable
        value={tenants}
        lazy
        paginator
        first={first}
        rows={rows}
        totalRecords={totalRecords}
        onPage={onPage}
        loading={loading}
        className="p-datatable-sm"
        emptyMessage="No se encontraron clientes"
        rowsPerPageOptions={[5, 10, 25, 50]}
      >
        <Column field="name" header="Nombre" sortable />
        <Column field="legalName" header="Razón Social" sortable />
        <Column field="email" header="Email" sortable />
        <Column field="phone" header="Teléfono" sortable />
        <Column field="city" header="Ciudad" sortable />
        <Column 
          field="createdAt" 
          header="Fecha Creación" 
          body={(data) => dateBodyTemplate(data, 'createdAt')}
          sortable 
        />
        <Column body={actionBodyTemplate} exportable={false} style={{ width: '8rem' }} />
      </DataTable>

      <Dialog
        visible={dialogVisible}
        style={{ width: '600px' }}
        header={isEdit ? 'Editar Tenant' : 'Nuevo Tenant'}
        modal
        className="p-fluid"
        footer={dialogFooter}
        onHide={hideDialog}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="field col-span-2">
            <label htmlFor="name" className="block mb-2 font-medium">
              Nombre del Tenant <span className="text-red-500">*</span>
            </label>
            <InputText
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className="field col-span-2">
            <label htmlFor="legalName" className="block mb-2 font-medium">
              Razón Social
            </label>
            <InputText
              id="legalName"
              value={formData.legalName}
              onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor="email" className="block mb-2 font-medium">
              Email
            </label>
            <InputText
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor="phone" className="block mb-2 font-medium">
              Teléfono
            </label>
            <InputText
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor="country" className="block mb-2 font-medium">
              País
            </label>
            <InputText
              id="country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor="city" className="block mb-2 font-medium">
              Ciudad
            </label>
            <InputText
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>

          <div className="field col-span-2">
            <label htmlFor="address" className="block mb-2 font-medium">
              Dirección
            </label>
            <InputText
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Tenants;