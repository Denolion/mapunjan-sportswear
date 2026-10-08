import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, MapPin, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DeliveryLocation } from '@/lib/types';
import { Loading, EmptyState, ErrorState, ConfirmDialog, Toast } from './ui';

export function AdminLocations() {
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<DeliveryLocation | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeliveryLocation | null>(null);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  async function loadLocations() {
    if (!supabase) { setError('Database not configured.'); setLoading(false); return; }
    setLoading(true);
    const { data, error: err } = await supabase.from('delivery_locations').select('*').order('sort_order', { ascending: true });
    if (err) setError(err.message);
    else setLocations((data || []) as DeliveryLocation[]);
    setLoading(false);
  }

  useEffect(() => { loadLocations(); }, []);

  function startAdd() {
    setIsAdding(true);
    setEditing(null);
    setName('');
    setSortOrder(String(locations.length + 1));
    setActive(true);
    setFormError('');
  }

  function startEdit(loc: DeliveryLocation) {
    setEditing(loc);
    setIsAdding(false);
    setName(loc.name);
    setSortOrder(String(loc.sort_order));
    setActive(loc.active);
    setFormError('');
  }

  function cancelForm() {
    setEditing(null);
    setIsAdding(false);
    setName('');
    setFormError('');
  }

  async function save() {
    if (!supabase) return;
    if (!name.trim()) { setFormError('Location name is required.'); return; }
    if (locations.some((l) => l.name.toLowerCase() === name.trim().toLowerCase() && l.id !== editing?.id)) {
      setFormError('A location with this name already exists.');
      return;
    }
    setSaving(true);
    setFormError('');
    const payload = { name: name.trim(), sort_order: parseInt(sortOrder) || 0, active };
    if (editing) {
      const { error: err } = await supabase.from('delivery_locations').update(payload).eq('id', editing.id);
      setSaving(false);
      if (err) { setFormError('Failed to update: ' + err.message); return; }
      setToast({ message: 'Location updated.', type: 'success' });
    } else {
      const { error: err } = await supabase.from('delivery_locations').insert(payload);
      setSaving(false);
      if (err) { setFormError('Failed to add: ' + err.message); return; }
      setToast({ message: 'Location added.', type: 'success' });
    }
    cancelForm();
    loadLocations();
  }

  async function confirmDelete() {
    if (!deleteTarget || !supabase) return;
    const { error: err } = await supabase.from('delivery_locations').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    if (err) {
      setToast({ message: 'Failed to delete: ' + err.message, type: 'error' });
    } else {
      setToast({ message: 'Location deleted.', type: 'success' });
      loadLocations();
    }
  }

  async function toggleActive(loc: DeliveryLocation) {
    if (!supabase) return;
    await supabase.from('delivery_locations').update({ active: !loc.active }).eq('id', loc.id);
    loadLocations();
  }

  if (loading) return <Loading label="Loading locations..." />;
  if (error) return <ErrorState message={error} onRetry={loadLocations} />;

  return (
    <div className="admin-locations">
      <div className="admin-panel">
        <div className="admin-panel-heading">
          <div><p className="eyebrow">Delivery</p><h2>{locations.length} locations</h2></div>
          <button className="admin-btn admin-btn-gold" onClick={startAdd}><Plus size={16} /> Add location</button>
        </div>

        {(isAdding || editing) && (
          <div className="admin-inline-form">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Location name" />
            <input type="number" min="0" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} placeholder="Sort order" className="admin-sort-input" />
            <label className="admin-checkbox"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /><span>Active</span></label>
            <button className="admin-btn admin-btn-sm admin-btn-dark" disabled={saving} onClick={save}><Save size={14} /> {editing ? 'Update' : 'Add'}</button>
            <button className="admin-btn admin-btn-sm admin-btn-ghost" onClick={cancelForm}><X size={14} /></button>
            {formError && <span className="admin-inline-error">{formError}</span>}
          </div>
        )}

        {locations.length === 0 ? (
          <EmptyState icon={<MapPin size={28} />} title="No delivery locations" message="Add delivery locations for customer checkout." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Name</th><th>Sort order</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {locations.map((loc) => (
                  <tr key={loc.id}>
                    <td><strong>{loc.name}</strong></td>
                    <td>{loc.sort_order}</td>
                    <td>
                      <button className="admin-toggle" onClick={() => toggleActive(loc)}>
                        <span className={`admin-status ${loc.active ? 'admin-status-confirmed' : 'admin-status-cancelled'}`}>{loc.active ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="admin-row-actions">
                      <button className="admin-btn admin-btn-sm admin-btn-ghost" onClick={() => startEdit(loc)}><Edit2 size={14} /> Edit</button>
                      <button className="admin-btn admin-btn-sm admin-btn-danger-outline" onClick={() => setDeleteTarget(loc)}><Trash2 size={14} /> Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete location?"
        message={`Delete "${deleteTarget?.name}"? Customers will no longer be able to select this delivery location.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        destructive
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
