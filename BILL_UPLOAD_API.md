# Bill Upload API Documentation

## Overview
Production-ready API for uploading purchase bills, extracting data using OCR/PDF parsing and AI, and updating stock in MongoDB.

## Features
✅ OCR for images (JPG, PNG)
✅ PDF text extraction
✅ AI-powered data extraction (Google Gemini)
✅ Stock validation (max 90 units)
✅ Preview before updating
✅ Error handling
✅ MongoDB integration

---

## API Endpoints

### 1. Upload Bill (Preview)
**Endpoint:** `POST /api/bill/upload`

**Description:** Upload a bill file, extract text, and get AI-extracted data for preview.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Form data with file field named `bill`

**Example (cURL):**
```bash
curl -X POST http://localhost:5000/api/bill/upload \
  -F "bill=@/path/to/bill.pdf"
```

**Example (JavaScript):**
```javascript
const formData = new FormData();
formData.append('bill', fileInput.files[0]);

const response = await fetch('http://localhost:5000/api/bill/upload', {
  method: 'POST',
  body: formData
});

const data = await response.json();
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Bill processed successfully",
  "data": {
    "items": [
      {
        "name": "Fresh Milk 1L",
        "quantity": 50
      },
      {
        "name": "White Bread",
        "quantity": 40
      }
    ],
    "totalItems": 2,
    "totalQuantity": 90
  }
}
```

**Error Responses:**
```json
// No file uploaded
{
  "success": false,
  "error": "No file uploaded",
  "message": "Please upload a PDF or image file"
}

// No products found
{
  "success": false,
  "error": "No products found",
  "message": "Could not find any products in the bill. Please try a clearer image."
}

// Processing failed
{
  "success": false,
  "error": "Processing failed",
  "message": "Failed to extract text from image"
}
```

---

### 2. Confirm Stock Update
**Endpoint:** `POST /api/bill/confirm`

**Description:** Confirm the extracted items and update stock in MongoDB.

**Request:**
- Method: `POST`
- Content-Type: `application/json`
- Body:
```json
{
  "items": [
    {
      "name": "Fresh Milk 1L",
      "quantity": 50
    },
    {
      "name": "White Bread",
      "quantity": 40
    }
  ]
}
```

**Example (JavaScript):**
```javascript
const response = await fetch('http://localhost:5000/api/bill/confirm', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    items: extractedItems
  })
});

const data = await response.json();
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Stock updated successfully. 2 items processed.",
  "data": {
    "processed": 2,
    "failed": 0,
    "results": [
      {
        "name": "Fresh Milk 1L",
        "action": "updated",
        "previousStock": 20,
        "newStock": 70,
        "added": 50
      },
      {
        "name": "White Bread",
        "action": "created",
        "previousStock": 0,
        "newStock": 40,
        "added": 40
      }
    ]
  }
}
```

**With Errors:**
```json
{
  "success": true,
  "message": "Stock updated successfully. 1 items processed.",
  "data": {
    "processed": 1,
    "failed": 1,
    "results": [...],
    "errors": [
      {
        "name": "Product X",
        "error": "Stock would exceed max limit of 90. Current: 50, Adding: 50"
      }
    ]
  }
}
```

---

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Create `.env` file:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
MAX_STOCK_LIMIT=90
```

**Get Gemini API Key:**
1. Go to https://makersuite.google.com/app/apikey
2. Create new API key
3. Copy and paste into `.env`

### 3. Start Server
```bash
npm start
```

---

## Frontend Integration Example

```javascript
// Upload Bill Component
const UploadBill = () => {
  const [extractedItems, setExtractedItems] = useState(null);
  const [loading, setLoading] = useState(false);

  // Step 1: Upload and preview
  const handleFileUpload = async (file) => {
    setLoading(true);
    
    const formData = new FormData();
    formData.append('bill', file);

    try {
      const response = await fetch('http://localhost:5000/api/bill/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setExtractedItems(data.data.items);
        alert(`Found ${data.data.totalItems} products!`);
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Confirm and update stock
  const handleConfirm = async () => {
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/bill/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: extractedItems
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Stock updated! ${data.data.processed} items processed.`);
        setExtractedItems(null);
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Update failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => handleFileUpload(e.target.files[0])}
        disabled={loading}
      />

      {extractedItems && (
        <div>
          <h3>Extracted Items:</h3>
          <ul>
            {extractedItems.map((item, i) => (
              <li key={i}>{item.name}: {item.quantity}</li>
            ))}
          </ul>
          <button onClick={handleConfirm} disabled={loading}>
            Confirm & Update Stock
          </button>
        </div>
      )}
    </div>
  );
};
```

---

## Business Logic

### Stock Update Rules:
1. **Product Exists:**
   - `newStock = currentStock + quantity`
   - If `newStock > 90`: Reject with error
   - Else: Update stock

2. **Product Doesn't Exist:**
   - If `quantity > 90`: Reject with error
   - Else: Create new product with quantity

3. **No Bill Data Stored:**
   - Only stock quantity is updated
   - Bill file is not saved
   - Extracted text is not saved

---

## Error Handling

All endpoints return consistent error format:
```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message"
}
```

Common errors:
- Invalid file type
- File too large (>10MB)
- No text extracted
- No products found
- Stock limit exceeded
- Database errors

---

## Testing

### Test with cURL:
```bash
# Upload bill
curl -X POST http://localhost:5000/api/bill/upload \
  -F "bill=@test-bill.pdf"

# Confirm stock update
curl -X POST http://localhost:5000/api/bill/confirm \
  -H "Content-Type: application/json" \
  -d '{"items":[{"name":"Milk","quantity":10}]}'
```

### Test with Postman:
1. Create POST request to `/api/bill/upload`
2. Select Body → form-data
3. Add key `bill` with type `File`
4. Upload a test bill
5. Check response

---

## Production Checklist

✅ Environment variables secured
✅ File size limits enforced (10MB)
✅ File type validation
✅ Error handling implemented
✅ Stock limit validation (90 max)
✅ MongoDB connection pooling
✅ Logging for debugging
✅ No sensitive data stored
✅ API key secured in .env
✅ CORS configured

---

## Support

For issues or questions, check:
1. Backend logs for detailed error messages
2. MongoDB connection status
3. Gemini API key validity
4. File format compatibility

