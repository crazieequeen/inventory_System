const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./models/Product');

async function updateCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all products
    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products`);

    let updated = 0;

    for (const product of products) {
      const nameLower = product.name.toLowerCase();
      let newCategory = 'General';

      // Smart category assignment
      if (nameLower.includes('milk') || nameLower.includes('butter') || nameLower.includes('cheese') || nameLower.includes('yogurt') || nameLower.includes('egg')) {
        newCategory = 'Dairy';
      } else if (nameLower.includes('bread') || nameLower.includes('bun') || nameLower.includes('cake') || nameLower.includes('pastry')) {
        newCategory = 'Bakery';
      } else if (nameLower.includes('juice') || nameLower.includes('soda') || nameLower.includes('water') || nameLower.includes('drink')) {
        newCategory = 'Beverages';
      } else if (nameLower.includes('chicken') || nameLower.includes('beef') || nameLower.includes('pork') || nameLower.includes('meat') || nameLower.includes('fish')) {
        newCategory = 'Meat';
      } else if (nameLower.includes('rice') || nameLower.includes('wheat') || nameLower.includes('grain') || nameLower.includes('cereal')) {
        newCategory = 'Grains';
      } else if (nameLower.includes('tomato') || nameLower.includes('potato') || nameLower.includes('onion') || nameLower.includes('carrot') || nameLower.includes('vegetable')) {
        newCategory = 'Vegetables';
      } else if (nameLower.includes('apple') || nameLower.includes('banana') || nameLower.includes('orange') || nameLower.includes('fruit')) {
        newCategory = 'Fruits';
      } else if (nameLower.includes('oil') || nameLower.includes('sugar') || nameLower.includes('salt') || nameLower.includes('flour') || nameLower.includes('pasta') || nameLower.includes('sauce')) {
        newCategory = 'Pantry';
      }

      if (product.category !== newCategory) {
        product.category = newCategory;
        await product.save();
        console.log(`✅ Updated: ${product.name} → ${newCategory}`);
        updated++;
      } else {
        console.log(`⏭️  Skipped: ${product.name} (already ${newCategory})`);
      }
    }

    console.log(`\n✅ Update complete! ${updated} products updated.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateCategories();
