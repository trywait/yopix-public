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
const validateInput = (query, page, per_page) => {
  // Validate query
  if (!query || typeof query !== 'string') return false;
  if (query.length > 100) return false; // Max length check
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(query)) return false; // Only allow alphanumeric, spaces, hyphens, and underscores

  // Validate page
  const pageNum = parseInt(page);
  if (isNaN(pageNum) || pageNum < 1 || pageNum > 100) return false;

  // Validate per_page
  const perPageNum = parseInt(per_page);
  if (isNaN(perPageNum) || perPageNum < 1 || perPageNum > 30) return false;

  return true;
};

// Generate cache key
const generateCacheKey = (query, page, per_page) => {
  return `unsplash:${query}:${page}:${per_page}`;
};

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, page = 1, per_page = 24 } = req.query;
  
  // Input validation
  if (!validateInput(query, page, per_page)) {
    return res.status(400).json({ 
      error: 'Invalid input parameters. Query must be a string containing only alphanumeric characters, spaces, hyphens, and underscores, with a maximum length of 100 characters. Page must be between 1 and 100. Per page must be between 1 and 30.' 
    });
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return res.status(500).json({ error: 'Unsplash API key is not configured' });
  }

  try {
    // Check cache first
    const cacheKey = generateCacheKey(query, page, per_page);
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    // Sanitize inputs
    const sanitizedQuery = query.trim().replace(/[^a-zA-Z0-9\s\-_]/g, '');
    const sanitizedPage = Math.min(Math.max(1, parseInt(page)), 100);
    const sanitizedPerPage = Math.min(Math.max(1, parseInt(per_page)), 30);

    // Add timeout to the fetch request
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(sanitizedQuery)}&page=${sanitizedPage}&per_page=${sanitizedPerPage}&content_filter=high`,
      {
        headers: {
          'Authorization': `Client-ID ${accessKey}`,
          'Accept-Version': 'v1'
        },
        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    const data = await response.json();

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 401) {
        return res.status(401).json({ error: 'Invalid API key' });
      }
      if (response.status === 403) {
        return res.status(403).json({ error: 'Rate limit exceeded' });
      }
      throw new Error(data.errors?.[0] || 'Failed to fetch images from Unsplash');
    }

    // Limit the number of results
    const limitedData = {
      ...data,
      results: data.results.slice(0, sanitizedPerPage)
    };

    // Cache the response
    cache.set(cacheKey, limitedData);

    res.status(200).json(limitedData);
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

    res.status(500).json({ error: error.message || 'Failed to search images' });
  }
}

// Apply rate limiting and CORS middleware
export default corsMiddleware(handler); 