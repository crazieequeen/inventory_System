const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./models/Product');
const Sale = require('./models/Sale');
const Purchase = require('./models/Purchase');

async function clearDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete all products
    const productsDeleted = await Product.deleteMany({});
    console.log(`🗑️  Deleted ${productsDeleted.deletedCount} products`);

    // Delete all sales
    const salesDeleted = await Sale.deleteMany({});
    console.log(`🗑️  Deleted ${salesDeleted.deletedCount} sales`);

    // Delete all purchases
    const purchasesDeleted = await Purchase.deleteMany({});
    console.log(`🗑️  Deleted ${purchasesDeleted.deletedCount} purchases`);

    console.log('\n✅ Database is now completely empty!');
    console.log('📋 Inventory will show 0 items until you upload a bill.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

clearDatabase();
