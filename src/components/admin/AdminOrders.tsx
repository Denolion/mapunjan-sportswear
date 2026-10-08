import { useEffect, useMemo, useState } from 'react';
import { Search, ShoppingCart, Eye, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Order, OrderItem, OrderStatus, ORDER_STATUSES, formatKES } from '@/lib/types';
import { Loading, EmptyState, ErrorState, ConfirmDialog, Toast } from './ui';

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState<OrderStatus | ''>('');
  const [updating, setUpdating] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  async function loadOrders() {
    if (!supabase) { setError('Database not configured.'); setLoading(false); return; }
    setLoading(true);
    const { data, error: err } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (err) setError(err.message);
    else setOrders((data || []) as Order[]);
    setLoading(false);
  }

  useEffect(() => { loadOrders(); }, []);

  const filtered = useMemo(() => {
    let list = orders;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((o) => `${o.order_number} ${o.customer_name} ${o.customer_phone}`.toLowerCase().includes(q));
    }
    if (statusFilter !== 'All') list = list.filter((o) => o.status === statusFilter);
    if (dateFilter) {
      const d = new Date(dateFilter).toDateString();
      list = list.filter((o) => new Date(o.created_at).toDateString() === d);
    }
    return list;
  }, [orders, search, statusFilter, dateFilter]);

  async function openOrderDetails(order: Order) {
    setViewOrder(order);
    setStatusUpdate('');
    setItemsLoading(true);
    if (!supabase) { setItemsLoading(false); return; }
    const { data } = await supabase.from('order_items').select('*').eq('order_id', order.id);
    setOrderItems((data || []) as OrderItem[]);
    setItemsLoading(false);
  }

  async function applyStatusUpdate() {
    if (!viewOrder || !statusUpdate || !supabase) return;
    setUpdating(true);
    const { error: err } = await supabase.from('orders').update({ status: statusUpdate }).eq('id', viewOrder.id);
    setUpdating(false);
    if (err) {
      setToast({ message: 'Failed to update status: ' + err.message, type: 'error' });
    } else {
      setOrders((prev) => prev.map((o) => o.id === viewOrder.id ? { ...o, status: statusUpdate } : o));
      setViewOrder({ ...viewOrder, status: statusUpdate });
      setToast({ message: 'Order status updated to ' + statusUpdate, type: 'success' });
      setStatusUpdate('');
    }
  }

  async function confirmCancel() {
    if (!cancelTarget || !supabase) return;
    const { error: err } = await supabase.from('orders').update({ status: 'Cancelled' }).eq('id', cancelTarget.id);
    setCancelTarget(null);
    if (err) {
      setToast({ message: 'Failed to cancel order: ' + err.message, type: 'error' });
    } else {
      setOrders((prev) => prev.map((o) => o.id === cancelTarget.id ? { ...o, status: 'Cancelled' } : o));
      setToast({ message: 'Order cancelled.', type: 'success' });
    }
  }

  if (loading) return <Loading label="Loading orders..." />;
  if (error) return <ErrorState message={error} onRetry={loadOrders} />;

  if (viewOrder) {
    return (
      <div className="admin-order-detail">
        <button className="admin-back-btn" onClick={() => setViewOrder(null)}>
          <ChevronLeft size={16} /> Back to orders
        </button>
        <div className="admin-order-detail-grid">
          <div className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <p className="eyebrow">Order details</p>
                <h2>{viewOrder.order_number}</h2>
              </div>
              <span className={`admin-status admin-status-${viewOrder.status.toLowerCase().replace(/ /g, '-')}`}>{viewOrder.status}</span>
            </div>
            <div className="admin-detail-grid">
              <div><span className="admin-sub-text">Customer</span><strong>{viewOrder.customer_name}</strong></div>
              <div><span className="admin-sub-text">Phone</span><strong>{viewOrder.customer_phone}</strong></div>
              <div><span className="admin-sub-text">Delivery location</span><strong>{viewOrder.delivery_location}</strong></div>
              <div><span className="admin-sub-text">Preferred date</span><strong>{viewOrder.preferred_delivery_date}</strong></div>
              <div><span className="admin-sub-text">Preferred time</span><strong>{viewOrder.preferred_delivery_time}</strong></div>
              <div><span className="admin-sub-text">Order date</span><strong>{new Date(viewOrder.created_at).toLocaleString()}</strong></div>
            </div>
            {viewOrder.additional_instructions && (
              <div className="admin-detail-section">
                <span className="admin-sub-text">Additional instructions</span>
                <p>{viewOrder.additional_instructions}</p>
              </div>
            )}

            <div className="admin-detail-section">
              <h3>Order items</h3>
              {itemsLoading ? <Loading label="Loading items..." /> : orderItems.length === 0 ? (
                <p className="admin-sub-text">No items found.</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr><th>Product</th><th>Team</th><th>Size</th><th>Qty</th><th>Unit price</th><th>Subtotal</th></tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.product_name}<br /><span className="admin-sub-text">{item.season} · {item.jersey_type}</span></td>
                        <td>{item.team_name}</td>
                        <td>{item.selected_size}</td>
                        <td>{item.quantity}</td>
                        <td>{formatKES(Number(item.unit_price))}</td>
                        <td>{formatKES(Number(item.unit_price) * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="admin-order-total">
              <span>Total amount</span>
              <strong>{formatKES(Number(viewOrder.total_amount))}</strong>
            </div>
          </div>

          <div className="admin-panel">
            <h3>Update status</h3>
            <div className="admin-status-update">
              <select value={statusUpdate} onChange={(e) => setStatusUpdate(e.target.value as OrderStatus)}>
                <option value="">Select new status...</option>
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button className="admin-btn admin-btn-dark" disabled={!statusUpdate || updating} onClick={applyStatusUpdate}>
                {updating ? 'Updating...' : 'Update status'}
              </button>
            </div>
            {viewOrder.status !== 'Cancelled' && (
              <button className="admin-btn admin-btn-danger-outline admin-btn-block" onClick={() => setCancelTarget(viewOrder)}>
                Cancel this order
              </button>
            )}
          </div>
        </div>

        <ConfirmDialog
          open={Boolean(cancelTarget)}
          title="Cancel order?"
          message={`Are you sure you want to cancel order ${cancelTarget?.order_number}? This action will mark it as Cancelled.`}
          confirmLabel="Yes, cancel order"
          onConfirm={confirmCancel}
          onCancel={() => setCancelTarget(null)}
          destructive
        />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel-heading">
        <div><p className="eyebrow">Orders</p><h2>{orders.length} total orders</h2></div>
      </div>
      <div className="admin-filters">
        <div className="admin-search-box">
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by order number, name, or phone..." />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<ShoppingCart size={28} />} title="No orders found" message="Orders will appear here once customers start placing them." />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Location</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id}>
                  <td className="admin-mono">{order.order_number}</td>
                  <td>{order.customer_name}</td>
                  <td className="admin-sub-text">{order.customer_phone}</td>
                  <td>{order.delivery_location}</td>
                  <td>{formatKES(Number(order.total_amount))}</td>
                  <td><span className={`admin-status admin-status-${order.status.toLowerCase().replace(/ /g, '-')}`}>{order.status}</span></td>
                  <td className="admin-sub-text">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td><button className="admin-btn admin-btn-sm admin-btn-ghost" onClick={() => openOrderDetails(order)}><Eye size={14} /> View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
