import { useState } from 'react';

const AiImageGenerator = ({ onImageSelect, onClose, compact = false }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);

  // Add validation function
  const validatePrompt = (text) => {
    if (!text) return 'Please enter a prompt';
    if (text.length > 500) return 'Prompt must be less than 500 characters';
    
    // Only allow: alphanumeric, spaces, hyphens, underscores, periods, commas, exclamation marks, question marks, and parentheses
    const validRegex = /^[a-zA-Z0-9\s\-_.,!?()\u0020]+$/;
    if (!validRegex.test(text)) {
      return 'Only letters, numbers, spaces, and basic punctuation (.,!?-_()) are allowed';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userText = prompt.trim();
    
    // Client-side validation
    const validationError = validatePrompt(userText);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-ai-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: userText
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

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
      
      // Check if it's a rate limit error
      if (err.message.includes('Rate limit exceeded') || err.message.includes('429')) {
        setError(
          <div className="space-y-2">
            <p className="font-medium">Rate Limit Reached</p>
            <p className="text-sm">The AI image generation service is temporarily unavailable. You can:</p>
            <ul className="text-sm list-disc list-inside">
              <li>Wait a minute and try again</li>
              <li>Upload an image instead</li>
              <li>Search Unsplash or Yoto Iconsfor a starting image</li>
            </ul>
          </div>
        );
      } else if (err.message.includes('Invalid prompt')) {
        setError('Please use only letters, numbers, spaces, and basic punctuation.');
      } else {
        setError('Failed to generate image. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageSelect = (imageUrl) => {
    // Pass just the raw user input text, not the enhanced prompt
    const userText = prompt.trim();
    console.log('AI Generator - Passing raw user text:', userText);
    onImageSelect(imageUrl, userText);
    setGeneratedImages([]);
    setPrompt('');
  };

  if (compact) {
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Generate with AI</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to generate..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={isGenerating}
              className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </form>

        {error && (
          <div className="text-red-500 mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {generatedImages.map((imageUrl, index) => (
            <div
              key={index}
              className="aspect-square relative rounded-lg overflow-hidden border border-gray-200 hover:border-purple-500 transition-colors cursor-pointer"
              onClick={() => handleImageSelect(imageUrl)}
            >
              <img
                src={imageUrl}
                alt={`Generated image ${index + 1}`}
                className="w-full h-full object-contain p-2"
              />
            </div>
          ))}
        </div>

        {!isGenerating && generatedImages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            Enter a prompt and click Generate to create images
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg flex flex-col" 
      style={{ 
        minHeight: 'min-content',
        maxHeight: generatedImages.length > 0 ? '90vh' : 'auto'
      }}
    >
      {/* Header */}
      <div className="bg-white flex-shrink-0">
        <div className="p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Generate with AI</h2>
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
          <div className="max-w-3xl mx-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What would you like to generate?
            </label>
            <form onSubmit={handleSubmit} className="flex">
              <input
                type="text"
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  setError(null);
                }}
                placeholder="Use simple words (e.g., dog, car, house)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isGenerating}
                autoFocus
              />
              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="px-6 py-2 bg-purple-500 text-white rounded-r-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-purple-300"
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </form>
            <p className="mt-2 text-xs text-gray-500">
              Use simple words, and we'll take care of the rest.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 flex-grow">
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg max-w-3xl mx-auto">
            {error}
          </div>
        )}

        {isGenerating && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Generating your images...</p>
          </div>
        )}

        {!isGenerating && !generatedImages.length && (
          <div className="text-center py-8 text-gray-500">
            Enter a prompt and click Generate to create images
          </div>
        )}

        {generatedImages.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-4 py-4">
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
            <div className="mt-3 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-xl mr-2">👾</span>
                <p className="text-sm text-blue-700">
                  These are not the final images. Your selection will be converted into a much simpler, true 16x16 pixel art
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-100 flex-shrink-0">
        <div className="p-4 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            <a 
              href="https://ai.google.dev/docs/gemini_api_overview"
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-500 hover:underline"
            >
              Powered by Google AI
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiImageGenerator; 