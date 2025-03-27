import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ message: 'Query parameter is required' });
  }

  try {
    const response = await fetch(
      `https://www.yotoicons.com/icons?tag=${query}&sort=popular&type=singles`
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

    return res.status(200).json({ icons });
  } catch (error) {
    console.error('Error fetching Yoto Icons:', error);
    return res.status(500).json({ message: 'Failed to fetch icons' });
  }
} 