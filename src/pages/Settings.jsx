import React from 'react';
import { Store, TrendingUp, Bell, Globe, Save } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

function Settings() {
  const { currency, setCurrency } = useSettings();
  return (
    <div className="settings-page">
      <div className="settings-header-top-sticky">
        <div className="settings-header-content">
          <div>
            <h1 className="page-title">Preferences & Settings</h1>
            <p className="subtitle">Manage your sales analytics, purchase configurations, and store details.</p>
          </div>
          <button className="save-btn">
            <Save size={18} />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      <div className="settings-grid">

        {/* Business Settings */}
        <div className="settings-card">
          <div className="card-header-icon">
            <Store size={24} color="#4F46E5" />
            <h2 className="section-title">Business Profile</h2>
          </div>
          <p className="card-desc">Update your company info across purchase orders and invoices.</p>
          <div className="settings-form">
            <div className="form-group">
              <label>Company/Store Name</label>
              <input type="text" defaultValue="Retail Store - Downtown Branch" />
            </div>
            <div className="form-group">
              <label>Tax Identification Number</label>
              <input type="text" defaultValue="TIN-123456789" />
            </div>
            <div className="form-group">
              <label>Default Supplier Contact Email</label>
              <input type="email" defaultValue="purchasing@retailstore.com" />
            </div>
          </div>
        </div>

        {/* Sales Targets */}
        <div className="settings-card">
          <div className="card-header-icon">
            <TrendingUp size={24} color="#10B981" />
            <h2 className="section-title">Sales Goals & Analytics</h2>
          </div>
          <p className="card-desc">Configure your sales targets used in the dashboard charts.</p>
          <div className="settings-form">
            <div className="form-group">
              <label>Monthly Revenue Goal</label>
              <input type="number" defaultValue="75000" />
            </div>
            <div className="form-group">
              <label>Dashboard Default Date Range</label>
              <select defaultValue="30">
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last Quarter</option>
              </select>
            </div>
            <div className="form-group">
              <label>Analytics Currency Symbol</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="settings-card">
          <div className="card-header-icon">
            <Bell size={24} color="#F59E0B" />
            <h2 className="section-title">Alerts & Notifications</h2>
          </div>
          <p className="card-desc">Decide which sales and purchase activities trigger alerts.</p>
          <div className="settings-form mt-form">
            <div className="toggle-group">
              <div className="toggle-text">
                <label>New Purchase Order Confirmation</label>
                <span>Receive an alert when a bill is successfully uploaded</span>
              </div>
              <label className="switch">
                <input type="checkbox" defaultChecked />
                <span className="slider round"></span>
              </label>
            </div>
            <div className="toggle-group">
              <div className="toggle-text">
                <label>Daily Sales Summary</label>
                <span>Get a summary report via email at the end of day</span>
              </div>
              <label className="switch">
                <input type="checkbox" />
                <span className="slider round"></span>
              </label>
            </div>
            <div className="toggle-group">
              <div className="toggle-text">
                <label>Unusual Sales Activity Spike</label>
                <span>Alert when sales jump &gt;50% compared to average</span>
              </div>
              <label className="switch">
                <input type="checkbox" defaultChecked />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Regional */}
        <div className="settings-card">
          <div className="card-header-icon">
            <Globe size={24} color="#6366F1" />
            <h2 className="section-title">Regional & Formatting</h2>
          </div>
          <p className="card-desc">Manage your locale, timezone, and data representations.</p>
          <div className="settings-form">
            <div className="form-group">
              <label>Timezone</label>
              <select defaultValue="UTC-5">
                <option value="UTC-8">Pacific Time (PT) - UTC-8</option>
                <option value="UTC-5">Eastern Time (ET) - UTC-5</option>
                <option value="UTC+0">Greenwich Mean Time (GMT)</option>
                <option value="UTC+5.5">India Standard Time (IST)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date Format</label>
              <select defaultValue="MM/DD/YYYY">
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>

      </div>

      <style jsx>{`
        .settings-page {
          animation: fadeIn 0.3s ease;
        }
        .settings-header-top-sticky {
          position: sticky;
          top: 72px; /* Position perfectly below global header (72px) */
          z-index: 100;
          background: #F3F4F6;
          padding: 24px 0;
          margin: 0 -32px 2rem -32px; /* Offset page padding */
          padding-left: 32px;    /* Restore left alignment */
          padding-right: 32px;
          border-bottom: 1px solid #E5E7EB;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          transition: all 0.2s;
        }
        .settings-header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1600px;
        }
        .subtitle {
          color: #6B7280;
          font-size: 0.95rem;
          margin-top: 0.5rem;
        }
        .save-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #4F46E5;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        .save-btn:hover {
          background: #4338CA;
        }
        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
        }
        .settings-card {
           background: white;
           border-radius: 12px;
           padding: 1.5rem;
           box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
           display: flex;
           flex-direction: column;
        }
        .card-header-icon {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }
        .card-header-icon h2 {
           margin: 0;
           font-size: 1.1rem;
        }
        .card-desc {
          font-size: 0.9rem;
          color: #6B7280;
          margin-bottom: 1.5rem;
        }
        .settings-form {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .mt-form {
          margin-top: 0.5rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #374151;
        }
        .form-group input, .form-group select {
          padding: 0.75rem;
          border: 1px solid #D1D5DB;
          border-radius: 6px;
          font-size: 0.95rem;
          color: #111827;
          transition: border-color 0.2s;
          background: #F9FAFB;
        }
        .form-group input:focus, .form-group select:focus {
           outline: none;
           border-color: #4F46E5;
           background: white;
        }
        .toggle-group {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 1rem;
          border-bottom: 1px solid #F3F4F6;
        }
        .toggle-group:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .toggle-text {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .toggle-text label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #111827;
        }
        .toggle-text span {
          font-size: 0.8rem;
          color: #6B7280;
        }
        /* Custom Toggle Switch */
        .switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }
        .switch input { 
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: #CBD5E1;
          transition: .4s;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
        }
        input:checked + .slider {
          background-color: #4F46E5;
        }
        input:focus + .slider {
          box-shadow: 0 0 1px #4F46E5;
        }
        input:checked + .slider:before {
          transform: translateX(20px);
        }
        .slider.round {
          border-radius: 24px;
        }
        .slider.round:before {
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
}

export default Settings;
