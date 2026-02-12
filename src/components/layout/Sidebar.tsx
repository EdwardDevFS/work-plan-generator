import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
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
  const { user, logout } = useAuth();
  const userMenuRef = useRef<OverlayPanel>(null);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    userMenuRef.current?.hide();
    logout();
  };

  const getUserName = () => {
    if (!user) return 'Usuario';
    return user.userId.substring(0, 8);
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
      viewsService.getRoleViews()
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
      bg-[#1a1a1a] text-white transition-all duration-300 
      ${collapsed ? 'w-16' : 'w-64'} 
      min-h-screen flex flex-col
    `}>
      {/* Header */}
      <div className="p-4 flex items-center gap-3 border-b border-gray-800">
        <div className="w-1 h-10 bg-transparent rounded-lg flex items-center justify-center flex-shrink-0">
         {/*  <Icon icon="mdi:asterisk" className="text-2xl" /> */}
        </div>
        {!collapsed && (
          <h2 className="text-xl font-bold whitespace-nowrap overflow-hidden">Bartech</h2>
        )}
      </div>

     
      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {views.map((view) => {
            const isActive = location.pathname === view.path;

            return (
              <li key={view.id}>
                <Button
                  className={`
                    w-full text-left !border-none !outline-none
                    ${isActive 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white'
                    }
                    ${collapsed ? 'p-3 justify-center' : 'px-4 py-3 justify-start'}
                    rounded-lg transition-all
                  `}
                  style={{ boxShadow: 'none' }}
                  onClick={() => handleNavigation(view.path)}
                  title={collapsed ? view.label : undefined}
                >
                  <Icon icon={view.icon} className="text-xl flex-shrink-0" />
                  {!collapsed && (
                    <span className="ml-3 whitespace-nowrap overflow-hidden text-ellipsis">{view.label}</span>
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Icons */}
      <div className="px-3 py-4 border-none border-gray-800 space-y-2">
        <Button
          className={`
            w-full bg-transparent hover:bg-gray-800 !border-none !outline-none rounded-lg 
            ${collapsed ? 'p-3' : 'p-3'} 
            flex items-center justify-center text-gray-400 hover:text-white transition-all
          `}
          style={{ boxShadow: 'none' }}
          title="Settings"
        >
          <Icon icon="mdi:cog" className="text-xl" />
        </Button>
        
        <Button
          className={`
            w-full bg-transparent hover:bg-gray-800 !border-none !outline-none rounded-lg 
            ${collapsed ? 'p-3' : 'p-3'} 
            flex items-center justify-center text-gray-400 hover:text-white transition-all
          `}
          style={{ boxShadow: 'none' }}
          title="User Menu"
          onClick={(e) => userMenuRef.current?.toggle(e)}
        >
          <Icon icon="mdi:account-multiple" className="text-xl" />
        </Button>
      </div>

      {/* User Menu Overlay - Estilo Oscuro */}
      <OverlayPanel 
        ref={userMenuRef} 
        className="user-menu-overlay"
        style={{ width: '200px' }}
      >
        <div className="bg-[#1a1a1a] text-white p-3 rounded-lg border border-gray-700">
          <div className="mb-3 pb-3 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon icon="mdi:account" className="text-xl" />
              </div>
              <div className="overflow-hidden">
                <p className="font-semibold text-base truncate">{getUserName()}</p>
                {user?.roles && (
                  <p className="text-xs text-gray-400 truncate">
                    {user.roles.map((r) => r.name).join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <Button
            icon={<Icon icon="mdi:logout" className="text-base" />}
            label="Salir"
            className="w-full !border-none !outline-none text-left justify-start text-red-400 hover:bg-gray-800 text-sm py-2"
            style={{ boxShadow: 'none' }}
            text
            onClick={handleLogout}
          />
        </div>
      </OverlayPanel>

      <style>{`
        .user-menu-overlay .p-overlaypanel-content {
          padding: 0 !important;
          background: #1a1a1a !important;
          border: 1px solid #374151 !important;
        }
        
        .user-menu-overlay.p-overlaypanel {
          background: #1a1a1a !important;
          border: 1px solid #374151 !important;
        }
        
        /* Triángulo indicador oscuro */
        .user-menu-overlay .p-overlaypanel-content::before {
          border-top-color: #374151 !important;
        }
        
        .user-menu-overlay .p-overlaypanel-content::after {
          border-top-color: #1a1a1a !important;
        }
        
        .user-menu-overlay.p-overlaypanel::before {
          border-top-color: #374151 !important;
        }
        
        .user-menu-overlay.p-overlaypanel::after {
          border-top-color: #1a1a1a !important;
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;