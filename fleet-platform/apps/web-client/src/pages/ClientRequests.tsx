import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../contexts/AuthContext';
import '../styles/ClientPage.css';

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

interface PaginatedResponse<T> {
  data: T[];
}

interface Quote {
  id: string;
  rfq_id?: string;
  status?: string;
  total?: number;
  validity_until?: string;
  rfq?: {
    id?: string;
    service_request_id?: string;
  } | null;
}

export default function ClientRequests() {
  const { token } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quoteActionError, setQuoteActionError] = useState<string | null>(null);
  const [updatingQuoteId, setUpdatingQuoteId] = useState<string | null>(null);

  const getErrorMessage = (error: unknown, fallback: string) => {
    return error instanceof Error ? error.message : fallback;
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [requestsResponse, vehiclesResponse, quotesResponse] = await Promise.all([
        apiClient.get('/service-requests', token || undefined),
        apiClient.get('/vehicles', token || undefined),
        apiClient.get('/quotes', token || undefined),
      ]);
      if (requestsResponse.error) {
        throw new Error(requestsResponse.error);
      }
      if (vehiclesResponse.error) {
        throw new Error(vehiclesResponse.error);
      }
      if (quotesResponse.error) {
        throw new Error(quotesResponse.error);
      }
      const requestsPayload = (requestsResponse.data || {}) as PaginatedResponse<ServiceRequest> | ServiceRequest[];
      const vehiclesPayload = (vehiclesResponse.data || {}) as PaginatedResponse<VehicleOption> | VehicleOption[];
      const quotesPayload = (quotesResponse.data || {}) as PaginatedResponse<Quote> | Quote[];
      setRequests(Array.isArray(requestsPayload) ? requestsPayload : requestsPayload.data || []);
      setVehicles(Array.isArray(vehiclesPayload) ? vehiclesPayload : vehiclesPayload.data || []);
      setQuotes(Array.isArray(quotesPayload) ? quotesPayload : quotesPayload.data || []);
      setError(null);
      setQuoteActionError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load service requests'));
      setRequests([]);
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const vehicleLookup = useMemo(() => {
    const map: Record<string, VehicleOption> = {};
    vehicles.forEach((vehicle) => {
      map[vehicle.id] = vehicle;
    });
    return map;
  }, [vehicles]);

  const quotesByRequestId = useMemo(() => {
    return quotes.reduce<Record<string, Quote[]>>((acc, quote) => {
      const requestId = quote.rfq?.service_request_id;
      if (!requestId) return acc;
      if (!acc[requestId]) {
        acc[requestId] = [];
      }
      acc[requestId].push(quote);
      return acc;
    }, {});
  }, [quotes]);

  const updateQuoteStatus = async (quoteId: string, status: 'approved' | 'rejected' | 'cancelled') => {
    if (!token) return;
    setUpdatingQuoteId(quoteId);
    setQuoteActionError(null);

    try {
      const response = await apiClient.put(`/quotes/${quoteId}`, { status }, token);
      if (response.error) {
        throw new Error(response.error);
      }

      await fetchData();
    } catch (err: unknown) {
      setQuoteActionError(getErrorMessage(err, 'Failed to update quote status'));
    } finally {
      setUpdatingQuoteId(null);
    }
  };

  return (
    <div className="client-page">
      <h1>📝 Service Requests</h1>
      <p>View and manage your service requests</p>

      {error && <div className="alert alert-error">{error}</div>}
      {quoteActionError && <div className="alert alert-error">{quoteActionError}</div>}

      {loading ? (
        <div className="loading">Loading requests...</div>
      ) : (
        <div className="request-list">
          {requests.length > 0 ? (
            requests.map((request) => {
              const vehicle = vehicleLookup[request.vehicle_id];
              const relatedQuotes = quotesByRequestId[request.id] || [];
              return (
                <div key={request.id} className="request-card">
                  <div className="request-header">
                    <div>
                      <strong>
                        {vehicle ? `${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle'}
                      </strong>
                      {vehicle && <div className="text-muted">{vehicle.plate}</div>}
                    </div>
                    <span className={`badge status-${request.status}`}>{request.status}</span>
                  </div>
                  <p className="request-issue">{request.issue_description}</p>
                  <div className="request-meta">
                    <span>Priority: {request.priority}</span>
                    <span>{request.created_at ? new Date(request.created_at).toLocaleDateString() : ''}</span>
                  </div>

                  <div className="request-quotes">
                    <strong>Quotes</strong>
                    {relatedQuotes.length === 0 ? (
                      <p className="text-muted">No quote available yet for this service request.</p>
                    ) : (
                      relatedQuotes.map((quote) => {
                        const status = quote.status || 'draft';
                        const canDecide = !['approved', 'rejected', 'cancelled'].includes(status);
                        return (
                          <div key={quote.id} className="quote-row">
                            <div>
                              <span className={`badge status-${status}`}>{status}</span>
                              <span className="quote-meta"> Quote #{quote.id.slice(0, 8)}</span>
                              <span className="quote-meta"> • ₱{Number(quote.total || 0).toFixed(2)}</span>
                            </div>
                            <div className="quote-actions">
                              <button
                                className="btn btn-primary"
                                disabled={!canDecide || updatingQuoteId === quote.id}
                                onClick={() => updateQuoteStatus(quote.id, 'approved')}
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn-secondary"
                                disabled={!canDecide || updatingQuoteId === quote.id}
                                onClick={() => updateQuoteStatus(quote.id, 'rejected')}
                              >
                                Reject
                              </button>
                              <button
                                className="btn btn-secondary"
                                disabled={!canDecide || updatingQuoteId === quote.id}
                                onClick={() => updateQuoteStatus(quote.id, 'cancelled')}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <p>No service requests yet</p>
              <p>Submit a request from your vehicle list when needed</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
