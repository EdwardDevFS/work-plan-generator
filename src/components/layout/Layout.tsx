import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';
import Header from './Header';
import Sidebar from './Sidebar';
import { Icon } from '@iconify/react';

const Layout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar collapsed={sidebarCollapsed} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} sidebarCollapsed={sidebarCollapsed}/>
        
        <main className="flex-1 overflow-auto p-6">

          <div className="bg-white rounded-lg shadow-sm min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
      
      <Toast position="top-right" />
      <ConfirmDialog />
    </div>
  );
};

export default Layout;