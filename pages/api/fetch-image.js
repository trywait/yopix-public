import axios from 'axios';

// Function to check if GIF data is animated
const isAnimatedGifBuffer = (buffer) => {
  // Convert buffer to Uint8Array for analysis
  const bytes = new Uint8Array(buffer);
  
  // Check if it's a GIF by checking the header (GIF87a or GIF89a)
  const isGif = bytes.length > 6 &&
    bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && // 'GIF'
    bytes[3] === 0x38 && (bytes[4] === 0x39 || bytes[4] === 0x37) && bytes[5] === 0x61; // '89a' or '87a'
  
  if (!isGif) {
    return false;
  }
  
  // Count frames in the GIF
  let frameCount = 0;
  for (let i = 0; i < bytes.length - 3; i++) {
    // Look for graphic control extension blocks
    if (bytes[i] === 0x21 && bytes[i + 1] === 0xF9 && bytes[i + 2] === 0x04) {
      frameCount++;
      if (frameCount > 1) {
        return true; // More than one frame means animated
      }
    }
  }
  
  return false;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  console.log('Received request to fetch image from URL:', url);
  
  if (!url) {
    console.error('No URL provided in request');
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    console.log('Fetching image with axios...');
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        // Some servers check the user agent
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      // Set a timeout to prevent hanging requests
      timeout: 10000
    });
    
    const contentType = response.headers['content-type'];
    console.log('Image fetched successfully, content type:', contentType);
    
    // Check if the content type is GIF, and if so, check if it's animated
    if (contentType.includes('image/gif')) {
      const isAnimated = isAnimatedGifBuffer(response.data);
      if (isAnimated) {
        console.error('Animated GIF detected, rejecting');
        return res.status(400).json({ error: 'Animated GIFs are not supported. Please upload a static image.' });
      }
    }
    
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;
    
    console.log('Image converted to data URL successfully');
    res.status(200).json({ dataUrl });
  } catch (error) {
    console.error('Error fetching image:', error.message);
    
    // Provide a more specific error message
    let errorMessage = 'Failed to fetch image';
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      errorMessage = `Server responded with status ${error.response.status}`;
      console.error('Server response error:', error.response.status);
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = 'No response received from server';
      console.error('No response received from server');
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timed out';
      console.error('Request timed out');
    }
    
    res.status(500).json({ error: errorMessage });
  }
} 