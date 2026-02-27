import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePermission } from '../hooks/usePermission';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import '../styles/ResourcePage.css';

interface Quote {
  id: string;
  rfq_id: string;
  rfq?: Rfq | null;
  rfq_code?: string;
  vendor_id?: string;
  subtotal: number;
  tax: number;
  total: number;
  validity_until?: string;
  status: string;
  created_at?: string;
}

interface Rfq {
  id: string;
  service_request_id: string;
  status: string;
  due_date: string;
}

interface ServiceRequestOption {
  id: string;
  status?: string;
  issue_description?: string;
}

interface Vendor {
  id: string;
  name: string;
}

type SortKey = 'total' | 'status' | 'validity_until' | 'created_at';

interface PaginatedResponse<T> {
  data: T[];
  current_page?: number;
  last_page?: number;
  total?: number;
}

const toNumber = (value: unknown): number => {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const toText = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const emptyForm = {
  service_request_id: '',
  rfq_id: '',
  rfq_code: '', // Add auto-generated RFQ code
  vendor_id: '',
  subtotal: '',
  tax: '',
  validity_until: '',
  status: 'draft',
};

export default function Quotes() {
  const { hasPermission } = usePermission();
  const { token } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequestOption[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Quote['status']>('all');
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
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([]);

  const canCreate = hasPermission('create_quotes');
  const canEdit = hasPermission('edit_quotes');
  const canDelete = hasPermission('delete_quotes');

  // Generate RFQ code in format RFQ+YYYYMM+000
  const generateRFQCode = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const sequenceNumber = String(quotes.filter(q => 
      q.rfq_code?.startsWith(`RFQ${year}${month}`)
    ).length + 1).padStart(3, '0');
    return `RFQ${year}${month}${sequenceNumber}`;
  };

  const fetchQuotes = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await apiClient.get(
        `/quotes?page=${currentPage}`,
        token
      );
      
      if (response.error) throw new Error(response.error);
      
      const paginatedData = response.data as PaginatedResponse<Quote>;
      setQuotes(paginatedData?.data || []);
      setLastPage(paginatedData?.last_page || 1);
      setTotal(paginatedData?.total || 0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quotes');
    } finally {
      setLoading(false);
    }
  }, [token, currentPage]);

  const fetchRfqs = useCallback(async () => {
    if (!token) return;
    try {
      const response = await apiClient.get('/rfqs?per_page=100', token);
      const paginatedData = response.data as PaginatedResponse<Rfq>;
      if (paginatedData?.data) {
        setRfqs(paginatedData.data.filter((rfq: Rfq) => rfq.status === 'sent'));
      }
    } catch (error) {
      console.error('Failed to load RFQs:', error);
    }
  }, [token]);

  const fetchVendors = useCallback(async () => {
    if (!token) return;
    try {
      const response = await apiClient.get('/vendors?per_page=100', token);
      const paginatedData = response.data as { data: Vendor[] };
      if (paginatedData?.data) {
        setVendors(paginatedData.data);
      }
    } catch (error) {
      console.error('Failed to load vendors:', error);
    }
  }, [token]);

  const fetchServiceRequests = useCallback(async () => {
    if (!token) return;
    try {
      const response = await apiClient.get('/service-requests?per_page=100', token);
      const paginatedData = response.data as PaginatedResponse<ServiceRequestOption>;
      if (paginatedData?.data) {
        setServiceRequests(paginatedData.data);
      }
    } catch (error) {
      console.error('Failed to load service requests:', error);
    }
  }, [token]);

  useEffect(() => {
    fetchQuotes();
    fetchVendors();
    fetchRfqs();
    fetchServiceRequests();
  }, [fetchQuotes, fetchVendors, fetchRfqs, fetchServiceRequests]);

  useEffect(() => {
    if (isFormOpen) {
      fetchRfqs();
      fetchVendors();
      fetchServiceRequests();
    }
  }, [isFormOpen, fetchRfqs, fetchVendors, fetchServiceRequests]);

  const handleServiceRequestChange = (serviceRequestId: string) => {
    const linkedRfq = rfqs.find((rfq) => rfq.service_request_id === serviceRequestId);
    setFormData((prev) => ({
      ...prev,
      service_request_id: serviceRequestId,
      rfq_id: linkedRfq?.id || '',
    }));
  };

  const filteredQuotes = useMemo(() => {
    const needle = filter.toLowerCase();
    return quotes.filter(quote =>
      filter === '' ||
      (quote.status ?? '').toLowerCase().includes(needle) ||
      toNumber(quote.total).toString().includes(filter) ||
      (quote.rfq_code ?? '').toLowerCase().includes(needle) ||
      (quote.vendor_id ?? '').toLowerCase().includes(needle)
    );
  }, [quotes, filter]);

  const statusFilteredQuotes = useMemo(() => {
    if (statusFilter === 'all') return filteredQuotes;
    return filteredQuotes.filter((quote) => toText(quote.status) === statusFilter);
  }, [filteredQuotes, statusFilter]);

  const sortedQuotes = useMemo(() => {
    return [...statusFilteredQuotes].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === undefined || bValue === undefined) return 0;
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [statusFilteredQuotes, sortConfig]);

  const vendorMap = useMemo(() => {
    return vendors.reduce<Record<string, Vendor>>((acc, vendor) => {
      acc[vendor.id] = vendor;
      return acc;
    }, {});
  }, [vendors]);

  const rfqMap = useMemo(() => {
    return rfqs.reduce<Record<string, Rfq>>((acc, rfq) => {
      acc[rfq.id] = rfq;
      return acc;
    }, {});
  }, [rfqs]);

  const summary = useMemo(() => {
    const totalAmount = quotes.reduce((sum, quote) => sum + toNumber(quote.total), 0);
    const draftCount = quotes.filter((quote) => toText(quote.status) === 'draft').length;
    const approvedCount = quotes.filter((quote) => toText(quote.status) === 'approved').length;
    const pendingCount = quotes.filter((quote) => toText(quote.status) === 'submitted').length;
    return { totalAmount, draftCount, approvedCount, pendingCount };
  }, [quotes]);

  const selectedQuotes = useMemo(() => {
    return quotes.filter((quote) => selectedQuoteIds.includes(quote.id));
  }, [quotes, selectedQuoteIds]);

  const toggleSelection = (id: string) => {
    setSelectedQuoteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePrint = () => {
    if (selectedQuotes.length === 0) {
      alert('Select at least one quote to print.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1000,height=700');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups to print.');
      return;
    }

    const rows = selectedQuotes
      .map((quote) => {
        const statusLabel = toText(quote.status, 'unknown');
        const subtotal = toNumber(quote.subtotal);
        const tax = toNumber(quote.tax);
        const total = toNumber(quote.total);
        const vendorName = quote.vendor_id ? vendorMap[quote.vendor_id]?.name || 'Unknown Vendor' : 'Unassigned';
        const rfqLabel = quote.rfq_code || (quote.rfq_id ? `RFQ-${quote.rfq_id.slice(0, 8)}` : 'N/A');
        const validity = quote.validity_until || rfqMap[quote.rfq_id || '']?.due_date || 'N/A';
        return `
          <tr>
            <td>${rfqLabel}</td>
            <td>${vendorName}</td>
            <td>${statusLabel}</td>
            <td>₱${subtotal.toFixed(2)}</td>
            <td>₱${tax.toFixed(2)}</td>
            <td>₱${total.toFixed(2)}</td>
            <td>${validity}</td>
          </tr>
        `;
      })
      .join('');

    const content = `
      <html>
        <head>
          <title>Quote Summary</title>
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
          <h1>Quote Summary</h1>
          <div class="meta">Printed from Fleet Management Platform</div>
          <table>
            <thead>
              <tr>
                <th>RFQ</th>
                <th>Vendor</th>
                <th>Status</th>
                <th>Subtotal</th>
                <th>Tax</th>
                <th>Total</th>
                <th>Valid Until</th>
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
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleCreate = () => {
    setFormMode('create');
    const generatedCode = generateRFQCode();
    setFormData({ 
      ...emptyForm,
      rfq_code: generatedCode, // Auto-populate with generated code
    });
    setFormError(null);
    setEditingId(null);
    setIsFormOpen(true);
  };

  const handleEdit = (quote: Quote) => {
    setFormMode('edit');
    setFormData({
      service_request_id: quote.rfq?.service_request_id || '',
      rfq_id: quote.rfq_id,
      rfq_code: quote.rfq_code ? quote.rfq_code : '', // Preserve existing RFQ code
      vendor_id: quote.vendor_id || '',
      subtotal: quote.subtotal.toString(),
      tax: quote.tax.toString(),
      validity_until: quote.validity_until || '',
      status: quote.status,
    });
    setFormError(null);
    setEditingId(quote.id);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setFormError(null);

    try {
      const payload = {
        service_request_id: formData.service_request_id || null,
        rfq_code: formData.rfq_code,
        rfq_id: formData.rfq_id || null,
        vendor_id: formData.vendor_id || null,
        subtotal: parseFloat(formData.subtotal),
        tax: parseFloat(formData.tax),
        validity_until: formData.validity_until || null,
        status: formData.status,
      };

      if (formMode === 'create') {
        const response = await apiClient.post('/quotes', payload, token);
        if (response.error) throw new Error(response.error);
      } else if (editingId) {
        const response = await apiClient.put(`/quotes/${editingId}`, payload, token);
        if (response.error) throw new Error(response.error);
      }

      setIsFormOpen(false);
      fetchQuotes();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save quote');
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm('Delete this quote?')) return;

    try {
      const response = await apiClient.delete(`/quotes/${id}`, token);
      if (response.error) throw new Error(response.error);
      fetchQuotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete quote');
    }
  };

  if (loading && quotes.length === 0) {
    return <div className="loading">Loading quotes...</div>;
  }

  return (
    <div className="resource-page">
      <div className="page-header">
        <div>
          <h1>Quotes</h1>
          <p className="page-subtitle">Review vendor pricing, validity, and approval status.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handlePrint} disabled={selectedQuoteIds.length === 0}>
            Print Selected
          </button>
          {canCreate && (
            <button onClick={handleCreate} className="btn btn-primary">
              + New Quote
            </button>
          )}
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <p>Draft Quotes</p>
          <h3>{summary.draftCount}</h3>
        </div>
        <div className="summary-card">
          <p>Submitted</p>
          <h3>{summary.pendingCount}</h3>
        </div>
        <div className="summary-card">
          <p>Approved</p>
          <h3>{summary.approvedCount}</h3>
        </div>
        <div className="summary-card highlight">
          <p>Total Value</p>
          <h3>₱{summary.totalAmount.toFixed(2)}</h3>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="page-controls">
        <div className="search-group">
          <input
            type="text"
            placeholder="Search quotes..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="search-input"
            title="Search quotes"
          />
          <select
            className="status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | Quote['status'])}
            title="Filter quotes by status"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <span className="results-count">
          {total} total ({sortedQuotes.length} shown)
        </span>
      </div>

      <div className="table-container">
        <table className="resource-table">
          <thead>
            <tr>
              <th>Select</th>
              <th>RFQ</th>
                <th>Service Request</th>
              <th>Vendor</th>
              <th onClick={() => handleSort('status')}>
                Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th>Subtotal</th>
              <th>Tax</th>
              <th onClick={() => handleSort('total')}>
                Total {sortConfig.key === 'total' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('validity_until')}>
                Valid Until {sortConfig.key === 'validity_until' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('created_at')}>
                Created {sortConfig.key === 'created_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              {(canEdit || canDelete) && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {sortedQuotes.map((quote) => (
              <tr
                key={quote.id}
                className={selectedQuoteIds.includes(quote.id) ? 'is-selected' : ''}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={selectedQuoteIds.includes(quote.id)}
                    onChange={() => toggleSelection(quote.id)}
                    title={`Select quote ${quote.id.slice(0, 8)}`}
                  />
                </td>
                <td>{quote.rfq_code || (quote.rfq_id ? `RFQ-${quote.rfq_id.slice(0, 8)}` : 'N/A')}</td>
                <td>{quote.rfq?.service_request_id ? `SR-${quote.rfq.service_request_id.slice(0, 8)}` : 'N/A'}</td>
                <td>{quote.vendor_id ? vendorMap[quote.vendor_id]?.name || quote.vendor_id : 'Unassigned'}</td>
                <td>
                  <span className={`status-badge status-${toText(quote.status, 'unknown')}`}>
                    {toText(quote.status, 'unknown')}
                  </span>
                </td>
                <td>₱{toNumber(quote.subtotal).toFixed(2)}</td>
                <td>₱{toNumber(quote.tax).toFixed(2)}</td>
                <td>₱{toNumber(quote.total).toFixed(2)}</td>
                <td>{quote.validity_until || rfqMap[quote.rfq_id || '']?.due_date || 'N/A'}</td>
                <td>{quote.created_at ? new Date(quote.created_at).toLocaleDateString() : 'N/A'}</td>
                {(canEdit || canDelete) && (
                  <td className="actions">
                    {canEdit && (
                      <button onClick={() => handleEdit(quote)} className="btn-icon" title="Edit">
                        ✏️
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => handleDelete(quote.id)} className="btn-icon" title="Delete">
                        🗑️
                      </button>
                    )}
                    <button onClick={() => toggleSelection(quote.id)} className="btn-icon" title="Select for Print">
                      🖨️
                    </button>
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
            <div className="modal-header">
              <h2>{formMode === 'create' ? 'Create Quote' : 'Edit Quote'}</h2>
              <button className="modal-close" onClick={() => setIsFormOpen(false)}>
                ×
              </button>
            </div>
            
            {formError && <div className="error-message">{formError}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>RFQ Code *</label>
                <input
                  type="text"
                  value={formData.rfq_code}
                  onChange={(e) => setFormData({ ...formData, rfq_code: e.target.value })}
                  readOnly={formMode === 'create'} // Auto-generated, read-only on create
                  required
                  placeholder="Auto-generated"
                  title="RFQ code"
                />
              </div>

              <div className="form-group">
                <label>Service Request ID (Optional)</label>
                <select
                  value={formData.service_request_id}
                  onChange={(e) => handleServiceRequestChange(e.target.value)}
                  title="Service request"
                >
                  <option value="">No Service Request</option>
                  {serviceRequests.map((request) => (
                    <option key={request.id} value={request.id}>
                      SR-{request.id.slice(0, 8)} ({request.status || 'draft'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Link to RFQ (Optional)</label>
                <select
                  value={formData.rfq_id}
                  onChange={(e) => setFormData({ ...formData, rfq_id: e.target.value })}
                  disabled={formMode === 'edit'}
                  title="Linked RFQ"
                >
                  <option value="">No RFQ (Standalone Quote)</option>
                  {rfqs.map(rfq => (
                    <option key={rfq.id} value={rfq.id}>
                      RFQ-{rfq.id.slice(0, 8)} · SR-{rfq.service_request_id.slice(0, 8)} (Due: {rfq.due_date})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Vendor</label>
                <select
                  value={formData.vendor_id}
                  onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                  title="Vendor"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Subtotal *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.subtotal}
                  onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })}
                  required
                  title="Subtotal"
                />
              </div>

              <div className="form-group">
                <label>Tax</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tax}
                  onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                  title="Tax"
                />
              </div>

              <div className="form-group">
                <label>Total</label>
                <input
                  type="number"
                  step="0.01"
                  value={(parseFloat(formData.subtotal || '0') + parseFloat(formData.tax || '0')).toFixed(2)}
                  readOnly
                  className="input-readonly"
                  title="Calculated total"
                />
              </div>

              <div className="form-group">
                <label>Valid Until</label>
                <input
                  type="date"
                  value={formData.validity_until}
                  onChange={(e) => setFormData({ ...formData, validity_until: e.target.value })}
                  title="Validity date"
                />
              </div>

              <div className="form-group">
                <label>Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                  title="Quote status"
                >
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
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
    </div>
  );
}
