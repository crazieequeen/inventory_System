// Master product list - Shop Inventory
// This is the single source of truth for all products in the shop
export const shopProducts = [
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

// Get all shop products
export const getShopProducts = () => {
  return shopProducts;
};

// Get product by ID
export const getProductById = (id) => {
  return shopProducts.find(product => product.id === id);
};

// Get products by category
export const getProductsByCategory = (category) => {
  if (category === 'all') return shopProducts;
  return shopProducts.filter(product => product.category === category);
};

// Get all unique categories
export const getCategories = () => {
  return [...new Set(shopProducts.map(product => product.category))];
};
