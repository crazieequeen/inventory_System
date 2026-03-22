const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/predictionController');

// Get sales forecast for a product
router.post('/forecast', predictionController.getForecast);

// Predict stock-out days
router.post('/stockout', predictionController.predictStockout);

// Get predictions for all products
router.get('/all-products', predictionController.getAllProductsPredictions);

module.exports = router;
