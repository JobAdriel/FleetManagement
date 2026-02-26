import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePermission } from '../hooks/usePermission';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import '../styles/ResourcePage.css';

interface Permission {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
  permissions?: Permission[];
}

type SortKey = 'name';

const PROTECTED_ROLES = ['Admin', 'Manager', 'Technician', 'Dispatcher', 'Approver'];

const emptyForm = {
  name: '',
  permissions: [] as string[],
};

export default function Roles() {
  const { hasPermission } = usePermission();
  const { token } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc',
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState({ ...emptyForm });
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [permissionSearch, setPermissionSearch] = useState('');

  const canManageRoles = hasPermission('manage_roles');

  const getErrorMessage = (error: unknown, fallback: string) => {
    return error instanceof Error ? error.message : fallback;
  };

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/roles', token || undefined);
      if (response.error) {
        throw new Error(response.error);
      }
      setRoles((response.data as Role[]) || []);
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load roles'));
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchPermissions = useCallback(async () => {
    try {
      const response = await apiClient.get('/permissions', token || undefined);
      if (response.error) throw new Error(response.error);
      setPermissions((response.data as Permission[]) || []);
    } catch (err: unknown) {
      console.error('Failed to load permissions:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, [fetchRoles, fetchPermissions]);

  const filteredRoles = useMemo(() => {
    if (!filter) return roles;
    const lowerFilter = filter.toLowerCase();
    return roles.filter((role) => role.name.toLowerCase().includes(lowerFilter));
  }, [roles, filter]);

  const resourceFilteredRoles = useMemo(() => {
    if (resourceFilter === 'all') return filteredRoles;
    return filteredRoles.filter((role) =>
      (role.permissions || []).some((permission) => {
        if (permission.name.includes('_')) {
          return permission.name.split('_').slice(1).join('_') === resourceFilter;
        }
        return permission.name.split('.')[0] === resourceFilter;
      })
    );
  }, [filteredRoles, resourceFilter]);

  const sortedRoles = useMemo(() => {
    const sorted = [...resourceFilteredRoles];
    sorted.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal === bVal) return 0;
      const comparison = aVal < bVal ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [resourceFilteredRoles, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleCreate = () => {
    setFormMode('create');
    setFormData({ ...emptyForm });
    setEditingId(null);
    setFormError(null);
    setPermissionSearch('');
    setIsFormOpen(true);
  };

  const handleEdit = (role: Role) => {
    setFormMode('edit');
    setEditingId(role.id);
    setFormData({
      name: role.name,
      permissions: (role.permissions || []).map(p => p.name),
    });
    setFormError(null);
    setPermissionSearch('');
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (PROTECTED_ROLES.includes(name)) {
      alert('Cannot delete core system roles');
      return;
    }
    if (!confirm(`Are you sure you want to delete the role "${name}"?`)) return;
    try {
      const response = await apiClient.delete(`/roles/${id}`, token || undefined);
      if (response.error) throw new Error(response.error);
      fetchRoles();
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to delete role'));
    }
  };

  const handleViewPermissions = (role: Role) => {
    setSelectedRole(role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      const payload = {
        name: formData.name,
        permissions: formData.permissions,
      };

      const response =
        formMode === 'create'
          ? await apiClient.post('/roles', payload, token || undefined)
          : await apiClient.put(`/roles/${editingId}`, payload, token || undefined);

      if (response.error) throw new Error(response.error);

      setIsFormOpen(false);
      setFormData({ ...emptyForm });
      setPermissionSearch('');
      setEditingId(null);
      fetchRoles();
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, 'Failed to save role'));
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormData({ ...emptyForm });
    setFormError(null);
    setPermissionSearch('');
    setEditingId(null);
  };

  const handlePermissionToggle = (permissionName: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionName)
        ? prev.permissions.filter(p => p !== permissionName)
        : [...prev.permissions, permissionName]
    }));
  };

  const handleTogglePermissionGroup = (resourceKey: string) => {
    const groupPermissions = groupedPermissions[resourceKey] || [];
    const names = groupPermissions.map((permission) => permission.name);
    const hasAll = names.every((name) => formData.permissions.includes(name));

    setFormData((prev) => ({
      ...prev,
      permissions: hasAll
        ? prev.permissions.filter((permission) => !names.includes(permission))
        : Array.from(new Set([...prev.permissions, ...names])),
    }));
  };

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    permissions.forEach(permission => {
      const resource = permission.name.includes('_')
        ? permission.name.split('_').slice(1).join('_')
        : permission.name.split('.')[0];
      if (!groups[resource]) groups[resource] = [];
      groups[resource].push(permission);
    });
    return groups;
  }, [permissions]);

  const permissionGroups = useMemo(() => {
    const entries = Object.entries(groupedPermissions).map(([resource, perms]) => {
      const filtered = permissionSearch
        ? perms.filter((perm) => perm.name.toLowerCase().includes(permissionSearch.toLowerCase()))
        : perms;
      return [resource, filtered] as const;
    });

    return entries.filter(([, perms]) => perms.length > 0);
  }, [groupedPermissions, permissionSearch]);

  const resourceFilters = useMemo(() => {
    return Object.keys(groupedPermissions).sort((a, b) => a.localeCompare(b));
  }, [groupedPermissions]);

  const summary = useMemo(() => {
    const totalRoles = roles.length;
    const totalPermissions = permissions.length;
    const protectedCount = roles.filter((role) => PROTECTED_ROLES.includes(role.name)).length;
    const assignedCount = roles.filter((role) => (role.permissions || []).length > 0).length;
    return { totalRoles, totalPermissions, protectedCount, assignedCount };
  }, [roles, permissions]);

  return (
    <div className="resource-page">
      <div className="page-header">
        <div>
          <h1>Roles & Permissions</h1>
          <p className="page-subtitle">Control access levels and permissions across the platform.</p>
        </div>
        <div className="header-actions">
          {canManageRoles && (
            <button className="btn btn-primary" onClick={handleCreate}>
              + Create Role
            </button>
          )}
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <p>Total Roles</p>
          <h3>{summary.totalRoles}</h3>
        </div>
        <div className="summary-card">
          <p>Total Permissions</p>
          <h3>{summary.totalPermissions}</h3>
        </div>
        <div className="summary-card">
          <p>Core Roles</p>
          <h3>{summary.protectedCount}</h3>
        </div>
        <div className="summary-card highlight">
          <p>Roles With Permissions</p>
          <h3>{summary.assignedCount}</h3>
        </div>
      </div>

      <div className="page-controls">
        <div className="search-group">
          <input
            type="text"
            placeholder="Search roles..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="search-input"
          />
          <select
            className="status-select"
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
          >
            <option value="all">All Resources</option>
            {resourceFilters.map((resource) => (
              <option key={resource} value={resource}>
                {resource}
              </option>
            ))}
          </select>
        </div>
        <span className="results-count">Showing {sortedRoles.length} role(s)</span>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading roles...</div>
      ) : sortedRoles.length === 0 ? (
        <div className="empty-state">
          <p>No roles found.</p>
          {canManageRoles && (
            <button className="btn btn-primary" onClick={handleCreate}>
              Create your first role
            </button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="resource-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} className="sortable">
                  Role Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th>Permissions</th>
                <th>Permissions Count</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedRoles.map((role) => (
                <tr key={role.id}>
                  <td>
                    <strong>{role.name}</strong>
                  </td>
                  <td>
                    {(role.permissions || []).slice(0, 3).map((permission) => (
                      <span key={permission.id} className="badge badge-info" style={{ marginRight: '4px' }}>
                        {permission.name}
                      </span>
                    ))}
                    {(role.permissions || []).length > 3 && (
                      <span className="badge badge-secondary">+{(role.permissions || []).length - 3}</span>
                    )}
                  </td>
                  <td>
                    <button 
                      className="btn btn-link" 
                      onClick={() => handleViewPermissions(role)}
                      style={{ padding: '4px 8px', fontSize: '0.9em' }}
                    >
                      {role.permissions?.length || 0} permissions
                    </button>
                  </td>
                  <td className="actions">
                    {canManageRoles && (
                      <button className="btn-icon" onClick={() => handleEdit(role)} title="Edit">
                        ✏️
                      </button>
                    )}
                    {canManageRoles && (
                      <button 
                        className="btn-icon" 
                        onClick={() => handleDelete(role.id, role.name)} 
                        title="Delete"
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isFormOpen && (
        <div className="modal-overlay" onClick={handleCloseForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>{formMode === 'create' ? 'Create Role' : 'Edit Role'}</h2>
              <button className="modal-close" onClick={handleCloseForm}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="form">
              {formError && <div className="error-message">{formError}</div>}

              <div className="form-group">
                <label>Role Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Fleet Manager"
                />
              </div>

              <div className="form-group">
                <label>Permissions</label>
                <input
                  type="text"
                  placeholder="Filter permissions..."
                  value={permissionSearch}
                  onChange={(e) => setPermissionSearch(e.target.value)}
                  className="search-input"
                  style={{ marginBottom: '12px' }}
                />
                <div style={{ 
                  maxHeight: '400px', 
                  overflowY: 'auto', 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '4px', 
                  padding: '12px' 
                }}>
                  {permissionGroups.map(([resource, perms]) => (
                    <div key={resource} style={{ marginBottom: '16px' }}>
                      <h4 style={{ 
                        textTransform: 'capitalize', 
                        marginBottom: '8px', 
                        color: '#2c3e50',
                        fontSize: '0.95em',
                        fontWeight: '600'
                      }}>
                        {resource}
                      </h4>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', marginBottom: '8px' }}
                        onClick={() => handleTogglePermissionGroup(resource)}
                      >
                        Toggle All
                      </button>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: '12px' }}>
                        {perms.map(permission => (
                          <label key={permission.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(permission.name)}
                              onChange={() => handlePermissionToggle(permission.name)}
                            />
                            <span style={{ fontSize: '0.9em' }}>{permission.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseForm}>
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

      {selectedRole && (
        <div className="modal-overlay" onClick={() => setSelectedRole(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{selectedRole.name} - Permissions</h2>
              <button className="modal-close" onClick={() => setSelectedRole(null)}>
                ×
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              {selectedRole.permissions && selectedRole.permissions.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {selectedRole.permissions.map(permission => (
                    <div 
                      key={permission.id} 
                      style={{ 
                        padding: '8px 12px', 
                        background: '#f8f9fa', 
                        borderRadius: '4px',
                        fontSize: '0.9em'
                      }}
                    >
                      {permission.name}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#95a5a6' }}>No permissions assigned</p>
              )}
            </div>

            <div style={{ padding: '0 20px 20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedRole(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
