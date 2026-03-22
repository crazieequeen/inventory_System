const { extractText } = require('../services/textExtractor');
const { extractDataWithAI } = require('../services/aiExtractor');
const Product = require('../models/Product');

const MAX_STOCK_LIMIT = parseInt(process.env.MAX_STOCK_LIMIT) || 90;

/**
 * Upload and process bill
 */
const uploadBill = async (req, res) => {
  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'Please upload a PDF or image file'
      });
    }

    console.log('📤 File uploaded:', req.file.originalname);

    // Step 1: Extract text from file
    const extractedText = await extractText(req.file);

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No text found',
        message: 'Could not extract text from the uploaded file'
      });
    }

    console.log('📝 Extracted text length:', extractedText.length);

    // Step 2: Extract structured data using AI
    const aiData = await extractDataWithAI(extractedText);

    if (!aiData.items || aiData.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No products found',
        message: 'Could not find any products in the bill. Please try a clearer image.'
      });
    }

    console.log(`✅ Found ${aiData.items.length} products`);

    // Step 3: Return preview data (don't update stock yet)
    res.json({
      success: true,
      message: 'Bill processed successfully',
      data: {
        items: aiData.items,
        totalItems: aiData.items.length,
        totalQuantity: aiData.items.reduce((sum, item) => sum + item.quantity, 0)
      }
    });

  } catch (error) {
    console.error('❌ Bill upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Processing failed',
      message: error.message || 'Failed to process bill'
    });
  }
};

/**
 * Confirm and update stock
 */
const confirmStockUpdate = async (req, res) => {
  try {
    const { items } = req.body;

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data',
        message: 'Items array is required'
      });
    }

    console.log(`📦 Updating stock for ${items.length} items...`);
    console.log('📋 Items received:', JSON.stringify(items, null, 2));

    const results = [];
    const errors = [];

    // Process each item
    for (const item of items) {
      try {
        const { name, quantity, price } = item;

        if (!name || !quantity || quantity <= 0) {
          errors.push({ name, error: 'Invalid item data' });
          continue;
        }

        // Check if product with same name already exists
        let product = await Product.findOne({
          name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });

        let productId, productName, category;

        if (product) {
          // Product exists - use existing ID
          productId = product.productId;
          productName = product.name;
          category = product.category;
          console.log(`🔍 ✅ FOUND EXISTING: "${name}" [${productId}]`);
        } else {
          // New product - generate next sequential ID
          const allProducts = await Product.find({}).sort({ productId: 1 });
          let nextNumber = 1;

          if (allProducts.length > 0) {
            // Find the highest P### number
            const pNumbers = allProducts
              .map(p => p.productId.match(/^P(\d+)$/))
              .filter(match => match)
              .map(match => parseInt(match[1]));

            if (pNumbers.length > 0) {
              nextNumber = Math.max(...pNumbers) + 1;
            }
          }

          productId = `P${String(nextNumber).padStart(3, '0')}`;
          productName = name;

          // Smart category assignment based on product name
          const nameLower = name.toLowerCase();
          if (nameLower.includes('milk') || nameLower.includes('butter') || nameLower.includes('cheese') || nameLower.includes('yogurt')) {
            category = 'Dairy';
          } else if (nameLower.includes('bread') || nameLower.includes('bun') || nameLower.includes('cake') || nameLower.includes('pastry')) {
            category = 'Bakery';
          } else if (nameLower.includes('egg')) {
            category = 'Dairy';
          } else if (nameLower.includes('juice') || nameLower.includes('soda') || nameLower.includes('water') || nameLower.includes('drink')) {
            category = 'Beverages';
          } else if (nameLower.includes('chicken') || nameLower.includes('beef') || nameLower.includes('pork') || nameLower.includes('meat') || nameLower.includes('fish')) {
            category = 'Meat';
          } else if (nameLower.includes('rice') || nameLower.includes('wheat') || nameLower.includes('grain') || nameLower.includes('cereal')) {
            category = 'Grains';
          } else if (nameLower.includes('tomato') || nameLower.includes('potato') || nameLower.includes('onion') || nameLower.includes('carrot') || nameLower.includes('vegetable')) {
            category = 'Vegetables';
          } else if (nameLower.includes('apple') || nameLower.includes('banana') || nameLower.includes('orange') || nameLower.includes('fruit')) {
            category = 'Fruits';
          } else if (nameLower.includes('oil') || nameLower.includes('sugar') || nameLower.includes('salt') || nameLower.includes('flour') || nameLower.includes('pasta') || nameLower.includes('sauce')) {
            category = 'Pantry';
          } else {
            category = 'General';
          }

          console.log(`🔍 ➕ NEW PRODUCT: "${name}" → [${productId}] Category: ${category}`);
        }

        if (product) {
          // Product exists - update stock
          const newStock = product.currentStock + quantity;

          product.currentStock = newStock;
          if (price !== undefined) {
            product.price = Number(price);
          }
          product.lastUpdated = new Date();
          await product.save();

          results.push({
            name: product.name,
            productId: product.productId,
            action: 'updated',
            previousStock: product.currentStock - quantity,
            newStock: product.currentStock,
            added: quantity
          });

          console.log(`✅ Updated: ${product.name} [${product.productId}] (${product.currentStock - quantity} → ${product.currentStock})`);

        } else {
          // Product doesn't exist - create new
          product = await Product.create({
            productId: productId,
            name: productName,
            category: category,
            currentStock: quantity,
            price: price !== undefined ? Number(price) : 0,
            lastUpdated: new Date()
          });

          results.push({
            name: product.name,
            productId: product.productId,
            action: 'created',
            previousStock: 0,
            newStock: product.currentStock,
            added: quantity
          });

          console.log(`✅ Created: ${product.name} [${product.productId}] (Stock: ${product.currentStock})`);
        }

      } catch (itemError) {
        console.error(`❌ Error processing ${item.name}:`, itemError);
        errors.push({
          name: item.name,
          error: itemError.message
        });
      }
    }

    // Create purchase record for history BEFORE sending response
    let purchaseRecord = null;
    try {
      const Purchase = require('../models/Purchase');
      purchaseRecord = await Purchase.create({
        products: results.map(r => ({
          productId: r.productId,
          productName: r.name,
          quantity: r.added
        })),
        supplier: 'Bill Upload',
        deliveryDate: new Date().toISOString().split('T')[0]
      });
      console.log('📝 Purchase record created:', purchaseRecord._id);
    } catch (purchaseError) {
      console.error('⚠️ Failed to create purchase record:', purchaseError.message);
      // Continue anyway - stock is already updated
    }

    // Return results
    res.json({
      success: true,
      message: `Stock updated successfully. ${results.length} items processed.`,
      data: {
        processed: results.length,
        failed: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined,
        purchaseId: purchaseRecord ? purchaseRecord._id : null
      }
    });

  } catch (error) {
    console.error('❌ Stock update error:', error);
    res.status(500).json({
      success: false,
      error: 'Update failed',
      message: error.message || 'Failed to update stock'
    });
  }
};

module.exports = {
  uploadBill,
  confirmStockUpdate
};
