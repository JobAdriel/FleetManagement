import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ClientHeader from './ClientHeader';
import '../styles/ClientLayout.css';

export default function ClientLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="client-container">
      <ClientHeader 
        user={user} 
        onLogout={handleLogout}
      />
      
      <main className="client-main">
        <div className="client-content">
          <Outlet />
        </div>
        
        <footer className="client-footer">
          <p>&copy; 2026 Fleet Management System. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
