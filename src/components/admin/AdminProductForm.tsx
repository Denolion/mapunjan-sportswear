import { useEffect, useState, FormEvent } from 'react';
import { Upload, X, Star, Trash2, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Product, ProductImage, Category, CATEGORY_OPTIONS, SIZE_OPTIONS } from '@/lib/types';
import { Loading, ErrorState, Toast } from './ui';

interface ProductFormState {
  team_name: string;
  product_name: string;
  category: Category;
  season: string;
  jersey_type: string;
  description: string;
  previous_price: string;
  current_price: string;
  available_sizes: string[];
  stock_quantity: string;
  featured: boolean;
  active: boolean;
}

const emptyForm: ProductFormState = {
  team_name: '', product_name: '', category: 'Football', season: '', jersey_type: '',
  description: '', previous_price: '', current_price: '', available_sizes: ['S', 'M', 'L', 'XL'],
  stock_quantity: '0', featured: false, active: true,
};

export function AdminProductForm({
  productId,
  navigate,
}: {
  productId?: string;
  navigate: (to: string) => void;
}) {
  const isEdit = Boolean(productId);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!productId || !supabase) return;
    supabase.from('products')
      .select('*, product_images(*)')
      .eq('id', productId)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err || !data) { setError('Could not load product.'); setLoading(false); return; }
        const p = data as Product;
        setForm({
          team_name: p.team_name,
          product_name: p.product_name,
          category: p.category,
          season: p.season,
          jersey_type: p.jersey_type,
          description: p.description || '',
          previous_price: String(p.previous_price),
          current_price: String(p.current_price),
          available_sizes: p.available_sizes,
          stock_quantity: String(p.stock_quantity),
          featured: p.featured,
          active: p.active,
        });
        setExistingImages(p.product_images || []);
        setLoading(false);
      });
  }, [productId]);

  function update<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleSize(size: string) {
    setForm((f) => ({
      ...f,
      available_sizes: f.available_sizes.includes(size)
        ? f.available_sizes.filter((s) => s !== size)
        : [...f.available_sizes, size],
    }));
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const valid = Array.from(files).filter((f) => f.type.startsWith('image/'));
    setNewFiles((prev) => [...prev, ...valid]);
    valid.forEach((f) => setPreviews((prev) => [...prev, URL.createObjectURL(f)]));
  }

  function removeNewFile(idx: number) {
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
    if (primaryIndex > idx) setPrimaryIndex((pi) => pi - 1);
  }

  async function removeExistingImage(img: ProductImage) {
    if (!supabase || !productId) return;
    if (img.storage_path) {
      await supabase.storage.from('product-images').remove([img.storage_path]);
    }
    await supabase.from('product_images').delete().eq('id', img.id);
    setExistingImages((prev) => prev.filter((i) => i.id !== img.id));
    setToast({ message: 'Image removed.', type: 'success' });
  }

  async function setPrimaryExisting(img: ProductImage) {
    if (!supabase || !productId) return;
    await supabase.from('product_images').update({ is_primary: false }).eq('product_id', productId).neq('id', img.id);
    await supabase.from('product_images').update({ is_primary: true }).eq('id', img.id);
    setExistingImages((prev) => prev.map((i) => ({ ...i, is_primary: i.id === img.id })));
    setPrimaryIndex(-1);
    setToast({ message: 'Primary image updated.', type: 'success' });
  }

  function validate(): string | null {
    if (!form.team_name.trim()) return 'Team name is required.';
    if (!form.product_name.trim()) return 'Product name is required.';
    if (!form.category) return 'Category is required.';
    if (!form.season.trim()) return 'Season is required.';
    if (!form.jersey_type.trim()) return 'Jersey type is required.';
    const prev = parseFloat(form.previous_price);
    const curr = parseFloat(form.current_price);
    if (isNaN(prev) || prev < 0) return 'Previous price must be a valid non-negative number.';
    if (isNaN(curr) || curr < 0) return 'Current price must be a valid non-negative number.';
    if (form.available_sizes.length === 0) return 'Select at least one size.';
    const stock = parseInt(form.stock_quantity);
    if (isNaN(stock) || stock < 0) return 'Stock quantity must be a non-negative integer.';
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setFormError(validationError); return; }
    if (!supabase) { setFormError('Database not configured.'); return; }
    setSaving(true);
    setFormError('');

    const payload = {
      team_name: form.team_name.trim(),
      product_name: form.product_name.trim(),
      category: form.category,
      season: form.season.trim(),
      jersey_type: form.jersey_type.trim(),
      description: form.description.trim() || null,
      previous_price: parseFloat(form.previous_price),
      current_price: parseFloat(form.current_price),
      available_sizes: form.available_sizes,
      stock_quantity: parseInt(form.stock_quantity),
      featured: form.featured,
      active: form.active,
    };

    let prodId = productId;
    if (isEdit && productId) {
      const { error: err } = await supabase.from('products').update(payload).eq('id', productId);
      if (err) { setFormError('Failed to update product: ' + err.message); setSaving(false); return; }
    } else {
      const { data, error: err } = await supabase.from('products').insert(payload).select().maybeSingle();
      if (err || !data) { setFormError('Failed to create product: ' + (err?.message || 'Unknown error')); setSaving(false); return; }
      prodId = data.id;
    }

    if (newFiles.length > 0 && prodId) {
      const uploadedImages: { image_url: string; storage_path: string; is_primary: boolean; sort_order: number }[] = [];
      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        const ext = file.name.split('.').pop();
        const path = `${prodId}/${Date.now()}-${i}.${ext}`;
        const { error: upErr } = await supabase.storage.from('product-images').upload(path, file);
        if (upErr) {
          setToast({ message: `Image upload failed: ${upErr.message}. Product saved without that image.`, type: 'error' });
          continue;
        }
        const { data: pubData } = supabase.storage.from('product-images').getPublicUrl(path);
        const isPrimary = primaryIndex === i && !existingImages.some((img) => img.is_primary);
        uploadedImages.push({ image_url: pubData.publicUrl, storage_path: path, is_primary: isPrimary, sort_order: existingImages.length + i });
      }
      if (uploadedImages.length > 0) {
        if (uploadedImages.some((img) => img.is_primary)) {
          await supabase.from('product_images').update({ is_primary: false }).eq('product_id', prodId);
        }
        await supabase.from('product_images').insert(uploadedImages.map((img) => ({ ...img, product_id: prodId })));
      }
    }

    setSaving(false);
    setToast({ message: isEdit ? 'Product updated successfully.' : 'Product created successfully.', type: 'success' });
    setTimeout(() => navigate('/admin/products'), 1000);
  }

  if (loading) return <Loading label="Loading product..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="admin-product-form">
      <button className="admin-back-btn" onClick={() => navigate('/admin/products')}>
        <ArrowLeft size={16} /> Back to products
      </button>
      <form onSubmit={handleSubmit} className="admin-form">
        <div className="admin-form-grid">
          <label className="admin-field">
            <span>Team name *</span>
            <input value={form.team_name} onChange={(e) => update('team_name', e.target.value)} placeholder="e.g. Gor Mahia" />
          </label>
          <label className="admin-field">
            <span>Product name *</span>
            <input value={form.product_name} onChange={(e) => update('product_name', e.target.value)} placeholder="e.g. Home Jersey 2024/25" />
          </label>
          <label className="admin-field">
            <span>Category *</span>
            <select value={form.category} onChange={(e) => update('category', e.target.value as Category)}>
              {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="admin-field">
            <span>Season *</span>
            <input value={form.season} onChange={(e) => update('season', e.target.value)} placeholder="e.g. 2024/25" />
          </label>
          <label className="admin-field">
            <span>Jersey type *</span>
            <input value={form.jersey_type} onChange={(e) => update('jersey_type', e.target.value)} placeholder="e.g. Home, Away, Third" />
          </label>
          <label className="admin-field">
            <span>Stock quantity *</span>
            <input type="number" min="0" value={form.stock_quantity} onChange={(e) => update('stock_quantity', e.target.value)} />
          </label>
          <label className="admin-field">
            <span>Previous price (KES) *</span>
            <input type="number" min="0" step="0.01" value={form.previous_price} onChange={(e) => update('previous_price', e.target.value)} placeholder="e.g. 3500" />
          </label>
          <label className="admin-field">
            <span>Current price (KES) *</span>
            <input type="number" min="0" step="0.01" value={form.current_price} onChange={(e) => update('current_price', e.target.value)} placeholder="e.g. 2800" />
          </label>
        </div>

        <label className="admin-field admin-field-full">
          <span>Description</span>
          <textarea rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Product description..." />
        </label>

        <div className="admin-field-group">
          <span className="admin-field-label">Available sizes * <small>(select one or more)</small></span>
          <div className="admin-size-grid">
            {SIZE_OPTIONS.map((size) => (
              <button
                type="button"
                key={size}
                className={form.available_sizes.includes(size) ? 'admin-size-chip selected' : 'admin-size-chip'}
                onClick={() => toggleSize(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="admin-checkbox-row">
          <label className="admin-checkbox">
            <input type="checkbox" checked={form.featured} onChange={(e) => update('featured', e.target.checked)} />
            <span>Featured product</span>
          </label>
          <label className="admin-checkbox">
            <input type="checkbox" checked={form.active} onChange={(e) => update('active', e.target.checked)} />
            <span>Active (visible on storefront)</span>
          </label>
        </div>

        <div className="admin-field-group">
          <span className="admin-field-label">Product images</span>
          <div className="admin-upload-area">
            <label className="admin-upload-drop">
              <input type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files)} style={{ display: 'none' }} />
              <Upload size={22} />
              <span>Click to upload images</span>
              <small>PNG, JPG, WebP accepted</small>
            </label>
          </div>

          {(existingImages.length > 0 || previews.length > 0) && (
            <div className="admin-image-gallery">
              {existingImages.map((img) => (
                <div key={img.id} className={`admin-image-tile ${img.is_primary ? 'is-primary' : ''}`}>
                  <img src={img.image_url} alt="" />
                  <div className="admin-image-actions">
                    <button type="button" title="Set as primary" onClick={() => setPrimaryExisting(img)} className={img.is_primary ? 'active' : ''}>
                      <Star size={14} />
                    </button>
                    <button type="button" title="Remove" onClick={() => removeExistingImage(img)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {img.is_primary && <span className="admin-primary-badge">Primary</span>}
                </div>
              ))}
              {previews.map((url, i) => (
                <div key={i} className={`admin-image-tile ${primaryIndex === i ? 'is-primary' : ''}`}>
                  <img src={url} alt="" />
                  <div className="admin-image-actions">
                    <button type="button" title="Set as primary" onClick={() => setPrimaryIndex(i)} className={primaryIndex === i ? 'active' : ''}>
                      <Star size={14} />
                    </button>
                    <button type="button" title="Remove" onClick={() => removeNewFile(i)}>
                      <X size={14} />
                    </button>
                  </div>
                  {primaryIndex === i && <span className="admin-primary-badge">Primary</span>}
                </div>
              ))}
            </div>
          )}
          {existingImages.length === 0 && previews.length === 0 && (
            <p className="admin-sub-text"><ImageIcon size={14} /> No images added yet.</p>
          )}
        </div>

        {formError && <div className="admin-form-error">{formError}</div>}

        <div className="admin-form-actions">
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => navigate('/admin/products')}>Cancel</button>
          <button type="submit" className="admin-btn admin-btn-gold" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create product'}
          </button>
        </div>
      </form>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
