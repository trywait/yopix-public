import axios from 'axios';

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    console.error('Proxy error: Missing URL parameter');
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  const decodedUrl = decodeURIComponent(url);
  console.log(`Proxying request to: ${decodedUrl}`);

  try {
    // Make request to the target URL with timeout and proper headers
    const response = await axios({
      method: 'GET',
      url: decodedUrl,
      responseType: 'arraybuffer', // Important for binary files like WASM and ONNX
      timeout: 30000, // 30 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
      },
      maxContentLength: 50 * 1024 * 1024, // 50MB max content length
    });

    // Get content type and other relevant headers
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const contentLength = response.headers['content-length'] || '0';
    
    console.log(`Proxy success: ${decodedUrl} (${contentType}, ${contentLength} bytes)`);
    
    // Set appropriate headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', contentLength);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    // Send the response
    return res.status(200).send(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    
    // Detailed error logging
    const errorDetails = {
      message: error.message,
      url: decodedUrl,
      code: error.code || 'UNKNOWN',
      status: error.response?.status,
      statusText: error.response?.statusText
    };
    
    console.error('Error details:', JSON.stringify(errorDetails, null, 2));
    
    // Respond with error details
    return res.status(error.response?.status || 500).json({ 
      error: 'Error fetching the resource', 
      details: errorDetails
    });
  }
} 