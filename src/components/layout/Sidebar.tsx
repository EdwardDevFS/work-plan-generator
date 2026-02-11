import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Icon } from '@iconify/react';
import { useAuth } from '../../contexts/AuthContext';
import { tenantsService } from '../../services/tenants.service';
import { Tenant, View } from '../../types';
import { viewsService } from '../../services/view.service';

interface SidebarProps {
  collapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [views, setViews] = useState<View[]>([]);
  const { user } = useAuth();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  useEffect(() => {
    if (user?.tenantId) {
      tenantsService.getByIdWithoutRestriction(user?.tenantId)
        .then(response => {
          setTenant(response.data);
        });
    }
  }, [user?.tenantId]);

  useEffect(() => {
    if (user?.userId) {
      viewsService.getUserViews(user.userId)
        .then(response => {
          setViews(response.data);
        })
        .catch(error => {
          console.error('Error fetching user views:', error);
        });
    }
  }, [user?.userId]);

  return (
    <aside className={`
      bg-gray-900 text-white transition-all duration-300 
      ${collapsed ? 'w-16' : 'w-64'} 
      min-h-screen flex flex-col
    `}>
      <div className="p-4 border-b border-gray-700">
        {!collapsed && (  
          <h2 className="text-lg font-semibold">{tenant?.name ?? 'Unknown'}</h2>
        )}
      </div>
      
      <nav className="flex-1 pt-4">
        <ul className="space-y-2 px-3">
          {views.map((view) => {
            const isActive = location.pathname === view.path;

            return (
              <li key={view.id}>
                <Button
                  className={`
                    w-full text-left justify-start border-0
                    ${isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white'
                    }
                    ${collapsed ? 'p-2' : 'px-4 py-3'}
                    rounded-lg transition-all
                  `}
                  onClick={() => handleNavigation(view.path)}
                  title={collapsed ? view.label : undefined}
                >
                  <Icon icon={view.icon} className="text-xl" />
                  {!collapsed && (
                    <span className="ml-3">{view.label}</span>
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;