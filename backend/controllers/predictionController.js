const salesData = require('../models/salesDataDB');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Helper to query Gemini AI
 */
async function queryGeminiAPI(promptText) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY missing. Please add it to your backend .env file.');
  }

  const modelNames = ['gemini-1.5-flash', 'gemini-pro'];
  let lastError = null;

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(promptText);
      const response = await result.response;
      const text = response.text();

      // Extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON object found in response');

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.warn(`⚠️ Gemini ${modelName} failed for prediction:`, error.message);
      lastError = error;
    }
  }
  throw lastError || new Error('All Gemini models failed for prediction');
}

/**
 * Get sales forecast for a product
 */
const getForecast = async (req, res) => {
  try {
    const { productId, days = 7 } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId is required' });

    const historicalSales = await salesData.getSalesByProduct(productId);
    if (historicalSales.length === 0) return res.status(404).json({ error: 'No sales data found' });

    const prompt = `
Given the following 7-day historical sales data:
${JSON.stringify(historicalSales)}

Provide a sales forecast for the next ${days} days.
Return ONLY valid JSON:
{
  "averageDailySales": number,
  "forecasts": [
    { "date": "YYYY-MM-DD", "predictedQuantity": number }
  ]
}`;

    const aiResult = await queryGeminiAPI(prompt);

    res.json({
      success: true,
      productId,
      data: {
        ...aiResult,
        totalPredictedSales: Math.round(aiResult.forecasts.reduce((sum, f) => sum + (f.predictedQuantity || 0), 0))
      }
    });
  } catch (error) {
    console.error('Error generating forecast:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Predict stock-out days
 */
const predictStockout = async (req, res) => {
  try {
    const { productId, currentStock } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId is required' });

    let stock = currentStock;
    if (stock === undefined) {
      const stockData = await salesData.getProductStock(productId);
      if (!stockData) return res.status(404).json({ error: 'Product not found' });
      stock = stockData.currentStock;
    }

    const historicalSales = await salesData.getSalesByProduct(productId);
    if (historicalSales.length === 0) {
      return res.json({ success: true, data: { status: 'no_sales_data' } });
    }

    const prompt = `
Inventory evaluation for Product ${productId} with current stock: ${stock}.
Sales history: ${JSON.stringify(historicalSales)}

Analyze these sales against the current stock.
Output STRICT JSON only:
{
  "averageDailySales": number,
  "daysUntilStockout": number
}`;

    const aiResult = await queryGeminiAPI(prompt);
    const daysUntilStockout = aiResult.daysUntilStockout || 0;

    const stockoutDate = new Date();
    stockoutDate.setDate(stockoutDate.getDate() + daysUntilStockout);

    res.json({
      success: true,
      data: {
        productId,
        currentStock: stock,
        averageDailySales: aiResult.averageDailySales,
        daysUntilStockout: Number(daysUntilStockout.toFixed(1)),
        stockoutDate: stockoutDate.toISOString().split('T')[0],
        status: daysUntilStockout <= 3 ? 'critical' : (daysUntilStockout <= 7 ? 'warning' : 'safe')
      }
    });
  } catch (error) {
    console.error('Error predicting stockout:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get predictions for all products
 */
const getAllProductsPredictions = async (req, res) => {
  try {
    const aggregatedSales = salesData.getAggregatedSales();
    const predictions = [];
    // Just a placeholder/simplified version of the previous heavy loop for now
    // In real app, you'd batch this or use job workers
    res.json({ success: true, message: 'Predictions engine is ready using Gemini', count: aggregatedSales.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getForecast,
  predictStockout,
  getAllProductsPredictions
};
