import React, { useState } from 'react';
import { Upload, FileText, Calendar, CheckCircle, Package, X } from 'lucide-react';
import { API_URL } from '../config';
import { useAPI } from '../hooks/useAPI';
import { useStock } from '../context/StockContext';

function UploadBill() {
  const { addPurchase } = useAPI();
  const { triggerStockUpdate } = useStock();
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [notification, setNotification] = useState(null);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);

  const handleFileSelect = async (file) => {
    if (file && (file.type === 'application/pdf' || file.type.startsWith('image/'))) {
      setSelectedFile(file);
      setIsExtracting(true);
      setExtractionProgress(0);

      try {
        // Upload to backend for extraction
        const formData = new FormData();
        formData.append('bill', file);

        const response = await fetch(`${API_URL}/api/bill/upload`, {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (result.success) {
          console.log('✅ Extracted data:', result.data);

          setExtractedData({
            invoiceNumber: `INV-${Date.now()}`,
            supplier: 'Extracted from Bill',
            deliveryDate: new Date().toISOString().split('T')[0],
            products: result.data.items.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price !== undefined ? item.price : 0
            }))
          });

          setDeliveryDate(new Date().toISOString().split('T')[0]);
          setIsExtracting(false);
        } else {
          setNotification(`⚠️ ${result.message}`);
          setSelectedFile(null);
          setIsExtracting(false);
        }

      } catch (error) {
        console.error('Extraction error:', error);
        setNotification(`❌ Failed to extract data: ${error.message}`);
        setSelectedFile(null);
        setIsExtracting(false);
      }
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpdateStock = async () => {
    console.log('🔵 Button clicked!');
    console.log('🔵 Extracted data:', extractedData);

    setIsLoading(true);

    try {
      // Prepare items for backend confirmation
      const items = extractedData.products.map(p => ({
        name: p.name,
        quantity: p.quantity,
        price: p.price || 0
      }));

      console.log('🟢 Confirming stock update:', items);

      // Confirm stock update with backend
      const response = await fetch(`${API_URL}/api/bill/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items })
      });

      const result = await response.json();

      console.log('🟢 Backend response:', result);

      if (result.success) {
        setIsLoading(false);
        setShowSuccess(true);

        const totalAdded = items.reduce((sum, p) => sum + p.quantity, 0);
        setNotification(`✅ Stock updated! Added ${totalAdded} items. Stock updated across all pages.`);

        console.log('✅ SUCCESS! Stock has been updated in MongoDB.');
        console.log('📊 Triggering real-time update across all pages...');

        // Trigger stock update across all pages
        triggerStockUpdate();

        // Reset form immediately to solve disappearing delay
        setSelectedFile(null);
        setExtractedData(null);
        setDeliveryDate('');

        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccess(false);
          setNotification(null);
        }, 3000);
      }
    } catch (error) {
      console.error('🔴 Upload error:', error);
      setIsLoading(false);
      setNotification(`❌ Failed to update stock: ${error.message}`);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setExtractedData(null);
    setDeliveryDate('');
  };

  const isUpdateDisabled = !extractedData ||
    (extractedData && !extractedData.deliveryDate && !deliveryDate) ||
    isLoading;

  const totalItems = extractedData ? extractedData.products.reduce((sum, p) => sum + p.quantity, 0) : 0;

  return (
    <div className="upload-bill">
      <h1 className="page-title">Upload Invoice & Update Stock (OCR Enabled)</h1>

      {/* Notification */}
      {notification && (
        <div className="notification success">
          {notification}
        </div>
      )}

      {/* OCR Extraction Progress */}
      {isExtracting && (
        <div className="extraction-progress">
          <div className="progress-content">
            <div className="spinner"></div>
            <div>
              <div className="progress-title">🔍 Extracting data from bill...</div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${extractionProgress}%` }}></div>
              </div>
              <div className="progress-text">{extractionProgress}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {showSuccess && (
        <div className="success-alert">
          <div className="success-content">
            <CheckCircle size={24} />
            <div>
              <div className="success-title">Stock Updated Successfully!</div>
              <div className="success-subtitle">Total Items Added: {totalItems}</div>
            </div>
          </div>
        </div>
      )}

      <div className="upload-section">
        {/* File Upload Card */}
        <div className="card upload-card">
          <h2 className="section-title">Upload Invoice</h2>

          {!selectedFile ? (
            <div
              className={`upload-area ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload size={48} className="upload-icon" />
              <h3 className="upload-title">Drag & Drop Invoice Here</h3>
              <p className="upload-subtitle">or click to browse</p>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileInputChange}
                className="file-input"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="upload-btn-label">
                Choose File
              </label>
              <p className="upload-hint">Supports: PDF, JPG, PNG</p>
            </div>
          ) : (
            <div className="file-preview">
              <div className="file-preview-header">
                <FileText size={40} className="file-icon" />
                <div className="file-info">
                  <div className="file-name">{selectedFile.name}</div>
                  <div className="file-size">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </div>
                </div>
                <button onClick={handleRemoveFile} className="remove-file-btn">
                  <X size={20} />
                </button>
              </div>

              {extractedData && (
                <div className="extracted-info">
                  <div className="info-row">
                    <span className="info-label">Invoice Number:</span>
                    <span className="info-value">{extractedData.invoiceNumber}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Supplier:</span>
                    <span className="info-value">{extractedData.supplier}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Total Products:</span>
                    <span className="info-value">{extractedData.products.length} items</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Extracted Products Card */}
        {extractedData && (
          <div className="card products-card">
            <h2 className="section-title">Extracted Products</h2>
            <div className="products-list-container">
              {extractedData.products.map((product, index) => (
                <div key={product.productId || index} className="product-row">
                  <Package size={20} className="product-icon" />
                  <div className="product-details-col">
                    <div className="product-name-text">
                      <input
                        className="edit-input"
                        value={product.name}
                        onChange={(e) => {
                          const newProducts = [...extractedData.products];
                          newProducts[index].name = e.target.value;
                          setExtractedData({ ...extractedData, products: newProducts });
                        }}
                        style={{ border: '1px solid #E5E7EB', borderRadius: '4px', padding: '4px', width: '100%', marginBottom: '4px' }}
                      />
                    </div>
                    <div className="product-meta" style={{ display: 'flex', gap: '10px' }}>
                      <label style={{ fontSize: '12px', color: '#6B7280' }}>
                        Qty: <input
                          type="number"
                          value={product.quantity}
                          onChange={(e) => {
                            const newProducts = [...extractedData.products];
                            newProducts[index].quantity = parseInt(e.target.value) || 0;
                            setExtractedData({ ...extractedData, products: newProducts });
                          }}
                          style={{ border: '1px solid #E5E7EB', borderRadius: '4px', padding: '2px 4px', width: '60px' }}
                        />
                      </label>
                      <label style={{ fontSize: '12px', color: '#6B7280' }}>
                        Price: <input
                          type="number"
                          step="0.01"
                          value={product.price || 0}
                          onChange={(e) => {
                            const newProducts = [...extractedData.products];
                            newProducts[index].price = parseFloat(e.target.value) || 0;
                            setExtractedData({ ...extractedData, products: newProducts });
                          }}
                          style={{ border: '1px solid #E5E7EB', borderRadius: '4px', padding: '2px 4px', width: '80px' }}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="product-supplier">
                    {extractedData.supplier}
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery Date Input */}
            {!extractedData.deliveryDate && (
              <div className="delivery-date-section">
                <label htmlFor="delivery-date" className="date-label">
                  <Calendar size={18} />
                  Enter Delivery Date
                </label>
                <input
                  type="date"
                  id="delivery-date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="date-input"
                  required
                />
              </div>
            )}

            {extractedData.deliveryDate && (
              <div className="delivery-date-display">
                <Calendar size={18} />
                <span>Delivery Date: {extractedData.deliveryDate}</span>
              </div>
            )}

            {/* Update Stock Button */}
            <button
              onClick={handleUpdateStock}
              disabled={isUpdateDisabled}
              className={`update-stock-btn ${isUpdateDisabled ? 'disabled' : ''}`}
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  Updating Stock...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Update Stock
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadBill;
