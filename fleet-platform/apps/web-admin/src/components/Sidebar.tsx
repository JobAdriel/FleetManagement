import { useState } from 'react';
import type { AuthUser } from '../contexts/AuthContext';
import { NavLink } from 'react-router-dom';
import '../styles/Sidebar.css';

interface SidebarProps {
  user: AuthUser;
  hasPermission: (permission: string) => boolean;
}

export default function Sidebar({ user, hasPermission }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      label: 'Dashboard',
      path: '/admin/dashboard',
      icon: '📊',
      permission: 'view_dashboard',
    },
    {
      label: 'Vehicles',
      path: '/admin/vehicles',
      icon: '🚗',
      permission: 'view_vehicles',
    },
    {
      label: 'Drivers',
      path: '/admin/drivers',
      icon: '👤',
      permission: 'view_drivers',
    },
    {
      label: 'Service Requests',
      path: '/admin/service-requests',
      icon: '📝',
      permission: 'view_service_requests',
    },
    {
      label: 'Quotes',
      path: '/admin/quotes',
      icon: '💰',
      permission: 'view_quotes',
    },
    {
      label: 'Work Orders',
      path: '/admin/work-orders',
      icon: '🔧',
      permission: 'view_work_orders',
    },
    {
      label: 'Preventive Rules',
      path: '/admin/preventive-rules',
      icon: '⚙️',
      permission: 'manage_settings',
    },
    {
      label: 'Invoices',
      path: '/admin/invoices',
      icon: '📄',
      permission: 'view_invoices',
    },
    {
      label: 'Reports',
      path: '/admin/reports',
      icon: '📈',
      permission: 'view_reports',
    },
  ];

  const adminItems = [
    {
      label: 'Users',
      path: '/admin/users',
      icon: '👥',
      permission: 'manage_users',
    },
    {
      label: 'Roles & Permissions',
      path: '/admin/roles',
      icon: '🔐',
      permission: 'manage_roles',
    },
  ];

  const visibleItems = menuItems.filter(item => hasPermission(item.permission));
  const visibleAdminItems = adminItems.filter(item => hasPermission(item.permission));

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <img
            src="/logo.png"
            alt="Fleet Management"
            className="sidebar-brand-image"
          />
        </div>
        {!isCollapsed && (
          <div className="sidebar-user-inline">
            <p className="user-name-inline">{user?.name || 'User'}</p>
          </div>
        )}
        <button 
          className="sidebar-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {!isCollapsed && <p className="nav-label">Menu</p>}
          {visibleItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }: { isActive: boolean }) => `nav-item ${isActive ? 'active' : ''}`}
              title={item.label}
            >
              <span className="nav-icon">{item.icon}</span>
              {!isCollapsed && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </div>

        {visibleAdminItems.length > 0 && (
          <div className="nav-section">
            {!isCollapsed && <p className="nav-label">Admin</p>}
            {visibleAdminItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }: { isActive: boolean }) => `nav-item ${isActive ? 'active' : ''}`}
                title={item.label}
              >
                <span className="nav-icon">{item.icon}</span>
                {!isCollapsed && <span className="nav-label">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        )}
      </nav>
    </aside>
  );
}
