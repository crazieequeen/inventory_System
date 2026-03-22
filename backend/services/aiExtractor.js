const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI (Optional)
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

/**
 * Extract structured data from bill text using AI
 */
const extractDataWithAI = async (extractedText) => {
  // 1. Try Groq first as it's the primary provider for this app
  const groqKey = process.env.GROK_API_KEY || process.env.GROQ_API_KEY;
  if (groqKey && groqKey !== 'your_api_key_here') {
    try {
      console.log('🤖 Extracting with Groq AI...');
      const prompt = `
Extract product data from this bill text. Return ONLY valid JSON in this exact structure:
{
  "items": [
    { "name": "string", "quantity": number, "price": number }
  ]
}

BILL TEXT:
${extractedText}`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are an inventory extraction assistant. Output STRICT JSON only.' },
            { role: 'user', content: prompt }
          ],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.1,
          response_format: { type: 'json_object' }
        })
      });

      const data = await response.json();
      if (data.choices && data.choices[0].message.content) {
        const raw = data.choices[0].message.content.trim();
        const parsed = JSON.parse(raw);
        if (parsed.items && Array.isArray(parsed.items)) {
          console.log(`✅ Groq extraction successful: ${parsed.items.length} items`);
          return parsed;
        }
      }
    } catch (e) {
      console.error('⚠️ Groq extraction failed:', e.message);
    }
  }

  // 2. Try Gemini if configured
  if (genAI) {
    const modelNames = ['gemini-2.0-flash', 'gemini-1.5-flash'];
    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const prompt = `Extract product data from this bill text. Return JSON: { "items": [{ "name": "string", "quantity": number, "price": number }] } \n\n TEXT: ${extractedText}`;
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.items) return parsed;
        }
      } catch (e) {
        console.error(`⚠️ Gemini ${modelName} failed:`, e.message);
      }
    }
  }

  // 3. Fallback: Manual extraction if all AI fails
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

    // Skip header/footer lines
    if (/^(store|receipt|cashier|date|time|subtotal|tax|total|thank|phone|street|city)/i.test(trimmedLine)) {
      continue;
    }

    // Pattern 1: "Apple (2 lbs)    1 x $1.00"
    let match = trimmedLine.match(/^([a-zA-Z\s()0-9\-]+?)\s+(\d+)\s*[×xX]\s*\$?\s*([0-9.]+)/);
    if (match) {
      items.push({ name: match[1].trim(), quantity: parseInt(match[2]), price: parseFloat(match[3]) });
      continue;
    }

    // Pattern 2: "Milk (1 gallon)    $3.50"
    match = trimmedLine.match(/^([a-zA-Z\s()0-9\-]+?)\s+\$?\s*([0-9.]+)$/);
    if (match) {
      items.push({ name: match[1].trim(), quantity: 1, price: parseFloat(match[2]) });
      continue;
    }

    // Simple fallback for quantity only
    match = trimmedLine.match(/^([a-zA-Z\s()]+?)\s{2,}(\d+)\s*$/);
    if (match) {
      items.push({ name: match[1].trim(), quantity: parseInt(match[2]), price: 0 });
    }
  }

  return { items };
};

module.exports = {
  extractDataWithAI
};
