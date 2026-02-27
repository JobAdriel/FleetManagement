import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePermission } from '../hooks/usePermission';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import '../styles/ResourcePage.css';

interface ServiceRequest {
  id: string;
  vehicle_id: string;
  issue_description: string;
  priority: string;
  status: string;
  created_at?: string;
}

interface VehicleOption {
  id: string;
  make: string;
  model: string;
  plate: string;
}

type SortKey = 'priority' | 'status' | 'created_at';

interface PaginatedResponse<T> {
  data: T[];
  current_page?: number;
  last_page?: number;
  total?: number;
}

const emptyForm = {
  vehicle_id: '',
  issue_description: '',
  priority: 'normal',
  status: 'draft',
};

export default function ServiceRequests() {
  const { hasPermission } = usePermission();
  const { token } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'created_at',
    direction: 'desc',
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState({ ...emptyForm });
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const getErrorMessage = (error: unknown, fallback: string) => {
    return error instanceof Error ? error.message : fallback;
  };

  const fetchVehicles = useCallback(async () => {
    try {
      const response = await apiClient.get('/vehicles', token || undefined);
      if (response.error) {
        throw new Error(response.error);
      }
      const payload = (response.data || {}) as PaginatedResponse<VehicleOption> | VehicleOption[];
      const items = Array.isArray(payload) ? payload : payload.data || [];
      setVehicles(items);
    } catch {
      setVehicles([]);
    }
  }, [token]);

  const fetchRequests = useCallback(async (page: number) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/service-requests?page=${page}`, token || undefined);
      if (response.error) {
        throw new Error(response.error);
      }
      const payload = (response.data || {}) as PaginatedResponse<ServiceRequest> | ServiceRequest[];
      const items = Array.isArray(payload) ? payload : payload.data || [];
      setRequests(items);
      if (!Array.isArray(payload)) {
        setCurrentPage(payload.current_page || 1);
        setLastPage(payload.last_page || 1);
        setTotal(payload.total || items.length);
      } else {
        setCurrentPage(1);
        setLastPage(1);
        setTotal(items.length);
      }
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load service requests'));
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRequests(currentPage);
  }, [fetchRequests, currentPage]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const vehicleLookup = useMemo(() => {
    const map: Record<string, VehicleOption> = {};
    vehicles.forEach((vehicle) => {
      map[vehicle.id] = vehicle;
    });
    return map;
  }, [vehicles]);

  const filteredRequests = useMemo(() => {
    const needle = filter.toLowerCase();
    return requests.filter((request) => {
      const vehicle = vehicleLookup[request.vehicle_id];
      const vehicleLabel = vehicle ? `${vehicle.make} ${vehicle.model} ${vehicle.plate}`.toLowerCase() : '';
      return (
        (request.issue_description ?? '').toLowerCase().includes(needle) ||
        (request.status ?? '').toLowerCase().includes(needle) ||
        (request.priority ?? '').toLowerCase().includes(needle) ||
        vehicleLabel.includes(needle)
      );
    });
  }, [requests, filter, vehicleLookup]);

  const sortedRequests = useMemo(() => {
    const list = [...filteredRequests];
    list.sort((a, b) => {
      const key = sortConfig.key;
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      const aValue = (a[key] ?? '').toString().toLowerCase();
      const bValue = (b[key] ?? '').toString().toLowerCase();
      if (aValue < bValue) return -1 * direction;
      if (aValue > bValue) return 1 * direction;
      return 0;
    });
    return list;
  }, [filteredRequests, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const openCreateForm = () => {
    setFormMode('create');
    setFormData({ ...emptyForm });
    setEditingId(null);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (request: ServiceRequest) => {
    setFormMode('edit');
    setEditingId(request.id);
    setFormData({
      vehicle_id: request.vehicle_id,
      issue_description: request.issue_description || '',
      priority: request.priority || 'normal',
      status: request.status || 'draft',
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setFormError(null);
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const basePayload = {
      vehicle_id: formData.vehicle_id,
      issue_description: formData.issue_description.trim(),
      priority: formData.priority,
    };

    try {
      if (formMode === 'create') {
        const response = await apiClient.post('/service-requests', basePayload, token || undefined);
        if (response.error) {
          throw new Error(response.error);
        }
      } else if (editingId) {
        const updatePayload = {
          ...basePayload,
          status: formData.status,
        };
        const response = await apiClient.put(`/service-requests/${editingId}`, updatePayload, token || undefined);
        if (response.error) {
          throw new Error(response.error);
        }
      }

      closeForm();
      fetchRequests(currentPage);
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, 'Failed to save request'));
    }
  };

  const handleDelete = async (request: ServiceRequest) => {
    if (!window.confirm('Delete this service request? This cannot be undone.')) {
      return;
    }

    try {
      const response = await apiClient.delete(`/service-requests/${request.id}`, token || undefined);
      if (response.error) {
        throw new Error(response.error);
      }
      fetchRequests(currentPage);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to delete request'));
    }
  };

  const sortIndicator = (key: SortKey) => {
    if (sortConfig.key !== key) return '↕';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="resource-page">
      <div className="page-header">
        <h1>📝 Service Requests</h1>
        {hasPermission('create_service_requests') && (
          <button className="btn-primary" onClick={openCreateForm}>+ New Request</button>
        )}
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by vehicle, issue, priority, or status..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="filter-input"
        />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading service requests...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Issue</th>
                <th className="sortable" onClick={() => handleSort('priority')}>Priority {sortIndicator('priority')}</th>
                <th className="sortable" onClick={() => handleSort('status')}>Status {sortIndicator('status')}</th>
                <th className="sortable" onClick={() => handleSort('created_at')}>Created {sortIndicator('created_at')}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedRequests.length > 0 ? (
                sortedRequests.map((request) => {
                  const vehicle = vehicleLookup[request.vehicle_id];
                  return (
                    <tr key={request.id}>
                      <td>
                        {vehicle ? `${vehicle.make} ${vehicle.model}` : 'Unknown'}
                        {vehicle && <div className="text-muted"><code>{vehicle.plate}</code></div>}
                      </td>
                      <td>{request.issue_description}</td>
                      <td>{request.priority}</td>
                      <td>
                        <span className={`badge status-${request.status}`}>{request.status}</span>
                      </td>
                      <td>{request.created_at ? new Date(request.created_at).toLocaleDateString() : '-'}</td>
                      <td>
                        <div className="action-buttons">
                          {hasPermission('edit_service_requests') && (
                            <button className="btn-sm btn-warning" onClick={() => openEditForm(request)}>Edit</button>
                          )}
                          {hasPermission('delete_service_requests') && (
                            <button className="btn-sm btn-danger" onClick={() => handleDelete(request)}>Delete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center">
                    No service requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <span>
          {sortedRequests.length} of {total} request(s)
        </span>
        <div className="pagination-controls">
          <button
            className="btn-sm btn-secondary"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          >
            Prev
          </button>
          <span>
            Page {currentPage} of {lastPage}
          </span>
          <button
            className="btn-sm btn-secondary"
            disabled={currentPage >= lastPage}
            onClick={() => setCurrentPage((page) => Math.min(lastPage, page + 1))}
          >
            Next
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h2>{formMode === 'create' ? 'Create Service Request' : 'Edit Service Request'}</h2>
              <button className="modal-close" onClick={closeForm} aria-label="Close">×</button>
            </div>
            {formError && <div className="alert alert-error">{formError}</div>}
            <form onSubmit={handleSubmit} className="form-grid">
              <div className="form-group">
                <label>Vehicle *</label>
                <select
                  value={formData.vehicle_id}
                  onChange={(e) => handleFormChange('vehicle_id', e.target.value)}
                  required
                  title="Select vehicle"
                >
                  <option value="">Select a vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} ({vehicle.plate})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group full-width">
                <label>Issue Description *</label>
                <textarea
                  rows={4}
                  value={formData.issue_description}
                  onChange={(e) => handleFormChange('issue_description', e.target.value)}
                  required
                  title="Issue description"
                />
              </div>
              <div className="form-group">
                <label>Priority *</label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleFormChange('priority', e.target.value)}
                  required
                  title="Priority"
                >
                  <option value="low">low</option>
                  <option value="normal">normal</option>
                  <option value="high">high</option>
                </select>
              </div>
              {formMode === 'edit' && (
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleFormChange('status', e.target.value)}
                    title="Service request status"
                  >
                    <option value="draft">draft</option>
                    <option value="submitted">submitted</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>
              )}
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
