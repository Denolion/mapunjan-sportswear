import { useEffect, useState } from 'react';
import { Save, Store, Phone, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ShopSettings } from '@/lib/types';
import { Loading, ErrorState, Toast } from './ui';

export function AdminSettings() {
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    shop_name: '', shop_address: '', whatsapp_number: '', business_phone: '',
    business_description: '', google_maps_url: '', latitude: '', longitude: '',
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

  if (loading) return <Loading label="Loading settings..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="admin-settings-page">
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
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
