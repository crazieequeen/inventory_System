import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell, ChevronDown, AlertTriangle, TrendingUp, Package, ShoppingCart, X } from 'lucide-react';
import { API_URL } from '../config';
import { useStock } from '../context/StockContext';

function Header() {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [hasBeenViewed, setHasBeenViewed] = useState(false);
  const [user, setUser] = useState(null);
  const { stockData } = useStock();

  // Load user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Get user initials
  const getUserInitials = () => {
    if (!user || !user.name) return 'U';
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return names[0][0] + (names[0][1] || '');
  };

  // Generate notifications based on inventory and sales data
  useEffect(() => {
    const generateNotifications = async () => {
      const newNotifications = [];

      try {
        // Fetch sales data for the last 7 days
        const salesResponse = await fetch(`${API_URL}/api/sales/aggregated?days=7`);
        const salesData = await salesResponse.json();

        const salesMap = {};
        if (salesData.success) {
          salesData.data.forEach(item => {
            salesMap[item.productId] = item.totalQuantity || 0;
          });
        }

        // Fetch recent purchases
        const purchasesResponse = await fetch(`${API_URL}/api/sales/purchases`);
        const purchasesData = await purchasesResponse.json();

        // Check each product for alerts
        if (stockData && stockData.length > 0) {
          stockData.forEach(product => {
            const stock = product.currentStock || 0;
            const sales = salesMap[product.productId] || 0;
            const dailyRate = sales / 7;

            // 1. CRITICAL: Low stock alert (less than 3 days remaining)
            if (sales > 0) {
              const daysRemaining = dailyRate > 0 ? stock / dailyRate : 999;

              if (daysRemaining < 3 && daysRemaining > 0) {
                newNotifications.push({
                  id: `low-${product.productId}`,
                  type: 'critical',
                  icon: AlertTriangle,
                  title: 'Critical Stock Alert',
                  message: `${product.productName} will run out in ${daysRemaining.toFixed(1)} days`,
                  time: 'Now',
                  color: '#DC2626'
                });
              } else if (daysRemaining < 7 && daysRemaining >= 3) {
                newNotifications.push({
                  id: `warning-${product.productId}`,
                  type: 'warning',
                  icon: AlertTriangle,
                  title: 'Low Stock Warning',
                  message: `${product.productName} stock running low (${daysRemaining.toFixed(1)} days left)`,
                  time: 'Now',
                  color: '#F59E0B'
                });
              }
            }

            // 2. Out of stock alert
            if (stock === 0) {
              newNotifications.push({
                id: `outofstock-${product.productId}`,
                type: 'critical',
                icon: Package,
                title: 'Out of Stock',
                message: `${product.productName} is out of stock`,
                time: 'Now',
                color: '#DC2626'
              });
            }

            // 3. High sales activity (selling fast)
            if (dailyRate > 10) {
              newNotifications.push({
                id: `trending-${product.productId}`,
                type: 'info',
                icon: TrendingUp,
                title: 'High Demand',
                message: `${product.productName} is selling fast (${dailyRate.toFixed(1)}/day)`,
                time: 'Today',
                color: '#3B82F6'
              });
            }

            // 4. No sales activity (stagnant inventory)
            if (sales === 0 && stock > 0) {
              newNotifications.push({
                id: `nosales-${product.productId}`,
                type: 'info',
                icon: Package,
                title: 'No Sales Activity',
                message: `${product.productName} has no sales in the last 7 days`,
                time: 'This week',
                color: '#6B7280'
              });
            }
          });
        }

        // 5. Recent purchases notification
        if (purchasesData.success && purchasesData.data.length > 0) {
          const recentPurchase = purchasesData.data[0];
          const totalProducts = recentPurchase.products.reduce((sum, p) => sum + p.quantity, 0);

          newNotifications.push({
            id: `purchase-${recentPurchase._id}`,
            type: 'success',
            icon: ShoppingCart,
            title: 'New Purchase Added',
            message: `${totalProducts} items added from ${recentPurchase.supplier || 'supplier'}`,
            time: new Date(recentPurchase.createdAt).toLocaleDateString(),
            color: '#16A34A'
          });
        }

        // Sort by priority: critical > warning > success > info
        const priorityOrder = { critical: 0, warning: 1, success: 2, info: 3 };
        newNotifications.sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type]);

        // Limit to top 10 notifications
        setNotifications(newNotifications.slice(0, 10));
      } catch (error) {
        console.error('Error generating notifications:', error);
      }
    };

    generateNotifications();

    // Refresh notifications every 30 seconds
    const interval = setInterval(generateNotifications, 30000);
    return () => clearInterval(interval);
  }, [stockData]);

  // Mark notifications as read when clicking the bell
  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    // Once clicked, mark as viewed (badge disappears forever)
    setHasBeenViewed(true);
  };

  return (
    <header className="header">
      <div className="header-left">
        <span className="shop-name">{user?.storeName || 'Retail Store'} - Inventory System</span>
      </div>

      <div className="header-center">
        {/* Search bar removed per request */}
      </div>

      <div className="header-right">
        <button
          className="notification-btn"
          onClick={handleNotificationClick}
        >
          <Bell size={20} />
          {!hasBeenViewed && notifications.length > 0 && (
            <span className="notification-badge">{notifications.length}</span>
          )}
        </button>

        {showNotifications && (
          <div className="notification-dropdown">
            <div className="notification-header">
              <h3>Notifications</h3>
              <button
                className="close-btn"
                onClick={() => setShowNotifications(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="no-notifications">
                  <Bell size={32} style={{ color: '#9CA3AF' }} />
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.map(notif => {
                  const IconComponent = notif.icon;
                  return (
                    <div key={notif.id} className={`notification-item ${notif.type}`}>
                      <div className="notification-icon" style={{ background: `${notif.color}15`, color: notif.color }}>
                        <IconComponent size={18} />
                      </div>
                      <div className="notification-content">
                        <div className="notification-title">{notif.title}</div>
                        <div className="notification-message">{notif.message}</div>
                        <div className="notification-time">{notif.time}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        <div className="profile-section">
          <button
            className="profile-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="profile-avatar overflow-hidden">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                getUserInitials()
              )}
            </div>
            <span className="profile-name">{user?.name || 'User'}</span>
            <ChevronDown size={16} />
          </button>

          {showProfileMenu && (
            <div className="profile-menu">
              <Link to="/profile" className="menu-item">Profile</Link>
              <a
                href="#logout"
                className="menu-item"
                onClick={(e) => {
                  e.preventDefault();
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  window.location.href = '/login';
                }}
              >
                Logout
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
