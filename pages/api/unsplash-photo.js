import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'Photo ID is required' });
  }

  try {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    
    if (!accessKey) {
      console.error('Unsplash API key is missing');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const headers = {
      'Accept-Version': 'v1',
      'Authorization': `Client-ID ${accessKey}`
    };

    // First, get the photo details
    const photoResponse = await axios.get(`https://api.unsplash.com/photos/${id}`, {
      headers
    });

    // Track the download to comply with Unsplash API guidelines
    await axios.get(photoResponse.data.links.download_location, {
      headers
    });

    // Use the regular size image (better for pixelation)
    const imageUrl = photoResponse.data.urls.regular;
    
    // Fetch the image and convert to data URL
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer'
    });
    
    const contentType = imageResponse.headers['content-type'];
    const base64 = Buffer.from(imageResponse.data, 'binary').toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;
    
    res.status(200).json({ 
      dataUrl,
      photographer: {
        name: photoResponse.data.user.name,
        username: photoResponse.data.user.username,
        link: photoResponse.data.user.links.html
      },
      unsplashLink: photoResponse.data.links.html
    });
  } catch (error) {
    let errorMessage = 'Failed to fetch image';
    let statusCode = 500;

    if (error.response) {
      errorMessage = `Unsplash API error: ${error.response.status} - ${error.response.statusText}`;
      statusCode = error.response.status;
    }
    
    res.status(statusCode).json({ error: errorMessage });
  }
} 