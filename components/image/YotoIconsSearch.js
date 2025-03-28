import { useState, useEffect, useRef } from 'react';

export default function YotoIconsSearch({ onIconSelect, onClose, onOpenAiGenerator }) {
  const [query, setQuery] = useState('');
  const [icons, setIcons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Helper function to get proxied image URL
  const getProxiedImageUrl = (originalUrl) => {
    return `/api/proxy-image?url=${encodeURIComponent(originalUrl)}`;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const formattedQuery = query.trim().replace(/\s+/g, '+');
      const response = await fetch(`/api/yoto-icons?query=${formattedQuery}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch icons');
      }

      const data = await response.json();
      setIcons(data.icons || []);
    } catch (err) {
      setError('Failed to fetch icons. Please try again.');
      console.error('Error fetching Yoto icons:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="w-full bg-white rounded-lg grid grid-rows-[auto_1fr_auto]" 
      style={{ 
        height: icons.length > 0 || loading ? '90vh' : 'auto',
        maxHeight: icons.length > 0 || loading ? '900px' : '300px',
        transition: 'max-height 0.3s ease-in-out'
      }}
    >
      {/* Fixed Header */}
      <div className="bg-white">
        <div className="p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Search Yoto Icons</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-lg p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="px-4 pb-4">
          <form onSubmit={handleSearch} className="flex max-w-3xl mx-auto">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Yoto Icons (e.g., dog, cat, nature)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-2 bg-green-500 text-white rounded-r-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-green-300"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>
      </div>

      {/* Scrollable Results */}
      <div className="overflow-y-auto px-4">
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg max-w-3xl mx-auto">
            {error}
          </div>
        )}

        {icons.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 py-4">
            {icons.map((icon, index) => (
              <div
                key={index}
                className="aspect-square relative rounded-lg overflow-hidden border border-gray-200 hover:border-green-500 transition-colors cursor-pointer group"
                onClick={() => {
                  const metadata = {
                    query: query.trim(),
                    author: icon.author.replace('@', ''),
                    source: 'yotoicons'
                  };
                  onIconSelect({
                    url: icon.downloadUrl,
                    metadata: metadata
                  });
                }}
              >
                {/* Checkerboard background for transparency */}
                <div 
                  className="absolute inset-0" 
                  style={{
                    backgroundImage: 'linear-gradient(45deg, #e0e0e0 25%, transparent 25%), linear-gradient(-45deg, #e0e0e0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e0e0e0 75%), linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)',
                    backgroundSize: '16px 16px',
                    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                    zIndex: 0
                  }}
                />
                
                {/* Canvas for pixel-perfect rendering */}
                <PixelIcon url={getProxiedImageUrl(icon.previewUrl)} title={icon.title} />

                {/* Author attribution overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-black bg-opacity-50">
                  <div className="p-2 text-xs text-white">
                    by @{icon.author}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && hasSearched && icons.length === 0 && query && (
          <div className="text-center text-gray-500 mt-8">
            No icons found. Try a different search term.{' '}
            <button
              onClick={() => {
                const currentQuery = query.trim();
                onClose();
                onOpenAiGenerator(currentQuery);
              }}
              className="text-green-500 hover:underline"
            >
              Try Generating with AI
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Searching...</p>
          </div>
        )}

        {!loading && !hasSearched && (
          <div className="text-center text-gray-500 py-8">
            Enter a search term to find icons
          </div>
        )}
      </div>

      {/* Fixed Footer */}
      <div className="bg-white border-t border-gray-100">
        <div className="p-4 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            <a 
              href="https://www.yotoicons.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-green-500 hover:underline"
            >
              Powered by Yoto Icons
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// PixelIcon component for canvas-based rendering
function PixelIcon({ url, title }) {
  const canvasRef = useRef(null);
  const SCALE = 8; // Each pixel will be 8x8

  // Helper function to render pixel art on canvas
  const renderPixelArt = (img, canvas) => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const SIZE = 16; // Original pixel art size
    const SCALED_SIZE = SIZE * SCALE; // Final rendered size
    
    // Set canvas to the scaled size
    canvas.width = SCALED_SIZE;
    canvas.height = SCALED_SIZE;
    
    // Disable image smoothing for crisp pixels
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    
    // Clear canvas
    ctx.clearRect(0, 0, SCALED_SIZE, SCALED_SIZE);
    
    // First draw small
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = SIZE;
    tempCanvas.height = SIZE;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    
    // Disable smoothing on temp canvas too
    tempCtx.imageSmoothingEnabled = false;
    tempCtx.webkitImageSmoothingEnabled = false;
    tempCtx.mozImageSmoothingEnabled = false;
    tempCtx.msImageSmoothingEnabled = false;
    
    // Draw original image at 16x16
    tempCtx.drawImage(img, 0, 0, SIZE, SIZE);
    
    // Get the pixel data
    const imageData = tempCtx.getImageData(0, 0, SIZE, SIZE);
    const pixels = imageData.data;
    
    // Draw each pixel scaled up
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const i = (y * SIZE + x) * 4;
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];
        
        ctx.fillStyle = `rgba(${r},${g},${b},${a/255})`;
        ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;

    img.onload = () => {
      renderPixelArt(img, canvas);
    };
  }, [url]);

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          imageRendering: 'pixelated',
          imageRendering: '-moz-crisp-edges',
          imageRendering: '-webkit-crisp-edges'
        }}
        title={title}
      />
    </div>
  );
} 