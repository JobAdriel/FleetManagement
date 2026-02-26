import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermission } from '../hooks/usePermission';
import Sidebar from './Sidebar';
import Header from './Header';
import '../styles/AdminLayout.css';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { hasPermission } = usePermission();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="admin-container">
      <Sidebar user={user} hasPermission={hasPermission} />
      
      <main className="admin-main">
        <Header 
          user={user} 
          onLogout={handleLogout}
        />
        
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
