import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import UnsplashSearch from './UnsplashSearch';

const UploadWidget = ({ onImageUpload }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showUnsplashSearch, setShowUnsplashSearch] = useState(false);
  const [attributionInfo, setAttributionInfo] = useState(null);

  // Function to check if a file is an animated GIF
  const isAnimatedGif = async (file) => {
    // First check if it's a GIF by file type
    if (file.type !== 'image/gif') {
      return false;
    }
    
    // Read the file to check for animation
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const arrayBuffer = event.target.result;
        const bytes = new Uint8Array(arrayBuffer);
        
        // Check for multiple image frames in GIF
        // GIF header + Application Extension + Graphic Control Extension
        let frameCount = 0;
        for (let i = 0; i < bytes.length - 3; i++) {
          // Look for graphic control extension blocks
          if (bytes[i] === 0x21 && bytes[i + 1] === 0xF9 && bytes[i + 2] === 0x04) {
            frameCount++;
          }
        }
        
        // If more than one frame, it's an animated GIF
        resolve(frameCount > 1);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setError(null);
      const file = acceptedFiles[0];
      
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      
      // Check if file is an animated GIF
      if (await isAnimatedGif(file)) {
        setError('Animated GIFs are not supported. Please upload a static image.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        setImageUrl('');
        setAttributionInfo(null); // Clear any previous attribution
        onImageUpload(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': []
    },
    maxFiles: 1
  });

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    
    if (!imageUrl.trim()) {
      setError('Please enter an image URL');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching image from URL:', imageUrl);
      
      // Use our server-side API endpoint to fetch the image
      const response = await fetch('/api/fetch-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: imageUrl }),
      });
      
      const data = await response.json();
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        console.error('API error:', data.error);
        throw new Error(data.error || 'Failed to fetch image');
      }
      
      console.log('Image fetched successfully');
      setAttributionInfo(null); // Clear any previous attribution
      onImageUpload(data.dataUrl);
      setIsLoading(false);
    } catch (error) {
      console.error('Error in handleUrlSubmit:', error);
      setError(error.message || 'An error occurred while fetching the image');
      setIsLoading(false);
    }
  };

  // Handle Unsplash image selection
  const handleUnsplashImageSelect = (dataUrl, attribution) => {
    setShowUnsplashSearch(false);
    setAttributionInfo(attribution);
    onImageUpload(dataUrl);
  };

  if (showUnsplashSearch) {
    return (
      <div className="w-full">
        <UnsplashSearch 
          onImageSelect={handleUnsplashImageSelect} 
          onClose={() => setShowUnsplashSearch(false)} 
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div 
        {...getRootProps()} 
        className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-blue-500">Drop the image here...</p>
        ) : (
          <div>
            <p className="mb-2 text-gray-800 font-medium">Drag & drop an image here, or click to select</p>
            <p className="text-sm text-gray-600">Supports JPG, PNG, and static GIF</p>
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="text-center text-gray-600 font-medium mb-2">OR</p>
        <form onSubmit={handleUrlSubmit} className="flex">
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Enter image URL"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            {isLoading ? 'Loading...' : 'Upload'}
          </button>
        </form>
      </div>

      <div className="mt-4">
        <p className="text-center text-gray-600 font-medium mb-2">OR</p>
        <button
          onClick={() => setShowUnsplashSearch(true)}
          className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2 text-gray-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
            <path fill="currentColor" d="M448 230.17V480H0V32h298.084a16.07 16.07 0 0 1 11.315 4.688l134.101 134.101c7.5 7.5 4.484 20.281-6.064 24.826L384.04 230.17H448zm-43.968-44.585l-98.114-98.114c2.066 15.425 15.404 27.11 31.78 27.11h66.334z" />
          </svg>
          Search Unsplash Photos
        </button>
      </div>

      {attributionInfo && (
        <div className="mt-4 p-3 bg-gray-100 text-gray-700 rounded-lg text-xs">
          <p>
            Photo by{' '}
            <a
              href={attributionInfo.photographer.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {attributionInfo.photographer.name}
            </a>{' '}
            on{' '}
            <a
              href={attributionInfo.unsplashLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Unsplash
            </a>
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default UploadWidget; 