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

export default function ClientRequests() {
  const { token } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = (error: unknown, fallback: string) => {
    return error instanceof Error ? error.message : fallback;
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [requestsResponse, vehiclesResponse] = await Promise.all([
        apiClient.get('/service-requests', token || undefined),
        apiClient.get('/vehicles', token || undefined),
      ]);
      if (requestsResponse.error) {
        throw new Error(requestsResponse.error);
      }
      if (vehiclesResponse.error) {
        throw new Error(vehiclesResponse.error);
      }
      const requestsPayload = (requestsResponse.data || {}) as PaginatedResponse<ServiceRequest> | ServiceRequest[];
      const vehiclesPayload = (vehiclesResponse.data || {}) as PaginatedResponse<VehicleOption> | VehicleOption[];
      setRequests(Array.isArray(requestsPayload) ? requestsPayload : requestsPayload.data || []);
      setVehicles(Array.isArray(vehiclesPayload) ? vehiclesPayload : vehiclesPayload.data || []);
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load service requests'));
      setRequests([]);
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

  return (
    <div className="client-page">
      <h1>📝 Service Requests</h1>
      <p>View and manage your service requests</p>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading requests...</div>
      ) : (
        <div className="request-list">
          {requests.length > 0 ? (
            requests.map((request) => {
              const vehicle = vehicleLookup[request.vehicle_id];
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
