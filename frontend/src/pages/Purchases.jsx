import React, { useState, useEffect } from 'react';
import { Calendar, Package, FileText } from 'lucide-react';
import { API_URL } from '../config';

function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Fetch purchase history from backend
  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sales/purchases`);
      const data = await response.json();
      
      if (data.success) {
        // Sort by date - newest first
        const sorted = data.data.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setPurchases(sorted);
        console.log('📦 Purchases loaded:', sorted);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      setLoading(false);
    }
  };

  const toggleExpand = (purchaseId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(purchaseId)) {
      newExpanded.delete(purchaseId);
    } else {
      newExpanded.add(purchaseId);
    }
    setExpandedRows(newExpanded);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const calculateTotal = (products) => {
    // Since we don't store prices, show total quantity instead
    return products.reduce((sum, p) => sum + p.quantity, 0);
  };

  const cleanProductName = (name) => {
    // Remove units like (2 lbs), (1 gallon), etc.
    return name.replace(/\s*\([^)]*\)/g, '').trim();
  };

  return (
    <div className="purchases">
      <div className="purchases-header">
        <h1 className="page-title">Purchase History</h1>
        <div className="header-stats">
          <div className="stat-box">
            <div className="stat-label">Total Purchases</div>
            <div className="stat-value">{purchases.length}</div>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading purchase history...</p>
          </div>
        ) : purchases.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <h3>No Purchases Yet</h3>
            <p>Upload a bill to add your first purchase</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="purchases-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th>Total Products</th>
                  <th>Total Quantity</th>
                  <th>Products</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase, index) => (
                  <tr key={purchase._id}>
                    <td className="sno-cell">{index + 1}</td>
                    <td className="date-cell">
                      <Calendar size={16} />
                      {formatDate(purchase.createdAt)}
                    </td>
                    <td className="supplier-cell">{purchase.supplier || 'N/A'}</td>
                    <td className="count-cell">
                      <Package size={16} />
                      {purchase.products.length}
                    </td>
                    <td className="quantity-cell">
                      <strong>{calculateTotal(purchase.products)}</strong> items
                    </td>
                    <td className="products-cell">
                      <div className="products-list">
                        {(expandedRows.has(purchase._id) 
                          ? purchase.products 
                          : purchase.products.slice(0, 3)
                        ).map((p, i) => (
                          <span key={i}>
                            {cleanProductName(p.productName)} ({p.quantity}){i < (expandedRows.has(purchase._id) ? purchase.products.length : Math.min(3, purchase.products.length)) - 1 ? ', ' : ''}
                          </span>
                        ))}
                        {purchase.products.length > 3 && (
                          <span 
                            className="product-tag more"
                            onClick={() => toggleExpand(purchase._id)}
                          >
                            {expandedRows.has(purchase._id) 
                              ? ' Show less' 
                              : ` +${purchase.products.length - 3} more`
                            }
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Purchases;
