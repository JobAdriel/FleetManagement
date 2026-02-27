import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePermission } from '../hooks/usePermission';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import '../styles/ResourcePage.css';

interface Vehicle {
  id: string;
  plate: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  odometer?: number;
  fuel_type?: string | null;
  status?: string;
  tenant_id: string;
}

type SortKey = 'make' | 'model' | 'year' | 'plate' | 'vin' | 'status';

interface PaginatedResponse<T> {
  data: T[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

const emptyForm = {
  plate: '',
  vin: '',
  make: '',
  model: '',
  year: '',
  odometer: '',
  fuel_type: '',
  status: 'active',
};

export default function Vehicles() {
  const { hasPermission } = usePermission();
  const { token } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [total, setTotal] = useState(0);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'make',
    direction: 'asc',
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState({ ...emptyForm });
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const getErrorMessage = (error: unknown, fallback: string) => {
    return error instanceof Error ? error.message : fallback;
  };

  const fetchVehicles = useCallback(async (page: number) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/vehicles?page=${page}`, token || undefined);
      if (response.error) {
        throw new Error(response.error);
      }
      const payload = (response.data || {}) as PaginatedResponse<Vehicle> | Vehicle[];
      const items = Array.isArray(payload) ? payload : payload.data || [];
      setVehicles(items);
      if (!Array.isArray(payload)) {
        setCurrentPage(payload.current_page || 1);
        setLastPage(payload.last_page || 1);
        setPerPage(payload.per_page || 15);
        setTotal(payload.total || items.length);
      } else {
        setCurrentPage(1);
        setLastPage(1);
        setPerPage(items.length || 15);
        setTotal(items.length);
      }
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load vehicles'));
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchVehicles(currentPage);
  }, [fetchVehicles, currentPage]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const needle = filter.toLowerCase();
      return (
        (vehicle.make ?? '').toLowerCase().includes(needle) ||
        (vehicle.model ?? '').toLowerCase().includes(needle) ||
        (vehicle.plate ?? '').toLowerCase().includes(needle) ||
        (vehicle.vin ?? '').toLowerCase().includes(needle)
      );
    });
  }, [vehicles, filter]);

  const sortedVehicles = useMemo(() => {
    const list = [...filteredVehicles];
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
  }, [filteredVehicles, sortConfig]);

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

  const openEditForm = (vehicle: Vehicle) => {
    setFormMode('edit');
    setEditingId(vehicle.id);
    setFormData({
      plate: vehicle.plate || '',
      vin: vehicle.vin || '',
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: String(vehicle.year || ''),
      odometer: vehicle.odometer !== undefined ? String(vehicle.odometer) : '',
      fuel_type: vehicle.fuel_type || '',
      status: vehicle.status || 'active',
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
      plate: formData.plate.trim(),
      vin: formData.vin.trim(),
      make: formData.make.trim(),
      model: formData.model.trim(),
      year: Number(formData.year),
      fuel_type: formData.fuel_type.trim() || null,
    };

    try {
      if (formMode === 'create') {
        const createPayload = basePayload;
        const response = await apiClient.post('/vehicles', createPayload, token || undefined);
        if (response.error) {
          throw new Error(response.error);
        }
      } else if (editingId) {
        const updatePayload = {
          ...basePayload,
          odometer: formData.odometer ? Number(formData.odometer) : undefined,
          status: formData.status,
        };
        const response = await apiClient.put(`/vehicles/${editingId}`, updatePayload, token || undefined);
        if (response.error) {
          throw new Error(response.error);
        }
      }

      closeForm();
      fetchVehicles(currentPage);
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, 'Failed to save vehicle'));
    }
  };

  const handleDelete = async (vehicle: Vehicle) => {
    if (!window.confirm(`Delete vehicle ${vehicle.plate}? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await apiClient.delete(`/vehicles/${vehicle.id}`, token || undefined);
      if (response.error) {
        throw new Error(response.error);
      }
      fetchVehicles(currentPage);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to delete vehicle'));
    }
  };

  const sortIndicator = (key: SortKey) => {
    if (sortConfig.key !== key) return '↕';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="resource-page">
      <div className="page-header">
        <h1>🚗 Vehicles</h1>
        {hasPermission('create_vehicles') && (
          <button className="btn-primary" onClick={openCreateForm}>+ Add Vehicle</button>
        )}
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by make, model, plate, or VIN..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="filter-input"
        />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading vehicles...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('make')}>Make {sortIndicator('make')}</th>
                <th className="sortable" onClick={() => handleSort('model')}>Model {sortIndicator('model')}</th>
                <th className="sortable" onClick={() => handleSort('year')}>Year {sortIndicator('year')}</th>
                <th className="sortable" onClick={() => handleSort('plate')}>Plate {sortIndicator('plate')}</th>
                <th className="sortable" onClick={() => handleSort('vin')}>VIN {sortIndicator('vin')}</th>
                <th className="sortable" onClick={() => handleSort('status')}>Status {sortIndicator('status')}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedVehicles.length > 0 ? (
                sortedVehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td>{vehicle.make}</td>
                    <td>{vehicle.model}</td>
                    <td>{vehicle.year}</td>
                    <td>
                      <code>{vehicle.plate}</code>
                    </td>
                    <td>
                      <code>{vehicle.vin}</code>
                    </td>
                    <td>
                      <span className={`badge status-${vehicle.status || 'active'}`}>
                        {vehicle.status || 'active'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {hasPermission('edit_vehicles') && (
                          <button className="btn-sm btn-warning" onClick={() => openEditForm(vehicle)}>Edit</button>
                        )}
                        {hasPermission('delete_vehicles') && (
                          <button className="btn-sm btn-danger" onClick={() => handleDelete(vehicle)}>Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center">
                    No vehicles found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <span>
          {sortedVehicles.length} of {total} vehicle(s) | {perPage} per page
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
              <h2>{formMode === 'create' ? 'Add Vehicle' : 'Edit Vehicle'}</h2>
              <button className="modal-close" onClick={closeForm} aria-label="Close">×</button>
            </div>
            {formError && <div className="alert alert-error">{formError}</div>}
            <form onSubmit={handleSubmit} className="form-grid">
              <div className="form-group">
                <label>Plate *</label>
                <input
                  value={formData.plate}
                  onChange={(e) => handleFormChange('plate', e.target.value)}
                  required
                  title="Vehicle plate"
                />
              </div>
              <div className="form-group">
                <label>VIN *</label>
                <input
                  value={formData.vin}
                  onChange={(e) => handleFormChange('vin', e.target.value)}
                  required
                  title="Vehicle VIN"
                />
              </div>
              <div className="form-group">
                <label>Make *</label>
                <input
                  value={formData.make}
                  onChange={(e) => handleFormChange('make', e.target.value)}
                  required
                  title="Vehicle make"
                />
              </div>
              <div className="form-group">
                <label>Model *</label>
                <input
                  value={formData.model}
                  onChange={(e) => handleFormChange('model', e.target.value)}
                  required
                  title="Vehicle model"
                />
              </div>
              <div className="form-group">
                <label>Year *</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => handleFormChange('year', e.target.value)}
                  required
                  title="Vehicle year"
                />
              </div>
              <div className="form-group">
                <label>Odometer</label>
                <input
                  type="number"
                  value={formData.odometer}
                  onChange={(e) => handleFormChange('odometer', e.target.value)}
                  title="Odometer"
                />
              </div>
              <div className="form-group">
                <label>Fuel Type</label>
                <input
                  value={formData.fuel_type}
                  onChange={(e) => handleFormChange('fuel_type', e.target.value)}
                  title="Fuel type"
                />
              </div>
              {formMode === 'edit' && (
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleFormChange('status', e.target.value)}
                    title="Vehicle status"
                  >
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                    <option value="maintenance">maintenance</option>
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
