const salesData = require('../models/salesDataDB');

// Add manual sales entry
const addSalesEntry = async (req, res) => {
  try {
    const { productId, quantity, date } = req.body;

    // Validation
    if (!productId || !quantity) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'productId and quantity are required'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        error: 'Invalid quantity',
        message: 'Quantity must be greater than 0'
      });
    }

    // Use MongoDB function from salesDataDB
    const entry = await salesData.addSalesEntry(productId, quantity, date);

    res.status(201).json({
      success: true,
      message: 'Sales entry added successfully. Stock updated.',
      data: entry
    });
  } catch (error) {
    console.error('Error adding sales entry:', error);
    res.status(500).json({
      error: 'Failed to add sales entry',
      message: error.message
    });
  }
};

// Get all sales history
const getSalesHistory = async (req, res) => {
  try {
    const history = await salesData.getAllSales();

    res.json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    console.error('Error fetching sales history:', error);
    res.status(500).json({
      error: 'Failed to fetch sales history',
      message: error.message
    });
  }
};

// Get sales for specific product
const getSalesByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const sales = await salesData.getSalesByProduct(productId);

    res.json({
      success: true,
      productId,
      count: sales.length,
      data: sales
    });
  } catch (error) {
    console.error('Error fetching product sales:', error);
    res.status(500).json({
      error: 'Failed to fetch product sales',
      message: error.message
    });
  }
};

// Get sales by date range
const getSalesByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing parameters',
        message: 'startDate and endDate are required'
      });
    }

    const sales = await salesData.getSalesByDateRange(startDate, endDate);

    res.json({
      success: true,
      startDate,
      endDate,
      count: sales.length,
      data: sales
    });
  } catch (error) {
    console.error('Error fetching sales by date range:', error);
    res.status(500).json({
      error: 'Failed to fetch sales by date range',
      message: error.message
    });
  }
};

// Get aggregated sales data
const getAggregatedSales = async (req, res) => {
  try {
    const { days } = req.query;

    let aggregated;
    if (days) {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      // Format dates as YYYY-MM-DD strings for comparison
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      console.log(`📅 Filtering sales from ${startDateStr} to ${endDateStr}`);

      // Get sales in date range and aggregate by product
      const sales = await salesData.getSalesByDateRange(startDateStr, endDateStr);

      console.log(`📊 Found ${sales.length} sales in date range`);

      // Aggregate by productId
      const productMap = {};
      sales.forEach(sale => {
        if (!productMap[sale.productId]) {
          productMap[sale.productId] = {
            productId: sale.productId,
            totalQuantity: 0
          };
        }
        productMap[sale.productId].totalQuantity += sale.quantity;
      });

      aggregated = Object.values(productMap);
      console.log(`📈 Aggregated into ${aggregated.length} products`);
    } else {
      // Get all-time aggregated sales
      aggregated = await salesData.getAggregatedSales();
    }

    res.json({
      success: true,
      count: aggregated.length,
      data: aggregated
    });
  } catch (error) {
    console.error('Error fetching aggregated sales:', error);
    res.status(500).json({
      error: 'Failed to fetch aggregated sales',
      message: error.message
    });
  }
};

// Get all shop products
const getShopProducts = async (req, res) => {
  try {
    const products = salesData.getShopProducts();

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error fetching shop products:', error);
    res.status(500).json({
      error: 'Failed to fetch shop products',
      message: error.message
    });
  }
};

// Get stock levels
const getStockLevels = async (req, res) => {
  try {
    // Fetch from MongoDB Product model instead of in-memory
    const Product = require('../models/Product');
    const products = await Product.find({});

    const stock = products.map(p => ({
      productId: p.productId,
      productName: p.name,
      currentStock: p.currentStock,
      price: p.price || 0,
      category: p.category,
      lastUpdated: p.lastUpdated
    }));

    res.json({
      success: true,
      count: stock.length,
      data: stock
    });
  } catch (error) {
    console.error('Error fetching stock levels:', error);
    res.status(500).json({
      error: 'Failed to fetch stock levels',
      message: error.message
    });
  }
};

// Get stock for specific product
const getProductStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const stock = await salesData.getProductStock(productId);

    if (!stock) {
      return res.status(404).json({
        error: 'Product not found',
        message: `No stock information for product ${productId}`
      });
    }

    res.json({
      success: true,
      data: stock
    });
  } catch (error) {
    console.error('Error fetching product stock:', error);
    res.status(500).json({
      error: 'Failed to fetch product stock',
      message: error.message
    });
  }
};

// Add purchase (from e-bill upload)
const addPurchase = async (req, res) => {
  try {
    const { products, supplier, deliveryDate } = req.body;

    console.log('📦 Received purchase request:', { products, supplier, deliveryDate });

    // Validation
    if (!products || !Array.isArray(products) || products.length === 0) {
      console.log('❌ Validation failed: products missing or invalid');
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'products array is required'
      });
    }

    // AWAIT the async function
    const purchase = await salesData.addPurchase(products, supplier, deliveryDate);

    console.log('✅ Purchase added successfully:', purchase);

    res.status(201).json({
      success: true,
      message: 'Purchase added successfully. Stock updated.',
      data: purchase
    });
  } catch (error) {
    console.error('❌ Error adding purchase:', error);
    res.status(500).json({
      error: 'Failed to add purchase',
      message: error.message
    });
  }
};

// Get purchase history
const getPurchaseHistory = async (req, res) => {
  try {
    const history = await salesData.getPurchaseHistory();

    res.json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    console.error('Error fetching purchase history:', error);
    res.status(500).json({
      error: 'Failed to fetch purchase history',
      message: error.message
    });
  }
};

// Clear all sales (for testing only)
const clearAllSales = async (req, res) => {
  try {
    await salesData.clearAllSales();

    res.json({
      success: true,
      message: 'All sales data cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing sales data:', error);
    res.status(500).json({
      error: 'Failed to clear sales data',
      message: error.message
    });
  }
};

// Clear all data including stock (for testing only)
const clearAllData = async (req, res) => {
  try {
    await salesData.clearAllData();

    res.json({
      success: true,
      message: 'All data cleared. Stock reset to 0.'
    });
  } catch (error) {
    console.error('Error clearing all data:', error);
    res.status(500).json({
      error: 'Failed to clear all data',
      message: error.message
    });
  }
};

module.exports = {
  addSalesEntry,
  getSalesHistory,
  getSalesByProduct,
  getSalesByDateRange,
  getAggregatedSales,
  getShopProducts,
  getStockLevels,
  getProductStock,
  addPurchase,
  getPurchaseHistory,
  clearAllSales,
  clearAllData
};
