import { useEffect, useState } from 'react';
import { Save, Store, Phone, MapPin, Wrench, Power } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ShopSettings } from '@/lib/types';
import { Loading, ErrorState, Toast, ConfirmDialog } from './ui';

export function AdminSettings() {
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [maintenanceConfirm, setMaintenanceConfirm] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

  const [form, setForm] = useState({
    shop_name: '', shop_address: '', whatsapp_number: '', business_phone: '',
    business_description: '', google_maps_url: '', latitude: '', longitude: '',
    maintenance_message: '',
  });

  useEffect(() => {
    if (!supabase) { setError('Database not configured.'); setLoading(false); return; }
    supabase.from('shop_settings').select('*').limit(1).maybeSingle().then(({ data, error: err }) => {
      if (err) { setError(err.message); setLoading(false); return; }
      if (data) {
        const s = data as ShopSettings;
        setSettings(s);
        setForm({
          shop_name: s.shop_name, shop_address: s.shop_address, whatsapp_number: s.whatsapp_number,
          business_phone: s.business_phone || '', business_description: s.business_description || '',
          google_maps_url: s.google_maps_url || '', latitude: s.latitude ? String(s.latitude) : '',
          longitude: s.longitude ? String(s.longitude) : '',
          maintenance_message: s.maintenance_message || '',
        });
      }
      setLoading(false);
    });
  }, []);

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!supabase) return;
    if (!form.shop_name.trim()) { setFormError('Shop name is required.'); return; }
    if (!form.whatsapp_number.trim()) { setFormError('WhatsApp number is required.'); return; }
    setSaving(true);
    setFormError('');
    const payload = {
      shop_name: form.shop_name.trim(),
      shop_address: form.shop_address.trim(),
      whatsapp_number: form.whatsapp_number.trim(),
      business_phone: form.business_phone.trim() || null,
      business_description: form.business_description.trim() || null,
      google_maps_url: form.google_maps_url.trim() || null,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      maintenance_message: form.maintenance_message.trim() || null,
    };
    if (settings) {
      const { error: err } = await supabase.from('shop_settings').update(payload).eq('id', settings.id);
      setSaving(false);
      if (err) { setToast({ message: 'Failed to save: ' + err.message, type: 'error' }); return; }
      setToast({ message: 'Shop settings saved.', type: 'success' });
    } else {
      const { data, error: err } = await supabase.from('shop_settings').insert(payload).select().maybeSingle();
      setSaving(false);
      if (err || !data) { setToast({ message: 'Failed to save: ' + (err?.message || 'Unknown error'), type: 'error' }); return; }
      setSettings(data as ShopSettings);
      setToast({ message: 'Shop settings created.', type: 'success' });
    }
  }

  async function toggleMaintenance() {
    if (!supabase || !settings) return;
    setMaintenanceConfirm(false);
    setMaintenanceLoading(true);
    const newValue = !settings.maintenance_mode;
    const { error: err } = await supabase.from('shop_settings').update({ maintenance_mode: newValue }).eq('id', settings.id);
    setMaintenanceLoading(false);
    if (err) {
      setToast({ message: 'Failed to toggle maintenance mode: ' + err.message, type: 'error' });
    } else {
      setSettings({ ...settings, maintenance_mode: newValue });
      setToast({ message: newValue ? 'Maintenance mode ENABLED. The shop is now hidden from customers.' : 'Maintenance mode DISABLED. The shop is live again.', type: 'success' });
    }
  }

  if (loading) return <Loading label="Loading settings..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="admin-settings-page">
      <div className={`admin-panel admin-maintenance-panel ${settings?.maintenance_mode ? 'admin-maintenance-on' : ''}`}>
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Shop status</p>
            <h2>Maintenance Mode</h2>
          </div>
          <span className={`admin-maintenance-status ${settings?.maintenance_mode ? 'is-on' : 'is-off'}`}>
            <Power size={14} /> {settings?.maintenance_mode ? 'ENABLED' : 'DISABLED'}
          </span>
        </div>
        <p className="admin-maintenance-desc">
          When enabled, customers see a maintenance page and cannot place orders. Order creation is also blocked at the database level. You (the administrator) can still log in and manage everything.
        </p>
        <label className="admin-field admin-field-full">
          <span>Custom maintenance message <small>(optional)</small></span>
          <textarea rows={2} value={form.maintenance_message} onChange={(e) => update('maintenance_message', e.target.value)} placeholder="MAPUNJAN SPORTS WEAR is currently undergoing scheduled maintenance. We're working to improve your shopping experience." />
        </label>
        <div className="admin-form-actions">
          <button
            className={`admin-btn ${settings?.maintenance_mode ? 'admin-btn-danger' : 'admin-btn-dark'}`}
            disabled={maintenanceLoading}
            onClick={() => {
              if (settings?.maintenance_mode) {
                toggleMaintenance();
              } else {
                setMaintenanceConfirm(true);
              }
            }}
          >
            <Wrench size={16} /> {maintenanceLoading ? 'Updating...' : settings?.maintenance_mode ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode'}
          </button>
        </div>
      </div>

      <div className="admin-settings-grid">
        <div className="admin-panel">
          <div className="admin-panel-heading">
            <div><p className="eyebrow">Business profile</p><h2>Shop settings</h2></div>
          </div>
          <div className="admin-form-grid">
            <label className="admin-field admin-field-full">
              <span>Shop name *</span>
              <input value={form.shop_name} onChange={(e) => update('shop_name', e.target.value)} />
            </label>
            <label className="admin-field admin-field-full">
              <span>Shop address</span>
              <input value={form.shop_address} onChange={(e) => update('shop_address', e.target.value)} placeholder="Kakamega, Kenya" />
            </label>
            <label className="admin-field">
              <span>WhatsApp number *</span>
              <input value={form.whatsapp_number} onChange={(e) => update('whatsapp_number', e.target.value)} placeholder="+254798777231" />
            </label>
            <label className="admin-field">
              <span>Business phone</span>
              <input value={form.business_phone} onChange={(e) => update('business_phone', e.target.value)} placeholder="+254798777231" />
            </label>
            <label className="admin-field">
              <span>Latitude</span>
              <input type="number" step="any" value={form.latitude} onChange={(e) => update('latitude', e.target.value)} placeholder="0.2837" />
            </label>
            <label className="admin-field">
              <span>Longitude</span>
              <input type="number" step="any" value={form.longitude} onChange={(e) => update('longitude', e.target.value)} placeholder="34.7519" />
            </label>
            <label className="admin-field admin-field-full">
              <span>Google Maps URL</span>
              <input value={form.google_maps_url} onChange={(e) => update('google_maps_url', e.target.value)} placeholder="https://maps.google.com/..." />
            </label>
            <label className="admin-field admin-field-full">
              <span>Business description</span>
              <textarea rows={3} value={form.business_description} onChange={(e) => update('business_description', e.target.value)} placeholder="Original team kits and sportswear." />
            </label>
          </div>
          {formError && <div className="admin-form-error">{formError}</div>}
          <div className="admin-form-actions">
            <button className="admin-btn admin-btn-gold" disabled={saving} onClick={save}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save settings'}
            </button>
          </div>
        </div>

        <div className="admin-panel admin-preview-panel">
          <h3>Preview</h3>
          <div className="admin-preview-card">
            <Store size={22} />
            <strong>{form.shop_name || 'MAPUNJAN SPORTS WEAR'}</strong>
            <span><MapPin size={14} /> {form.shop_address || 'Kakamega, Kenya'}</span>
            <span><Phone size={14} /> {form.whatsapp_number || '+254 798 777 231'}</span>
            {form.business_description && <p>{form.business_description}</p>}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={maintenanceConfirm}
        title="Enable maintenance mode?"
        message="Are you sure you want to enable maintenance mode? Customers will temporarily be unable to access the shop."
        confirmLabel="Enable Maintenance"
        onConfirm={toggleMaintenance}
        onCancel={() => setMaintenanceConfirm(false)}
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
