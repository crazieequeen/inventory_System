const salesData = require('../models/salesDataDB');

/**
 * Helper to query Grok (or Groq) API compatible endpoints
 */
async function queryGrokAPI(promptText) {
  const apiKey = process.env.GROK_API_KEY || process.env.GROQ_API_KEY || 'your_api_key_here';
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
        { role: 'system', content: 'You are an inventory data science AI. Return strictly parsable JSON object.' },
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
    throw new Error('AI returned non-JSON response');
  }
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
Given the historical sales data: ${JSON.stringify(historicalSales)}
Provide a sales forecast for the next ${days} days.
Return ONLY valid JSON: { "averageDailySales": number, "forecasts": [{ "date": "YYYY-MM-DD", "predictedQuantity": number }] }`;

    const aiResult = await queryGrokAPI(prompt);

    res.json({
      success: true,
      productId,
      data: {
        ...aiResult,
        totalPredictedSales: Math.round(aiResult.forecasts.reduce((sum, f) => sum + (f.predictedQuantity || 0), 0))
      }
    });
  } catch (error) {
    console.error('Error in Groq forecast:', error);
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
      stock = stockData ? stockData.currentStock : 0;
    }

    const historicalSales = await salesData.getSalesByProduct(productId);
    const prompt = `
Inventory evaluate Product ${productId} (Stock: ${stock}).
Sales: ${JSON.stringify(historicalSales)}
Output strictly JSON: { "averageDailySales": number, "daysUntilStockout": number }`;

    const aiResult = await queryGrokAPI(prompt);
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
    res.status(500).json({ error: error.message });
  }
};

/**
 * Placeholder for all products
 */
const getAllProductsPredictions = async (req, res) => {
  res.json({ success: true, message: 'Groq engine is active for predictions' });
};

module.exports = {
  getForecast,
  predictStockout,
  getAllProductsPredictions
};
