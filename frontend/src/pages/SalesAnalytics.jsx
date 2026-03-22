import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

const weeklySales = [
  { week: 'Week 1', sales: 12400 },
  { week: 'Week 2', sales: 15800 },
  { week: 'Week 3', sales: 14200 },
  { week: 'Week 4', sales: 18600 }
];

const monthlyTrend = [
  { month: 'Aug', sales: 45000 },
  { month: 'Sep', sales: 52000 },
  { month: 'Oct', sales: 48000 },
  { month: 'Nov', sales: 58000 },
  { month: 'Dec', sales: 62000 },
  { month: 'Jan', sales: 61000 }
];

const topProducts = [
  { name: 'Fresh Milk 1L', sales: 1240, revenue: 3720, trend: 'up' },
  { name: 'White Bread', sales: 980, revenue: 2940, trend: 'up' },
  { name: 'Eggs (Dozen)', sales: 856, revenue: 4280, trend: 'up' },
  { name: 'Orange Juice 1L', sales: 720, revenue: 2880, trend: 'down' },
  { name: 'Chicken Breast', sales: 650, revenue: 5850, trend: 'up' }
];

const slowMoving = [
  { name: 'Canned Beans', sales: 45, daysInStock: 120 },
  { name: 'Pasta Sauce', sales: 62, daysInStock: 95 },
  { name: 'Rice 5kg', sales: 38, daysInStock: 110 }
];

function SalesAnalytics() {
  return (
    <div className="sales-analytics">
      <h1 className="page-title">Sales Analytics</h1>

      <div className="charts-grid">
        <div className="chart-card large">
          <h2 className="section-title">Weekly Sales Performance</h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={weeklySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="week" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  background: 'white', 
                  border: '1px solid #E5E7EB', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Bar dataKey="sales" fill="#4F46E5" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card large">
          <h2 className="section-title">Monthly Sales Trend</h2>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  background: 'white', 
                  border: '1px solid #E5E7EB', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Line type="monotone" dataKey="sales" stroke="#16A34A" strokeWidth={3} dot={{ fill: '#16A34A', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="products-grid">
        <div className="card">
          <h2 className="section-title">Top 5 Selling Products</h2>
          <div className="products-list">
            {topProducts.map((product, index) => (
              <div key={index} className="product-item">
                <div className="product-rank">{index + 1}</div>
                <div className="product-details">
                  <div className="product-name">{product.name}</div>
                  <div className="product-stats">
                    <span>{product.sales} units sold</span>
                    <span className="revenue">${product.revenue.toLocaleString()}</span>
                  </div>
                </div>
                <div className={`trend-indicator ${product.trend}`}>
                  {product.trend === 'up' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">Slow-Moving Products</h2>
          <div className="slow-moving-list">
            {slowMoving.map((product, index) => (
              <div key={index} className="slow-item">
                <div className="slow-info">
                  <div className="slow-name">{product.name}</div>
                  <div className="slow-stats">
                    <span className="sales-count">{product.sales} units/month</span>
                    <span className="days-stock">{product.daysInStock} days in stock</span>
                  </div>
                </div>
                <div className="warning-badge">
                  <TrendingDown size={16} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalesAnalytics;
