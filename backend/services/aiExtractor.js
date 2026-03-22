const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Extract structured data from bill text using AI
 */
const extractDataWithAI = async (extractedText) => {
  // Try different model names in order (updated for March 2026)
  const modelNames = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-flash-latest',
    'gemini-1.5-flash'
  ];

  let lastError = null;

  for (const modelName of modelNames) {
    try {
      console.log(`🤖 Trying AI model: ${modelName}...`);

      // Check if API key exists
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
        console.log('⚠️ No valid Gemini API key found, skipping AI models...');
        break;
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

EXAMPLE INPUT:
Apple (2 lbs)          1 x $1.00
Milk (1 gallon)        1 x $1.50
Eggs (Dozen)           2 x $2.00
Total: $6.50

EXAMPLE OUTPUT:
{
  "items": [
    {"name": "Apple (2 lbs)", "quantity": 1, "price": 1.00},
    {"name": "Milk (1 gallon)", "quantity": 1, "price": 1.50},
    {"name": "Eggs (Dozen)", "quantity": 2, "price": 2.00}
  ]
}

BILL TEXT TO EXTRACT FROM:
${extractedText}

Return ONLY the JSON object, nothing else.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log(`✅ AI model ${modelName} worked!`);
      console.log('🤖 AI Response:', text);

      // Extract JSON from response (handle markdown code blocks)
      let jsonText = text.trim();

      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }

      // Parse JSON
      const data = JSON.parse(jsonText);

      // Validate structure
      if (!data.items || !Array.isArray(data.items)) {
        throw new Error('Invalid JSON structure from AI');
      }

      // Validate each item
      const validItems = data.items.filter(item => {
        // Must have name and quantity
        if (!item.name || typeof item.name !== 'string' || !item.quantity) {
          return false;
        }

        // Parse quantity if it's a string
        if (typeof item.quantity === 'string') {
          item.quantity = parseInt(item.quantity) || 1;
        }

        // Parse price safely
        if (item.price !== undefined) {
          if (typeof item.price === 'string') {
            item.price = parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0;
          }
        } else {
          item.price = 0;
        }

        // Quantity must be positive and reasonable
        if (item.quantity <= 0 || item.quantity > 1000) {
          return false;
        }

        // Filter out prices, dates, and other non-product text
        const name = item.name.trim();

        // Reject if it looks like a price ($4.00, $4 00, 4.00, etc.)
        if (/^\$?\d+[\s.]?\d*$/.test(name)) {
          console.log(`⚠️ Rejected price as product: ${name}`);
          return false;
        }

        // Reject if it looks like a date (DATE, 2026-03-04, etc.)
        if (/^(DATE|date|\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})$/i.test(name)) {
          console.log(`⚠️ Rejected date as product: ${name}`);
          return false;
        }

        // Reject if it's too short (less than 3 characters)
        if (name.length < 3) {
          console.log(`⚠️ Rejected too short: ${name}`);
          return false;
        }

        // Reject if it's just numbers
        if (/^\d+$/.test(name)) {
          console.log(`⚠️ Rejected number as product: ${name}`);
          return false;
        }

        return true;
      });

      console.log(`✅ AI extracted ${validItems.length} valid items`);

      return { items: validItems };

    } catch (error) {
      console.log(`⚠️ Model ${modelName} failed:`, error.message);
      lastError = error;
      // Continue to next model
      continue;
    }
  }

  // All models failed, try fallback extraction
  console.log('⚠️ All AI models failed, attempting manual extraction...');
  try {
    const fallbackResult = attemptManualExtraction(extractedText);

    // Apply same validation as AI path
    const validItems = fallbackResult.items.filter(item => {
      // Must have name and quantity
      if (!item.name || typeof item.name !== 'string' || !item.quantity) {
        return false;
      }

      if (typeof item.quantity === 'string') {
        item.quantity = parseInt(item.quantity) || 1;
      }

      // Parse price safely
      if (item.price !== undefined) {
        if (typeof item.price === 'string') {
          item.price = parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0;
        }
      } else {
        item.price = 0;
      }

      // Quantity must be positive and reasonable
      if (item.quantity <= 0 || item.quantity > 1000) {
        return false;
      }

      // Filter out prices, dates, and other non-product text
      const name = item.name.trim();

      // Reject if it looks like a price ($4.00, $4 00, 4.00, etc.)
      if (/^\$?\d+[\s.]?\d*$/.test(name)) {
        console.log(`⚠️ Rejected price as product: ${name}`);
        return false;
      }

      // Reject if it looks like a date (DATE, date, 2026-03-04, etc.)
      if (/^(DATE|date|\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})$/i.test(name)) {
        console.log(`⚠️ Rejected date as product: ${name}`);
        return false;
      }

      // Reject if it's too short (less than 3 characters)
      if (name.length < 3) {
        console.log(`⚠️ Rejected too short: ${name}`);
        return false;
      }

      // Reject if it's just numbers
      if (/^\d+$/.test(name)) {
        console.log(`⚠️ Rejected number as product: ${name}`);
        return false;
      }

      return true;
    });

    console.log(`✅ After validation: ${validItems.length} valid items`);
    return { items: validItems };

  } catch (fallbackError) {
    throw new Error('Failed to extract data with AI: ' + (lastError?.message || 'Unknown error'));
  }
};

/**
 * Fallback: Manual extraction if AI fails
 */
const attemptManualExtraction = (text) => {
  console.log('🔧 Using fallback extraction...');
  console.log('📝 Text to parse:');
  console.log(text);

  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const items = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip header/footer lines
    if (/^(store|receipt|cashier|date|time|subtotal|tax|total|thank|phone|street|city)/i.test(trimmedLine)) {
      continue;
    }

    // Skip lines that are just prices or numbers
    if (/^\$?\d+[\s.,]?\d*$/.test(trimmedLine)) {
      continue;
    }

    // Skip separator lines
    if (/^[-=_]+$/.test(trimmedLine)) {
      continue;
    }

    // Pattern 1: "Apple (2 lbs)    1 x $1.00" - Extract product and quantity before × or x
    let match = trimmedLine.match(/^([a-zA-Z\s()0-9\-]+?)\s+(\d+)\s*[×xX]\s*\$?\s*([0-9.]+)/);
    if (match) {
      const name = match[1].trim();
      const quantity = parseInt(match[2]);
      const price = parseFloat(match[3]);

      if (name.length >= 3 && quantity > 0 && quantity <= 1000) {
        items.push({ name, quantity, price });
        console.log(`✅ Extracted (Pattern 1 with price): ${name} - ${quantity} @ $${price}`);
        continue;
      }
    }

    // Pattern 2: "Milk (1 gallon)    $3.50" - Single item (quantity = 1) no x
    match = trimmedLine.match(/^([a-zA-Z\s()0-9\-]+?)\s+\$?\s*([0-9.]+)$/);
    if (match) {
      const name = match[1].trim();
      const quantity = 1;
      const price = parseFloat(match[2]);

      // Prevent simple number patterns from matching as names incorrectly if they have no text
      if (name.length >= 3 && /[a-zA-Z]/.test(name)) {
        items.push({ name, quantity, price });
        console.log(`✅ Extracted (Pattern 2 with price): ${name} - ${quantity} @ $${price}`);
        continue;
      }
    }

    // Pattern 3: "Product Name    25" (product name followed by spaces and number at end - quantity only fallback)
    match = trimmedLine.match(/^([a-zA-Z\s()]+?)\s{2,}(\d+)\s*$/);
    if (match) {
      const name = match[1].trim();
      const quantity = parseInt(match[2]);

      if (name.length >= 3 && quantity > 0 && quantity <= 1000) {
        items.push({ name, quantity });
        console.log(`✅ Extracted (Pattern 3): ${name} - ${quantity}`);
        continue;
      }
    }

    // Pattern 4: "Product Name - 25" or "Product Name: 25"
    match = trimmedLine.match(/^([a-zA-Z\s()]+?)\s*[-:]\s*(\d+)\s*$/);
    if (match) {
      const name = match[1].trim();
      const quantity = parseInt(match[2]);

      if (name.length >= 3 && quantity > 0 && quantity <= 1000) {
        items.push({ name, quantity });
        console.log(`✅ Extracted (Pattern 4): ${name} - ${quantity}`);
        continue;
      }
    }

    // Pattern 5: "25 x Product Name" or "25 Product Name"
    match = trimmedLine.match(/^(\d+)\s*[×x]?\s+([a-zA-Z\s()]+)$/i);
    if (match) {
      const quantity = parseInt(match[1]);
      const name = match[2].trim();

      if (name.length >= 3 && quantity > 0 && quantity <= 1000 && !/^\d+$/.test(name) && !name.includes('$')) {
        items.push({ name, quantity });
        console.log(`✅ Extracted (Pattern 5): ${name} - ${quantity}`);
        continue;
      }
    }
  }

  console.log(`✅ Fallback extracted ${items.length} items`);
  return { items };
};

module.exports = {
  extractDataWithAI
};
