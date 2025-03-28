import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import UnsplashSearch from './UnsplashSearch';
import AiImageGenerator from './AiImageGenerator';
import YotoIconsSearch from './YotoIconsSearch';

const UploadWidget = ({ onImageUpload, onDirectPixelEdit }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showUnsplashSearch, setShowUnsplashSearch] = useState(false);
  const [showYotoIconsSearch, setShowYotoIconsSearch] = useState(false);
  const [showAiInput, setShowAiInput] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState('');
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

  const handleYotoIconSelect = async (iconData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use our proxy-image endpoint to fetch the icon
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(iconData.url)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch icon');
      }
      
      // Convert the response to a data URL
      const blob = await response.blob();
      const reader = new FileReader();
      
      const dataUrl = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      setShowYotoIconsSearch(false);
      
      // If onDirectPixelEdit is provided, skip the cropping stage
      if (onDirectPixelEdit) {
        onDirectPixelEdit(dataUrl, iconData.metadata);
      } else {
        onImageUpload(dataUrl, iconData.metadata);
      }
    } catch (error) {
      console.error('Error fetching Yoto icon:', error);
      setError(error.message || 'An error occurred while fetching the icon');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setShowUnsplashSearch(true)}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Search Unsplash
            </button>
            <button
              onClick={() => setShowYotoIconsSearch(true)}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Search Yoto Icons
            </button>
            <button
              onClick={() => setShowAiInput(true)}
              className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              Generate with AI
            </button>
          </div>

          <div className="relative">
            <div
              {...getRootProps()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
            >
              <input {...getInputProps()} />
              <p className="text-gray-600">
                Drag and drop an image here, or click to select
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-gray-500">or</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          <form onSubmit={handleUrlSubmit} className="flex gap-2">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Enter image URL"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Load URL'}
            </button>
          </form>

          {error && (
            <div className="text-red-500 text-sm mt-2">
              {error}
            </div>
          )}
        </div>
      </div>

      {showUnsplashSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <UnsplashSearch
              onImageSelect={handleUnsplashImageSelect}
              onClose={() => setShowUnsplashSearch(false)}
            />
          </div>
        </div>
      )}

      {showYotoIconsSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <YotoIconsSearch
              onIconSelect={handleYotoIconSelect}
              onClose={() => setShowYotoIconsSearch(false)}
              onOpenAiGenerator={(query) => {
                setShowYotoIconsSearch(false);
                setAiInitialPrompt(query);
                setShowAiInput(true);
              }}
            />
          </div>
        </div>
      )}

      {showAiInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <AiImageGenerator
              onImageSelect={onImageUpload}
              onClose={() => {
                setShowAiInput(false);
                setAiInitialPrompt('');
              }}
              initialPrompt={aiInitialPrompt}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadWidget; 