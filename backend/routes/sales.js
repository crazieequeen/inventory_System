const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

// Add manual sales entry
router.post('/entry', salesController.addSalesEntry);

// Get all sales history
router.get('/history', salesController.getSalesHistory);

// Get sales for specific product
router.get('/product/:productId', salesController.getSalesByProduct);

// Get sales by date range
router.get('/range', salesController.getSalesByDateRange);

// Get aggregated sales data
router.get('/aggregated', salesController.getAggregatedSales);

// Get all shop products
router.get('/products', salesController.getShopProducts);

// Get stock levels
router.get('/stock', salesController.getStockLevels);

// Get stock for specific product
router.get('/stock/:productId', salesController.getProductStock);

// Add purchase (from e-bill upload)
router.post('/purchase', salesController.addPurchase);

// Get purchase history
router.get('/purchases', salesController.getPurchaseHistory);

// Clear all sales (for testing only)
router.delete('/clear', salesController.clearAllSales);

// Clear all data including stock (for testing only)
router.delete('/reset', salesController.clearAllData);

module.exports = router;
