# InventoryIQ - Inventory Intelligence System

A modern, professional SaaS-style inventory management dashboard with AI-powered stock predictions. Built with React + Vite frontend, Express.js backend, and Python ML model. Designed for retail shop owners to manage stock, track sales, and make intelligent purchasing decisions.

## Features

### Frontend (React + Vite)
- **Dashboard**: Real-time overview with sales trends, stock distribution, and alerts
- **Stock Requirements**: AI-powered restock recommendations with urgency indicators
- **Inventory Management**: Searchable product catalog with visual stock levels
- **Shop Inventory**: Manual sales count tracking for 10 shop products
- **Purchase Management**: Timeline-based purchase history with invoice upload
- **Upload Bill**: Upload e-bills, extract data, and update stock with smart delivery date handling
- **Sales Analytics**: Performance charts and product insights
- **Reports**: Downloadable business reports in multiple formats
- **Settings**: Customizable thresholds and notifications

### Backend (Express.js + Python AI)
- **Sales Tracking**: REST API for manual sales entry and history
- **AI Predictions**: Machine learning model for sales forecasting
- **Stock-out Alerts**: Predict when products will run out of stock
- **Data Aggregation**: Analyze sales patterns and trends
- **Python Integration**: Seamless communication with ML model (.pkl)

## Design System

- **Primary Color**: Deep Blue (#1E3A8A)
- **Accent Color**: Indigo (#4F46E5)
- **Success**: Green (#16A34A)
- **Warning**: Orange (#F59E0B)
- **Danger**: Red (#DC2626)
- **Background**: Light Gray (#F3F4F6)
- **Font**: Inter
- **Single CSS File**: All styles consolidated in `src/styles.css`

## Quick Start

### Frontend Only
```bash
npm install
npm run dev
```
Frontend runs at: `http://localhost:5173`

### Full Stack (Frontend + Backend + AI)

#### Option 1: Automated Setup (Linux/Mac)
```bash
chmod +x start-backend.sh
./start-backend.sh
```

#### Option 2: Automated Setup (Windows)
```bash
start-backend.bat
```

#### Option 3: Manual Setup
```bash
# 1. Install backend dependencies
cd backend
npm install

# 2. Install Python dependencies
cd ../python-ai
pip install -r requirements.txt

# 3. Train AI model
python train_model.py

# 4. Start backend server
cd ../backend
npm start
```

Backend runs at: `http://localhost:5000`

Then in a new terminal:
```bash
# 5. Start frontend
npm run dev
```

## Build for Production

```bash
npm run build
```

## Preview Production Build

```bash
npm run preview
```

## Project Structure

```
inventory-intelligence-system/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx         # Navigation sidebar
│   │   │   └── Header.jsx          # Top header
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       # Main dashboard
│   │   │   ├── StockRequirements.jsx # AI predictions
│   │   │   ├── Inventory.jsx       # Product catalog
│   │   │   ├── ShopInventory.jsx   # Sales tracking
│   │   │   ├── Purchases.jsx       # Purchase history
│   │   │   ├── UploadBill.jsx      # E-bill upload
│   │   │   ├── SalesAnalytics.jsx  # Charts
│   │   │   ├── Reports.jsx         # Reports
│   │   │   └── Settings.jsx        # Settings
│   │   ├── hooks/
│   │   │   └── useAPI.js           # Backend API hook
│   │   ├── utils/
│   │   │   ├── mockData.js         # Mock data
│   │   │   └── shopProducts.js     # Master product list
│   │   ├── styles.css              # Single stylesheet
│   │   ├── App.jsx                 # Main app
│   │   └── main.jsx                # Entry point
│   └── package.json
│
├── backend/
│   ├── routes/
│   │   ├── sales.js                # Sales routes
│   │   └── predictions.js          # Prediction routes
│   ├── controllers/
│   │   ├── salesController.js      # Sales logic
│   │   └── predictionController.js # Prediction logic
│   ├── models/
│   │   └── salesData.js            # Data store
│   ├── utils/
│   │   └── pythonRunner.js         # Python executor
│   ├── server.js                   # Express server
│   ├── package.json
│   └── .env                        # Config
│
├── python-ai/
│   ├── predict_sales.py            # Prediction script
│   ├── train_model.py              # Model training
│   ├── requirements.txt            # Dependencies
│   └── shop_sales_model.pkl        # Trained model
│
└── Documentation/
    ├── BACKEND_SETUP.md            # Architecture
    ├── API_INTEGRATION_GUIDE.md    # API reference
    └── BACKEND_COMPLETE.md         # Setup guide
```

## Technologies Used

### Frontend
- React 18
- Vite 5
- React Router DOM
- Recharts (data visualization)
- Lucide React (icons)
- CSS3 (single consolidated stylesheet)

### Backend
- Node.js
- Express.js
- CORS
- Body Parser
- Morgan (logging)

### AI/ML
- Python 3
- NumPy
- Pandas
- Scikit-learn
- Pickle (model serialization)

## API Endpoints

### Sales
- `POST /api/sales/entry` - Add sales entry
- `GET /api/sales/history` - Get sales history
- `GET /api/sales/product/:id` - Get product sales
- `GET /api/sales/aggregated` - Get aggregated data

### Predictions
- `POST /api/predictions/forecast` - Get sales forecast
- `POST /api/predictions/stockout` - Predict stock-out
- `GET /api/predictions/all-products` - Get all predictions

See `API_INTEGRATION_GUIDE.md` for detailed documentation.

## Master Product List

The system uses 10 shop products (P001-P010):
1. Fresh Milk 1L (Dairy)
2. White Bread (Bakery)
3. Eggs Dozen (Dairy)
4. Orange Juice 1L (Beverages)
5. Butter 250g (Dairy)
6. Chicken Breast 1kg (Meat)
7. Rice 5kg (Grains)
8. Tomatoes 1kg (Vegetables)
9. Cooking Oil 1L (Pantry)
10. Sugar 1kg (Pantry)

All pages use this single source of truth from `src/utils/shopProducts.js`.

## Key Concepts

- **Shop Inventory**: Tracks manual sales count (not stock)
- **Upload Bill**: Manages stock through e-bill uploads
- **Stock vs Sales**: Stock managed via e-bills, sales tracked manually
- **AI Predictions**: Based on historical sales data
- **In-Memory Storage**: Data resets on server restart (use database for production)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Documentation

- `README.md` - This file (overview)
- `BACKEND_SETUP.md` - Backend architecture
- `API_INTEGRATION_GUIDE.md` - Complete API reference
- `BACKEND_COMPLETE.md` - Setup checklist
- `MASTER_PRODUCT_LIST.md` - Product details
- `SHOP_INVENTORY_GUIDE.md` - Shop inventory usage
