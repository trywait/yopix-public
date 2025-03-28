import { NextApiRequest, NextApiResponse } from 'next';
import rateLimit from 'express-rate-limit';
import { createHash } from 'crypto';

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
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
const validateQuery = (query) => {
  if (!query || typeof query !== 'string') return false;
  if (query.length > 100) return false; // Max length check
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(query)) return false; // Only allow alphanumeric, spaces, hyphens, and underscores
  return true;
};

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { query } = req.query;

  // Input validation
  if (!validateQuery(query)) {
    return res.status(400).json({ 
      message: 'Invalid query parameter. Query must be a string containing only alphanumeric characters, spaces, hyphens, and underscores, with a maximum length of 100 characters.' 
    });
  }

  try {
    // Sanitize the query
    const sanitizedQuery = query.trim().replace(/[^a-zA-Z0-9\s\-_]/g, '');
    
    const response = await fetch(
      `https://www.yotoicons.com/icons?tag=${encodeURIComponent(sanitizedQuery)}&sort=popular&type=singles`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Yoto Icons');
    }

    const html = await response.text();
    
    // Extract icon information using regex patterns
    const iconRegex = /<div class="icon" onclick="populate_icon_modal\('(\d+)', '([^']+)', '([^']+)', '([^']*)', '([^']+)', '(\d+)'\);">/g;
    const icons = [];
    let match;

    while ((match = iconRegex.exec(html)) !== null) {
      const [_, id, category, tag1, tag2, author, downloads] = match;
      
      // Validate extracted data
      if (!id || !category || !tag1 || !author) continue;
      
      // Find the corresponding image URL in the HTML
      const imgMatch = html.match(new RegExp(`<img src="/static/uploads/${id}\.png">`));
      if (imgMatch) {
        icons.push({
          id,
          title: tag1,
          category,
          tags: [tag1, tag2].filter(Boolean),
          author,
          downloads: parseInt(downloads),
          previewUrl: `https://www.yotoicons.com/static/uploads/${id}.png`,
          downloadUrl: `https://www.yotoicons.com/static/uploads/${id}.png`
        });
      }
    }

    // Limit the number of returned icons
    const limitedIcons = icons.slice(0, 50);

    return res.status(200).json({ icons: limitedIcons });
  } catch (error) {
    console.error('Error fetching Yoto Icons:', error);
    return res.status(500).json({ message: 'Failed to fetch icons' });
  }
}

// Apply rate limiting and CORS middleware
export default corsMiddleware(handler); 