import React, { useEffect, useState } from 'react';
import { createVehicle, deleteVehicle, listVehicles, updateVehicle, type Vehicle } from './vehiclesApi';

type VehicleForm = {
  plate_no: string;
  make: string;
  model: string;
  year: string;
  status: 'active' | 'in_maintenance' | 'inactive';
  odometer: string;
  notes: string;
};

const defaultForm: VehicleForm = {
  plate_no: '',
  make: '',
  model: '',
  year: '',
  status: 'active',
  odometer: '0',
  notes: '',
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState<VehicleForm>(defaultForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const loadVehicles = async () => {
    const data = await listVehicles();
    setVehicles(data?.data ?? []);
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const payload = {
      ...form,
      year: form.year ? Number(form.year) : null,
      odometer: Number(form.odometer || 0),
    };

    try {
      if (editingId) {
        await updateVehicle(editingId, payload);
      } else {
        await createVehicle(payload);
      }

      setForm(defaultForm);
      setEditingId(null);
      await loadVehicles();
    } catch (err: any) {
      setError(err?.message || 'Save failed');
    }
  };

  const edit = (v: Vehicle) => {
    setEditingId(v.id);
    setForm({
      plate_no: v.plate_no,
      make: v.make,
      model: v.model,
      year: v.year ? String(v.year) : '',
      status: v.status,
      odometer: String(v.odometer ?? 0),
      notes: v.notes ?? '',
    });
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Vehicles</h2>
      {error ? <p style={{ color: 'red' }}>{error}</p> : null}

      <form onSubmit={submit} style={{ display: 'grid', gap: 8, maxWidth: 520 }}>
        <input placeholder="Plate No" value={form.plate_no} onChange={(e) => setForm({ ...form, plate_no: e.target.value })} required />
        <input placeholder="Make" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} required />
        <input placeholder="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required />
        <input placeholder="Year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as VehicleForm['status'] })}>
          <option value="active">Active</option>
          <option value="in_maintenance">In Maintenance</option>
          <option value="inactive">Inactive</option>
        </select>
        <input placeholder="Odometer" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} />
        <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <button type="submit">{editingId ? 'Update Vehicle' : 'Add Vehicle'}</button>
      </form>

      <hr />

      <table width="100%" cellPadding={8}>
        <thead>
          <tr>
            <th>Plate</th>
            <th>Make</th>
            <th>Model</th>
            <th>Year</th>
            <th>Status</th>
            <th>Odometer</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v) => (
            <tr key={v.id}>
              <td>{v.plate_no}</td>
              <td>{v.make}</td>
              <td>{v.model}</td>
              <td>{v.year ?? '-'}</td>
              <td>{v.status}</td>
              <td>{v.odometer}</td>
              <td>
                <button onClick={() => edit(v)}>Edit</button>{' '}
                <button
                  onClick={async () => {
                    await deleteVehicle(v.id);
                    await loadVehicles();
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {!vehicles.length && (
            <tr>
              <td colSpan={7}>No vehicles found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}