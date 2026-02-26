import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginForm from './components/LoginForm';
import ClientLayout from './components/ClientLayout';
import ClientDashboard from './pages/ClientDashboard';
import ClientVehicles from './pages/ClientVehicles';
import ClientRequests from './pages/ClientRequests';
import ClientInvoices from './pages/ClientInvoices';
import './App.css';
import './styles/ClientLayout.css';
import './styles/ClientHeader.css';
import './styles/ClientDashboard.css';
import './styles/ClientPage.css';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginForm />} />

          {/* Protected Client Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<ClientLayout />}>
              <Route path="/client/dashboard" element={<ClientDashboard />} />
              <Route path="/client/vehicles" element={<ClientVehicles />} />
              <Route path="/client/requests" element={<ClientRequests />} />
              <Route path="/client/invoices" element={<ClientInvoices />} />
            </Route>
          </Route>

          {/* Redirect root to dashboard or login */}
          <Route path="/" element={<Navigate to="/client/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
