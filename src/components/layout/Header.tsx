import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { tenantsService } from '../../services/tenants.service';
import { Icon } from '@iconify/react';
import { eventBus, EVENTS } from '../common/eventBus';

interface IHeaderParams {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

interface TenantOption {
  key: string;
  text: string;
  description: string;
}

const Header = ({ sidebarCollapsed, toggleSidebar }: IHeaderParams) => {
  const { user, logout } = useAuth();
  const { selectedTenant, setSelectedTenant } = useTenant();
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => {
      loadTenants()
    };

    eventBus.addEventListener(EVENTS.TENANT_CREATED, handler);
    loadTenants();
    return () => {
      eventBus.removeEventListener(EVENTS.TENANT_CREATED, handler);
    };
  }, []);

  const loadTenants = async () => {
    if(!user?.roles.some(x => x.name === 'System Administrator')) return 
    setLoading(true);
    try {
      const response = await tenantsService.getCombo();
      setTenants(response.data);
      
      // Si no hay tenant seleccionado y hay tenants disponibles, seleccionar el primero
      if (!selectedTenant && response.data.length > 0) {
        setSelectedTenant(response.data[0].key);
      }
    } catch (error) {
      console.error('Error al cargar tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const getUserName = () => {
    if (!user) return 'Usuario';
    return user.userId.substring(0, 8);
  };

  const tenantOptionTemplate = (option: TenantOption) => {
    return (
      <div className="flex flex-col">
        <span className="font-medium">{option.text}</span>
        {option.description && (
          <span className="text-xs text-gray-500">{option.description}</span>
        )}
      </div>
    );
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            icon={
              <Icon
                icon={sidebarCollapsed ? 'lucide:sidebar-open' : 'lucide:sidebar-close'}
                className="text-2xl"
              />
            }
            tooltip={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            severity="secondary"
            text
            onClick={toggleSidebar}
          />
          <Icon icon="mdi:store-outline" className="text-blue-600 text-3xl" />
          <h1 className="text-xl font-semibold text-gray-900">
            Sistema de Supervisión Retail
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Dropdown de Tenants */}
          {
            user?.roles.some(x => x.name == 'System Administrator') && (

            <div className="flex items-center space-x-2">
              <Icon icon="mdi:office-building" className="text-gray-600 text-xl" />
              <Dropdown
                value={selectedTenant}
                options={tenants}
                onChange={(e) => setSelectedTenant(e.value)}
                optionLabel="text"
                optionValue="key"
                placeholder="Seleccionar empresa"
                itemTemplate={tenantOptionTemplate}
                className="w-64"
                loading={loading}
                disabled={loading || tenants.length === 0}
              />
            </div>
            )
          }

          <div className="text-sm text-gray-600">
            <span className="font-medium">{getUserName()}</span>
            {user?.roles && (
              <span className="text-gray-400 ml-2">
                ({user.roles.map((r) => r.name).join(', ')})
              </span>
            )}
          </div>

          <Button
            icon={<Icon icon="mdi:logout" />}
            label="Salir"
            className="p-button-outlined p-button-sm"
            onClick={handleLogout}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;