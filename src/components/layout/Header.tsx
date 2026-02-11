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
  const { user } = useAuth();
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

  const getUserName = () => {
    if (!user) return 'Usuario';
    return user.userId.substring(0, 8);
  };

  const tenantOptionTemplate = (option: TenantOption) => {
    return (
      <div className="flex flex-col py-1">
        <span className="font-medium text-gray-900">{option.text}</span>
        {option.description && (
          <span className="text-xs text-gray-500">{option.description}</span>
        )}
      </div>
    );
  };

  return (
    <header className="bg-white h-full flex items-center">
      <div className="flex items-center justify-between w-full">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <Button
            icon={
              <Icon
                icon={sidebarCollapsed ? 'mdi:menu' : 'mdi:menu-open'}
                className="text-2xl"
              />
            }
            className="!border-none !outline-none text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2"
            style={{ boxShadow: 'none' }}
            rounded
            text
            onClick={toggleSidebar}
          />
          
          <div className="flex items-center gap-4 pl-2 border-l border-gray-200">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <Icon icon="mdi:store-outline" className="text-white text-2xl" />
            </div>
            <h1 className="text-base font-semibold text-gray-900">
              Sistema de Supervisión Retail
            </h1>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Dropdown de Tenants */}
          {user?.roles.some(x => x.name === 'System Administrator') && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg border border-gray-200">
              <Icon icon="mdi:office-building" className="text-white text-base" />
              <Dropdown
                value={selectedTenant}
                options={tenants}
                onChange={(e) => setSelectedTenant(e.value)}
                optionLabel="text"
                optionValue="key"
                placeholder="Seleccionar empresa"
                itemTemplate={tenantOptionTemplate}
                className="border-none text-sm"
                style={{ width: '200px' }}
                loading={loading}
                disabled={loading || tenants.length === 0}
              />
            </div>
          )}

          {/* User Info */}
         <div className="flex items-center gap-5 px-3 rounded-lg">
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
              <Icon icon="mdi:account" className="text-white text-xl" />
            </div>
            <div className="leading-tight">
              <p className="font-semibold text-gray-900 text-sm">{getUserName()}</p>
              {user?.roles && (
                <p className="text-xs text-gray-500">
                  {user.roles.map((r) => r.name).join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;