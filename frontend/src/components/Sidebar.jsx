import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, Package, ShoppingCart, Upload, Store, TrendingUp, FileText, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/stock-requirements', icon: AlertTriangle, label: 'Stock Requirements' },
  { path: '/purchases', icon: ShoppingCart, label: 'Purchases' },
  { path: '/upload-bill', icon: Upload, label: 'Upload Bill' },
  { path: '/shop-inventory', icon: Store, label: 'Shop Inventory' },
  { path: '/sales-analytics', icon: TrendingUp, label: 'Sales Analytics' },
  { path: '/reports', icon: FileText, label: 'Reports' },
  { path: '/settings', icon: Settings, label: 'Settings' }
];

function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">IQ</div>
          {!collapsed && <span className="logo-text">InventoryIQ</span>}
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : ''}
            >
              <Icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button className="collapse-btn" onClick={onToggle}>
        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>
    </div>
  );
}

export default Sidebar;
