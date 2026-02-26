export type Vehicle = {
  id: number;
  plate_no: string;
  make: string;
  model: string;
  year: number | null;
  status: 'active' | 'in_maintenance' | 'inactive';
  odometer: number;
  notes: string | null;
};

const authHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function listVehicles() {
  const res = await fetch('/api/vehicles', {
    headers: { ...authHeader() },
  });
  if (!res.ok) throw new Error('Failed to load vehicles');
  return res.json();
}

export async function createVehicle(payload: Partial<Vehicle>) {
  const res = await fetch('/api/vehicles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await res.json().catch(() => ({}));
  return res.json();
}

export async function updateVehicle(id: number, payload: Partial<Vehicle>) {
  const res = await fetch(`/api/vehicles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await res.json().catch(() => ({}));
  return res.json();
}

export async function deleteVehicle(id: number) {
  const res = await fetch(`/api/vehicles/${id}`, {
    method: 'DELETE',
    headers: { ...authHeader() },
  });
  if (!res.ok) throw new Error('Failed to delete vehicle');
}