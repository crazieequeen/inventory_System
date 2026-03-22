// MongoDB-based data operations
const Product = require('./Product');
const Sale = require('./Sale');
const Purchase = require('./Purchase');

// Shop products (master list)
const shopProducts = [
  { id: 'P001', name: 'Fresh Milk 1L', category: 'Dairy' },
  { id: 'P002', name: 'White Bread', category: 'Bakery' },
  { id: 'P003', name: 'Eggs (Dozen)', category: 'Dairy' },
  { id: 'P004', name: 'Orange Juice 1L', category: 'Beverages' },
  { id: 'P005', name: 'Butter 250g', category: 'Dairy' },
  { id: 'P006', name: 'Chicken Breast 1kg', category: 'Meat' },
  { id: 'P007', name: 'Rice 5kg', category: 'Grains' },
  { id: 'P008', name: 'Tomatoes 1kg', category: 'Vegetables' },
  { id: 'P009', name: 'Cooking Oil 1L', category: 'Pantry' },
  { id: 'P010', name: 'Sugar 1kg', category: 'Pantry' }
];

// Initialize products in database
const initializeProducts = async () => {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      console.log('📦 Initializing products in database...');
      for (const product of shopProducts) {
        await Product.create({
          productId: product.id,
          name: product.name,
          category: product.category,
          currentStock: 0
        });
      }
      console.log('✅ Products initialized');
    }
  } catch (error) {
    console.error('Error initializing products:', error);
  }
};

// Add purchase (from e-bill upload) - INCREASES stock
const addPurchase = async (products, supplier, deliveryDate) => {
  console.log('🔵 addPurchase called with:', { products, supplier, deliveryDate });
  
  try {
    // Create purchase record
    const purchase = await Purchase.create({
      products: products.map(p => ({
        productId: p.productId,
        productName: shopProducts.find(sp => sp.id === p.productId)?.name,
        quantity: parseInt(p.quantity)
      })),
      supplier,
      deliveryDate: deliveryDate || new Date().toISOString().split('T')[0]
    });

    // Update stock for each product
    for (const item of products) {
      const product = await Product.findOne({ productId: item.productId });
      
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      const oldStock = product.currentStock;
      product.currentStock += parseInt(item.quantity);
      product.lastUpdated = new Date();
      await product.save();

      console.log(`📊 ${product.name}: ${oldStock} + ${item.quantity} = ${product.currentStock}`);
    }

    console.log('✅ Purchase complete');
    return purchase;
  } catch (error) {
    console.error('❌ Error in addPurchase:', error);
    throw error;
  }
};

// Add sales entry - DECREASES stock
const addSalesEntry = async (productId, quantity, date) => {
  try {
    const product = await Product.findOne({ productId });
    
    if (!product) {
      throw new Error('Product not found');
    }

    const qty = parseInt(quantity);

    // Check if enough stock available
    if (product.currentStock < qty) {
      throw new Error(`Insufficient stock. Available: ${product.currentStock}, Requested: ${qty}`);
    }

    // Create sale record
    const sale = await Sale.create({
      productId,
      productName: product.name,
      category: product.category,
      quantity: qty,
      date: date || new Date().toISOString().split('T')[0]
    });

    // DECREASE stock
    product.currentStock -= qty;
    product.lastUpdated = new Date();
    await product.save();

    console.log(`📉 ${product.name}: Stock reduced by ${qty}. New stock: ${product.currentStock}`);

    return sale;
  } catch (error) {
    console.error('❌ Error in addSalesEntry:', error);
    throw error;
  }
};

// Get all sales history
const getAllSales = async () => {
  try {
    return await Sale.find().sort({ createdAt: -1 });
  } catch (error) {
    console.error('Error getting sales:', error);
    throw error;
  }
};

// Get sales by product ID
const getSalesByProduct = async (productId) => {
  try {
    return await Sale.find({ productId }).sort({ date: -1 });
  } catch (error) {
    console.error('Error getting sales by product:', error);
    throw error;
  }
};

// Get sales by date range
const getSalesByDateRange = async (startDate, endDate) => {
  try {
    return await Sale.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });
  } catch (error) {
    console.error('Error getting sales by date range:', error);
    throw error;
  }
};

// Get aggregated sales by product
const getAggregatedSales = async () => {
  try {
    const sales = await Sale.aggregate([
      {
        $group: {
          _id: '$productId',
          productName: { $first: '$productName' },
          category: { $first: '$category' },
          totalQuantity: { $sum: '$quantity' },
          salesCount: { $sum: 1 },
          lastSaleDate: { $max: '$date' }
        }
      },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          productName: 1,
          category: 1,
          totalQuantity: 1,
          salesCount: 1,
          lastSaleDate: 1
        }
      }
    ]);
    
    return sales;
  } catch (error) {
    console.error('Error getting aggregated sales:', error);
    throw error;
  }
};

// Get current stock levels
const getStockLevels = async () => {
  try {
    return await Product.find().select('-_id -__v');
  } catch (error) {
    console.error('Error getting stock levels:', error);
    throw error;
  }
};

// Get stock for specific product
const getProductStock = async (productId) => {
  try {
    return await Product.findOne({ productId }).select('-_id -__v');
  } catch (error) {
    console.error('Error getting product stock:', error);
    throw error;
  }
};

// Get purchase history
const getPurchaseHistory = async () => {
  try {
    return await Purchase.find().sort({ createdAt: -1 });
  } catch (error) {
    console.error('Error getting purchase history:', error);
    throw error;
  }
};

// Get shop products
const getShopProducts = () => {
  return shopProducts;
};

// Clear all sales (for testing)
const clearAllSales = async () => {
  try {
    await Sale.deleteMany({});
    console.log('✅ All sales cleared');
  } catch (error) {
    console.error('Error clearing sales:', error);
    throw error;
  }
};

// Clear all data (for testing)
const clearAllData = async () => {
  try {
    await Sale.deleteMany({});
    await Purchase.deleteMany({});
    await Product.updateMany({}, { currentStock: 0, lastUpdated: new Date() });
    console.log('✅ All data cleared, stock reset to 0');
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
};

module.exports = {
  initializeProducts,
  addSalesEntry,
  addPurchase,
  getAllSales,
  getSalesByProduct,
  getSalesByDateRange,
  getAggregatedSales,
  getStockLevels,
  getProductStock,
  getPurchaseHistory,
  getShopProducts,
  clearAllSales,
  clearAllData
};
