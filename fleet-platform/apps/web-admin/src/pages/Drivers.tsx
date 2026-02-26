import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePermission } from '../hooks/usePermission';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import '../styles/ResourcePage.css';

interface Driver {
  id: string;
  name: string;
  license_number: string;
  license_class: string;
  license_expiry: string;
  contact_phone?: string | null;
  contact_email?: string | null;
  employment_status?: string;
  tenant_id: string;
}

type SortKey = 'name' | 'license_number' | 'license_class' | 'license_expiry' | 'employment_status';

interface PaginatedResponse<T> {
  data: T[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

const emptyForm = {
  name: '',
  license_number: '',
  license_class: '',
  license_expiry: '',
  contact_phone: '',
  contact_email: '',
  employment_status: 'active',
};

export default function Drivers() {
  const { hasPermission } = usePermission();
  const { token } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [total, setTotal] = useState(0);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'name',
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

  const fetchDrivers = useCallback(async (page: number) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/drivers?page=${page}`, token || undefined);
      if (response.error) {
        throw new Error(response.error);
      }
      const payload = (response.data || {}) as PaginatedResponse<Driver> | Driver[];
      const items = Array.isArray(payload) ? payload : payload.data || [];
      setDrivers(items);
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
      setError(getErrorMessage(err, 'Failed to load drivers'));
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDrivers(currentPage);
  }, [fetchDrivers, currentPage]);

  const filteredDrivers = useMemo(() => {
    const needle = filter.toLowerCase();
    return drivers.filter((driver) => {
      return (
        driver.name.toLowerCase().includes(needle) ||
        driver.license_number.toLowerCase().includes(needle) ||
        (driver.contact_email || '').toLowerCase().includes(needle) ||
        (driver.contact_phone || '').includes(filter)
      );
    });
  }, [drivers, filter]);

  const sortedDrivers = useMemo(() => {
    const list = [...filteredDrivers];
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
  }, [filteredDrivers, sortConfig]);

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

  const openEditForm = (driver: Driver) => {
    setFormMode('edit');
    setEditingId(driver.id);
    setFormData({
      name: driver.name || '',
      license_number: driver.license_number || '',
      license_class: driver.license_class || '',
      license_expiry: driver.license_expiry || '',
      contact_phone: driver.contact_phone || '',
      contact_email: driver.contact_email || '',
      employment_status: driver.employment_status || 'active',
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
      name: formData.name.trim(),
      license_number: formData.license_number.trim(),
      license_class: formData.license_class.trim(),
      license_expiry: formData.license_expiry,
      contact_phone: formData.contact_phone.trim() || null,
      contact_email: formData.contact_email.trim() || null,
    };

    try {
      if (formMode === 'create') {
        const response = await apiClient.post('/drivers', basePayload, token || undefined);
        if (response.error) {
          throw new Error(response.error);
        }
      } else if (editingId) {
        const updatePayload = {
          ...basePayload,
          employment_status: formData.employment_status,
        };
        const response = await apiClient.put(`/drivers/${editingId}`, updatePayload, token || undefined);
        if (response.error) {
          throw new Error(response.error);
        }
      }

      closeForm();
      fetchDrivers(currentPage);
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, 'Failed to save driver'));
    }
  };

  const handleDelete = async (driver: Driver) => {
    if (!window.confirm(`Delete driver ${driver.name}? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await apiClient.delete(`/drivers/${driver.id}`, token || undefined);
      if (response.error) {
        throw new Error(response.error);
      }
      fetchDrivers(currentPage);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to delete driver'));
    }
  };

  const sortIndicator = (key: SortKey) => {
    if (sortConfig.key !== key) return '↕';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="resource-page">
      <div className="page-header">
        <h1>👤 Drivers</h1>
        {hasPermission('create_drivers') && (
          <button className="btn-primary" onClick={openCreateForm}>+ Add Driver</button>
        )}
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by name, license, or contact..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="filter-input"
        />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading drivers...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('name')}>Name {sortIndicator('name')}</th>
                <th className="sortable" onClick={() => handleSort('license_number')}>License # {sortIndicator('license_number')}</th>
                <th className="sortable" onClick={() => handleSort('license_class')}>Class {sortIndicator('license_class')}</th>
                <th className="sortable" onClick={() => handleSort('license_expiry')}>Expiry {sortIndicator('license_expiry')}</th>
                <th className="sortable" onClick={() => handleSort('employment_status')}>Status {sortIndicator('employment_status')}</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedDrivers.length > 0 ? (
                sortedDrivers.map((driver) => (
                  <tr key={driver.id}>
                    <td>
                      <strong>{driver.name}</strong>
                    </td>
                    <td>
                      <code>{driver.license_number}</code>
                    </td>
                    <td>{driver.license_class}</td>
                    <td>{driver.license_expiry}</td>
                    <td>
                      <span className={`badge status-${driver.employment_status || 'active'}`}>
                        {driver.employment_status || 'active'}
                      </span>
                    </td>
                    <td>
                      <div>
                        {driver.contact_email && (
                          <div><a href={`mailto:${driver.contact_email}`}>{driver.contact_email}</a></div>
                        )}
                        {driver.contact_phone && <div>{driver.contact_phone}</div>}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {hasPermission('edit_drivers') && (
                          <button className="btn-sm btn-warning" onClick={() => openEditForm(driver)}>Edit</button>
                        )}
                        {hasPermission('delete_drivers') && (
                          <button className="btn-sm btn-danger" onClick={() => handleDelete(driver)}>Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center">
                    No drivers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <span>
          {sortedDrivers.length} of {total} driver(s) | {perPage} per page
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
              <h2>{formMode === 'create' ? 'Add Driver' : 'Edit Driver'}</h2>
              <button className="modal-close" onClick={closeForm} aria-label="Close">×</button>
            </div>
            {formError && <div className="alert alert-error">{formError}</div>}
            <form onSubmit={handleSubmit} className="form-grid">
              <div className="form-group">
                <label>Name *</label>
                <input
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>License # *</label>
                <input
                  value={formData.license_number}
                  onChange={(e) => handleFormChange('license_number', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>License Class *</label>
                <input
                  value={formData.license_class}
                  onChange={(e) => handleFormChange('license_class', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>License Expiry *</label>
                <input
                  type="date"
                  value={formData.license_expiry}
                  onChange={(e) => handleFormChange('license_expiry', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Contact Phone</label>
                <input
                  value={formData.contact_phone}
                  onChange={(e) => handleFormChange('contact_phone', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Contact Email</label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleFormChange('contact_email', e.target.value)}
                />
              </div>
              {formMode === 'edit' && (
                <div className="form-group">
                  <label>Employment Status</label>
                  <select
                    value={formData.employment_status}
                    onChange={(e) => handleFormChange('employment_status', e.target.value)}
                  >
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                    <option value="suspended">suspended</option>
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
