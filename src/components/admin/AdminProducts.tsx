import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Product, formatKES, CATEGORY_OPTIONS, Category } from '@/lib/types';
import { Loading, EmptyState, ErrorState, ConfirmDialog, Toast } from './ui';

export function AdminProducts({ navigate }: { navigate: (to: string) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('created_desc');
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  async function loadProducts() {
    if (!supabase) { setError('Database not configured.'); setLoading(false); return; }
    setLoading(true);
    const { data, error: err } = await supabase
      .from('products')
      .select('*, product_images(*)')
      .order('created_at', { ascending: false });
    if (err) setError(err.message);
    else setProducts((data || []) as Product[]);
    setLoading(false);
  }

  useEffect(() => { loadProducts(); }, []);

  const filtered = useMemo(() => {
    let list = products;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => `${p.product_name} ${p.team_name} ${p.season}`.toLowerCase().includes(q));
    }
    if (categoryFilter !== 'All') list = list.filter((p) => p.category === categoryFilter);
    if (statusFilter === 'Active') list = list.filter((p) => p.active);
    if (statusFilter === 'Inactive') list = list.filter((p) => !p.active);
    const [field, dir] = sortBy.split('_');
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (field === 'created') cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (field === 'price') cmp = a.current_price - b.current_price;
      if (field === 'stock') cmp = a.stock_quantity - b.stock_quantity;
      if (field === 'name') cmp = a.product_name.localeCompare(b.product_name);
      return dir === 'desc' ? -cmp : cmp;
    });
    return list;
  }, [products, search, categoryFilter, statusFilter, sortBy]);

  async function confirmDelete() {
    if (!deleteTarget || !supabase) return;
    setDeleting(true);
    const id = deleteTarget.id;
    const images = deleteTarget.product_images || [];
    for (const img of images) {
      if (img.storage_path) {
        await supabase.storage.from('product-images').remove([img.storage_path]);
      }
    }
    const { error: err } = await supabase.from('products').delete().eq('id', id);
    setDeleting(false);
    setDeleteTarget(null);
    if (err) {
      setToast({ message: 'Could not delete product: ' + err.message, type: 'error' });
    } else {
      setToast({ message: 'Product deleted successfully.', type: 'success' });
      loadProducts();
    }
  }

  return (
    <div>
      <div className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Catalogue</p>
            <h2>{products.length} products</h2>
          </div>
          <button className="admin-btn admin-btn-gold" onClick={() => navigate('/admin/products/new')}>
            <Plus size={16} /> Add product
          </button>
        </div>

        <div className="admin-filters">
          <div className="admin-search-box">
            <Search size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or team..." />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="All">All categories</option>
            {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="created_desc">Newest first</option>
            <option value="created_asc">Oldest first</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="stock_asc">Stock: Low to High</option>
            <option value="name_asc">Name: A to Z</option>
          </select>
        </div>

        {loading ? (
          <Loading label="Loading products..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadProducts} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Package size={28} />}
            title="No products found"
            message="Add your first product to start building the catalogue."
            action={<button className="admin-btn admin-btn-gold" onClick={() => navigate('/admin/products/new')}><Plus size={16} /> Add product</button>}
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Season</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <img
                        className="admin-product-thumb"
                        src={p.product_images?.find((i) => i.is_primary)?.image_url || p.product_images?.[0]?.image_url || '/images/branding/WhatsApp_Image_2026-10-09_at_00.05.46_(1).jpeg'}
                        alt=""
                      />
                    </td>
                    <td>
                      <strong>{p.product_name}</strong>
                      <br />
                      <span className="admin-sub-text">{p.team_name} · {p.jersey_type}</span>
                    </td>
                    <td>{p.category}</td>
                    <td>{p.season}</td>
                    <td>
                      {formatKES(p.current_price)}
                      {p.previous_price > p.current_price && <br />}
                      {p.previous_price > p.current_price && <del className="admin-sub-text">{formatKES(p.previous_price)}</del>}
                    </td>
                    <td className={p.stock_quantity <= 5 ? 'admin-low-stock' : ''}>{p.stock_quantity}</td>
                    <td>
                      <span className={`admin-status ${p.active ? 'admin-status-confirmed' : 'admin-status-cancelled'}`}>
                        {p.active ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="admin-row-actions">
                      <button className="admin-btn admin-btn-sm admin-btn-ghost" onClick={() => navigate(`/admin/products/${p.id}/edit`)}>
                        <Edit2 size={14} /> Edit
                      </button>
                      <button className="admin-btn admin-btn-sm admin-btn-danger-outline" onClick={() => setDeleteTarget(p)}>
                        <Trash2 size={14} /> Delete
                      </button>
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
        title="Delete product?"
        message={`Are you sure you want to delete "${deleteTarget?.product_name}" by ${deleteTarget?.team_name}? This will also remove all associated images. This action cannot be undone.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        destructive
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
