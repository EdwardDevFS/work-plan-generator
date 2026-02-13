import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
// import Dashboard from './pages/Dashboard';
// import Stores from './pages/Stores';
// import Forms from './pages/Forms';
import Users from './pages/Users';
// import Tenants from './pages/Tenants';
// import Roles from './pages/Roles';
// import Activities from './pages/Activities';
// import WorkPlans from './pages/WorkPlans';

import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { TenantProvider } from './contexts/TenantContext';
import Teams from './pages/rethinking/Teams';
import { UsersManagement } from './pages/rethinking/UserManagement';
import { RolesManagement } from './pages/rethinking/RoleManagement';
import { ZonalsManagement } from './pages/rethinking/ZonalsManagement';
import Tenants from './pages/Tenants';
import Activities from './pages/Activities';
import Forms from './pages/Forms';
import Roles from './pages/Roles';
import WorkPlans from './pages/WorkPlans';

function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Layout />
                  </PrivateRoute>
                }
              >
                <Route index element={<Navigate to="/users-management" replace />} />
                <Route 
                  path="users-management" 
                  element={
                    <ProtectedRoute viewKey="users-management">
                      <UsersManagement />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Usuarios original (mantener compatibilidad) */}
                <Route 
                  path="users" 
                  element={
                    <ProtectedRoute viewKey="users">
                      <Users />
                    </ProtectedRoute>
                  } 
                /> 
                
                {/* Nueva gestión de roles mejorada */}
                <Route 
                  path="roles-management" 
                  element={
                    <ProtectedRoute viewKey="roles-management">
                      <RolesManagement />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Roles original (mantener compatibilidad) */}
                <Route 
                  path="roles" 
                  element={
                    <ProtectedRoute viewKey="roles">
                      <Roles />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Nuevas rutas del sistema operativo */}
                <Route 
                  path="zonals" 
                  element={
                    <ProtectedRoute viewKey="zonals">
                      <ZonalsManagement />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="teams" 
                  element={
                    <ProtectedRoute viewKey="teams">
                      <Teams />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="tenants" 
                  element={
                    <ProtectedRoute viewKey="tenants">
                      <Tenants />
                    </ProtectedRoute>
                  } 
                />
                
                {/* <Route 
                  path="users" 
                  element={
                    <ProtectedRoute viewKey="users">
                      <Users />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="roles" 
                  element={
                    <ProtectedRoute viewKey="roles">
                      <Roles />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="stores" 
                  element={
                    <ProtectedRoute viewKey="stores">
                      <Stores />
                    </ProtectedRoute>
                  } 
                />
              */}
                <Route 
                  path="work-plans" 
                  element={
                    <ProtectedRoute viewKey="work-plans">
                      <WorkPlans />
                    </ProtectedRoute>
                  } 
                />  
              

              <Route 
                  path="forms" 
                  element={
                    <ProtectedRoute viewKey="forms">
                      <Forms />
                    </ProtectedRoute>
                  } 
              />
              <Route 
                  path="activities" 
                  element={
                    <ProtectedRoute viewKey="activities">
                      <Activities />
                    </ProtectedRoute>
                  } 
                />
              </Route>
              <Route path="*" element={<Navigate to="/users-management" replace />} />
            </Routes>
          </div>
        </Router>
      </TenantProvider>
    </AuthProvider>
  );
}

export default App;

