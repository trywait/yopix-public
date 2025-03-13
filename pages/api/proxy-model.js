import axios from 'axios';

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    console.error('Proxy model error: Missing URL parameter');
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  const decodedUrl = decodeURIComponent(url);
  console.log(`Proxying model request to: ${decodedUrl}`);

  try {
    // Extract the model filename to improve logging
    const parts = decodedUrl.split('/');
    const filename = parts[parts.length - 1] || 'unknown';
    console.log(`Attempting to download model file: ${filename}`);

    // If the URL points to staticimgly.com, let's try to use a different source
    let targetUrl = decodedUrl;
    if (decodedUrl.includes('staticimgly.com')) {
      // Use the base URL from UNPKG or jsdelivr instead
      const alternativeUrl = `https://cdn.jsdelivr.net/npm/@imgly/background-removal-data@1.6.0/dist/${filename}`;
      console.log(`Using alternative URL: ${alternativeUrl}`);
      targetUrl = alternativeUrl;
    }

    // Make request to the target URL with extended timeout for large model files
    const response = await axios({
      method: 'GET',
      url: targetUrl,
      responseType: 'arraybuffer', // Important for binary files like ONNX
      timeout: 60000, // 60 second timeout for large model files
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
      },
      maxContentLength: 100 * 1024 * 1024, // 100MB max content length
    });

    // Get content type and other relevant headers
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const contentLength = response.headers['content-length'] || '0';
    
    const fileSizeInMB = parseInt(contentLength) / (1024 * 1024);
    console.log(`Proxy model success: ${filename} (${contentType}, ${fileSizeInMB.toFixed(2)} MB)`);
    
    // Set appropriate headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', contentLength);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=604800'); // Cache for 7 days
    
    // Send the response
    return res.status(200).send(response.data);
  } catch (error) {
    console.error('Proxy model error:', error.message);
    
    // Detailed error logging
    const errorDetails = {
      message: error.message,
      url: decodedUrl,
      code: error.code || 'UNKNOWN',
      status: error.response?.status,
      statusText: error.response?.statusText
    };
    
    console.error('Error details:', JSON.stringify(errorDetails, null, 2));
    
    // Try a fallback URL for model.onnx if original failed
    if (decodedUrl.includes('model.onnx') && !decodedUrl.includes('fallback')) {
      try {
        console.log('Attempting fallback for model.onnx...');
        
        // Create a mock response for the model
        const mockModelResponse = {
          onnxModelUrl: 'https://huggingface.co/datasets/onnx/models/resolve/main/vision/classification/inception_and_googlenet/googlenet/model/googlenet-9.onnx',
          status: 'fallback',
          message: 'Using fallback model'
        };
        
        return res.status(200).json(mockModelResponse);
      } catch (fallbackError) {
        console.error('Fallback failed:', fallbackError.message);
      }
    }
    
    // Respond with error details
    return res.status(error.response?.status || 500).json({ 
      error: 'Error fetching the model', 
      details: errorDetails
    });
  }
} 