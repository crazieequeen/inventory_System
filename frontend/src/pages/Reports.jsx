import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, ShoppingCart, Download, Eye, X, Calendar } from 'lucide-react';
import { useAPI } from '../hooks/useAPI';
import { useSettings } from '../context/SettingsContext';

function Reports() {
  const { getSalesHistory, getPurchaseHistory, getStockLevels } = useAPI();
  const { formatCurrency } = useSettings();

  // Date filtering states
  const [startDate, setStartDate] = useState('2026-03-15');
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [downloading, setDownloading] = useState(null);

  // Modal states
  const [viewModal, setViewModal] = useState({ isOpen: false, title: '', content: null, isInventory: false });
  const [inventoryPrices, setInventoryPrices] = useState({});

  useEffect(() => {
    // Pre-fetch prices secretly for Sales mapping
    getStockLevels().then(res => {
      if (res.success && res.data) {
        const prices = {};
        res.data.forEach(p => { prices[p.productId] = p.price || 0; });
        setInventoryPrices(prices);
      }
    });
  }, []);

  // Filter helper logic
  const isDateInRange = (dateString) => {
    const d = new Date(dateString);
    d.setHours(0, 0, 0, 0);
    const s = new Date(startDate);
    s.setHours(0, 0, 0, 0);
    const e = new Date(endDate);
    e.setHours(23, 59, 59, 999);
    return d >= s && d <= e;
  };

  const getFilteredSales = async () => {
    const res = await getSalesHistory();
    if (!res.success || !res.data) throw new Error('Failed to fetch sales');
    return res.data.filter(s => isDateInRange(s.date || s.createdAt));
  };

  const getFilteredPurchases = async () => {
    const res = await getPurchaseHistory();
    if (!res.success || !res.data) throw new Error('Failed to fetch purchases');
    return res.data.filter(p => isDateInRange(p.createdAt));
  };

  const generateReportGroup = (data, type) => {
    if (type === 'inventory') {
      return data.map(item => ({
        productName: item.productName,
        category: item.category || 'General',
        currentStock: item.currentStock,
        price: item.price > 0 ? formatCurrency(item.price) : 'N/A'
      }));
    }

    const grouped = {};
    if (type === 'sales') {
      data.forEach(sale => {
        const d = new Date(sale.date || sale.createdAt).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
        if (!grouped[d]) grouped[d] = [];

        const unitPrice = inventoryPrices[sale.productId] || 0;
        const totalRevenue = unitPrice * sale.quantity;

        grouped[d].push({
          name: sale.productName || 'Unknown Product',
          category: sale.category || 'General',
          quantity: sale.quantity,
          isDeduction: true,
          price: totalRevenue > 0 ? formatCurrency(totalRevenue) : 'Free/Missing'
        });
      });
    } else if (type === 'purchases') {
      data.forEach(purchase => {
        const d = new Date(purchase.createdAt).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
        if (!grouped[d]) grouped[d] = [];
        purchase.products.forEach(item => {
          grouped[d].push({
            name: item.name,
            source: purchase.supplier || purchase._id,
            quantity: item.quantity,
            isDeduction: false,
            price: item.price > 0 ? formatCurrency(item.price) : 'Missing'
          });
        });
      });
    }
    return grouped;
  };

  const buildHTMLString = (title, groupedData, isInventory) => {
    let bodyContent = '';
    if (isInventory) {
      bodyContent = `
        <table>
          <thead><tr><th>Product Name</th><th>Category</th><th>Current Stock</th><th>Estimated Price</th></tr></thead>
          <tbody>
            ${groupedData.map(item => `
              <tr>
                <td><strong>${item.productName}</strong></td>
                <td><span class="badge">${item.category}</span></td>
                <td>${item.currentStock} Units</td>
                <td>${item.price}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      const sortedKeys = Object.keys(groupedData).sort((a, b) => new Date(b) - new Date(a));
      sortedKeys.forEach(dateKey => {
        bodyContent += `
          <div class="date-header">📅 Transactions for ${dateKey}</div>
          <table>
            <thead><tr>
              <th>Product / Item</th>
              <th>Category / Source</th>
              <th>Volume / Quantity</th>
              <th>Price Details</th>
            </tr></thead>
            <tbody>
              ${groupedData[dateKey].map(row => `
                <tr>
                  <td><strong>${row.name}</strong></td>
                  <td><span class="badge">${row.category || row.source}</span></td>
                  <td><span style="color:${row.isDeduction ? '#ef4444' : '#10b981'};font-weight:bold;">${row.isDeduction ? '−' : '+'} ${row.quantity} Units</span></td>
                  <td>${row.price}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      });
    }

    return `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #1f2937; background: #f9fafb; margin:0; }
            .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            h1 { color: #4F46E5; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px; margin-top: 0; font-size: 28px; }
            .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 30px; font-weight: 500; }
            .date-header { background: #EEF2FF; color: #4338CA; padding: 12px 18px; border-radius: 6px; font-weight: 700; font-size: 16px; margin-top: 35px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 10px; }
            th { text-align: left; padding: 12px 18px; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e5e7eb; }
            td { padding: 14px 18px; border-bottom: 1px solid #f3f4f6; font-size: 14px; vertical-align: middle; }
            tr:last-child td { border-bottom: none; }
            .badge { background: #f3f4f6; color: #4b5563; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
            .footer { margin-top: 50px; text-align: center; color: #9ca3af; font-size: 13px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📄 ${title}</h1>
            <div class="subtitle">Filtered: ${startDate} to ${endDate}</div>
            ${(!isInventory && Object.keys(groupedData).length === 0) ? '<p style="text-align:center;color:#9ca3af;padding:40px;">No records available in this date range.</p>' : bodyContent}
            <div class="footer">Confidential Internal Business Ledger</div>
          </div>
        </body>
      </html>
    `;
  };

  const handleAction = async (type, mode) => {
    // Mode is 'view' or 'download'
    setDownloading(type);
    try {
      let title, groupedData, isInventory = false;

      if (type === 'sales') {
        const raw = await getFilteredSales();
        groupedData = generateReportGroup(raw, 'sales');
        title = 'Sales Ledger History';
      } else if (type === 'purchases') {
        const raw = await getFilteredPurchases();
        groupedData = generateReportGroup(raw, 'purchases');
        title = 'Restock & Vendor Ledgers';
      } else if (type === 'inventory') {
        const res = await getStockLevels();
        if (!res.success || !res.data) throw new Error('Failed to fetch inventory');
        groupedData = generateReportGroup(res.data, 'inventory');
        title = 'Raw Stock Valuation';
        isInventory = true;
      }

      if (mode === 'download') {
        const htmlString = buildHTMLString(title, groupedData, isInventory);
        const blob = new Blob([htmlString], { type: 'text/html;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title.replace(/ /g, '_')}_${startDate}_to_${endDate}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else if (mode === 'view') {
        setViewModal({ isOpen: true, title, content: groupedData, isInventory });
      }

    } catch (e) {
      alert("Error compiling report: " + e.message);
    }
    setDownloading(null);
  };

  const renderModalContent = () => {
    const { title, content, isInventory } = viewModal;
    if (!content) return null;

    if (isInventory) {
      return (
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead style={{ background: '#f9fafb' }}><tr><th style={{ padding: '12px' }}>Product Name</th><th>Category</th><th>Current Stock</th><th>Estimated Price</th></tr></thead>
          <tbody>
            {content.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px', fontWeight: '600' }}>{item.productName}</td>
                <td><span className="category-badge">{item.category}</span></td>
                <td>{item.currentStock} Units</td>
                <td>{item.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    const sortedKeys = Object.keys(content).sort((a, b) => new Date(b) - new Date(a));
    if (sortedKeys.length === 0) {
      return <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No records exactly matched this date range!</div>;
    }

    return sortedKeys.map(dateKey => (
      <div key={dateKey} style={{ marginBottom: '30px' }}>
        <div style={{ background: '#EEF2FF', color: '#4338CA', padding: '10px 15px', borderRadius: '6px', fontWeight: 'bold', marginBottom: '10px' }}>
          📅 Transactions for {dateKey}
        </div>
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
            <th style={{ paddingBottom: '8px', color: '#6b7280' }}>Product / Item</th>
            <th style={{ paddingBottom: '8px', color: '#6b7280' }}>Category / Source</th>
            <th style={{ paddingBottom: '8px', color: '#6b7280' }}>Volume / Quantity</th>
            <th style={{ paddingBottom: '8px', color: '#6b7280' }}>Total Value</th>
          </tr></thead>
          <tbody>
            {content[dateKey].map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 0', fontWeight: '600' }}>{row.name}</td>
                <td><span className="category-badge">{row.category || row.source}</span></td>
                <td style={{ color: row.isDeduction ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                  {row.isDeduction ? '−' : '+'} {row.quantity} Units
                </td>
                <td style={{ fontWeight: '500' }}>{row.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ));
  };

  return (
    <div className="reports" style={{ position: 'relative' }}>
      <h1 className="page-title">Reports & Extraction Dashboard</h1>
      <p style={{ color: '#6B7280', marginBottom: '25px' }}>Filter your offline extraction data ranges intelligently down to the exact specific days you need.</p>

      {/* GLOBAL DATE FILTER BAR */}
      <div className="card" style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '30px', background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '15px 25px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={20} color="#4F46E5" />
          <strong style={{ color: '#374151', fontSize: '15px' }}>Report Timeframe Scope:</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
          />
        </div>
      </div>

      <div className="reports-grid">

        {/* SALES CARD */}
        <div className="report-card">
          <div className="report-icon-wrapper green">
            <TrendingUp size={28} />
          </div>
          <h3 className="report-title">Sales Performance Ledger</h3>
          <p className="report-description">A beautiful daily-categorized summary of all completed sales and deducted stock items.</p>
          <div className="report-footer" style={{ gap: '10px', marginTop: 'auto' }}>
            <button className="download-btn" onClick={() => handleAction('sales', 'view')} disabled={downloading === 'sales'} style={{ flex: 1, padding: '12px 0', background: '#10B981', display: 'flex', justifyContent: 'center' }}>
              <Eye size={16} /> View
            </button>
            <button className="download-btn" onClick={() => handleAction('sales', 'download')} disabled={downloading === 'sales'} style={{ flex: 1, padding: '12px 0', background: '#4F46E5', display: 'flex', justifyContent: 'center' }}>
              <Download size={14} /> Save File
            </button>
          </div>
        </div>

        {/* PURCHASES CARD */}
        <div className="report-card">
          <div className="report-icon-wrapper purple">
            <ShoppingCart size={28} />
          </div>
          <h3 className="report-title">Purchase History Ledger</h3>
          <p className="report-description">A beautiful daily-categorized ledger of every product safely restocked via vendor bills.</p>
          <div className="report-footer" style={{ gap: '10px', marginTop: 'auto' }}>
            <button className="download-btn" onClick={() => handleAction('purchases', 'view')} disabled={downloading === 'purchases'} style={{ flex: 1, padding: '12px 0', background: '#8B5CF6', display: 'flex', justifyContent: 'center' }}>
              <Eye size={16} /> View
            </button>
            <button className="download-btn" onClick={() => handleAction('purchases', 'download')} disabled={downloading === 'purchases'} style={{ flex: 1, padding: '12px 0', background: '#4F46E5', display: 'flex', justifyContent: 'center' }}>
              <Download size={14} /> Save File
            </button>
          </div>
        </div>

        {/* INVENTORY CARD */}
        <div className="report-card">
          <div className="report-icon-wrapper blue">
            <Package size={28} />
          </div>
          <h3 className="report-title">Inventory Summary</h3>
          <p className="report-description">Complete active overview of your current accessible stock levels natively mapped.</p>
          <div className="report-footer" style={{ gap: '10px', marginTop: 'auto' }}>
            <button className="download-btn" onClick={() => handleAction('inventory', 'view')} disabled={downloading === 'inventory'} style={{ flex: 1, padding: '12px 0', background: '#3B82F6', display: 'flex', justifyContent: 'center' }}>
              <Eye size={16} /> View
            </button>
            <button className="download-btn" onClick={() => handleAction('inventory', 'download')} disabled={downloading === 'inventory'} style={{ flex: 1, padding: '12px 0', background: '#4F46E5', display: 'flex', justifyContent: 'center' }}>
              <Download size={14} /> Save File
            </button>
          </div>
        </div>

      </div>

      {/* FULLSCREEN VIEW MODAL */}
      {viewModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '900px', maxHeight: '90vh', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>

            <div style={{ padding: '20px 25px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
              <div>
                <h2 style={{ margin: 0, color: '#111827', fontSize: '20px' }}>📄 {viewModal.title}</h2>
                <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>Date Range Applied: {startDate} to {endDate}</div>
              </div>
              <button
                onClick={() => setViewModal({ ...viewModal, isOpen: false })}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '8px', borderRadius: '8px' }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '30px 25px', overflowY: 'auto', flex: 1, background: 'white' }}>
              {renderModalContent()}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;
