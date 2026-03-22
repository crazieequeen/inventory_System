import React, { useState, useEffect } from 'react';
import { getShopProducts } from '../utils/shopProducts';
import { useAPI } from '../hooks/useAPI';

function StockRequirements() {
  const { getAggregatedSales, predictStockout, getStockLevels, loading } = useAPI();
  const [allPredictions, setAllPredictions] = useState([]);
  const [targetDays, setTargetDays] = useState(7);
  const [error, setError] = useState(null);

  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // Intentionally empty: The user explicitly wants to trigger Grok API manually to save compute/rate-limits.
  useEffect(() => {
  }, []);

  const loadStockRequirements = async () => {
    try {
      setError(null);

      // Get real stock levels
      const stockResult = await getStockLevels();

      if (!stockResult.success || stockResult.data.length === 0) {
        setError('No stock data available. Upload e-bills to add stock first.');
        return;
      }

      // Get aggregated sales data
      const salesResult = await getAggregatedSales();

      if (!salesResult.success || salesResult.data.length === 0) {
        setError('No sales data available. Add sales entries in Shop Inventory to see predictions.');
        return;
      }

      const predictions = [];

      // Get predictions for each product with stock
      for (const stockItem of stockResult.data) {
        // Only predict for products with stock > 0
        if (stockItem.currentStock > 0) {
          try {
            // Use real stock from inventory
            const prediction = await predictStockout(stockItem.productId);

            if (prediction.success && prediction.data) {
              predictions.push({
                id: stockItem.productId,
                name: stockItem.productName,
                currentStock: stockItem.currentStock,
                avgDailySales: prediction.data.averageDailySales,
                daysRemaining: prediction.data.daysUntilStockout,
                recommended: prediction.data.recommendedReorderQuantity,
                status: prediction.data.status,
                stockoutDate: prediction.data.stockoutDate
              });
            }
          } catch (err) {
            console.error(`Error predicting for ${stockItem.productId}:`, err);
          }
        }
      }

      if (predictions.length === 0) {
        setError('No predictions available. Make sure you have both stock and sales data.');
        return;
      }

      // Sort by urgency before saving to state
      predictions.sort((a, b) => a.daysRemaining - b.daysRemaining);

      setAllPredictions(predictions);
      setHasAnalyzed(true);

    } catch (err) {
      console.error('Error loading stock requirements:', err);
      setError('Failed to load predictions. Make sure backend is running.');
    }
  };

  // Dynamically compute categorizations based on User Target Days
  const processedItems = allPredictions.map(item => {
    const needed = Math.max(0, Math.ceil(targetDays * item.avgDailySales) - item.currentStock);
    const isFastSelling = item.avgDailySales > 0 && item.daysRemaining < targetDays;

    return {
      ...item,
      neededToBuy: needed,
      isFastSelling
    };
  });

  const restockItems = processedItems.filter(p => p.isFastSelling);
  const safeItems = processedItems.filter(p => !p.isFastSelling);
  return (
    <div className="stock-requirements">
      <div className="page-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Stock Requirements Planner</h1>
          <p style={{ color: '#6B7280', marginTop: '5px' }}>Plan your re-orders based on AI predicted sales</p>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div className="target-days-input" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label htmlFor="targetDays" style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Target Stock Coverage (Days):
            </label>
            <input
              type="number"
              id="targetDays"
              value={targetDays}
              onChange={(e) => setTargetDays(Number(e.target.value) || 0)}
              style={{ width: '120px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '16px' }}
              min="1"
            />
          </div>
          <button onClick={loadStockRequirements} className="btn-primary" disabled={loading} style={{ height: '42px', marginTop: '24px' }}>
            {loading ? 'Analyzing...' : '🔄 Refresh Data'}
          </button>
        </div>
      </div>

      {
        loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Analyzing sales velocity and predicting stockouts...</p>
          </div>
        )
      }

      {
        error && (
          <div className="alert alert-warning">
            <strong>⚠️ {error}</strong>
            <p>Go to Shop Inventory and add some sales data first.</p>
          </div>
        )
      }

      {
        !loading && !error && !hasAnalyzed && (
          <div className="alert alert-info">
            <strong>🤖 AI Prediction Engine Ready</strong>
            <p>Click "Refresh Data" to send your sales metrics to the Groq AI to generate stockout predictions.</p>
          </div>
        )
      }

      {
        !loading && !error && hasAnalyzed && restockItems.length === 0 && allPredictions.length > 0 && (
          <div className="alert alert-info">
            <strong>ℹ️ Excellent! All products have sufficient stock!</strong>
            <p>Based on your current sales average, everything will comfortably last for at least {targetDays} days.</p>
          </div>
        )
      }

      {
        restockItems.length > 0 && (
          <div className="requirements-section">
            <div className="card" style={{ borderTop: '4px solid #EF4444' }}>
              <h2 className="section-title">🚨 Fast-Selling Items to Buy Again</h2>
              <p style={{ color: '#6B7280', marginBottom: '15px' }}>These items will run out before your target of {targetDays} days.</p>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Current Stock</th>
                      <th>Average 1 Day Sale</th>
                      <th>Max Time It Can Last</th>
                      <th>Suggested Quantity to Buy</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restockItems.map(item => (
                      <tr key={item.id}>
                        <td className="product-name" style={{ fontWeight: '600' }}>{item.name}</td>
                        <td className="stock-value">{item.currentStock}</td>
                        <td>{item.avgDailySales} units/day</td>
                        <td>
                          <div className="days-remaining" style={{ color: '#EF4444', fontWeight: 'bold' }}>
                            {item.daysRemaining} days (Est. {item.stockoutDate})
                          </div>
                        </td>
                        <td>
                          <div style={{ background: '#EEF2FF', color: '#4F46E5', padding: '6px 12px', borderRadius: '4px', display: 'inline-block', fontWeight: 'bold' }}>
                            Buy {item.neededToBuy} units
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge critical`} style={{ background: '#FEE2E2', color: '#991B1B', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                            🔥 Fast Selling
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}

export default StockRequirements;
