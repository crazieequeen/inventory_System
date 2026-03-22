import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import StockRequirements from './pages/StockRequirements';
import Purchases from './pages/Purchases';
import UploadBill from './pages/UploadBill';
import ShopInventory from './pages/ShopInventory';
import SalesAnalytics from './pages/SalesAnalytics';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgetPassword from './pages/ForgetPassword';
import Profile from './pages/Profile';
import { StockProvider } from './context/StockContext';
import { SettingsProvider } from './context/SettingsContext';

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
  };

  const ProtectedRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/login" />;
  };

  const AuthRoute = ({ children }) => {
    return !isAuthenticated() ? children : <Navigate to="/" />;
  };

  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
        <Route path="/forget-password" element={<AuthRoute><ForgetPassword /></AuthRoute>} />

        {/* Protected Routes */}
        <Route path="/*" element={
          <ProtectedRoute>
            <SettingsProvider>
              <StockProvider>
                <div className="app-container">
                  <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
                  <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                    <Header />
                    <div className="page-content">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/stock-requirements" element={<StockRequirements />} />
                        <Route path="/purchases" element={<Purchases />} />
                        <Route path="/upload-bill" element={<UploadBill />} />
                        <Route path="/shop-inventory" element={<ShopInventory />} />
                        <Route path="/sales-analytics" element={<SalesAnalytics />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/profile" element={<Profile />} />
                      </Routes>
                    </div>
                  </div>
                </div>
              </StockProvider>
            </SettingsProvider>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
