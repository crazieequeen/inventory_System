import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAPI } from '../hooks/useAPI';

const StockContext = createContext();

export const useStock = () => {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error('useStock must be used within StockProvider');
  }
  return context;
};

export const StockProvider = ({ children }) => {
  const { getStockLevels } = useAPI();
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Load stock data
  const refreshStock = async () => {
    setLoading(true);
    try {
      const result = await getStockLevels();
      if (result.success) {
        setStockData(result.data);
        setLastUpdate(Date.now());
      }
    } catch (error) {
      console.error('Error loading stock:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load stock on mount
  useEffect(() => {
    refreshStock();
  }, []);

  // Trigger refresh from any component
  const triggerStockUpdate = () => {
    refreshStock();
  };

  const value = {
    stockData,
    loading,
    lastUpdate,
    refreshStock,
    triggerStockUpdate
  };

  return (
    <StockContext.Provider value={value}>
      {children}
    </StockContext.Provider>
  );
};
