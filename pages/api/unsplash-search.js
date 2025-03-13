import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, page = 1, per_page = 24 } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return res.status(500).json({ error: 'Unsplash API key is not configured' });
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${per_page}&content_filter=high`,
      {
        headers: {
          'Authorization': `Client-ID ${accessKey}`,
          'Accept-Version': 'v1'
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errors?.[0] || 'Failed to fetch images from Unsplash');
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Unsplash API error:', error);
    res.status(500).json({ error: error.message || 'Failed to search images' });
  }
} 