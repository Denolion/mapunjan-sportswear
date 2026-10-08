import { useEffect, useState } from 'react';
import { Package, ShoppingCart, Clock3, CheckCircle2, TrendingUp, AlertTriangle, Boxes } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Product, Order, formatKES, LOW_STOCK_THRESHOLD } from '@/lib/types';
import { Loading, EmptyState, ErrorState } from './ui';

export function AdminDashboard({ navigate }: { navigate: (to: string) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) { setError('Database is not configured.'); setLoading(false); return; }
    Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
    ]).then(([pRes, oRes]) => {
      if (pRes.error) setError(pRes.error.message);
      else setProducts((pRes.data || []) as Product[]);
      if (oRes.error && !error) setError(oRes.error.message);
      else setOrders((oRes.data || []) as Order[]);
      setLoading(false);
    });
  }, []);

  if (loading) return <Loading label="Loading dashboard..." />;
  if (error) return <ErrorState message={error} />;

  const activeProducts = products.filter((p) => p.active).length;
  const pendingOrders = orders.filter((o) => o.status === 'Pending').length;
  const confirmedOrders = orders.filter((o) => o.status === 'Confirmed').length;
  const deliveredOrders = orders.filter((o) => o.status === 'Delivered').length;
  const totalUnits = products.reduce((sum, p) => sum + p.stock_quantity, 0);
  const lowStock = products.filter((p) => p.stock_quantity <= LOW_STOCK_THRESHOLD);
  const totalValue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const recentOrders = orders.slice(0, 8);

  const stats = [
    { label: 'Total Products', value: products.length, icon: <Package size={18} /> },
    { label: 'Active Products', value: activeProducts, icon: <CheckCircle2 size={18} /> },
    { label: 'Total Orders', value: orders.length, icon: <ShoppingCart size={18} /> },
    { label: 'Pending Orders', value: pendingOrders, icon: <Clock3 size={18} /> },
    { label: 'Confirmed Orders', value: confirmedOrders, icon: <CheckCircle2 size={18} /> },
    { label: 'Delivered Orders', value: deliveredOrders, icon: <CheckCircle2 size={18} /> },
    { label: 'Inventory Units', value: totalUnits, icon: <Boxes size={18} /> },
    { label: 'Total Order Value', value: formatKES(totalValue), icon: <TrendingUp size={18} /> },
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-stat-grid">
        {stats.map((s) => (
          <div className="admin-stat-card" key={s.label}>
            <span className="admin-stat-icon">{s.icon}</span>
            <span className="admin-stat-label">{s.label}</span>
            <strong className="admin-stat-value">{s.value}</strong>
          </div>
        ))}
      </div>

      {lowStock.length > 0 && (
        <div className="admin-alert admin-alert-warning">
          <AlertTriangle size={18} />
          <span><strong>{lowStock.length}</strong> product{lowStock.length > 1 ? 's' : ''} running low on stock (≤ {LOW_STOCK_THRESHOLD} units)</span>
          <button className="admin-btn admin-btn-sm admin-btn-ghost" onClick={() => navigate('/admin/inventory')}>View inventory</button>
        </div>
      )}

      <div className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Latest activity</p>
            <h2>Recent Orders</h2>
          </div>
          {orders.length > 8 && (
            <button className="admin-btn admin-btn-ghost" onClick={() => navigate('/admin/orders')}>View all</button>
          )}
        </div>
        {recentOrders.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Customer</th>
                  <th>Location</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="admin-mono">{order.order_number}</td>
                    <td>{order.customer_name}<br /><span className="admin-sub-text">{order.customer_phone}</span></td>
                    <td>{order.delivery_location}</td>
                    <td>{formatKES(Number(order.total_amount))}</td>
                    <td><span className={`admin-status admin-status-${order.status.toLowerCase().replace(/ /g, '-')}`}>{order.status}</span></td>
                    <td className="admin-sub-text">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td><button className="admin-btn admin-btn-sm admin-btn-ghost" onClick={() => navigate('/admin/orders')}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<ShoppingCart size={28} />}
            title="No orders yet"
            message="Orders placed by customers will appear here."
          />
        )}
      </div>
    </div>
  );
}
