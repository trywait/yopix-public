import { GoogleGenerativeAI } from "@google/generative-ai";
import { strictLimiter, withRateLimit } from '../../lib/rate-limit';

// CORS configuration
const corsMiddleware = (handler) => async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  return handler(req, res);
};

// Input validation
const validatePrompt = (prompt) => {
  if (!prompt || typeof prompt !== 'string') return false;
  if (prompt.length > 500) return false; // Max length check
  if (!/^[a-zA-Z0-9\s\-_.,!?()]+$/.test(prompt)) return false; // Only allow safe characters
  return true;
};

// Helper function to enhance the prompt
const enhancePrompt = (prompt) => {
  return `Create a pixel art style image of: ${prompt}. Make it simple and iconic, suitable for a 16x16 pixel grid.`;
};

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    // Input validation
    if (!validatePrompt(prompt)) {
      return res.status(400).json({ 
        error: 'Invalid prompt. Prompt must be a string containing only alphanumeric characters, spaces, hyphens, underscores, periods, commas, exclamation marks, question marks, and parentheses, with a maximum length of 500 characters.' 
      });
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.error('Google AI API key is missing');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: process.env.NODE_ENV === 'development' 
          ? 'Google AI API key is not configured. Please add GOOGLE_AI_API_KEY to your .env.local file.'
          : undefined
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use the correct model for image generation
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp-image-generation",
      generationConfig: {
        responseModalities: ['Text', 'Image'],
        temperature: 0.1
      },
    });
    
    // Enhance the prompt with our requirements
    const enhancedPrompt = enhancePrompt(prompt);

    // Generate two variations by making separate requests
    const [result1, result2] = await Promise.all([
      model.generateContent(enhancedPrompt),
      model.generateContent(enhancedPrompt)
    ]);

    const response1 = await result1.response;
    const response2 = await result2.response;
    
    // Process both responses to extract images
    const images = [];
    
    // Extract image from first response
    for (const part of response1.candidates[0].content.parts) {
      if (part.inlineData) {
        images.push(part.inlineData.data);
        break; // Only take the first image
      }
    }
    
    // Extract image from second response
    for (const part of response2.candidates[0].content.parts) {
      if (part.inlineData) {
        images.push(part.inlineData.data);
        break; // Only take the first image
      }
    }

    if (images.length === 0) {
      throw new Error('No images were generated');
    }

    res.status(200).json({ 
      images: images
    });
  } catch (error) {
    console.error('Image generation error:', error);
    
    // Handle specific error cases
    let errorMessage = 'Failed to generate image';
    let statusCode = 500;
    
    if (error.message.includes('API key')) {
      errorMessage = 'Invalid API key';
      statusCode = 401;
    } else if (error.message.includes('rate limit') || error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) {
      errorMessage = 'Rate limit exceeded. Please wait a few minutes before trying again, or try using a different method like uploading an image or searching Unsplash.';
      statusCode = 429;
    }

    res.status(statusCode).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: statusCode === 429 ? 'RATE_LIMIT_EXCEEDED' : undefined
    });
  }
}

// Apply rate limiting and CORS middleware
export default corsMiddleware(withRateLimit(handler, strictLimiter)); 