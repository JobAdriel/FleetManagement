import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePermission } from '../hooks/usePermission';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import '../styles/ResourcePage.css';

interface Role {
  id: string;
  name: string;
}

interface User {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  email_verified_at?: string | null;
  two_factor_enabled?: boolean | number;
  created_at: string;
  roles?: Role[];
  roles_names?: string[];
}

type SortKey = 'name' | 'email' | 'created_at';

interface PaginatedResponse<T> {
  data: T[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

const emptyForm = {
  name: '',
  email: '',
  password: '',
  roles: [] as string[],
};

export default function Users() {
  const { hasPermission } = usePermission();
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'created_at',
    direction: 'desc',
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState({ ...emptyForm });
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const canManageUsers = hasPermission('manage_users');

  const getErrorMessage = (error: unknown, fallback: string) => {
    return error instanceof Error ? error.message : fallback;
  };

  const fetchUsers = useCallback(async (page: number) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/users?page=${page}`, token || undefined);
      if (response.error) {
        throw new Error(response.error);
      }
      const payload = (response.data || {}) as PaginatedResponse<User> | User[];
      const items = Array.isArray(payload) ? payload : payload.data || [];
      setUsers(items);
      if (!Array.isArray(payload)) {
        setCurrentPage(payload.current_page || 1);
        setLastPage(payload.last_page || 1);
      }
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load users'));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await apiClient.get('/roles', token || undefined);
      if (response.error) throw new Error(response.error);
      setRoles((response.data as Role[]) || []);
    } catch (err: unknown) {
      console.error('Failed to load roles:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers(currentPage);
    fetchRoles();
  }, [fetchUsers, fetchRoles, currentPage]);

  const filteredUsers = useMemo(() => {
    if (!filter) return users;
    const lowerFilter = filter.toLowerCase();
    return users.filter(
      (user) =>
        (user.name ?? '').toLowerCase().includes(lowerFilter) ||
        (user.email ?? '').toLowerCase().includes(lowerFilter) ||
        (user.roles_names || []).some(role => role.toLowerCase().includes(lowerFilter))
    );
  }, [users, filter]);

  const roleFilteredUsers = useMemo(() => {
    if (roleFilter === 'all') return filteredUsers;
    return filteredUsers.filter((user) => (user.roles_names || []).includes(roleFilter));
  }, [filteredUsers, roleFilter]);

  const sortedUsers = useMemo(() => {
    const sorted = [...roleFilteredUsers];
    sorted.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal === bVal) return 0;
      const comparison = aVal < bVal ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [roleFilteredUsers, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleCreate = () => {
    setFormMode('create');
    setFormData({ ...emptyForm });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleEdit = (user: User) => {
    setFormMode('edit');
    setEditingId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Don't pre-fill password for security
      roles: user.roles_names || [],
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (currentUser?.id?.toString() === id) {
      alert('You cannot delete your own account');
      return;
    }
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const response = await apiClient.delete(`/users/${id}`, token || undefined);
      if (response.error) throw new Error(response.error);
      fetchUsers(currentPage);
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to delete user'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (formMode === 'create' && !formData.password) {
      setFormError('Password is required for new users');
      return;
    }

    try {
      const payload: { name: string; email: string; roles: string[]; password?: string } = {
        name: formData.name,
        email: formData.email,
        roles: formData.roles,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const response =
        formMode === 'create'
          ? await apiClient.post('/users', payload, token || undefined)
          : await apiClient.put(`/users/${editingId}`, payload, token || undefined);

      if (response.error) throw new Error(response.error);

      setIsFormOpen(false);
      setFormData({ ...emptyForm });
      setEditingId(null);
      fetchUsers(currentPage);
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, 'Failed to save user'));
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormData({ ...emptyForm });
    setFormError(null);
    setEditingId(null);
  };

  const handleRoleToggle = (roleName: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(roleName)
        ? prev.roles.filter(r => r !== roleName)
        : [...prev.roles, roleName]
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US');
  };

  const summary = useMemo(() => {
    const totalCount = users.length;
    const assignedRolesCount = users.filter((user) => (user.roles_names || []).length > 0).length;
    const verifiedCount = users.filter((user) => !!user.email_verified_at).length;
    const twoFactorCount = users.filter((user) => Boolean(user.two_factor_enabled)).length;
    return { totalCount, assignedRolesCount, verifiedCount, twoFactorCount };
  }, [users]);

  return (
    <div className="resource-page">
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p className="page-subtitle">Manage team access, roles, and account details.</p>
        </div>
        <div className="header-actions">
          {canManageUsers && (
            <button className="btn btn-primary" onClick={handleCreate}>
              + Create User
            </button>
          )}
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <p>Total Users</p>
          <h3>{summary.totalCount}</h3>
        </div>
        <div className="summary-card">
          <p>Verified Emails</p>
          <h3>{summary.verifiedCount}</h3>
        </div>
        <div className="summary-card">
          <p>2FA Enabled</p>
          <h3>{summary.twoFactorCount}</h3>
        </div>
        <div className="summary-card highlight">
          <p>With Roles</p>
          <h3>{summary.assignedRolesCount}</h3>
        </div>
      </div>

      <div className="page-controls">
        <div className="search-group">
          <input
            type="text"
            placeholder="Search users..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="search-input"
            title="Search users"
          />
          <select
            className="status-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            title="Filter by role"
          >
            <option value="all">All Roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.name}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
        <span className="results-count">Showing {sortedUsers.length} user(s)</span>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading users...</div>
      ) : sortedUsers.length === 0 ? (
        <div className="empty-state">
          <p>No users found.</p>
          {canManageUsers && (
            <button className="btn btn-primary" onClick={handleCreate}>
              Create your first user
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="resource-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')} className="sortable">
                    Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('email')} className="sortable">
                    Email {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Roles</th>
                  <th>Verified</th>
                  <th>2FA</th>
                  <th onClick={() => handleSort('created_at')} className="sortable">
                    Created {sortConfig.key === 'created_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      {(user.roles_names || []).map(role => (
                        <span key={role} className="badge badge-info badge-spaced">
                          {role}
                        </span>
                      ))}
                      {user.id === currentUser?.id?.toString() && (
                        <span className="badge badge-secondary">You</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${user.email_verified_at ? 'badge-success' : 'badge-warning'}`}>
                        {user.email_verified_at ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${user.two_factor_enabled ? 'badge-success' : 'badge-secondary'}`}>
                        {user.two_factor_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td>{formatDate(user.created_at)}</td>
                    <td className="actions">
                      {canManageUsers && (
                        <button className="btn-icon" onClick={() => handleEdit(user)} title="Edit">
                          ✏️
                        </button>
                      )}
                      {canManageUsers && user.id !== currentUser?.id?.toString() && (
                        <button className="btn-icon" onClick={() => handleDelete(user.id)} title="Delete">
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {lastPage > 1 && (
            <div className="pagination">
              <button
                className="btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {lastPage}
              </span>
              <button
                className="btn"
                onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
                disabled={currentPage === lastPage}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {isFormOpen && (
        <div className="modal-overlay" onClick={handleCloseForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{formMode === 'create' ? 'Create User' : 'Edit User'}</h2>
              <button className="modal-close" onClick={handleCloseForm}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="form">
              {formError && <div className="error-message">{formError}</div>}

              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  title="User name"
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  title="User email"
                />
              </div>

              <div className="form-group">
                <label>Password {formMode === 'create' ? '*' : '(leave blank to keep current)'}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={formMode === 'create'}
                  minLength={8}
                  title="User password"
                />
              </div>

              <div className="form-group">
                <label>Roles</label>
                <div className="stack-vertical-gap-8">
                  {roles.map(role => (
                    <label key={role.id} className="inline-flex-center-gap-8">
                      <input
                        type="checkbox"
                        checked={formData.roles.includes(role.name)}
                        onChange={() => handleRoleToggle(role.name)}
                        title={`Assign role ${role.name}`}
                      />
                      {role.name}
                    </label>
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
    </div>
  );
}
