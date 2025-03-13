import { useState, useEffect } from 'react';
import { removeBackground } from '@imgly/background-removal';

export default function BgTest() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debug, setDebug] = useState([]);

  const addDebugMessage = (message) => {
    console.log(message); // Also log to console for easier debugging
    setDebug(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Check if the library is available on mount
  useEffect(() => {
    try {
      addDebugMessage('Checking if removeBackground function exists...');
      if (typeof removeBackground === 'function') {
        addDebugMessage('✅ removeBackground function exists');
      } else {
        addDebugMessage('❌ removeBackground is not a function');
        setError('removeBackground is not available');
      }
    } catch (err) {
      addDebugMessage(`❌ Error checking library: ${err.message}`);
      setError(`Error: ${err.message}`);
    }
  }, []);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setProcessedImage(null);
      setError(null);
      setDebug([]);
      addDebugMessage(`Selected image: ${file.name}`);
    }
  };

  const handleRemoveBackground = async () => {
    if (!selectedImage) {
      addDebugMessage('No image selected');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      addDebugMessage('Starting background removal process');

      // Load the image
      const img = await loadImage(selectedImage);
      addDebugMessage(`Image loaded: ${img.width}x${img.height}`);

      // Create canvas and convert to blob
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // Get the image as PNG blob
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/png', 1.0);
      });

      if (!blob) {
        throw new Error('Failed to create image blob');
      }
      
      addDebugMessage(`Image converted to blob: ${Math.round(blob.size / 1024)} KB`);

      // Set up configuration options
      const config = {
        debug: true,
        progress: (progress) => {
          addDebugMessage(`Progress: ${Math.round(progress * 100)}%`);
        },
        proxyToAssetUrl: (url) => `/api/proxy-asset?url=${encodeURIComponent(url)}`
      };

      // Use removeBackground with config
      addDebugMessage('Calling removeBackground...');
      const result = await removeBackground(blob, config);
      
      addDebugMessage('Background removal completed successfully');
      
      if (!result) {
        throw new Error('Background removal returned no result');
      }

      const url = URL.createObjectURL(result);
      setProcessedImage(url);
      addDebugMessage('Image processed and displayed');
      
    } catch (error) {
      console.error('Error removing background:', error);
      setError('Failed to remove background: ' + error.message);
      addDebugMessage(`ERROR: ${error.message}`);
      
      if (error.stack) {
        console.error('Stack trace:', error.stack);
        const stackLines = error.stack.split('\n').slice(0, 3).join('\n');
        addDebugMessage(`Stack: ${stackLines}`);
      }
      
    } finally {
      setLoading(false);
    }
  };

  // Helper function to load an image
  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error(`Failed to load image: ${e}`));
      img.src = src;
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Simple Background Removal Test</h1>
      
      <div className="mb-4">
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleImageChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>
      
      {selectedImage && (
        <div className="mb-4">
          <button 
            onClick={handleRemoveBackground}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-blue-300"
          >
            {loading ? 'Processing...' : 'Remove Background'}
          </button>
        </div>
      )}
      
      <div className="flex flex-wrap gap-4">
        {selectedImage && (
          <div className="border p-2">
            <h2 className="text-lg font-semibold mb-2">Original Image</h2>
            <img src={selectedImage} alt="Original" className="max-w-sm max-h-80 object-contain" />
          </div>
        )}
        
        {processedImage && (
          <div className="border p-2">
            <h2 className="text-lg font-semibold mb-2">Processed Image</h2>
            <img src={processedImage} alt="Processed" className="max-w-sm max-h-80 object-contain" />
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Debug Log</h2>
        <div className="bg-gray-100 p-3 rounded-md h-60 overflow-y-auto">
          {debug.length > 0 ? (
            <ul className="list-disc pl-5">
              {debug.map((msg, idx) => (
                <li key={idx} className="text-sm font-mono">{msg}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No debug messages yet</p>
          )}
        </div>
      </div>
    </div>
  );
} 