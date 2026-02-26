import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePermission } from '../hooks/usePermission';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import '../styles/ResourcePage.css';

interface Invoice {
  id: string;
  tenant_id: string;
  invoice_number: string;
  customer_tenant_id: string;
  customer?: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
  } | null;
  subtotal: number;
  tax: number;
  total: number;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'disputed';
  created_at: string;
}

type SortKey = 'invoice_number' | 'total' | 'due_date' | 'status' | 'created_at';

interface PaginatedResponse<T> {
  data: T[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

const emptyForm = {
  customer_tenant_id: '',
  subtotal: '',
  tax: '',
  due_date: '',
  status: 'draft' as 'draft' | 'sent' | 'paid' | 'disputed',
};

export default function Invoices() {
  const { hasPermission } = usePermission();
  const { token, user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Invoice['status']>('all');
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
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const getErrorMessage = (error: unknown, fallback: string) => {
    return error instanceof Error ? error.message : fallback;
  };

  const fetchInvoices = useCallback(async (page: number) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/invoices?page=${page}`, token || undefined);
      if (response.error) {
        throw new Error(response.error);
      }
      const payload = (response.data || {}) as PaginatedResponse<Invoice> | Invoice[];
      const items = Array.isArray(payload) ? payload : payload.data || [];
      setInvoices(items);
      if (!Array.isArray(payload)) {
        setCurrentPage(payload.current_page || 1);
        setLastPage(payload.last_page || 1);
      }
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load invoices'));
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchInvoices(currentPage);
  }, [fetchInvoices, currentPage]);

  const filteredInvoices = useMemo(() => {
    if (!filter) return invoices;
    const lowerFilter = filter.toLowerCase();
    return invoices.filter(
      (invoice) =>
        invoice.invoice_number.toLowerCase().includes(lowerFilter) ||
        invoice.status.toLowerCase().includes(lowerFilter)
    );
  }, [invoices, filter]);

  const statusFilteredInvoices = useMemo(() => {
    if (statusFilter === 'all') return filteredInvoices;
    return filteredInvoices.filter((invoice) => invoice.status === statusFilter);
  }, [filteredInvoices, statusFilter]);

  const sortedInvoices = useMemo(() => {
    const sorted = [...statusFilteredInvoices];
    sorted.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal === bVal) return 0;
      const comparison = aVal < bVal ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [statusFilteredInvoices, sortConfig]);

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

  const handleEdit = (invoice: Invoice) => {
    setFormMode('edit');
    setEditingId(invoice.id);
    setFormData({
      customer_tenant_id: invoice.customer_tenant_id,
      subtotal: invoice.subtotal.toString(),
      tax: invoice.tax.toString(),
      due_date: invoice.due_date.split('T')[0],
      status: invoice.status,
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      const response = await apiClient.delete(`/invoices/${id}`, token || undefined);
      if (response.error) throw new Error(response.error);
      fetchInvoices(currentPage);
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to delete invoice'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      const payload = {
        customer_tenant_id: formData.customer_tenant_id || user?.tenant_id,
        subtotal: parseFloat(formData.subtotal) || 0,
        tax: parseFloat(formData.tax) || 0,
        due_date: formData.due_date,
        status: formData.status,
      };

      const response =
        formMode === 'create'
          ? await apiClient.post('/invoices', payload, token || undefined)
          : await apiClient.put(`/invoices/${editingId}`, payload, token || undefined);

      if (response.error) throw new Error(response.error);

      setIsFormOpen(false);
      setFormData({ ...emptyForm });
      setEditingId(null);
      fetchInvoices(currentPage);
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, 'Failed to save invoice'));
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormData({ ...emptyForm });
    setFormError(null);
    setEditingId(null);
  };

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      draft: 'badge-secondary',
      sent: 'badge-info',
      paid: 'badge-success',
      disputed: 'badge-warning',
    };
    return classes[status] || 'badge-secondary';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US');
  };

  const summary = useMemo(() => {
    const totalCount = invoices.length;
    const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const paidCount = invoices.filter((invoice) => invoice.status === 'paid').length;
    const openCount = invoices.filter((invoice) => invoice.status !== 'paid').length;
    const overdueCount = invoices.filter((invoice) => {
      if (invoice.status === 'paid') return false;
      return new Date(invoice.due_date).getTime() < Date.now();
    }).length;

    return { totalCount, totalAmount, paidCount, openCount, overdueCount };
  }, [invoices]);

  const selectedInvoice = useMemo(() => {
    if (!selectedInvoiceId) return null;
    return invoices.find((invoice) => invoice.id === selectedInvoiceId) || null;
  }, [invoices, selectedInvoiceId]);

  const handlePrint = () => {
    if (!selectedInvoice) {
      alert('Select an invoice to print.');
      return;
    }

    const customerName = selectedInvoice.customer?.name || 'Unknown Customer';
    const customerSlug = selectedInvoice.customer?.slug || selectedInvoice.customer_tenant_id;
    const customerDescription = selectedInvoice.customer?.description || '';

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups to print.');
      return;
    }

    const invoiceRows = [
      { label: 'Customer', value: customerName },
      { label: 'Customer Code', value: customerSlug },
      { label: 'Invoice Number', value: selectedInvoice.invoice_number },
      { label: 'Status', value: selectedInvoice.status },
      { label: 'Due Date', value: formatDate(selectedInvoice.due_date) },
      { label: 'Created', value: formatDate(selectedInvoice.created_at) },
      { label: 'Subtotal', value: formatCurrency(selectedInvoice.subtotal) },
      { label: 'Tax', value: formatCurrency(selectedInvoice.tax) },
      { label: 'Total', value: formatCurrency(selectedInvoice.total) },
    ];

    const content = `
      <html>
        <head>
          <title>Invoice ${selectedInvoice.invoice_number}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #1f2d3d; padding: 24px; }
            h1 { margin-bottom: 8px; }
            .meta { color: #6b7c93; margin-bottom: 24px; }
            .card { border: 1px solid #e4e7eb; border-radius: 10px; padding: 20px; }
            .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eef1f4; }
            .row:last-child { border-bottom: none; }
            .label { font-weight: 600; }
            .total { font-size: 1.2em; font-weight: 700; }
          </style>
        </head>
        <body>
          <h1>Invoice Summary</h1>
          <div class="meta">Printed from Fleet Management Platform</div>
          ${customerDescription ? `<div class="meta">${customerDescription}</div>` : ''}
          <div class="card">
            ${invoiceRows
              .map((row) => `
                <div class="row">
                  <span class="label">${row.label}</span>
                  <span class="${row.label === 'Total' ? 'total' : ''}">${row.value}</span>
                </div>
              `)
              .join('')}
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="resource-page">
      <div className="page-header">
        <div>
          <h1>Invoices</h1>
          <p className="page-subtitle">Track billing, due dates, and payment status in one view.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handlePrint} disabled={!selectedInvoiceId}>
            Print Selected
          </button>
          {hasPermission('invoice.create') && (
            <button className="btn btn-primary" onClick={handleCreate}>
              + Create Invoice
            </button>
          )}
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <p>Total Invoices</p>
          <h3>{summary.totalCount}</h3>
        </div>
        <div className="summary-card">
          <p>Outstanding</p>
          <h3>{summary.openCount}</h3>
        </div>
        <div className="summary-card">
          <p>Overdue</p>
          <h3>{summary.overdueCount}</h3>
        </div>
        <div className="summary-card highlight">
          <p>Total Amount</p>
          <h3>{formatCurrency(summary.totalAmount)}</h3>
        </div>
      </div>

      <div className="page-controls">
        <div className="search-group">
          <input
            type="text"
            placeholder="Search invoices..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="search-input"
          />
          <select
            className="status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | Invoice['status'])}
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="disputed">Disputed</option>
          </select>
        </div>
        <div className="results-count">Showing {sortedInvoices.length} invoice(s)</div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading invoices...</div>
      ) : sortedInvoices.length === 0 ? (
        <div className="empty-state">
          <p>No invoices found.</p>
          {hasPermission('invoice.create') && (
            <button className="btn btn-primary" onClick={handleCreate}>
              Create your first invoice
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="resource-table">
              <thead>
                <tr>
                    <th>Select</th>
                  <th onClick={() => handleSort('invoice_number')} className="sortable">
                    Invoice # {sortConfig.key === 'invoice_number' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Customer</th>
                  <th onClick={() => handleSort('total')} className="sortable">
                    Total {sortConfig.key === 'total' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('due_date')} className="sortable">
                    Due Date {sortConfig.key === 'due_date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('status')} className="sortable">
                    Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('created_at')} className="sortable">
                    Created {sortConfig.key === 'created_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className={selectedInvoiceId === invoice.id ? 'is-selected' : ''}
                    onClick={() => setSelectedInvoiceId(invoice.id)}
                  >
                    <td>
                      <input
                        type="radio"
                        name="selectedInvoice"
                        checked={selectedInvoiceId === invoice.id}
                        onChange={() => setSelectedInvoiceId(invoice.id)}
                      />
                    </td>
                    <td>{invoice.invoice_number}</td>
                    <td>{invoice.customer?.name || invoice.customer_tenant_id}</td>
                    <td>{formatCurrency(invoice.total)}</td>
                    <td>{formatDate(invoice.due_date)}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td>{formatDate(invoice.created_at)}</td>
                    <td className="actions">
                      {hasPermission('invoice.update') && (
                        <button className="btn-icon" onClick={() => handleEdit(invoice)} title="Edit">
                          ✏️
                        </button>
                      )}
                      {hasPermission('invoice.delete') && (
                        <button className="btn-icon" onClick={() => handleDelete(invoice.id)} title="Delete">
                          🗑️
                        </button>
                      )}
                      <button className="btn-icon" onClick={() => setSelectedInvoiceId(invoice.id)} title="Select for Print">
                        🖨️
                      </button>
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
              <h2>{formMode === 'create' ? 'Create Invoice' : 'Edit Invoice'}</h2>
              <button className="modal-close" onClick={handleCloseForm}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="form">
              {formError && <div className="error-message">{formError}</div>}

              <div className="form-row">
                <div className="form-group">
                  <label>Subtotal *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.subtotal}
                    onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Tax</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.tax}
                    onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Due Date *</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Invoice['status'] })}
                    required
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="disputed">Disputed</option>
                  </select>
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
