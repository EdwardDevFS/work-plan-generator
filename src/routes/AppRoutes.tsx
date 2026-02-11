import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Login from '../pages/Login';
import Layout from '../components/layout/Layout';
import Dashboard from '../pages/Dashboard';
import Users from '../pages/Users';
import Tenants from '../pages/Tenants';
import Roles from '../pages/Roles';
import Stores from '../pages/Stores';

const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Solo System Administrator */}
            <Route 
              path="tenants" 
              element={
                <ProtectedRoute requiredRole="System Administrator">
                  <Tenants />
                </ProtectedRoute>
              } 
            />
            
            {/* Administrator y System Administrator */}
            <Route 
              path="users" 
              element={
                <ProtectedRoute requiredRoles={['Administrator', 'System Administrator']}>
                  <Users />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="roles" 
              element={
                <ProtectedRoute requiredRoles={['Administrator', 'System Administrator']}>
                  <Roles />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="stores" 
              element={
                <ProtectedRoute requiredRoles={['Administrator', 'System Administrator']}>
                  <Stores />
                </ProtectedRoute>
              } 
            />
            
            <Route path="forms" element={<div className="p-6">Formularios (Coming Soon)</div>} />
            <Route path="itinerary" element={<div className="p-6">Itinerarios (Coming Soon)</div>} />
          </Route>
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;