import { ReactNode, useState } from 'react';
import {
  LayoutDashboard, Package, PlusCircle, ShoppingCart, Boxes,
  MapPin, Settings, LogOut, Menu, X, CircleUserRound,
} from 'lucide-react';
import { useAdminAuth } from '@/lib/admin-auth';

export interface AdminPage {
  key: string;
  label: string;
  icon: ReactNode;
  path: string;
  render: () => ReactNode;
}

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} />, path: '/admin' },
  { key: 'products', label: 'Products', icon: <Package size={17} />, path: '/admin/products' },
  { key: 'add-product', label: 'Add Product', icon: <PlusCircle size={17} />, path: '/admin/products/new' },
  { key: 'orders', label: 'Orders', icon: <ShoppingCart size={17} />, path: '/admin/orders' },
  { key: 'inventory', label: 'Inventory', icon: <Boxes size={17} />, path: '/admin/inventory' },
  { key: 'locations', label: 'Delivery Locations', icon: <MapPin size={17} />, path: '/admin/delivery-locations' },
  { key: 'settings', label: 'Shop Settings', icon: <Settings size={17} />, path: '/admin/settings' },
];

export function AdminShell({
  activeKey,
  navigate,
  children,
}: {
  activeKey: string;
  navigate: (to: string) => void;
  children: ReactNode;
}) {
  const { signOut } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeNav = navItems.find((n) => n.key === activeKey) || navItems[0];

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <button className="brand-mark admin-brand" onClick={() => navigate('/admin')}>
          <span className="brand-word">MAPUNJAN</span>
          <span className="brand-sub">SPORTSWEAR</span>
        </button>
        <span className="admin-sidebar-label">Management</span>
        <nav className="admin-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={activeKey === item.key ? 'active' : ''}
              onClick={() => handleNav(item.path)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <button className="admin-logout" onClick={handleSignOut}>
          <span>Sign out</span>
          <LogOut size={15} />
        </button>
      </aside>

      {mobileOpen && <div className="admin-sidebar-backdrop" onClick={() => setMobileOpen(false)} />}

      <main className="admin-main">
        <div className="admin-mobile-bar">
          <button onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span>{activeNav.label}</span>
        </div>
        <div className="admin-top">
          <div>
            <p className="eyebrow">Control room</p>
            <h1>{activeNav.label}</h1>
          </div>
          <div className="admin-user-pill">
            <CircleUserRound size={18} />
            <span>Administrator</span>
          </div>
        </div>
        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}
