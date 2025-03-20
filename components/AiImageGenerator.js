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
        body: JSON.stringify({ prompt: prompt.trim() }),
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
      setError(err.message);
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
              placeholder="Type to generate..."
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
          <p className="text-sm text-gray-600">Keep it simple, and we'll handle the rest</p>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
        {generatedImages.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            {generatedImages.map((imageUrl, index) => (
              <button
                key={index}
                onClick={() => handleImageSelect(imageUrl)}
                className="relative aspect-square overflow-hidden rounded-lg border-2 border-transparent hover:border-purple-500 focus:outline-none focus:border-purple-500 bg-gray-50"
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
              </button>
            ))}
          </div>
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
          <div className="grid grid-cols-2 gap-6">
            {generatedImages.map((imageUrl, index) => (
              <button
                key={index}
                onClick={() => handleImageSelect(imageUrl)}
                className="relative aspect-square overflow-hidden rounded-lg border-2 border-transparent hover:border-purple-500 focus:outline-none focus:border-purple-500"
              >
                <img
                  src={imageUrl}
                  alt={`Generated option ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
};

export default AiImageGenerator; 