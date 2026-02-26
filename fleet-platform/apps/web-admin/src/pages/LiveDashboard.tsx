import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/apiClient';
import '../styles/LiveDashboard.css';

interface VehicleStatus {
  active: number;
  maintenance: number;
  inactive: number;
  total: number;
}

interface RecentActivity {
  id: string;
  type: 'service_request' | 'work_order' | 'vehicle_status';
  message: string;
  timestamp: string;
}

export default function LiveDashboard() {
  const { token } = useAuth();
  const [vehicleStatus, setVehicleStatus] = useState<VehicleStatus>({
    active: 0,
    maintenance: 0,
    inactive: 0,
    total: 0,
  });
  const [recentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;

    try {
      const response = await apiClient.get('/reports/fleet-summary', token);
      if (!response.error && response.data) {
        const data = response.data as { 
          total_vehicles: number; 
          by_status: Record<string, number> 
        };
        
        setVehicleStatus({
          active: data.by_status.active || 0,
          maintenance: data.by_status.maintenance || 0,
          inactive: data.by_status.inactive || 0,
          total: data.total_vehicles,
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Function to add activity to the recent activities list
  // const addActivity = (activity: RecentActivity) => {
  //   setRecentActivities((prev) => [activity, ...prev].slice(0, 10));
  // };

  // This function will be called by WebSocket listeners in production
  useEffect(() => {
    // Placeholder for real-time event listeners
    // window.Echo.channel('tenant.{tenantId}').listen('service-request.created', (e) => {
    //   addActivity({
    //     id: e.id,
    //     type: 'service_request',
    //     message: `New service request for ${e.vehicle}`,
    //     timestamp: new Date().toISOString()
    //   });
    // });
  }, []);

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="live-dashboard">
      <div className="page-header">
        <h1>Live Fleet Dashboard</h1>
        <div className="live-indicator">
          <span className="live-dot"></span>
          <span>Live Updates</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card active">
          <div className="stat-icon">🚗</div>
          <div className="stat-content">
            <div className="stat-value">{vehicleStatus.active}</div>
            <div className="stat-label">Active Vehicles</div>
          </div>
        </div>

        <div className="stat-card maintenance">
          <div className="stat-icon">🔧</div>
          <div className="stat-content">
            <div className="stat-value">{vehicleStatus.maintenance}</div>
            <div className="stat-label">In Maintenance</div>
          </div>
        </div>

        <div className="stat-card inactive">
          <div className="stat-icon">⏸️</div>
          <div className="stat-content">
            <div className="stat-value">{vehicleStatus.inactive}</div>
            <div className="stat-label">Inactive</div>
          </div>
        </div>

        <div className="stat-card total">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{vehicleStatus.total}</div>
            <div className="stat-label">Total Fleet</div>
          </div>
        </div>
      </div>

      <div className="activity-section">
        <h2>Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <div className="empty-activity">
            <p>Waiting for real-time updates...</p>
            <p className="hint">Activity will appear here when events occur</p>
          </div>
        ) : (
          <div className="activity-list">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-type-icon">
                  {activity.type === 'service_request' && '📝'}
                  {activity.type === 'work_order' && '🔧'}
                  {activity.type === 'vehicle_status' && '🚗'}
                </div>
                <div className="activity-content">
                  <div className="activity-message">{activity.message}</div>
                  <div className="activity-time">
                    {new Date(activity.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-info">
        <p><strong>Note:</strong> This dashboard updates in real-time when connected to WebSocket broadcasting.</p>
        <p>To enable real-time features, configure Pusher or Laravel WebSockets in your .env</p>
      </div>
    </div>
  );
}
