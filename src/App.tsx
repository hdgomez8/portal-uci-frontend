import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';

// Lazy loaded components
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Employees = React.lazy(() => import('./pages/Employees'));
const EmployeeDetail = React.lazy(() => import('./pages/EmployeeDetail'));
const Administration = React.lazy(() => import('./pages/Administration'));
const VacacionesPage = React.lazy(() => import('./pages/vacaciones/VacacionesPage'));
const CesantiasPage = React.lazy(() => import('./pages/cesantias/CesantiasPage'));
const ShiftChange = React.lazy(() => import('./pages/cambioTurno/Shift-Change'));
const PermissionsEmployees = React.lazy(() => import('./pages/permisos/Permissions-Employees'));
const Profile = React.lazy(() => import('./pages/Profile'));

function App() {
  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <Provider store={store}>
          <Router>
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            }>
              <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/employees" element={<Employees />} />
                  <Route path="/employees/:id" element={<EmployeeDetail />} />
                  <Route path="/administration" element={<Administration />} />
                  <Route path="/permissions-employees" element={<PermissionsEmployees />} />
                  <Route path="/vacations" element={<VacacionesPage />} />
                  <Route path="/severance" element={<CesantiasPage />} />
                  <Route path="/shift-change" element={<ShiftChange />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>
              </Route>
              <Route path="*" element={<Login />} />
              </Routes>
            </Suspense>
          </Router>
      </Provider>
    </div>
  );
}

export default App;