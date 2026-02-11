import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-[#1a1a1a]">
      <Sidebar collapsed={sidebarCollapsed} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Franja superior del mismo color que el sidebar */}
        <div className="bg-[#1a1a1a] h-16"></div>
        
        {/* Contenedor principal con borde redondeado y sombra */}
        <main className="flex-1 overflow-auto bg-gray-50 rounded-tl-3xl shadow-2xl -mt-16">
          {/* Header dentro del área blanca */}
          <div className="bg-white px-6 py-4 sticky top-0 z-10 border-b border-gray-200">
            <Header toggleSidebar={toggleSidebar} sidebarCollapsed={sidebarCollapsed}/>
          </div>
          
          {/* Contenido */}
          <div className="p-6">
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