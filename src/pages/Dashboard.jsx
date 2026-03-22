import React, { useState, useEffect } from 'react';
import { ShoppingCart, TrendingUp, Package, Activity, DollarSign } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';

function Dashboard() {
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesRes, purchasesRes, stockRes] = await Promise.all([
        fetch('http://localhost:5000/api/sales/history'),
        fetch('http://localhost:5000/api/sales/purchases'),
        fetch('http://localhost:5000/api/sales/stock')
      ]);

      const salesData = await salesRes.json();
      const purchasesData = await purchasesRes.json();
      const stockData = await stockRes.json();

      if (salesData.success) {
        setSales(salesData.data || []);
      }
      if (purchasesData.success) {
        setPurchases(purchasesData.data || []);
      }
      if (stockData.success) {
        const prodMap = {};
        (stockData.data || []).forEach(p => {
          prodMap[p.productId] = p.productName;
        });
        setProducts(prodMap);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Process data for charts
  const processTimelineData = () => {
    const timelineMap = {};

    // Process Sales
    sales.forEach(sale => {
      const date = new Date(sale.date || sale.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!timelineMap[date]) timelineMap[date] = { date, sales: 0, purchases: 0 };
      timelineMap[date].sales += sale.quantity;
    });

    // Process Purchases 
    purchases.forEach(purchase => {
      const date = new Date(purchase.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!timelineMap[date]) timelineMap[date] = { date, sales: 0, purchases: 0 };

      const purchaseQty = purchase.products.reduce((sum, p) => sum + p.quantity, 0);
      timelineMap[date].purchases += purchaseQty;
    });

    // Sort by date roughly (this is basic sorting, works if dates are within the same year usually)
    return Object.values(timelineMap).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const timelineData = processTimelineData();

  // Metrics calculation
  const totalSalesCount = sales.reduce((sum, s) => sum + s.quantity, 0);
  const totalPurchasesCount = purchases.reduce((sum, p) => {
    return sum + p.products.reduce((sq, item) => sq + item.quantity, 0);
  }, 0);

  const getProductName = (id) => {
    return products[id] || id;
  };

  const bestSellingProducts = () => {
    const productMap = {};
    sales.forEach(sale => {
      const name = getProductName(sale.productId);
      if (!productMap[name]) productMap[name] = 0;
      productMap[name] += sale.quantity;
    });

    return Object.entries(productMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  const pieColors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="dashboard loading-container">
        <div className="spinner"></div>
        <p>Analyzing Sales & Purchase Data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="page-title">Sales & Purchase Dashboard</h1>
        <p className="subtitle">Real-time overview of your business metrics</p>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon indigo">
            <TrendingUp size={24} />
          </div>
          <div className="card-content">
            <div className="card-value">{totalSalesCount}</div>
            <div className="card-label">Total Items Sold</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon green">
            <ShoppingCart size={24} />
          </div>
          <div className="card-content">
            <div className="card-value">{totalPurchasesCount}</div>
            <div className="card-label">Items Purchased</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon orange">
            <Activity size={24} />
          </div>
          <div className="card-content">
            <div className="card-value">{sales.length}</div>
            <div className="card-label">Sales Transactions</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon red">
            <Package size={24} />
          </div>
          <div className="card-content">
            <div className="card-value">{purchases.length}</div>
            <div className="card-label">Purchase Orders</div>
          </div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card large" style={{ flex: 2 }}>
          <h3 className="section-title">Sales vs Purchases Trend</h3>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
              <RechartsTooltip
                contentStyle={{
                  background: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Area type="monotone" dataKey="sales" name="Items Sold" stroke="#4F46E5" fillOpacity={1} fill="url(#colorSales)" />
              <Area type="monotone" dataKey="purchases" name="Items Purchased" stroke="#10B981" fillOpacity={1} fill="url(#colorPurchases)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card" style={{ flex: 1 }}>
          <h3 className="section-title">Top Selling Items</h3>
          <div className="chart-wrapper">
            {bestSellingProducts().length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={bestSellingProducts()}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {bestSellingProducts().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">Not enough data to display top products</div>
            )}
          </div>
        </div>
      </div>

      <div className="tables-row" style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div className="recent-card card" style={{ flex: 1 }}>
          <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} color="#4F46E5" /> Recent Sales
          </h3>
          <div className="table-container small-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>QTY</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {sales.slice(-5).reverse().map((s, i) => (
                  <tr key={i}>
                    <td className="font-medium text-gray-900">{getProductName(s.productId)}</td>
                    <td>{s.quantity}</td>
                    <td className="text-gray-500">{new Date(s.date || s.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr><td colSpan="3" className="text-center text-gray-500 py-4">No recent sales</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="recent-card card" style={{ flex: 1 }}>
          <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={20} color="#10B981" /> Recent Purchases
          </h3>
          <div className="table-container small-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Items</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {purchases.slice(-5).reverse().map((p, i) => (
                  <tr key={i}>
                    <td className="font-medium text-gray-900">{p.supplier || 'Unknown'}</td>
                    <td>{p.products.length} types</td>
                    <td className="text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {purchases.length === 0 && (
                  <tr><td colSpan="3" className="text-center text-gray-500 py-4">No recent purchases</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard-header {
           margin-bottom: 2rem;
        }
        .subtitle {
           color: #6B7280;
           font-size: 0.95rem;
           margin-top: 0.25rem;
        }
        .loading-container {
           display: flex;
           flex-direction: column;
           align-items: center;
           justify-content: center;
           height: 400px;
        }
        .spinner {
           border: 4px solid rgba(0, 0, 0, 0.1);
           border-top-color: #4F46E5;
           border-radius: 50%;
           width: 40px;
           height: 40px;
           animation: spin 1s linear infinite;
           margin-bottom: 1rem;
        }
        @keyframes spin {
           0% { transform: rotate(0deg); }
           100% { transform: rotate(360deg); }
        }
        .tables-row {
           display: flex;
        }
        .recent-card {
           background: white;
           border-radius: 12px;
           padding: 1.5rem;
           box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        }
        .data-table {
           width: 100%;
           border-collapse: collapse;
        }
        .data-table th, .data-table td {
           padding: 0.75rem 1rem;
           text-align: left;
           border-bottom: 1px solid #F3F4F6;
        }
        .data-table th {
           font-size: 0.75rem;
           font-weight: 600;
           text-transform: uppercase;
           color: #6B7280;
           background-color: #F9FAFB;
        }
        .font-medium { font-weight: 500; }
        .text-gray-900 { color: #111827; }
        .text-gray-500 { color: #6B7280; }
        .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
        .text-center { text-align: center; }
      `}</style>
    </div>
  );
}

export default Dashboard;
