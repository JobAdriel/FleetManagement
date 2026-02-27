import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePermission } from '../hooks/usePermission';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import '../styles/ResourcePage.css';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  plate: string;
}

interface ServiceRequest {
  id: string;
  vehicle_id: string;
  vehicle?: Vehicle | null;
}

interface Rfq {
  id: string;
  service_request_id: string;
  serviceRequest?: ServiceRequest | null;
}

interface Quote {
  id: string;
  total: number;
  status?: string;
  rfq_id?: string;
  rfq?: Rfq | null;
}

interface Vendor {
  id: string;
  name: string;
  type: string;
}

interface WorkOrder {
  id: string;
  quote_id: string;
  vehicle_id?: string;
  shop_id: string;
  assigned_to?: string;
  start_at?: string;
  complete_at?: string;
  status: string;
  owner_decision?: string;
  shop_notes?: string;
  job_details?: string;
  created_at?: string;
  quote?: Quote | null;
  vehicle?: Vehicle | null;
  shop?: Vendor | null;
}

type SortKey = 'start_at' | 'status' | 'created_at';

interface PaginatedResponse<T> {
  data: T[];
  current_page?: number;
  last_page?: number;
  total?: number;
}

const emptyForm = {
  quote_id: '',
  vehicle_id: '',
  shop_id: '',
  assigned_to: '',
  status: 'pending',
  owner_decision: 'pending',
  shop_notes: '',
  job_details: '',
  start_at: '',
  complete_at: '',
};

export default function WorkOrders() {
  const { hasPermission } = usePermission();
  const { token } = useAuth();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'start_at',
    direction: 'asc',
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState({ ...emptyForm });
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedWorkOrderIds, setSelectedWorkOrderIds] = useState<string[]>([]);

  const canCreate = hasPermission('create_work_orders');
  const canEdit = hasPermission('edit_work_orders');
  const canDelete = hasPermission('delete_work_orders');

  const fetchWorkOrders = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await apiClient.get(`/work-orders?page=${currentPage}`, token);
      if (response.error) throw new Error(response.error);

      const paginatedData = response.data as PaginatedResponse<WorkOrder>;
      setWorkOrders(paginatedData?.data || []);
      setLastPage(paginatedData?.last_page || 1);
      setTotal(paginatedData?.total || 0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load work orders');
    } finally {
      setLoading(false);
    }
  }, [token, currentPage]);

  const fetchQuotes = useCallback(async () => {
    if (!token) return;
    try {
      const response = await apiClient.get('/quotes?status=approved&per_page=100', token);
      const paginatedData = response.data as PaginatedResponse<Quote>;
      if (paginatedData?.data) {
        setQuotes(paginatedData.data);
      }
    } catch (error) {
      console.error('Failed to load quotes:', error);
    }
  }, [token]);

  const fetchVendors = useCallback(async () => {
    if (!token) return;
    try {
      const response = await apiClient.get('/vendors?per_page=100', token);
      const paginatedData = response.data as PaginatedResponse<Vendor>;
      if (paginatedData?.data) {
        setVendors(paginatedData.data);
      }
    } catch (error) {
      console.error('Failed to load vendors:', error);
    }
  }, [token]);

  const fetchVehicles = useCallback(async () => {
    if (!token) return;
    try {
      const response = await apiClient.get('/vehicles?per_page=100', token);
      const paginatedData = response.data as PaginatedResponse<Vehicle>;
      if (paginatedData?.data) {
        setVehicles(paginatedData.data);
      }
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    }
  }, [token]);

  useEffect(() => {
    fetchWorkOrders();
    fetchQuotes();
    fetchVendors();
    fetchVehicles();
  }, [fetchWorkOrders, fetchQuotes, fetchVendors, fetchVehicles]);

  useEffect(() => {
    if (isFormOpen && formMode === 'create') {
      fetchQuotes();
      fetchVendors();
      fetchVehicles();
    }
  }, [isFormOpen, formMode, fetchQuotes, fetchVendors, fetchVehicles]);

  const filteredWorkOrders = useMemo(() => {
    const needle = filter.toLowerCase();
    return workOrders.filter((wo) =>
      filter === '' ||
      (wo.status ?? '').toLowerCase().includes(needle) ||
      (wo.start_at && wo.start_at.includes(filter)) ||
      (wo.quote_id ?? '').toLowerCase().includes(needle)
    );
  }, [workOrders, filter]);

  const statusFilteredWorkOrders = useMemo(() => {
    if (statusFilter === 'all') return filteredWorkOrders;
    return filteredWorkOrders.filter((wo) => wo.status === statusFilter);
  }, [filteredWorkOrders, statusFilter]);

  const sortedWorkOrders = useMemo(() => {
    return [...statusFilteredWorkOrders].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === undefined || bValue === undefined) return 0;

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [statusFilteredWorkOrders, sortConfig]);

  const vendorMap = useMemo(() => {
    return vendors.reduce<Record<string, Vendor>>((acc, vendor) => {
      acc[vendor.id] = vendor;
      return acc;
    }, {});
  }, [vendors]);

  const quoteMap = useMemo(() => {
    return quotes.reduce<Record<string, Quote>>((acc, quote) => {
      acc[quote.id] = quote;
      return acc;
    }, {});
  }, [quotes]);

  const summary = useMemo(() => {
    const totalCount = workOrders.length;
    const pendingCount = workOrders.filter((wo) => wo.status === 'pending').length;
    const progressCount = workOrders.filter((wo) => wo.status === 'in_progress').length;
    const completedCount = workOrders.filter((wo) => wo.status === 'completed').length;
    return { totalCount, pendingCount, progressCount, completedCount };
  }, [workOrders]);

  const toggleSelection = (id: string) => {
    setSelectedWorkOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePrint = () => {
    const selectedWorkOrders = workOrders.filter((wo) => selectedWorkOrderIds.includes(wo.id));
    if (selectedWorkOrders.length === 0) {
      alert('Select at least one work order to print.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1000,height=700');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups to print.');
      return;
    }

    const rows = selectedWorkOrders
      .map((wo) => {
        const quoteTotal = wo.quote?.total ?? quoteMap[wo.quote_id]?.total ?? 0;
        const shopName = wo.shop?.name ?? vendorMap[wo.shop_id]?.name ?? 'Unknown Shop';
        const quoteDecision = wo.quote?.status ?? 'pending';
        const vehicle = wo.vehicle; // Direct relationship
        const vehicleMake = vehicle?.make || 'N/A';
        const vehicleModel = vehicle?.model || 'N/A';
        const vehiclePlate = vehicle?.plate || 'N/A';
        return `
          <tr>
            <td>${wo.id.slice(0, 8)}</td>
            <td>${vehicleMake}</td>
            <td>${vehicleModel}</td>
            <td>${vehiclePlate}</td>
            <td>${shopName}</td>
            <td>${quoteDecision}</td>
            <td>${wo.status}</td>
            <td>₱${quoteTotal.toFixed(2)}</td>
            <td>${wo.job_details || wo.shop_notes || '-'}</td>
            <td>${wo.start_at ? new Date(wo.start_at).toLocaleDateString() : 'N/A'}</td>
            <td>${wo.complete_at ? new Date(wo.complete_at).toLocaleDateString() : 'N/A'}</td>
          </tr>
        `;
      })
      .join('');

    const content = `
      <html>
        <head>
          <title>Work Order Summary</title>
          <style>
            body { font-family: Arial, sans-serif; color: #1f2d3d; padding: 24px; }
            h1 { margin-bottom: 8px; }
            .meta { color: #6b7c93; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; padding: 10px; border-bottom: 1px solid #e6e9ec; }
            th { background: #f8f9fb; }
          </style>
        </head>
        <body>
          <h1>Work Order Summary</h1>
          <div class="meta">Printed from Fleet Management Platform</div>
          <table>
            <thead>
              <tr>
                <th>Work Order</th>
                <th>Vehicle Make</th>
                <th>Vehicle Model</th>
                <th>Plate</th>
                <th>Shop</th>
                <th>Status</th>
                <th>Quote Total</th>
                <th>Job Details</th>
                <th>Start Date</th>
                <th>Completion</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

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
    setEditingId(null);
    setIsFormOpen(true);
  };

  const handleQuoteChange = (quoteId: string) => {
    const selectedQuote = quotes.find(q => q.id === quoteId);
    const vehicleId = selectedQuote?.rfq?.serviceRequest?.vehicle_id || '';
    
    setFormData({ 
      ...formData, 
      quote_id: quoteId,
      vehicle_id: vehicleId, // Auto-populate vehicle from quote, but user can change it
    });
  };

  const handleEdit = (workOrder: WorkOrder) => {
    setFormMode('edit');
    setFormData({
      quote_id: workOrder.quote_id,
      vehicle_id: workOrder.vehicle_id || '',
      shop_id: workOrder.shop_id,
      assigned_to: workOrder.assigned_to || '',
      status: workOrder.status,
      owner_decision: workOrder.owner_decision || 'pending',
      shop_notes: workOrder.shop_notes || '',
      job_details: workOrder.job_details || '',
      start_at: workOrder.start_at ? workOrder.start_at.split('T')[0] : '',
      complete_at: workOrder.complete_at ? workOrder.complete_at.split('T')[0] : '',
    });
    setFormError(null);
    setEditingId(workOrder.id);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setFormError(null);

    try {
      console.log('🚀 Form Mode:', formMode);
      console.log('🚀 Editing ID:', editingId);
      console.log('🚀 Form Data:', formData);

      if (formMode === 'create') {
        const payload = {
          quote_id: formData.quote_id,
          vehicle_id: formData.vehicle_id || null,
          shop_id: formData.shop_id,
          assigned_to: formData.assigned_to || null,
          status: formData.status,
          owner_decision: formData.owner_decision,
          shop_notes: formData.shop_notes || null,
          job_details: formData.job_details || null,
          start_at: formData.start_at || null,
          complete_at: formData.complete_at || null,
        };
        
        console.log('📝 Creating new work order...');
        console.log('📝 Payload:', payload);
        const response = await apiClient.post('/work-orders', payload, token);
        console.log('📝 Create response:', response);
        if (response.error) throw new Error(response.error);
      } else if (editingId) {
        // For updates, only send fields that can be updated
        const updatePayload = {
          vehicle_id: formData.vehicle_id || null,
          assigned_to: formData.assigned_to || null,
          status: formData.status,
          owner_decision: formData.owner_decision,
          shop_notes: formData.shop_notes || null,
          job_details: formData.job_details || null,
          start_at: formData.start_at || null,
          complete_at: formData.complete_at || null,
        };
        
        console.log('✏️ Updating work order:', editingId);
        console.log('✏️ Update Payload:', updatePayload);
        const updateUrl = `/work-orders/${editingId}`;
        console.log('✏️ Update URL:', updateUrl);
        const response = await apiClient.put(updateUrl, updatePayload, token);
        console.log('✏️ Update response:', response);
        console.log('✏️ Response status:', response.status);
        console.log('✏️ Response error:', response.error);
        if (response.error) throw new Error(response.error);
      } else {
        console.warn('⚠️ No form mode or editing ID - skipping API call');
      }

      console.log('✅ Closing form and refreshing data...');
      setIsFormOpen(false);
      setFormData({ ...emptyForm });
      setEditingId(null);
      await fetchWorkOrders(); // Ensure fresh data is loaded
      console.log('✅ Data refreshed');
    } catch (err) {
      console.error('❌ Error saving work order:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to save work order');
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormData({ ...emptyForm });
    setFormError(null);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm('Delete this work order?')) return;

    try {
      const response = await apiClient.delete(`/work-orders/${id}`, token);
      if (response.error) throw new Error(response.error);
      fetchWorkOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete work order');
    }
  };

  if (loading && workOrders.length === 0) {
    return <div className="loading">Loading work orders...</div>;
  }

  return (
    <div className="resource-page">
      <div className="page-header">
        <div>
          <h1>Work Orders</h1>
          <p className="page-subtitle">Track shop progress and completion timelines.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handlePrint} disabled={selectedWorkOrderIds.length === 0}>
            Print Selected
          </button>
          {canCreate && (
            <button onClick={handleCreate} className="btn btn-primary">
              + New Work Order
            </button>
          )}
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <p>Total Work Orders</p>
          <h3>{summary.totalCount}</h3>
        </div>
        <div className="summary-card">
          <p>Pending</p>
          <h3>{summary.pendingCount}</h3>
        </div>
        <div className="summary-card">
          <p>In Progress</p>
          <h3>{summary.progressCount}</h3>
        </div>
        <div className="summary-card highlight">
          <p>Completed</p>
          <h3>{summary.completedCount}</h3>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="page-controls">
        <div className="search-group">
          <input
            type="text"
            placeholder="Search work orders..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="search-input"
            title="Search work orders"
          />
          <select
            className="status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled')}
            title="Filter by work order status"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <span className="results-count">
          {total} total ({sortedWorkOrders.length} shown)
        </span>
      </div>

      <div className="table-container">
        <table className="resource-table">
          <thead>
            <tr>
              <th>Select</th>
              <th>Work Order</th>
              <th>Vehicle Make</th>
              <th>Vehicle Model</th>
              <th>Plate</th>
              <th>Shop</th>
              <th>Quote Decision</th>
              <th>Quote Total</th>
              <th onClick={() => handleSort('status')} className="sortable">
                Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th>Owner Decision</th>
              <th>Job Details</th>
              <th onClick={() => handleSort('start_at')} className="sortable">
                Start Date {sortConfig.key === 'start_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th>Complete Date</th>
              <th onClick={() => handleSort('created_at')} className="sortable">
                Created {sortConfig.key === 'created_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              {(canEdit || canDelete) && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {sortedWorkOrders.map((wo) => {
              const vehicle = wo.vehicle; // Direct relationship
              return (
              <tr key={wo.id} className={selectedWorkOrderIds.includes(wo.id) ? 'is-selected' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedWorkOrderIds.includes(wo.id)}
                    onChange={() => toggleSelection(wo.id)}
                    title={`Select work order ${wo.id.slice(0, 8)}`}
                  />
                </td>
                <td>{wo.id.slice(0, 8)}</td>
                <td>{vehicle?.make || 'N/A'}</td>
                <td>{vehicle?.model || 'N/A'}</td>
                <td>{vehicle?.plate || 'N/A'}</td>
                <td>{wo.shop?.name || vendorMap[wo.shop_id]?.name || wo.shop_id}</td>
                <td>{wo.quote?.status || quoteMap[wo.quote_id]?.status || 'pending'}</td>
                <td>₱{((wo.quote?.total ?? quoteMap[wo.quote_id]?.total) || 0).toFixed(2)}</td>
                <td>
                  <span className={`status-badge status-${wo.status}`}>
                    {wo.status}
                  </span>
                </td>
                <td>
                  <span className={`status-badge status-${wo.owner_decision || 'pending'}`}>
                    {wo.owner_decision || 'pending'}
                  </span>
                </td>
                <td>{wo.job_details || wo.shop_notes || '-'}</td>
                <td>{wo.start_at ? new Date(wo.start_at).toLocaleDateString() : 'N/A'}</td>
                <td>{wo.complete_at ? new Date(wo.complete_at).toLocaleDateString() : 'N/A'}</td>
                <td>{wo.created_at ? new Date(wo.created_at).toLocaleDateString() : 'N/A'}</td>
                {(canEdit || canDelete) && (
                  <td className="actions">
                    {canEdit && (
                      <button onClick={() => handleEdit(wo)} className="btn-icon" title="Edit">
                        ✏️
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => handleDelete(wo.id)} className="btn-icon" title="Delete">
                        🗑️
                      </button>
                    )}
                    <button onClick={() => toggleSelection(wo.id)} className="btn-icon" title="Select for Print">
                      🖨️
                    </button>
                  </td>
                )}
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="btn-small"
        >
          Previous
        </button>
        <span>Page {currentPage} of {lastPage}</span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
          disabled={currentPage === lastPage}
          className="btn-small"
        >
          Next
        </button>
      </div>

      {isFormOpen && (
        <div className="modal-overlay" onClick={handleCloseForm}>
          <div className="modal-content modal-content-width-650" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{formMode === 'create' ? 'Create Work Order' : 'Edit Work Order'}</h2>
              <button className="modal-close" onClick={handleCloseForm}>
                ×
              </button>
            </div>

            {formError && <div className="error-message">{formError}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Quote *</label>
                <select
                  value={formData.quote_id}
                  onChange={(e) => handleQuoteChange(e.target.value)}
                  required
                  disabled={formMode === 'edit'}
                  title="Select approved quote"
                >
                  <option value="">Select Approved Quote</option>
                  {quotes.map((quote) => (
                    <option key={quote.id} value={quote.id}>
                      Quote-{quote.id.slice(0, 8)} (₱{quote.total.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Vehicle</label>
                <select
                  value={formData.vehicle_id}
                  onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                  title="Select vehicle"
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} - {vehicle.plate}
                    </option>
                  ))}
                </select>
              </div>

              {formData.vehicle_id && (() => {
                const selectedVehicle = vehicles.find(v => v.id === formData.vehicle_id);
                return selectedVehicle ? (
                  <div className="form-group selected-vehicle-details">
                    <p className="selected-vehicle-caption">Selected Vehicle Details:</p>
                    <p className="selected-vehicle-summary">
                      <strong>Make:</strong> {selectedVehicle.make} | <strong>Model:</strong> {selectedVehicle.model} | <strong>Plate:</strong> {selectedVehicle.plate}
                    </p>
                  </div>
                ) : null;
              })()}

              <div className="form-group">
                <label>Shop/Vendor *</label>
                <select
                  value={formData.shop_id}
                  onChange={(e) => setFormData({ ...formData, shop_id: e.target.value })}
                  required
                  disabled={formMode === 'edit'}
                  title="Select shop or vendor"
                >
                  <option value="">Select Shop/Vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name} ({vendor.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Assigned To (User ID)</label>
                <input
                  type="text"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  placeholder="Enter user ID or leave blank"
                  title="Assigned user ID"
                />
              </div>

              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={formData.start_at}
                  onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                  title="Start date"
                />
              </div>

              <div className="form-group">
                <label>Complete Date</label>
                <input
                  type="date"
                  value={formData.complete_at}
                  onChange={(e) => setFormData({ ...formData, complete_at: e.target.value })}
                  title="Completion date"
                />
              </div>

              <div className="form-group">
                <label>Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                  title="Work order status"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-group">
                <label>Owner Decision</label>
                <select
                  value={formData.owner_decision}
                  onChange={(e) => setFormData({ ...formData, owner_decision: e.target.value })}
                  title="Owner decision"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-group">
                <label>Shop Notes</label>
                <textarea
                  value={formData.shop_notes}
                  onChange={(e) => setFormData({ ...formData, shop_notes: e.target.value })}
                  rows={3}
                  title="Shop notes"
                />
              </div>

              <div className="form-group">
                <label>Job Details</label>
                <textarea
                  value={formData.job_details}
                  onChange={(e) => setFormData({ ...formData, job_details: e.target.value })}
                  rows={3}
                  title="Job details"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={handleCloseForm} className="btn btn-secondary">
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
