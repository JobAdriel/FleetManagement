import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePermission } from '../hooks/usePermission';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import '../styles/ResourcePage.css';

interface PreventiveRule {
  id: string;
  name: string;
  trigger_type: string;
  trigger_value: number;
  action: string;
  is_active: boolean;
  created_at?: string;
}

interface NextDueItem {
  vehicle_id: string;
  vehicle: string;
  next_maintenance: Array<{
    rule_name: string;
    type: string;
    current?: number;
    next_at?: number;
    remaining?: number;
    next_date?: string;
    days_remaining?: number;
  }>;
}

type SortKey = 'name' | 'trigger_type' | 'is_active';

interface PaginatedResponse<T> {
  data: T[];
  current_page?: number;
  last_page?: number;
  total?: number;
}

const emptyForm = {
  name: '',
  trigger_type: 'mileage',
  trigger_value: '',
  action: '',
  is_active: true,
};

export default function PreventiveRules() {
  const { hasPermission } = usePermission();
  const { token } = useAuth();
  const [rules, setRules] = useState<PreventiveRule[]>([]);
  const [nextDue, setNextDue] = useState<NextDueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showNextDue, setShowNextDue] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc',
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState({ ...emptyForm });
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const canCreate = hasPermission('manage_settings');
  const canEdit = hasPermission('manage_settings');
  const canDelete = hasPermission('manage_settings');

  const fetchRules = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await apiClient.get(
        `/preventive-rules?page=${currentPage}`,
        token
      );
      
      if (response.error) throw new Error(response.error);
      
      const paginatedData = response.data as PaginatedResponse<PreventiveRule>;
      setRules(paginatedData?.data || []);
      setLastPage(paginatedData?.last_page || 1);
      setTotal(paginatedData?.total || 0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preventive rules');
    } finally {
      setLoading(false);
    }
  }, [token, currentPage]);

  const fetchNextDue = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await apiClient.get('/preventive-rules/next-due/calculate', token);
      if (response.error) throw new Error(response.error);
      setNextDue((response.data as NextDueItem[]) || []);
    } catch (err) {
      console.error('Failed to calculate next due:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const filteredRules = useMemo(() => {
    const needle = filter.toLowerCase();
    return rules.filter(rule =>
      filter === '' ||
      (rule.name ?? '').toLowerCase().includes(needle) ||
      (rule.trigger_type ?? '').toLowerCase().includes(needle)
    );
  }, [rules, filter]);

  const sortedRules = useMemo(() => {
    return [...filteredRules].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === undefined || bValue === undefined) return 0;
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredRules, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleCreate = () => {
    setFormMode('create');
    setFormData({ ...emptyForm });
    setFormError(null);
    setEditingId(null);
    setIsFormOpen(true);
  };

  const handleEdit = (rule: PreventiveRule) => {
    setFormMode('edit');
    setFormData({
      name: rule.name,
      trigger_type: rule.trigger_type,
      trigger_value: rule.trigger_value.toString(),
      action: rule.action,
      is_active: rule.is_active,
    });
    setFormError(null);
    setEditingId(rule.id);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setFormError(null);

    try {
      const payload = {
        ...formData,
        trigger_value: parseInt(formData.trigger_value),
      };

      if (formMode === 'create') {
        const response = await apiClient.post('/preventive-rules', payload, token);
        if (response.error) throw new Error(response.error);
      } else if (editingId) {
        const response = await apiClient.put(`/preventive-rules/${editingId}`, payload, token);
        if (response.error) throw new Error(response.error);
      }

      setIsFormOpen(false);
      fetchRules();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save rule');
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm('Delete this preventive rule?')) return;

    try {
      const response = await apiClient.delete(`/preventive-rules/${id}`, token);
      if (response.error) throw new Error(response.error);
      fetchRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete rule');
    }
  };

  const handleShowNextDue = async () => {
    await fetchNextDue();
    setShowNextDue(true);
  };

  if (loading && rules.length === 0) {
    return <div className="loading">Loading preventive rules...</div>;
  }

  return (
    <div className="resource-page">
      <div className="page-header">
        <h1>Preventive Maintenance Rules</h1>
        <div className="inline-flex-gap-10">
          <button onClick={handleShowNextDue} className="btn btn-secondary">
            📊 View Next Due
          </button>
          {canCreate && (
            <button onClick={handleCreate} className="btn btn-primary">
              + New Rule
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="toolbar">
        <input
          type="text"
          placeholder="Search rules..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="search-input"
        />
        <span className="result-count">
          {total} total ({sortedRules.length} shown)
        </span>
      </div>

      <div className="table-container">
        <table className="resource-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')}>
                Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('trigger_type')}>
                Type {sortConfig.key === 'trigger_type' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th>Trigger Value</th>
              <th>Action</th>
              <th onClick={() => handleSort('is_active')}>
                Status {sortConfig.key === 'is_active' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              {(canEdit || canDelete) && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {sortedRules.map((rule) => (
              <tr key={rule.id}>
                <td>{rule.name}</td>
                <td>
                  <span className="badge">
                    {rule.trigger_type === 'mileage' ? '📏 Mileage' : 
                     rule.trigger_type === 'time' ? '⏱️ Time' : '📅 Date'}
                  </span>
                </td>
                <td>
                  {rule.trigger_type === 'mileage' ? `${rule.trigger_value} km` : 
                   rule.trigger_type === 'time' ? `${rule.trigger_value} days` : 
                   rule.trigger_value}
                </td>
                <td>{rule.action}</td>
                <td>
                  <span className={`status-badge ${rule.is_active ? 'status-active' : 'status-inactive'}`}>
                    {rule.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                {(canEdit || canDelete) && (
                  <td className="actions">
                    {canEdit && (
                      <button onClick={() => handleEdit(rule)} className="btn-small btn-edit">
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => handleDelete(rule.id)} className="btn-small btn-delete">
                        Delete
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="btn-small"
        >
          Previous
        </button>
        <span>Page {currentPage} of {lastPage}</span>
        <button
          onClick={() => setCurrentPage(p => Math.min(lastPage, p + 1))}
          disabled={currentPage === lastPage}
          className="btn-small"
        >
          Next
        </button>
      </div>

      {isFormOpen && (
        <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{formMode === 'create' ? 'Create Preventive Rule' : 'Edit Preventive Rule'}</h2>
            
            {formError && <div className="error-message">{formError}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Rule Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Oil Change Every 5000km"
                />
              </div>

              <div className="form-group">
                <label>Trigger Type *</label>
                <select
                  value={formData.trigger_type}
                  onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value })}
                  required
                  title="Select trigger type"
                >
                  <option value="mileage">Mileage (km)</option>
                  <option value="time">Time (days)</option>
                  <option value="date">Specific Date</option>
                </select>
              </div>

              <div className="form-group">
                <label>Trigger Value *</label>
                <input
                  type="number"
                  value={formData.trigger_value}
                  onChange={(e) => setFormData({ ...formData, trigger_value: e.target.value })}
                  required
                  placeholder={
                    formData.trigger_type === 'mileage' ? 'e.g., 5000' :
                    formData.trigger_type === 'time' ? 'e.g., 90' : 'e.g., 20260101'
                  }
                />
              </div>

              <div className="form-group">
                <label>Action *</label>
                <input
                  type="text"
                  value={formData.action}
                  onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                  required
                  placeholder="e.g., Schedule oil change service"
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  {' '}Active
                </label>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setIsFormOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {formMode === 'create' ? 'Create' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNextDue && (
        <div className="modal-overlay" onClick={() => setShowNextDue(false)}>
          <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}>
            <h2>Next Maintenance Due</h2>
            
            {nextDue.length === 0 ? (
              <p>No upcoming maintenance scheduled.</p>
            ) : (
              <div className="next-due-list">
                {nextDue.map((item) => (
                  <div key={item.vehicle_id} className="next-due-item">
                    <h3>{item.vehicle}</h3>
                    <table className="resource-table">
                      <thead>
                        <tr>
                          <th>Rule</th>
                          <th>Type</th>
                          <th>Current</th>
                          <th>Next Due</th>
                          <th>Remaining</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.next_maintenance.map((maint, idx) => (
                          <tr key={idx}>
                            <td>{maint.rule_name}</td>
                            <td>{maint.type}</td>
                            <td>
                              {maint.type === 'mileage' ? `${maint.current} km` : 'N/A'}
                            </td>
                            <td>
                              {maint.type === 'mileage' ? `${maint.next_at} km` : maint.next_date}
                            </td>
                            <td>
                              {maint.type === 'mileage' 
                                ? `${maint.remaining} km`
                                : `${maint.days_remaining} days`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
            
            <div className="form-actions">
              <button onClick={() => setShowNextDue(false)} className="btn btn-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
