import React, { useState, useEffect } from 'react';
import { ShoppingBag, Edit2, Save, X, Search, Filter } from 'lucide-react';
import { getShopProducts, getCategories } from '../utils/shopProducts';
import { useAPI } from '../hooks/useAPI';
import { useStock } from '../context/StockContext';
import { useSettings } from '../context/SettingsContext';

function ShopInventory() {
  const { addSalesEntry, loading, error } = useAPI();
  const { stockData, lastUpdate, triggerStockUpdate } = useStock();
  const { formatCurrency } = useSettings();

  // Initialize inventory with shop products and stock levels
  const [inventory, setInventory] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [notification, setNotification] = useState(null);

  // Update inventory when stock data changes - show ALL products from MongoDB
  useEffect(() => {
    if (stockData && stockData.length > 0) {
      console.log('📊 Stock data received:', stockData);
      const allProducts = stockData.map(item => ({
        id: item.productId,
        name: item.productName || item.name,
        category: item.category || 'General',
        salesCount: 0,
        currentStock: item.currentStock || 0,
        price: item.price || 0
      }));
      console.log('📦 Mapped inventory:', allProducts);
      setInventory(allProducts);
    }
  }, [stockData, lastUpdate]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Get unique categories from actual inventory
  const categories = ['all', ...new Set(inventory.map(item => item.category).filter(Boolean))];
  console.log('🏷️ Available categories:', categories);

  // Filter inventory based on search and category
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setEditValue('');
  };

  const handleSaveClick = async (id) => {
    const salesQty = parseInt(editValue) || 0;
    const currentItem = inventory.find(item => item.id === id);

    if (salesQty <= 0) {
      showNotification('❌ Sales quantity must be greater than 0', 'error');
      return;
    }

    // Check if enough stock available
    if (currentItem.currentStock < salesQty) {
      showNotification(`❌ Insufficient stock! Available: ${currentItem.currentStock}, Requested: ${salesQty}`, 'error');
      return;
    }

    try {
      // Add sales entry to backend (this will decrease stock)
      await addSalesEntry(id, salesQty);

      // Trigger stock update across all pages
      triggerStockUpdate();

      showNotification(`✅ Sales recorded! Sold ${salesQty} units of ${currentItem.name}. Stock updated.`);
    } catch (err) {
      showNotification(`❌ Failed to record sales: ${err.message}`, 'error');
    }

    setEditingId(null);
    setEditValue('');
  };

  const handleCancelClick = () => {
    setEditingId(null);
    setEditValue('');
  };

  const getTotalStock = () => {
    return inventory.reduce((sum, item) => sum + item.currentStock, 0);
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return 'no-stock';
    if (stock <= 10) return 'low-stock';
    return 'good-stock';
  };

  return (
    <div className="shop-inventory">
      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Updating sales data...</p>
        </div>
      )}

      <div className="inventory-header">
        <div>
          <h1 className="page-title">Shop Inventory - Sales Tracking</h1>
          <p className="inventory-subtitle">
            Track sales count for each product manually
          </p>
        </div>
        <div className="inventory-stats">
          <div className="stat-card">
            <div className="stat-label">Total Products</div>
            <div className="stat-value">{inventory.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Stock</div>
            <div className="stat-value">{getTotalStock()}</div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="info-banner">
        <div className="info-icon">ℹ️</div>
        <div className="info-content">
          <strong>Sales & Stock Management:</strong> Enter sales quantity to record sales.
          Stock is automatically reduced. Upload e-bills to add stock.
        </div>
      </div>

      {/* Filters */}
      <div className="card inventory-controls">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by product name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={16} />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="inventory-grid">
        {filteredInventory.map((item) => (
          <div key={item.id} className={`inventory-card ${getStockStatus(item.currentStock)}`}>
            <div className="inventory-card-header">
              <div className="product-icon-wrapper">
                <ShoppingBag size={24} />
              </div>
              <div className="product-category">{item.category}</div>
            </div>

            <div className="inventory-card-body">
              <h3 className="product-name">{item.name}</h3>
              <div className="product-id" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>ID: {item.id}</span>
                <span style={{ fontWeight: 600, color: '#4F46E5' }}>{formatCurrency(item.price)}</span>
              </div>

              <div className="stock-section" style={{ marginTop: '12px' }}>
                <div className="stock-label">Current Stock: {item.currentStock}</div>
                <div className="stock-label">Record Sales</div>
                {editingId === item.id ? (
                  <div className="stock-edit-group">
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="stock-input"
                      min="1"
                      max={item.currentStock}
                      placeholder="Enter quantity"
                      autoFocus
                    />
                    <div className="edit-actions">
                      <button
                        onClick={() => handleSaveClick(item.id)}
                        className="save-btn"
                        title="Save"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={handleCancelClick}
                        className="cancel-btn"
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="stock-display-group">
                    <button
                      onClick={() => handleEditClick(item)}
                      className="edit-btn"
                      title="Record Sales"
                      disabled={item.currentStock === 0}
                    >
                      <Edit2 size={16} /> Record Sale
                    </button>
                  </div>
                )}
              </div>

              <div className={`stock-status-badge ${getStockStatus(item.currentStock)}`}>
                {item.currentStock === 0 && '🔴 Out of Stock'}
                {item.currentStock > 0 && item.currentStock <= 10 && '🟡 Low Stock'}
                {item.currentStock > 10 && '🟢 In Stock'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredInventory.length === 0 && (
        <div className="empty-state">
          <ShoppingBag size={48} />
          <h3>No products found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}

export default ShopInventory;
