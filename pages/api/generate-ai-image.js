import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    
    // Use the correct model for image generation
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp-image-generation",
      generationConfig: {
        responseModalities: ['Text', 'Image'],
        temperature: 0.1
      },
    });
    
    // Craft the prompt with specific requirements
    const enhancedPrompt = `generate a simple 8bit pixel image of a ${prompt} with large pixels, centered on a white background. Follow these specific requirements:
    - Use bold, clear shapes with minimal details
    - Ensure the image is perfectly square (1:1 aspect ratio)
    - Make the subject instantly recognizable at 16x16 pixels
    - Avoid complex textures or gradients
    - Use high contrast between the subject and the white background
    - Limit the color palette to 8-10 colors maximum
    - Focus on creating a strong, readable silhouette
    - Keep the style consistent with classic 8-bit pixel art`;

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
    res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.message 
    });
  }
} 