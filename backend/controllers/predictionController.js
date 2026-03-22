const salesData = require('../models/salesDataDB');

// Helper to query Grok (or Groq) API compatible endpoints
async function queryGrokAPI(promptText) {
  // Uses GROK_API_KEY or GROQ_API_KEY from `.env`
  const apiKey = process.env.GROK_API_KEY || process.env.GROQ_API_KEY || 'your_api_key_here';

  // Decide endpoint dynamically based on which key is provided
  const isGroq = !!process.env.GROQ_API_KEY;
  const endpoint = isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.x.ai/v1/chat/completions';
  const model = isGroq ? 'llama-3.3-70b-versatile' : 'grok-beta';

  if (apiKey === 'your_api_key_here') {
    throw new Error('API Key missing. Please add GROK_API_KEY to your backend .env file.');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: 'You are an inventory data science AI. Return strictly parsable JSON object, absolutely zero markdown formatting or plain text.' },
        { role: 'user', content: promptText }
      ],
      model: model,
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'API request failed');

  try {
    const rawContent = data.choices[0].message.content.trim();
    return JSON.parse(rawContent);
  } catch (error) {
    throw new Error('AI returned non-JSON response: ' + data.choices[0].message.content);
  }
}

// Get sales forecast for a product
const getForecast = async (req, res) => {
  try {
    const { productId, days = 7 } = req.body;

    if (!productId) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'productId is required'
      });
    }

    // Get historical sales for the product (AWAIT the async function)
    const historicalSales = await salesData.getSalesByProduct(productId);

    if (historicalSales.length === 0) {
      return res.status(404).json({
        error: 'No sales data',
        message: 'No historical sales data found for this product'
      });
    }

    // Formulate prompt for AI
    const prompt = `
Given the following 7-day historical sales data:
${JSON.stringify(historicalSales)}

Provide a sales forecast for the next ${days} days.
Return ONLY valid JSON in this exact structure:
{
  "averageDailySales": number (float),
  "forecasts": [
    { "date": "YYYY-MM-DD", "predictedQuantity": number (integer) }
  ]
}`;

    const aiResult = await queryGrokAPI(prompt);
    const avgDailySales = aiResult.averageDailySales || 0;
    const forecasts = aiResult.forecasts || [];

    const prediction = {
      productId,
      averageDailySales: Number(avgDailySales),
      forecastDays: days,
      forecasts,
      totalPredictedSales: Math.round(forecasts.reduce((sum, f) => sum + (f.predictedQuantity || 0), 0))
    };

    res.json({
      success: true,
      productId,
      forecastDays: days,
      data: prediction
    });
  } catch (error) {
    console.error('Error generating forecast:', error);
    res.status(500).json({
      error: 'Failed to generate forecast',
      message: error.message
    });
  }
};

// Predict stock-out days
const predictStockout = async (req, res) => {
  try {
    const { productId, currentStock } = req.body;

    if (!productId) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'productId is required'
      });
    }

    // Get current stock from inventory if not provided
    let stock = currentStock;
    if (stock === undefined) {
      const stockData = await salesData.getProductStock(productId);
      if (stockData) {
        stock = stockData.currentStock;
      } else {
        return res.status(404).json({
          error: 'Product not found',
          message: 'No stock information available for this product'
        });
      }
    }

    // Get historical sales for the product (AWAIT the async function)
    const historicalSales = await salesData.getSalesByProduct(productId);

    if (historicalSales.length === 0) {
      return res.json({
        success: true,
        productId,
        currentStock: stock,
        data: {
          productId,
          currentStock: stock,
          averageDailySales: 0,
          daysUntilStockout: null,
          stockoutDate: null,
          status: 'no_sales_data',
          message: 'No sales data available for prediction'
        }
      });
    }

    // Ask Grok/Groq API strictly (no local math fallbacks)
    const prompt = `
Inventory evaluation for Product ${productId} with current stock: ${stock}.
Historical sales records:
${JSON.stringify(historicalSales)}

Analyze these sales against the current stock.
Output strictly JSON only in this exact format constraint:
{
  "averageDailySales": number (float, e.g. 5.5),
  "daysUntilStockout": number (float, e.g. 3.2 days until stock hits 0 dividing stock by rate)
}
If no sales, set both to 0.`;

    // Robust mathematical failsafe locally calculated
    const totalQuantity = historicalSales.reduce((sum, sale) => sum + sale.quantity, 0);
    const dates = historicalSales.map(sale => new Date(sale.date).getTime()).filter(t => !isNaN(t));
    let dateRange = 1;
    if (dates.length > 0) {
      const maxDate = new Date(Math.max(...dates));
      const minDate = new Date(Math.min(...dates));
      dateRange = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;
      if (dateRange <= 0) dateRange = 1;
    }
    const mathAvgDailySales = totalQuantity / dateRange;
    const mathDaysUntilStockout = mathAvgDailySales > 0 ? (stock / mathAvgDailySales) : 999;

    let aiResult = {};
    try {
      aiResult = await queryGrokAPI(prompt);
      console.log(`✅ Groq/Grok AI evaluation successful for ${productId}`);
    } catch (aiError) {
      console.error(`⚠️ AI Gen failed: ${aiError.message}. Using exact math failsafe.`);
    }

    const avgDailySales = ('averageDailySales' in aiResult && !isNaN(aiResult.averageDailySales))
      ? Number(aiResult.averageDailySales) : mathAvgDailySales;

    const daysUntilStockout = ('daysUntilStockout' in aiResult && !isNaN(aiResult.daysUntilStockout))
      ? Number(aiResult.daysUntilStockout) : mathDaysUntilStockout;

    const stockoutDate = new Date();
    stockoutDate.setDate(stockoutDate.getDate() + daysUntilStockout);

    let status = 'safe';
    if (daysUntilStockout <= 3) status = 'critical';
    else if (daysUntilStockout <= 7) status = 'warning';

    const prediction = {
      productId,
      currentStock: stock,
      averageDailySales: Number(avgDailySales.toFixed(2)),
      daysUntilStockout: Number(daysUntilStockout.toFixed(1)),
      stockoutDate: stockoutDate.toISOString().split('T')[0],
      status,
      recommendedReorderQuantity: Math.round(avgDailySales * 14)
    };

    res.json({
      success: true,
      productId,
      currentStock: stock,
      data: prediction
    });
  } catch (error) {
    console.error('Error predicting stockout:', error);
    res.status(500).json({
      error: 'Failed to predict stockout',
      message: error.message
    });
  }
};

// Get predictions for all products
const getAllProductsPredictions = async (req, res) => {
  try {
    const aggregatedSales = salesData.getAggregatedSales();
    const predictions = [];

    for (const product of aggregatedSales) {
      try {
        const historicalSales = salesData.getSalesByProduct(product.productId);

        if (historicalSales.length > 0) {
          const totalQuantity = historicalSales.reduce((sum, sale) => sum + sale.quantity, 0);
          const dates = historicalSales.map(sale => new Date(sale.date).getTime()).filter(t => !isNaN(t));

          let dateRange = 1;
          if (dates.length > 0) {
            const maxDate = new Date(Math.max(...dates));
            const minDate = new Date(Math.min(...dates));
            dateRange = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;
          }

          const avgDailySales = totalQuantity / dateRange;

          const forecasts = Array.from({ length: 7 }).map((_, i) => {
            const fd = new Date();
            fd.setDate(fd.getDate() + i + 1);
            return {
              date: fd.toISOString().split('T')[0],
              predictedQuantity: Math.round(avgDailySales * (0.9 + Math.random() * 0.2))
            };
          });

          predictions.push({
            productId: product.productId,
            productName: product.productName,
            category: product.category,
            totalSales: product.totalQuantity,
            prediction: {
              forecastDays: 7,
              averageDailySales: Number(avgDailySales.toFixed(2)),
              forecasts,
              totalPredictedSales: Math.round(sum(forecasts.map(f => f.predictedQuantity)))
            }
          });
        }
      } catch (error) {
        console.error(`Error predicting for product ${product.productId}:`, error);
        // Continue with other products
      }
    }

    res.json({
      success: true,
      count: predictions.length,
      data: predictions
    });
  } catch (error) {
    console.error('Error generating predictions for all products:', error);
    res.status(500).json({
      error: 'Failed to generate predictions',
      message: error.message
    });
  }
};

module.exports = {
  getForecast,
  predictStockout,
  getAllProductsPredictions
};
