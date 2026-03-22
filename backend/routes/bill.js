const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const billController = require('../controllers/billController');

// Upload bill and extract data (preview only)
router.post('/upload', upload.single('bill'), billController.uploadBill);

// Confirm and update stock
router.post('/confirm', billController.confirmStockUpdate);

module.exports = router;
