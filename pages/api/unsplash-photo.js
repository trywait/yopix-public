import rateLimit from 'express-rate-limit';
import { LRUCache } from 'lru-cache';

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Cache configuration (5 minutes, max 100 items)
const cache = new LRUCache({
  max: 100,
  ttl: 1000 * 60 * 5, // 5 minutes
  updateAgeOnGet: true,
  updateAgeOnHas: true,
});

// CORS configuration
const corsMiddleware = (handler) => async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
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
const validatePhotoId = (id) => {
  if (!id || typeof id !== 'string') return false;
  if (id.length > 50) return false; // Max length check
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) return false; // Only allow alphanumeric, hyphens, and underscores
  return true;
};

// Generate cache key
const generateCacheKey = (id) => {
  return `unsplash:photo:${id}`;
};

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  
  // Input validation
  if (!validatePhotoId(id)) {
    return res.status(400).json({ 
      error: 'Invalid photo ID. ID must be a string containing only alphanumeric characters, hyphens, and underscores, with a maximum length of 50 characters.' 
    });
  }

  try {
    // Check cache first
    const cacheKey = generateCacheKey(id);
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    
    if (!accessKey) {
      console.error('Unsplash API key is missing');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const headers = {
      'Accept-Version': 'v1',
      'Authorization': `Client-ID ${accessKey}`
    };

    // Add timeout to the requests
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    // First, get the photo details
    const photoResponse = await fetch(`https://api.unsplash.com/photos/${id}`, {
      headers,
      signal: controller.signal
    });

    if (!photoResponse.ok) {
      if (photoResponse.status === 401) {
        return res.status(401).json({ error: 'Invalid API key' });
      }
      if (photoResponse.status === 403) {
        return res.status(403).json({ error: 'Rate limit exceeded' });
      }
      throw new Error(`Failed to fetch photo details: ${photoResponse.statusText}`);
    }

    const photoData = await photoResponse.json();

    // Track the download to comply with Unsplash API guidelines
    await fetch(photoData.links.download_location, {
      headers,
      signal: controller.signal
    });

    // Use the regular size image (better for pixelation)
    const imageUrl = photoData.urls.regular;
    
    // Fetch the image and convert to data URL
    const imageResponse = await fetch(imageUrl, {
      signal: controller.signal
    });

    if (!imageResponse.ok) {
      throw new Error('Failed to fetch image data');
    }

    const contentType = imageResponse.headers.get('content-type');
    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;
    
    clearTimeout(timeout);

    const response = { 
      dataUrl,
      photographer: {
        name: photoData.user.name,
        username: photoData.user.username,
        link: photoData.user.links.html
      },
      unsplashLink: photoData.links.html
    };

    // Cache the response
    cache.set(cacheKey, response);
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Unsplash API error:', error);
    
    // Handle specific error cases
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timeout' });
    }
    
    // Rate limit error from our middleware
    if (error.message.includes('Too many requests')) {
      return res.status(429).json({ error: 'Too many requests from this IP' });
    }

    res.status(500).json({ error: error.message || 'Failed to fetch image' });
  }
}

// Apply rate limiting and CORS middleware
export default corsMiddleware(handler); 