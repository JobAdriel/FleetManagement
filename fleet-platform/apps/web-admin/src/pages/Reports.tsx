import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/apiClient';
import '../styles/Reports.css';

interface MaintenanceSpend {
  vehicle_id: string;
  vehicle_plate: string;
  total_spend: number;
  work_order_count: number;
}

interface VehicleDowntime {
  vehicle_id: string;
  vehicle_plate: string;
  downtime_days: number;
  work_order_count: number;
}

interface RequestCycleTime {
  average_days: number;
  total_requests: number;
  completed_requests: number;
}

interface FleetSummary {
  total_vehicles: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
}

export default function Reports() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'spend' | 'downtime' | 'cycle' | 'summary'>('spend');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  const [maintenanceSpend, setMaintenanceSpend] = useState<MaintenanceSpend[]>([]);
  const [vehicleDowntime, setVehicleDowntime] = useState<VehicleDowntime[]>([]);
  const [cycleTime, setCycleTime] = useState<RequestCycleTime | null>(null);
  const [fleetSummary, setFleetSummary] = useState<FleetSummary | null>(null);
  const [selectedSpendIds, setSelectedSpendIds] = useState<string[]>([]);
  const [selectedDowntimeIds, setSelectedDowntimeIds] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set default date range to last 30 days
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setDateRange({ start, end });
  }, []);

  const fetchReports = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = `start_date=${dateRange.start}&end_date=${dateRange.end}`;
      
      if (activeTab === 'spend') {
        const response = await apiClient.get(`/reports/maintenance-spend?${params}`, token);
        if (response.error) throw new Error(response.error);
        const data = Array.isArray(response.data) ? response.data : [];
        setMaintenanceSpend(data as MaintenanceSpend[]);
      } else if (activeTab === 'downtime') {
        const response = await apiClient.get(`/reports/vehicle-downtime?${params}`, token);
        if (response.error) throw new Error(response.error);
        const data = Array.isArray(response.data) ? response.data : [];
        setVehicleDowntime(data as VehicleDowntime[]);
      } else if (activeTab === 'cycle') {
        const response = await apiClient.get(`/reports/request-cycle-time?${params}`, token);
        if (response.error) throw new Error(response.error);
        setCycleTime(response.data as RequestCycleTime);
      } else if (activeTab === 'summary') {
        const response = await apiClient.get('/reports/fleet-summary', token);
        if (response.error) throw new Error(response.error);
        setFleetSummary(response.data as FleetSummary);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateRange, token]);

  useEffect(() => {
    if (dateRange.start && dateRange.end && token) {
      fetchReports();
    }
  }, [activeTab, dateRange, token, fetchReports]);

  useEffect(() => {
    if (activeTab !== 'spend') {
      setSelectedSpendIds([]);
    }
    if (activeTab !== 'downtime') {
      setSelectedDowntimeIds([]);
    }
  }, [activeTab]);

  const toggleSpendSelection = (vehicleId: string) => {
    setSelectedSpendIds((prev) =>
      prev.includes(vehicleId) ? prev.filter((id) => id !== vehicleId) : [...prev, vehicleId]
    );
  };

  const toggleDowntimeSelection = (vehicleId: string) => {
    setSelectedDowntimeIds((prev) =>
      prev.includes(vehicleId) ? prev.filter((id) => id !== vehicleId) : [...prev, vehicleId]
    );
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=1000,height=700');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups to print.');
      return;
    }

    let title = '';
    let content = '';

    if (activeTab === 'spend') {
      const selected = maintenanceSpend.filter((item) => selectedSpendIds.includes(item.vehicle_id));
      if (selected.length === 0) {
        alert('Select at least one vehicle to print.');
        return;
      }
      title = 'Maintenance Spend Report';
      const rows = selected
        .map((item) => `
          <tr>
            <td>${item.vehicle_plate}</td>
            <td>${item.work_order_count}</td>
            <td>₱${item.total_spend.toLocaleString()}</td>
          </tr>
        `)
        .join('');
      content = `
        <table>
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Work Orders</th>
              <th>Total Spend</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      `;
    }

    if (activeTab === 'downtime') {
      const selected = vehicleDowntime.filter((item) => selectedDowntimeIds.includes(item.vehicle_id));
      if (selected.length === 0) {
        alert('Select at least one vehicle to print.');
        return;
      }
      title = 'Vehicle Downtime Report';
      const rows = selected
        .map((item) => `
          <tr>
            <td>${item.vehicle_plate}</td>
            <td>${item.work_order_count}</td>
            <td>${item.downtime_days} days</td>
          </tr>
        `)
        .join('');
      content = `
        <table>
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Work Orders</th>
              <th>Downtime</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      `;
    }

    if (activeTab === 'cycle' && cycleTime) {
      title = 'Request Cycle Time Report';
      content = `
        <div class="summary">
          <div><strong>Average Days:</strong> ${cycleTime.average_days.toFixed(1)}</div>
          <div><strong>Total Requests:</strong> ${cycleTime.total_requests}</div>
          <div><strong>Completed:</strong> ${cycleTime.completed_requests}</div>
          <div><strong>Completion Rate:</strong> ${((cycleTime.completed_requests / cycleTime.total_requests) * 100).toFixed(0)}%</div>
        </div>
      `;
    }

    if (activeTab === 'summary' && fleetSummary) {
      title = 'Fleet Summary Report';
      const statusRows = Object.entries(fleetSummary.by_status)
        .map(([status, count]) => `<div><strong>${status}:</strong> ${count}</div>`)
        .join('');
      const typeRows = Object.entries(fleetSummary.by_type)
        .map(([type, count]) => `<div><strong>${type || 'Unspecified'}:</strong> ${count}</div>`)
        .join('');
      content = `
        <div class="summary">
          <div><strong>Total Vehicles:</strong> ${fleetSummary.total_vehicles}</div>
          <h3>By Status</h3>
          ${statusRows}
          <h3>By Type</h3>
          ${typeRows}
        </div>
      `;
    }

    const html = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #1f2d3d; padding: 24px; }
            h1 { margin-bottom: 8px; }
            .meta { color: #6b7c93; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { text-align: left; padding: 10px; border-bottom: 1px solid #e6e9ec; }
            th { background: #f8f9fb; }
            .summary > div { margin-bottom: 8px; }
            h3 { margin-top: 16px; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="meta">Date Range: ${dateRange.start} to ${dateRange.end}</div>
          ${content}
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const isPrintDisabled =
    (activeTab === 'spend' && selectedSpendIds.length === 0) ||
    (activeTab === 'downtime' && selectedDowntimeIds.length === 0) ||
    (activeTab === 'cycle' && !cycleTime) ||
    (activeTab === 'summary' && !fleetSummary);

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1>Fleet Reports</h1>
          <p className="subtitle">Analytics and insights for fleet management</p>
        </div>
        <div className="report-actions">
          <button className="print-btn" onClick={handlePrint} disabled={isPrintDisabled}>
            Print Report
          </button>
        </div>
      </div>

      <div className="report-controls">
        <div className="date-filters">
          <label>
            From:
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
          </label>
          <label>
            To:
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </label>
        </div>
      </div>

      <div className="report-tabs">
        <button
          className={`tab ${activeTab === 'spend' ? 'active' : ''}`}
          onClick={() => setActiveTab('spend')}
        >
          Maintenance Spend
        </button>
        <button
          className={`tab ${activeTab === 'downtime' ? 'active' : ''}`}
          onClick={() => setActiveTab('downtime')}
        >
          Vehicle Downtime
        </button>
        <button
          className={`tab ${activeTab === 'cycle' ? 'active' : ''}`}
          onClick={() => setActiveTab('cycle')}
        >
          Request Cycle Time
        </button>
        <button
          className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Fleet Summary
        </button>
      </div>

      <div className="report-content">
        {loading && <div className="loading">Loading report...</div>}
        {error && <div className="alert alert-error">{error}</div>}
        
        {!loading && !error && activeTab === 'spend' && (
          <div className="report-section">
            <h2>Maintenance Spend by Vehicle</h2>
            {!maintenanceSpend || maintenanceSpend.length === 0 ? (
              <div className="empty-state">No data available for this period</div>
            ) : (
              <>
                <div className="chart-container">
                  {maintenanceSpend.map((item) => {
                    const maxSpend = Math.max(...maintenanceSpend.map(i => i.total_spend), 1);
                    return (
                      <div key={item.vehicle_id} className="bar-chart-item">
                        <label className="bar-select">
                          <input
                            type="checkbox"
                            checked={selectedSpendIds.includes(item.vehicle_id)}
                            onChange={() => toggleSpendSelection(item.vehicle_id)}
                            title={`Select ${item.vehicle_plate} for maintenance spend comparison`}
                          />
                        </label>
                        <div className="bar-label">{item.vehicle_plate}</div>
                        <div className="bar-wrapper">
                          <progress
                            className="bar-progress"
                            max={100}
                            value={(item.total_spend / maxSpend) * 100}
                            title={`Maintenance spend ratio for ${item.vehicle_plate}: ${((item.total_spend / maxSpend) * 100).toFixed(0)}%`}
                          />
                          <span className="bar-progress-label">₱{item.total_spend.toLocaleString()}</span>
                        </div>
                        <div className="bar-info">{item.work_order_count} orders</div>
                      </div>
                    );
                  })}
                </div>
                <div className="summary-stats">
                  <div className="stat-card">
                    <div className="stat-value">₱{maintenanceSpend.reduce((sum, i) => sum + i.total_spend, 0).toLocaleString()}</div>
                    <div className="stat-label">Total Spend</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{maintenanceSpend.reduce((sum, i) => sum + i.work_order_count, 0)}</div>
                    <div className="stat-label">Total Work Orders</div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {!loading && !error && activeTab === 'downtime' && (
          <div className="report-section">
            <h2>Vehicle Downtime Analysis</h2>
            {!vehicleDowntime || vehicleDowntime.length === 0 ? (
              <div className="empty-state">No data available for this period</div>
            ) : (
              <>
                <div className="chart-container">
                  {vehicleDowntime.map((item) => {
                    const maxDowntime = Math.max(...vehicleDowntime.map(i => i.downtime_days), 1);
                    return (
                      <div key={item.vehicle_id} className="bar-chart-item">
                        <label className="bar-select">
                          <input
                            type="checkbox"
                            checked={selectedDowntimeIds.includes(item.vehicle_id)}
                            onChange={() => toggleDowntimeSelection(item.vehicle_id)}
                            title={`Select ${item.vehicle_plate} for downtime comparison`}
                          />
                        </label>
                        <div className="bar-label">{item.vehicle_plate}</div>
                        <div className="bar-wrapper">
                          <progress
                            className="bar-progress downtime-bar"
                            max={100}
                            value={(item.downtime_days / maxDowntime) * 100}
                            title={`Downtime ratio for ${item.vehicle_plate}: ${((item.downtime_days / maxDowntime) * 100).toFixed(0)}%`}
                          />
                          <span className="bar-progress-label">{item.downtime_days} days</span>
                        </div>
                        <div className="bar-info">{item.work_order_count} orders</div>
                      </div>
                    );
                  })}
                </div>
                <div className="summary-stats">
                  <div className="stat-card">
                    <div className="stat-value">{vehicleDowntime.reduce((sum, i) => sum + i.downtime_days, 0)}</div>
                    <div className="stat-label">Total Downtime Days</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{(vehicleDowntime.reduce((sum, i) => sum + i.downtime_days, 0) / vehicleDowntime.length).toFixed(1)}</div>
                    <div className="stat-label">Average per Vehicle</div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {!loading && !error && activeTab === 'cycle' && cycleTime && (
          <div className="report-section">
            <h2>Service Request Cycle Time</h2>
            <div className="summary-stats large">
              <div className="stat-card featured">
                <div className="stat-value">{cycleTime.average_days.toFixed(1)}</div>
                <div className="stat-label">Average Days to Complete</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{cycleTime.total_requests}</div>
                <div className="stat-label">Total Requests</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{cycleTime.completed_requests}</div>
                <div className="stat-label">Completed</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{((cycleTime.completed_requests / cycleTime.total_requests) * 100).toFixed(0)}%</div>
                <div className="stat-label">Completion Rate</div>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && activeTab === 'summary' && fleetSummary && (
          <div className="report-section">
            <h2>Fleet Summary</h2>
            <div className="summary-stats large">
              <div className="stat-card featured">
                <div className="stat-value">{fleetSummary.total_vehicles}</div>
                <div className="stat-label">Total Vehicles</div>
              </div>
            </div>
            
            <div className="summary-grid">
              <div className="summary-column">
                <h3>By Status</h3>
                <div className="pie-chart">
                  {Object.entries(fleetSummary.by_status).map(([status, count]) => (
                    <div key={status} className="pie-item">
                      <span className="pie-label">{status}</span>
                      <span className="pie-value">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="summary-column">
                <h3>By Type</h3>
                <div className="pie-chart">
                  {Object.entries(fleetSummary.by_type).map(([type, count]) => (
                    <div key={type} className="pie-item">
                      <span className="pie-label">{type}</span>
                      <span className="pie-value">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
