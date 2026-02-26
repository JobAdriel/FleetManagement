import { useState } from 'react';
import type { AuthUser } from '../contexts/AuthContext';
import '../styles/Header.css';

interface HeaderProps {
  user: AuthUser;
  onLogout: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="admin-header">
      <div className="header-left">
        <h2>Fleet Management System</h2>
      </div>

      <div className="header-right">
        <div className="user-menu">
          <button 
            className="user-button"
            onClick={() => setShowMenu(!showMenu)}
          >
            <span className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
            <span className="user-display">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-email">{user?.email || 'user@example.com'}</span>
            </span>
          </button>

          {showMenu && (
            <div className="dropdown-menu">
              <div className="menu-item disabled">
                <strong>Role:</strong> {user.roles_names?.[0]}
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
