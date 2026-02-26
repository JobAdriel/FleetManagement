import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRoute from './components/RoleBasedRoute';
import LoginForm from './components/LoginForm';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import ServiceRequests from './pages/ServiceRequests';
import Quotes from './pages/Quotes';
import WorkOrders from './pages/WorkOrders';
import PreventiveRules from './pages/PreventiveRules';
import Invoices from './pages/Invoices';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Roles from './pages/Roles';
import './styles/App.css';
import './styles/AdminLayout.css';
import './styles/Sidebar.css';
import './styles/Header.css';
import './styles/Dashboard.css';
import './styles/ResourcePage.css';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginForm />} />

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              {/* Dashboard */}
              <Route path="/admin/dashboard" element={<Dashboard />} />

              {/* Fleet Management */}
              <Route path="/admin/vehicles" element={<Vehicles />} />
              <Route path="/admin/drivers" element={<Drivers />} />
              <Route path="/admin/service-requests" element={<ServiceRequests />} />
              <Route path="/admin/quotes" element={<Quotes />} />
              <Route path="/admin/work-orders" element={<WorkOrders />} />
              <Route path="/admin/preventive-rules" element={<PreventiveRules />} />
              <Route path="/admin/invoices" element={<Invoices />} />
              <Route path="/admin/reports" element={<Reports />} />

              {/* Admin Only */}
              <Route 
                path="/admin/users" 
                element={
                  <RoleBasedRoute requiredPermissions={['manage_users']}>
                    <Users />
                  </RoleBasedRoute>
                } 
              />
              <Route 
                path="/admin/roles" 
                element={
                  <RoleBasedRoute requiredPermissions={['manage_roles']}>
                    <Roles />
                  </RoleBasedRoute>
                } 
              />
            </Route>
          </Route>

          {/* Redirect root to dashboard or login */}
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
