import { useState, useEffect, useCallback } from 'react';

const UnsplashSearch = ({ onImageSelect, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [lastSearchedQuery, setLastSearchedQuery] = useState('');

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint in Tailwind
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Function to search Unsplash
  const searchUnsplash = useCallback(async (query, pageNum = 1) => {
    if (!query) return;
    
    setLoading(true);
    setError(null);
    setHasSearched(true);
    setLastSearchedQuery(query);
    
    try {
      const perPage = isMobile ? 6 : 24; // 6 results on mobile, 24 on desktop
      const response = await fetch(`/api/unsplash-search?query=${encodeURIComponent(query)}&page=${pageNum}&per_page=${perPage}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to search images');
      }
      
      setSearchResults(data.results || []);
      setTotalPages(data.total_pages || 0);
      setPage(pageNum);
    } catch (error) {
      console.error('Error searching Unsplash:', error);
      setError(error.message || 'An error occurred while searching images');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [isMobile]);

  // Re-search when screen size changes between mobile and desktop
  useEffect(() => {
    if (hasSearched && lastSearchedQuery) {
      searchUnsplash(lastSearchedQuery, 1);
    }
  }, [isMobile, lastSearchedQuery, hasSearched, searchUnsplash]);

  // Handle search form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchUnsplash(searchQuery.trim(), 1);
    }
  };

  // Handle image selection
  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      searchUnsplash(lastSearchedQuery, newPage);
    }
  };

  // Handle final image selection
  const handleSelectImage = async () => {
    if (!selectedImage) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/unsplash-photo?id=${selectedImage.id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch image');
      }
      
      // Call the parent component with the selected image data
      onImageSelect(data.dataUrl, {
        photographer: data.photographer,
        unsplashLink: data.unsplashLink
      });
    } catch (error) {
      console.error('Error fetching Unsplash image:', error);
      setError(error.message || 'An error occurred while fetching the image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Search Unsplash Images</h2>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-lg p-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Search form */}
      <div className="p-4 border-b border-gray-200">
        <form onSubmit={handleSubmit} className="flex max-w-3xl mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for images..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>
      
      {/* Results grid */}
      <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)', minHeight: '400px' }}>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg max-w-3xl mx-auto">
            {error}
          </div>
        )}
        
        {searchResults.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {searchResults.map((image) => (
              <div 
                key={image.id}
                onClick={() => handleImageClick(image)}
                className={`relative rounded-lg overflow-hidden cursor-pointer aspect-video group hover:shadow-lg transition-shadow ${
                  selectedImage && selectedImage.id === image.id ? 'ring-4 ring-blue-500' : ''
                }`}
              >
                <img 
                  src={image.urls.small} 
                  alt={image.alt_description || 'Unsplash image'} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-end">
                  <div className="p-2 text-xs text-white bg-black bg-opacity-50 w-full">
                    Photo by {image.user.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : hasSearched && !loading ? (
          <div className="text-center py-8 text-gray-500">
            No images found for "{searchQuery}"
          </div>
        ) : !hasSearched ? (
          <div className="text-center py-8 text-gray-500">
            Enter a search term to find images
          </div>
        ) : null}
        
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Searching...</p>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center space-x-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || loading}
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages || loading}
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white"
            >
              Next
            </button>
          </div>
        )}
      </div>
      
      {/* Footer with actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
        <div className="text-xs text-gray-500">
          <a 
            href="https://unsplash.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Powered by Unsplash
          </a>
        </div>
        <button
          onClick={handleSelectImage}
          disabled={!selectedImage || loading}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
        >
          {loading ? 'Processing...' : 'Use Selected Image'}
        </button>
      </div>
    </div>
  );
};

export default UnsplashSearch; 