const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./models/Product');

async function cleanupDuplicates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all products
    const allProducts = await Product.find({});
    console.log(`📦 Found ${allProducts.length} total products`);

    // Group by name (case-insensitive)
    const productsByName = {};
    
    for (const product of allProducts) {
      const nameLower = product.name.toLowerCase();
      if (!productsByName[nameLower]) {
        productsByName[nameLower] = [];
      }
      productsByName[nameLower].push(product);
    }

    // Find and remove duplicates
    let duplicatesRemoved = 0;
    
    for (const [name, products] of Object.entries(productsByName)) {
      if (products.length > 1) {
        console.log(`\n🔍 Found ${products.length} duplicates of "${products[0].name}":`);
        
        // Sort by: 1) Master products first (P001-P010), 2) Highest stock, 3) Most recent
        products.sort((a, b) => {
          // Prioritize master products (P001-P010)
          const aIsMaster = /^P0\d{2}$/.test(a.productId);
          const bIsMaster = /^P0\d{2}$/.test(b.productId);
          if (aIsMaster && !bIsMaster) return -1;
          if (!aIsMaster && bIsMaster) return 1;
          
          // Then by stock
          if (b.currentStock !== a.currentStock) {
            return b.currentStock - a.currentStock;
          }
          
          // Then by date
          return new Date(b.lastUpdated) - new Date(a.lastUpdated);
        });
        
        // Keep the first one (best), delete the rest
        const keepProduct = products[0];
        console.log(`  ✅ KEEPING: ${keepProduct.productId} (Stock: ${keepProduct.currentStock})`);
        
        for (let i = 1; i < products.length; i++) {
          const deleteProduct = products[i];
          console.log(`  ❌ DELETING: ${deleteProduct.productId} (Stock: ${deleteProduct.currentStock})`);
          await Product.deleteOne({ _id: deleteProduct._id });
          duplicatesRemoved++;
        }
      }
    }

    console.log(`\n✅ Cleanup complete! Removed ${duplicatesRemoved} duplicate products.`);
    
    // Show final count
    const finalCount = await Product.countDocuments();
    console.log(`📊 Final product count: ${finalCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupDuplicates();
