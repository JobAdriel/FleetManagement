import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/ClientDashboard.css';

export default function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const stats = [
    { label: 'Your Vehicles', value: '5', icon: '🚗', to: '/client/vehicles' },
    { label: 'Active Requests', value: '2', icon: '📝', to: '/client/requests' },
    { label: 'Pending Quotes', value: '1', icon: '💰', to: '/client/requests' },
    { label: 'Recent Invoices', value: '3', icon: '📄', to: '/client/invoices' },
  ];

  return (
    <div className="client-dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name}!</h1>
        <p>Track your vehicles and service requests</p>
      </div>

      <div className="dashboard-stats">
        {stats.map((stat, idx) => (
          <button
            key={idx}
            type="button"
            className="stat-card stat-card-btn"
            onClick={() => navigate(stat.to)}
            title={`Open ${stat.label}`}
          >
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-info">
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value">{stat.value}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="dashboard-sections">
        <section
          className="section section-link"
          onClick={() => navigate('/client/requests')}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              navigate('/client/requests');
            }
          }}
        >
          <h2>📋 Recent Service Requests</h2>
          <div className="empty-state">
            <p>No recent service requests</p>
            <p>Track your vehicle maintenance and service history</p>
          </div>
        </section>

        <section
          className="section section-link"
          onClick={() => navigate('/client/invoices')}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              navigate('/client/invoices');
            }
          }}
        >
          <h2>📄 Recent Invoices</h2>
          <div className="empty-state">
            <p>No recent invoices</p>
            <p>View and download your invoices</p>
          </div>
        </section>
      </div>

      <section className="info-section">
        <h2>📚 Getting Started</h2>
        <ul className="info-list">
          <li>Start by adding your vehicles to the system</li>
          <li>Create service requests for maintenance needs</li>
          <li>Receive quotes from our service providers</li>
          <li>Approve quotes to generate work orders</li>
          <li>Track all invoices and payments in one place</li>
        </ul>
      </section>
    </div>
  );
}
