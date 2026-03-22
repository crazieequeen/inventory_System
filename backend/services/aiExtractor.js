const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Extract structured data from bill text using AI
 */
const extractDataWithAI = async (extractedText) => {
  // Try different model names in order
  const modelNames = [
    'gemini-1.5-flash',
    'gemini-pro'
  ];

  let lastError = null;

  for (const modelName of modelNames) {
    try {
      console.log(`🤖 Extraction using Gemini model: ${modelName}...`);

      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY missing in environment variables');
      }

      const model = genAI.getGenerativeModel({ model: modelName });

      const prompt = `
You are a data extraction assistant. Extract product information from the following purchase bill/invoice text.

CRITICAL RULES:
1. Extract product names, their quantities, AND their unit prices.
2. Product names are DESCRIPTIVE TEXT (e.g., "Fresh Milk 1L", "White Bread", "Eggs Dozen", "Apple (2 lbs)")
3. DO NOT extract dates or invoice numbers as product names.
4. Quantities are WHOLE NUMBERS representing units purchased.
5. Prices should be NUMBER format (e.g. 1.00) without currency symbols. Provide the UNIT PRICE or TOTAL PRICE for that row.
6. Return STRICTLY valid JSON format with NO additional text.

REQUIRED JSON FORMAT:
{
  "items": [
    {
      "name": "Product Name Here",
      "quantity": 1,
      "price": 1.00
    }
  ]
}

BILL TEXT TO EXTRACT FROM:
${extractedText}

Return ONLY the JSON object, nothing else.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in AI response');

      const data = JSON.parse(jsonMatch[0]);

      if (!data.items || !Array.isArray(data.items)) {
        throw new Error('Invalid JSON structure from Gemini');
      }

      console.log(`✅ Gemini extracted ${data.items.length} items`);
      return data;

    } catch (error) {
      console.warn(`⚠️ Gemini ${modelName} failed:`, error.message);
      lastError = error;
      continue;
    }
  }

  // Final fallback
  return attemptManualExtraction(extractedText);
};

/**
 * Fallback: Manual extraction if AI fails
 */
const attemptManualExtraction = (text) => {
  console.log('🔧 Using fallback extraction...');
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const items = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    // Simple regex patterns as before
    let match = trimmedLine.match(/^([a-zA-Z\s()0-9\-]+?)\s+(\d+)\s*[×xX]\s*\$?\s*([0-9.]+)/);
    if (match) {
      items.push({ name: match[1].trim(), quantity: parseInt(match[2]), price: parseFloat(match[3]) });
      continue;
    }
    match = trimmedLine.match(/^([a-zA-Z\s()0-9\-]+?)\s+\$?\s*([0-9.]+)$/);
    if (match) {
      items.push({ name: match[1].trim(), quantity: 1, price: parseFloat(match[2]) });
    }
  }

  return { items };
};

module.exports = {
  extractDataWithAI
};
