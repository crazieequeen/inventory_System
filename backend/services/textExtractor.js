const Tesseract = require('tesseract.js');

/**
 * Extract text from image using OCR
 */
const extractFromImage = async (buffer) => {
  try {
    console.log('🔍 Starting OCR extraction...');
    
    const result = await Tesseract.recognize(buffer, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    console.log('✅ OCR extraction complete');
    console.log(`📄 Extracted ${result.data.text.length} characters`);
    console.log('📝 EXTRACTED TEXT:');
    console.log('─────────────────────────────────────');
    console.log(result.data.text);
    console.log('─────────────────────────────────────');
    return result.data.text;
  } catch (error) {
    console.error('❌ OCR extraction failed:', error);
    throw new Error('Failed to extract text from image');
  }
};

/**
 * Main extraction function - only supports images
 */
const extractText = async (file) => {
  const { buffer, path, mimetype } = file;
  const source = path || buffer;
  
  console.log(`📋 File type: ${mimetype}`);
  
  if (mimetype && mimetype.startsWith('image/')) {
    return await extractFromImage(source);
  } else {
    throw new Error('Only image files (JPG, PNG) are supported. Please upload a photo of your bill.');
  }
};

module.exports = {
  extractText,
  extractFromImage
};
