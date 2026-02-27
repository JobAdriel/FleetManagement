import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';
import '../styles/Dashboard.css';

interface DashboardStats {
  vehicles: number;
  drivers: number;
  serviceRequests: number;
  pendingQuotes: number;
  activeVehicles: number;
  maintenanceVehicles: number;
  inactiveVehicles: number;
}

interface FleetSummary {
  total_vehicles: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
}

interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  icon: string;
}

const toItems = (payload: unknown): Array<Record<string, unknown>> => {
  if (Array.isArray(payload)) {
    return payload as Array<Record<string, unknown>>;
  }

  if (payload && typeof payload === 'object') {
    const maybeObject = payload as Record<string, unknown>;
    if (Array.isArray(maybeObject.data)) {
      return maybeObject.data as Array<Record<string, unknown>>;
    }
  }

  return [];
};

const toTotal = (payload: unknown): number => {
  if (payload && typeof payload === 'object') {
    const maybeObject = payload as Record<string, unknown>;
    if (typeof maybeObject.total === 'number') {
      return maybeObject.total;
    }

    if (maybeObject.meta && typeof maybeObject.meta === 'object') {
      const meta = maybeObject.meta as Record<string, unknown>;
      if (typeof meta.total === 'number') {
        return meta.total;
      }
    }

    if (Array.isArray(maybeObject.data)) {
      return maybeObject.data.length;
    }
  }

  if (Array.isArray(payload)) {
    return payload.length;
  }

  return 0;
};

const toDateLabel = (value: unknown): string => {
  if (typeof value !== 'string') {
    return 'Unknown time';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown time';
  }

  return date.toLocaleString();
};

export default function Dashboard() {
  const AUTO_REFRESH_MS = 30000;
  const { user, token } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    vehicles: 0,
    drivers: 0,
    serviceRequests: 0,
    pendingQuotes: 0,
    activeVehicles: 0,
    maintenanceVehicles: 0,
    inactiveVehicles: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [fleetSummary, setFleetSummary] = useState<FleetSummary | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  const fetchStats = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [
        vehiclesResult,
        driversResult,
        serviceRequestsResult,
        pendingQuotesResult,
        fleetSummaryResult,
        activityServiceRequestsResult,
        activityQuotesResult,
        activityWorkOrdersResult,
      ] = await Promise.allSettled([
        apiClient.get('/vehicles?per_page=1', token),
        apiClient.get('/drivers?per_page=1', token),
        apiClient.get('/service-requests?per_page=1', token),
        apiClient.get('/quotes?status=pending&per_page=1', token),
        apiClient.get('/reports/fleet-summary', token),
        apiClient.get('/service-requests?per_page=5', token),
        apiClient.get('/quotes?per_page=5', token),
        apiClient.get('/work-orders?per_page=5', token),
      ]);

      const vehiclesPayload = vehiclesResult.status === 'fulfilled' ? vehiclesResult.value.data : undefined;
      const driversPayload = driversResult.status === 'fulfilled' ? driversResult.value.data : undefined;
      const serviceRequestsPayload = serviceRequestsResult.status === 'fulfilled' ? serviceRequestsResult.value.data : undefined;
      const pendingQuotesPayload = pendingQuotesResult.status === 'fulfilled' ? pendingQuotesResult.value.data : undefined;
      const summaryPayload = fleetSummaryResult.status === 'fulfilled' ? fleetSummaryResult.value.data : undefined;
      const serviceActivityPayload = activityServiceRequestsResult.status === 'fulfilled' ? activityServiceRequestsResult.value.data : undefined;
      const quotesActivityPayload = activityQuotesResult.status === 'fulfilled' ? activityQuotesResult.value.data : undefined;
      const workOrdersActivityPayload = activityWorkOrdersResult.status === 'fulfilled' ? activityWorkOrdersResult.value.data : undefined;

      const summary = (summaryPayload && typeof summaryPayload === 'object') ? (summaryPayload as FleetSummary) : null;
      setFleetSummary(summary);

      setStats({
        vehicles: toTotal(vehiclesPayload),
        drivers: toTotal(driversPayload),
        serviceRequests: toTotal(serviceRequestsPayload),
        pendingQuotes: toTotal(pendingQuotesPayload),
        activeVehicles: summary?.by_status?.active || 0,
        maintenanceVehicles: summary?.by_status?.maintenance || 0,
        inactiveVehicles: summary?.by_status?.inactive || 0,
      });

      const serviceActivities = toItems(serviceActivityPayload).map((item) => ({
        id: `sr-${String(item.id ?? Math.random())}`,
        title: String(item.request_number || `Service Request #${String(item.id || '')}`),
        subtitle: `Status: ${String(item.status || 'submitted')}`,
        timestamp: String(item.created_at || item.updated_at || ''),
        icon: '📝',
      }));

      const quoteActivities = toItems(quotesActivityPayload).map((item) => ({
        id: `q-${String(item.id ?? Math.random())}`,
        title: String(item.quote_number || `Quote #${String(item.id || '')}`),
        subtitle: `Status: ${String(item.status || 'pending')}`,
        timestamp: String(item.created_at || item.updated_at || ''),
        icon: '💰',
      }));

      const workOrderActivities = toItems(workOrdersActivityPayload).map((item) => ({
        id: `wo-${String(item.id ?? Math.random())}`,
        title: String(item.work_order_number || `Work Order #${String(item.id || '')}`),
        subtitle: `Status: ${String(item.status || 'open')}`,
        timestamp: String(item.created_at || item.updated_at || ''),
        icon: '🔧',
      }));

      const mergedActivities = [...serviceActivities, ...quoteActivities, ...workOrderActivities]
        .filter((item) => item.timestamp)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 6);

      setActivity(mergedActivities);
      setLastUpdated(new Date());
    } catch (fetchError) {
      console.error('Failed to fetch dashboard stats:', fetchError);
      setError('Unable to load some dashboard data. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();

    const interval = setInterval(() => {
      fetchStats();
    }, AUTO_REFRESH_MS);

    return () => clearInterval(interval);
  }, [AUTO_REFRESH_MS, fetchStats]);

  const totalKnownStatus = stats.activeVehicles + stats.maintenanceVehicles + stats.inactiveVehicles;

  const statusBreakdown = useMemo(() => {
    const base = totalKnownStatus || 1;
    return [
      {
        label: 'Active',
        value: stats.activeVehicles,
        percent: Math.round((stats.activeVehicles / base) * 100),
      },
      {
        label: 'Maintenance',
        value: stats.maintenanceVehicles,
        percent: Math.round((stats.maintenanceVehicles / base) * 100),
      },
      {
        label: 'Inactive',
        value: stats.inactiveVehicles,
        percent: Math.round((stats.inactiveVehicles / base) * 100),
      },
    ];
  }, [stats.activeVehicles, stats.inactiveVehicles, stats.maintenanceVehicles, totalKnownStatus]);

  const statCards = [
    { label: 'Total Vehicles', value: stats.vehicles, icon: '🚗' },
    { label: 'Drivers', value: stats.drivers, icon: '👤' },
    { label: 'Service Requests', value: stats.serviceRequests, icon: '📝' },
    { label: 'Pending Quotes', value: stats.pendingQuotes, icon: '💰' },
  ];

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Welcome, {user?.name}!</h1>
          <p className="subtitle">Fleet Management Dashboard</p>
        </div>
        <div className="dashboard-header-actions">
          {lastUpdated && <span className="last-updated">Updated {lastUpdated.toLocaleTimeString()}</span>}
          <button className="refresh-btn" onClick={fetchStats} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && <div className="dashboard-alert">{error}</div>}

      <div className="summary-banner">
        <div className="summary-banner-item">
          <p className="summary-label">Fleet Composition</p>
          <h3>{stats.vehicles} Vehicles Tracked</h3>
        </div>
        <div className="summary-banner-item">
          <p className="summary-label">Open Operational Load</p>
          <h3>{stats.serviceRequests + stats.pendingQuotes} Items</h3>
        </div>
        <div className="summary-banner-item">
          <p className="summary-label">Fleet Types</p>
          <h3>{Object.keys(fleetSummary?.by_type || {}).length}</h3>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map((stat, idx) => (
          <div key={idx} className="stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <h3>{stat.label}</h3>
              <p className="stat-value">{loading ? '...' : stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3>Live Activity</h3>
          {loading ? (
            <div className="activity-placeholder">Loading recent activity...</div>
          ) : activity.length === 0 ? (
            <div className="activity-placeholder">No recent records found in the database.</div>
          ) : (
            <div className="activity-list">
              {activity.map((item) => (
                <div key={item.id} className="activity-item">
                  <span className="activity-icon">{item.icon}</span>
                  <div className="activity-body">
                    <span className="activity-text">{item.title}</span>
                    <span className="activity-subtext">{item.subtitle}</span>
                  </div>
                  <span className="activity-time">{toDateLabel(item.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3>Fleet Status</h3>
          <div className="status-list">
            {statusBreakdown.map((status) => (
              <div key={status.label} className="status-item">
                <div className="status-head">
                  <span>{status.label}</span>
                  <span>{loading ? '...' : `${status.value} (${status.percent}%)`}</span>
                </div>
                <div className="status-track">
                  <progress
                    className="status-fill"
                    max={100}
                    value={loading ? 0 : status.percent}
                    title={`${status.label} ${loading ? 0 : status.percent}%`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Quick Actions</h3>
          <div className="quick-actions">
            <Link className="action-btn" to="/admin/service-requests">
              Create Service Request
            </Link>
            <Link className="action-btn" to="/admin/work-orders">
              Create Work Order
            </Link>
            <Link className="action-btn" to="/admin/reports">
              View Reports
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
