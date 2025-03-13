import { useState, useEffect } from 'react';
import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';
import { configureBackgroundRemoval, modelFiles } from './BackgroundRemovalConfig';

const BackgroundRemovalTest = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debug, setDebug] = useState([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const checkLibraryAvailability = async () => {
      try {
        addDebugMessage('Checking background removal library availability...');
        const success = await configureBackgroundRemoval();
        if (success) {
          setInitialized(true);
          addDebugMessage('Background removal library is available');
        } else {
          throw new Error('Library not available');
        }
      } catch (err) {
        addDebugMessage(`ERROR: ${err.message}`);
        setError(`Failed to initialize background removal: ${err.message}`);
      }
    };

    checkLibraryAvailability();
  }, []);

  const addDebugMessage = (message) => {
    setDebug(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

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

    if (!initialized) {
      addDebugMessage('Background removal library not initialized');
      setError('Background removal library not initialized. Please refresh and try again.');
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

      // Network test - check if we can access model files
      try {
        addDebugMessage('Testing network access to model files...');
        const response = await fetch(modelFiles.onnxModelUrl, { method: 'HEAD' });
        addDebugMessage(`Model file access test: ${response.status} ${response.statusText}`);
      } catch (netError) {
        addDebugMessage(`Network test failed: ${netError.message}`);
        // Continue anyway, as the library might have its own way to access files
      }

      // Set up configuration options with progress callback
      const config = {
        debug: true,
        progress: (progress) => {
          addDebugMessage(`Progress: ${Math.round(progress * 100)}%`);
        },
        // Use a proxy for assets to avoid CORS issues
        proxyToAssetUrl: (url) => `/api/proxy-asset?url=${encodeURIComponent(url)}`
      };

      // Use imgly background removal with config
      addDebugMessage('Calling imglyRemoveBackground');
      const result = await imglyRemoveBackground(blob, config);
      
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
      
      // Add more diagnostic information about the error
      if (error.cause) {
        addDebugMessage(`Error cause: ${error.cause}`);
      }
      
      if (error.stack) {
        const stackLines = error.stack.split('\n').slice(0, 3).join('\n');
        addDebugMessage(`Stack trace: ${stackLines}`);
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
      <h1 className="text-2xl font-bold mb-4">Background Removal Test</h1>
      
      <div className="mb-4">
        <div className="p-3 bg-blue-100 text-blue-800 rounded-md mb-4">
          <p>Status: {initialized ? 'Library detected ✅' : 'Checking library...'}</p>
          {!initialized && <p>Please wait for library check to complete</p>}
        </div>
        
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
            disabled={loading || !initialized}
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
};

export default BackgroundRemovalTest; 