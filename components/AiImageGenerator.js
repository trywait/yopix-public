import { useState } from 'react';

const AiImageGenerator = ({ onImageSelect, compact = false }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-ai-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: `Create a colorful app icon of a ${prompt.trim()}. The style should be extremely simple and bold like an iOS app icon or Material Design icon, with bright cheerful colors. The icon should be large and centered on a pure white background with no border. Use 3-4 solid colors maximum, no gradients or shadows. Make it playful and cute, similar to a modern app icon or emoji design. The shape should be very simple and fill most of the frame.`
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to generate image');
      }

      const data = await response.json();
      
      // Convert base64 data to image URLs if needed
      const imageUrls = data.images.map(image => {
        // Check if the image is already a URL or base64
        if (image.startsWith('data:') || image.startsWith('http')) {
          return image;
        }
        // Convert base64 to data URL if needed
        return `data:image/png;base64,${image}`;
      });
      
      setGeneratedImages(imageUrls);
    } catch (err) {
      console.error('Generation error:', err);
      
      // Check if it's a quota/rate limit error
      if (err.message.includes('quota') || err.message.includes('429') || err.message.includes('Too Many Requests')) {
        setError('Generation Limit Reached. Please use a different image upload method');
      } else {
        setError('Failed to generate image. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageSelect = (imageUrl) => {
    onImageSelect(imageUrl);
    setGeneratedImages([]);
    setPrompt('');
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex-1">
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Dog, Beach, Pinwheel..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              disabled={isGenerating}
            />
            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-purple-300 text-sm font-medium whitespace-nowrap"
            >
              {isGenerating ? (
                <div className="flex items-center">
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                  Generating...
                </div>
              ) : (
                generatedImages.length > 0 ? 'Regenerate' : 'Generate'
              )}
            </button>
          </div>
          {generatedImages.length === 0 && (
            <p className="text-xs text-gray-600 text-center italic">Keep it simple, and we'll handle the rest</p>
          )}
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
        {generatedImages.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              {generatedImages.map((imageUrl, index) => (
                <button
                  key={index}
                  onClick={() => handleImageSelect(imageUrl)}
                  className="relative aspect-square overflow-hidden rounded-lg border-2 border-transparent hover:border-purple-500 focus:outline-none focus:border-purple-500 bg-gray-50 group"
                >
                  <img
                    src={imageUrl}
                    alt={`Generated option ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Image failed to load:', imageUrl);
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-purple-500 bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                    <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-lg drop-shadow-md">
                      Use
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-xl mr-2">👾</span>
                <p className="text-sm text-blue-700">
                  These are not the final images. Your selection will be converted into a much simpler, true 16x16 pixel art
                </p>
              </div>
            </div>
          </>
        )}
      </form>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
            What would you like to generate?
          </label>
          <input
            id="prompt"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter a description of what you want to generate..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isGenerating}
          />
        </div>

        <button
          type="submit"
          disabled={isGenerating || !prompt.trim()}
          className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-purple-300"
        >
          {isGenerating ? 'Generating...' : 'Generate Image'}
        </button>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        {generatedImages.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              {generatedImages.map((imageUrl, index) => (
                <button
                  key={index}
                  onClick={() => handleImageSelect(imageUrl)}
                  className="relative aspect-square overflow-hidden rounded-lg border-2 border-transparent hover:border-purple-500 focus:outline-none focus:border-purple-500 bg-gray-50 group"
                >
                  <img
                    src={imageUrl}
                    alt={`Generated option ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Image failed to load:', imageUrl);
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-purple-500 bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                    <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-lg drop-shadow-md">
                      Use
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-xl mr-2">👾</span>
                <p className="text-sm text-blue-700">
                  These are not the final images. Your selection will be converted into a much simpler, true 16x16 pixel art
                </p>
              </div>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default AiImageGenerator; 