import { useState } from 'react';
import type { AuthUser } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import '../styles/ClientHeader.css';

interface ClientHeaderProps {
  user: AuthUser;
  onLogout: () => void;
}

export default function ClientHeader({ user, onLogout }: ClientHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="client-header">
      <div className="header-container">
        <Link to="/client/dashboard" className="brand">
          <span className="brand-icon">🚗</span>
          <span className="brand-text">Fleet Owner Portal</span>
        </Link>

        <nav className="header-nav">
          <Link to="/client/dashboard" className="nav-link">Home</Link>
          <Link to="/client/vehicles" className="nav-link">My Vehicles</Link>
          <Link to="/client/requests" className="nav-link">Service Requests</Link>
          <Link to="/client/invoices" className="nav-link">Invoices</Link>
        </nav>

        <div className="user-menu">
          <button 
            className="user-button"
            onClick={() => setShowMenu(!showMenu)}
          >
            <span className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
            <span className="user-name">{user?.name || 'User'}</span>
          </button>

          {showMenu && (
            <div className="dropdown-menu">
              <div className="menu-item disabled">
                <strong>{user?.email || 'user@example.com'}</strong>
              </div>
              
              <hr />
              
              <button 
                className="menu-item logout-btn"
                onClick={() => {
                  setShowMenu(false);
                  onLogout();
                }}
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
