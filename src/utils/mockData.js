// Mock data for invoice extraction simulation
import { getShopProducts } from './shopProducts';

// Get random products from shop inventory for mock invoices
const getRandomShopProducts = (count = 4) => {
  const shopProducts = getShopProducts();
  const shuffled = [...shopProducts].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map(product => ({
    productId: product.id,  // Changed from 'id' to 'productId'
    name: product.name,
    quantity: Math.floor(Math.random() * 100) + 20 // Random quantity between 20-120
  }));
};

export const mockInvoiceData = {
  withDeliveryDate: {
    invoiceNumber: "INV-2024-001234",
    supplier: "Fresh Dairy Co.",
    deliveryDate: "2024-02-15",
    products: getRandomShopProducts(4)
  },
  withoutDeliveryDate: {
    invoiceNumber: "INV-2024-001235",
    supplier: "Bakery Supplies Ltd",
    deliveryDate: null,
    products: getRandomShopProducts(4)
  }
};

// Simulate random selection between invoices with and without delivery date
export const getRandomMockInvoice = () => {
  // Return consistent data for testing (not random)
  return {
    invoiceNumber: `INV-2026-${Math.floor(Math.random() * 900000) + 100000}`,
    supplier: "Fresh Foods Wholesale Ltd",
    deliveryDate: "2026-03-05",
    products: [
      { productId: 'P001', name: 'Fresh Milk 1L', quantity: 50 },
      { productId: 'P002', name: 'White Bread', quantity: 40 },
      { productId: 'P003', name: 'Eggs (Dozen)', quantity: 30 }
    ]
  };
};

// Initial stock data for the table - using shop products with 0 stock
export const initialStockData = getShopProducts().map(product => ({
  id: product.id,
  name: product.name,
  totalQuantity: 0,
  availableQuantity: 0,
  lastUpdated: new Date().toISOString().split('T')[0]
}));
