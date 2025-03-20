import { useState } from 'react';

const AiImageGenerator = ({ onImageSelect }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [generatedImages, setGeneratedImages] = useState(null);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setGeneratedImages(null);

      const response = await fetch('/api/generate-ai-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to generate image');
      }

      // Convert base64 data to image URLs
      const imageUrls = data.images.map(base64Data => 
        `data:image/png;base64,${base64Data}`
      );

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
    setGeneratedImages(null);
    setPrompt('');
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  return (
    <div className="w-full">
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="kite, cat, dog..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isGenerating}
        />
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className={`px-4 py-2 rounded-lg text-white ${
            isGenerating || !prompt.trim()
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isGenerating ? (
            <div className="flex items-center">
              <div className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
              Generating...
            </div>
          ) : (
            'Generate'
          )}
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Keep it simple - we'll handle the rest!
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {generatedImages && (
        <div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {generatedImages.map((imageUrl, index) => (
              <div
                key={index}
                className="relative aspect-square border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => handleImageSelect(imageUrl)}
              >
                <img
                  src={imageUrl}
                  alt={`Generated option ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleRegenerate}
            className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Generate New Options
          </button>
        </div>
      )}
    </div>
  );
};

export default AiImageGenerator; 