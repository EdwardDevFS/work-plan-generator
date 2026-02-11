import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { tenantsService } from '../services/tenants.service';
import { Tenant } from '../types';
import { useAuth } from './AuthContext';


interface TenantContextType {
  selectedTenant: string | null;
  setSelectedTenant: (tenantId: string) => void;
  tenantInfo: Tenant | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);


export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const {user} = useAuth()

  const [selectedTenant, setSelectedTenantState] = useState<string | null>(() => {
    // Cargar el tenant seleccionado desde localStorage al iniciar
    return user?.tenantId!
  });

  const [tenantInfo, setTenantInfo] = useState<Tenant | null>(null);

  const setSelectedTenant = (tenantId: string | null) => {
    setSelectedTenantState(tenantId);
  };
  useEffect(() => {
    if(user){
      setSelectedTenantState(user?.tenantId)
    }
  }, [user])
  

  useEffect(() => {
    if (selectedTenant) {
      tenantsService.getByIdWithoutRestriction(selectedTenant).then(response => {
        setTenantInfo(response.data)
      })
    }
  }, [selectedTenant]);

  return (
    <TenantContext.Provider value={{ selectedTenant, setSelectedTenant, tenantInfo }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};