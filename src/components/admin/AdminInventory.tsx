import { useEffect, useMemo, useState } from 'react';
import { Search, Save, Boxes, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Product, formatKES, LOW_STOCK_THRESHOLD } from '@/lib/types';
import { Loading, EmptyState, ErrorState, Toast } from './ui';

export function AdminInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [editStock, setEditStock] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  async function loadProducts() {
    if (!supabase) { setError('Database not configured.'); setLoading(false); return; }
    setLoading(true);
    const { data, error: err } = await supabase.from('products').select('*').order('product_name', { ascending: true });
    if (err) setError(err.message);
    else setProducts((data || []) as Product[]);
    setLoading(false);
  }

  useEffect(() => { loadProducts(); }, []);

  const filtered = useMemo(() => {
    let list = products;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => `${p.product_name} ${p.team_name}`.toLowerCase().includes(q));
    }
    if (filter === 'Low') list = list.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= LOW_STOCK_THRESHOLD);
    if (filter === 'Out') list = list.filter((p) => p.stock_quantity === 0);
    return list;
  }, [products, search, filter]);

  async function saveStock(productId: string) {
    if (!supabase) return;
    const val = parseInt(editStock[productId]);
    if (isNaN(val) || val < 0) { setToast({ message: 'Stock must be a non-negative integer.', type: 'error' }); return; }
    setSaving(productId);
    const { error: err } = await supabase.from('products').update({ stock_quantity: val }).eq('id', productId);
    setSaving(null);
    if (err) {
      setToast({ message: 'Failed to update stock: ' + err.message, type: 'error' });
    } else {
      setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, stock_quantity: val } : p));
      setEditStock((prev) => { const next = { ...prev }; delete next[productId]; return next; });
      setToast({ message: 'Stock updated successfully.', type: 'success' });
    }
  }

  function stockStatus(p: Product) {
    if (p.stock_quantity === 0) return { label: 'Out of stock', icon: <XCircle size={14} />, cls: 'admin-status-cancelled' };
    if (p.stock_quantity <= LOW_STOCK_THRESHOLD) return { label: 'Low stock', icon: <AlertTriangle size={14} />, cls: 'admin-status-pending' };
    return { label: 'In stock', icon: <CheckCircle2 size={14} />, cls: 'admin-status-confirmed' };
  }

  if (loading) return <Loading label="Loading inventory..." />;
  if (error) return <ErrorState message={error} onRetry={loadProducts} />;

  return (
    <div className="admin-panel">
      <div className="admin-panel-heading">
        <div><p className="eyebrow">Stock management</p><h2>{products.length} products</h2></div>
      </div>
      <div className="admin-filters">
        <div className="admin-search-box">
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="All">All products</option>
          <option value="Low">Low stock (≤ {LOW_STOCK_THRESHOLD})</option>
          <option value="Out">Out of stock</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Boxes size={28} />} title="No products found" message="Add products to manage their stock levels." />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Team</th>
                <th>Current Stock</th>
                <th>Status</th>
                <th>New Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const status = stockStatus(p);
                const isEditing = editStock[p.id] !== undefined;
                return (
                  <tr key={p.id}>
                    <td><strong>{p.product_name}</strong></td>
                    <td className="admin-sub-text">{p.team_name}</td>
                    <td className={p.stock_quantity <= LOW_STOCK_THRESHOLD ? 'admin-low-stock' : ''}>{p.stock_quantity}</td>
                    <td><span className={`admin-status ${status.cls}`}>{status.icon} {status.label}</span></td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        className="admin-stock-input"
                        value={isEditing ? editStock[p.id] : p.stock_quantity}
                        onChange={(e) => setEditStock((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      />
                    </td>
                    <td>
                      <button
                        className="admin-btn admin-btn-sm admin-btn-dark"
                        disabled={saving === p.id || !isEditing}
                        onClick={() => saveStock(p.id)}
                      >
                        {saving === p.id ? 'Saving...' : <><Save size={14} /> Save</>}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
