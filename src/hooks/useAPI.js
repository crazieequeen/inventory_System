import { useState } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Custom hook for making API calls to the backend
 * Handles loading states, errors, and provides a simple interface
 */
export const useAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Make an API call
   * @param {string} endpoint - API endpoint (e.g., '/sales/entry')
   * @param {object} options - Fetch options (method, body, headers, etc.)
   * @returns {Promise} - Response data
   */
  const apiCall = async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'API request failed');
      }

      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  /**
   * Add a sales entry
   */
  const addSalesEntry = async (productId, quantity, date = null) => {
    return apiCall('/sales/entry', {
      method: 'POST',
      body: JSON.stringify({
        productId,
        quantity,
        date: date || new Date().toISOString().split('T')[0]
      })
    });
  };

  /**
   * Get sales history
   */
  const getSalesHistory = async () => {
    return apiCall('/sales/history');
  };

  /**
   * Get sales for a specific product
   */
  const getSalesByProduct = async (productId) => {
    return apiCall(`/sales/product/${productId}`);
  };

  /**
   * Get aggregated sales data
   */
  const getAggregatedSales = async () => {
    return apiCall('/sales/aggregated');
  };

  /**
   * Get stock levels
   */
  const getStockLevels = async () => {
    return apiCall('/sales/stock');
  };

  /**
   * Get stock for specific product
   */
  const getProductStock = async (productId) => {
    return apiCall(`/sales/stock/${productId}`);
  };

  /**
   * Add purchase (from e-bill upload)
   */
  const addPurchase = async (products, supplier, deliveryDate = null) => {
    return apiCall('/sales/purchase', {
      method: 'POST',
      body: JSON.stringify({
        products,
        supplier,
        deliveryDate: deliveryDate || new Date().toISOString().split('T')[0]
      })
    });
  };

  /**
   * Get purchase history
   */
  const getPurchaseHistory = async () => {
    return apiCall('/sales/purchases');
  };

  /**
   * Get sales forecast for a product
   */
  const getForecast = async (productId, days = 7) => {
    return apiCall('/predictions/forecast', {
      method: 'POST',
      body: JSON.stringify({ productId, days })
    });
  };

  /**
   * Predict stock-out for a product (uses real stock if not provided)
   */
  const predictStockout = async (productId, currentStock = null) => {
    const body = { productId };
    if (currentStock !== null) {
      body.currentStock = currentStock;
    }
    
    return apiCall('/predictions/stockout', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  };

  /**
   * Get predictions for all products
   */
  const getAllPredictions = async () => {
    return apiCall('/predictions/all-products');
  };

  /**
   * Check backend health
   */
  const checkHealth = async () => {
    return apiCall('/health');
  };

  return {
    // Generic API call
    apiCall,
    
    // Sales methods
    addSalesEntry,
    getSalesHistory,
    getSalesByProduct,
    getAggregatedSales,
    
    // Stock methods
    getStockLevels,
    getProductStock,
    addPurchase,
    getPurchaseHistory,
    
    // Prediction methods
    getForecast,
    predictStockout,
    getAllPredictions,
    
    // Health check
    checkHealth,
    
    // State
    loading,
    error
  };
};
