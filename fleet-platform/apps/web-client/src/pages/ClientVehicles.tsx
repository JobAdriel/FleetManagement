import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../contexts/AuthContext';
import '../styles/ClientPage.css';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  plate: string;
  vin: string;
}

interface PaginatedResponse<T> {
  data: T[];
}

export default function ClientVehicles() {
  const { token } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [requestVehicleId, setRequestVehicleId] = useState<string | null>(null);
  const [requestIssue, setRequestIssue] = useState('');
  const [requestPriority, setRequestPriority] = useState('normal');
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  const getErrorMessage = (error: unknown, fallback: string) => {
    return error instanceof Error ? error.message : fallback;
  };

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/vehicles', token || undefined);
      if (response.error) {
        throw new Error(response.error);
      }
      const payload = (response.data || {}) as PaginatedResponse<Vehicle> | Vehicle[];
      const items = Array.isArray(payload) ? payload : payload.data || [];
      setVehicles(items);
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load vehicles'));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const openRequestModal = (vehicleId: string) => {
    setRequestVehicleId(vehicleId);
    setRequestIssue('');
    setRequestPriority('normal');
    setRequestError(null);
    setRequestSuccess(null);
    setIsRequestOpen(true);
  };

  const closeRequestModal = () => {
    setIsRequestOpen(false);
  };

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requestVehicleId) return;
    setRequestError(null);
    setRequestSuccess(null);

    try {
      const response = await apiClient.post(
        '/service-requests',
        {
          vehicle_id: requestVehicleId,
          issue_description: requestIssue.trim(),
          priority: requestPriority,
        },
        token || undefined
      );

      if (response.error) {
        throw new Error(response.error);
      }

      setRequestSuccess('Service request submitted.');
      setRequestIssue('');
    } catch (err: unknown) {
      setRequestError(getErrorMessage(err, 'Failed to submit request'));
    }
  };

  return (
    <div className="client-page">
      <h1>🚗 My Vehicles</h1>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading your vehicles...</div>
      ) : (
        <div className="vehicles-grid">
          {vehicles.length > 0 ? (
            vehicles.map((vehicle) => (
              <div key={vehicle.id} className="vehicle-card">
                <div className="vehicle-header">
                  <h3>{vehicle.make} {vehicle.model}</h3>
                  <span className="vehicle-year">{vehicle.year}</span>
                </div>
                <div className="vehicle-details">
                  <p><strong>Plate:</strong> {vehicle.plate}</p>
                  <p><strong>VIN:</strong> {vehicle.vin}</p>
                </div>
                <div className="vehicle-actions">
                  <button className="btn btn-primary" onClick={() => openRequestModal(vehicle.id)}>Request Service</button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No vehicles assigned yet</p>
              <p>Contact support to add your vehicles to the system</p>
            </div>
          )}
        </div>
      )}

      {isRequestOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h2>Request Service</h2>
              <button className="modal-close" onClick={closeRequestModal} aria-label="Close">×</button>
            </div>
            {requestError && <div className="alert alert-error">{requestError}</div>}
            {requestSuccess && <div className="alert alert-success">{requestSuccess}</div>}
            <form onSubmit={submitRequest} className="form-grid">
              <div className="form-group full-width">
                <label>Issue Description *</label>
                <textarea
                  rows={4}
                  value={requestIssue}
                  onChange={(e) => setRequestIssue(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Priority *</label>
                <select
                  value={requestPriority}
                  onChange={(e) => setRequestPriority(e.target.value)}
                  required
                >
                  <option value="low">low</option>
                  <option value="normal">normal</option>
                  <option value="high">high</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={closeRequestModal}>Close</button>
                <button type="submit" className="btn-primary">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
