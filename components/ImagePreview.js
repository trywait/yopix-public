import React, { useEffect, useState } from 'react';

const ImagePreview = ({ 
  imageUrl, 
  pixelatedImageUrl, 
  forceOriginal = false
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Determine which image to display
  const effectiveImageUrl = forceOriginal ? imageUrl : 
    (pixelatedImageUrl && typeof pixelatedImageUrl === 'object' ? pixelatedImageUrl.preview : pixelatedImageUrl);
  
  // Reset error state when image URL changes
  useEffect(() => {
    setImageError(false);
    console.log('ImagePreview: Image URL changed', 
      forceOriginal ? 'Original' : 'Pixelated', 
      effectiveImageUrl ? effectiveImageUrl.substring(0, 50) + '...' : 'null'
    );
  }, [imageUrl, pixelatedImageUrl, forceOriginal, effectiveImageUrl]);

  // Handle image load error
  const handleImageError = () => {
    console.error('Failed to load image:', effectiveImageUrl);
    setImageError(true);
  };

  // Handle image load success
  const handleImageLoad = () => {
    console.log('Image loaded successfully:', 
      forceOriginal ? 'Original' : 'Pixelated'
    );
  };

  return (
    <div className="image-preview-container">
      <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-gray-100 aspect-square">
        {effectiveImageUrl ? (
          <div className="flex justify-center items-center w-full h-full">
            <img 
              src={effectiveImageUrl}
              alt={forceOriginal ? "Original image" : "Pixelated image"}
              className={`w-full h-full object-contain ${!forceOriginal ? 'pixelated' : ''}`}
              style={{
                imageRendering: !forceOriginal ? 'pixelated' : 'auto'
              }}
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          </div>
        ) : (
          <div className="flex justify-center items-center h-full text-gray-500">
            No image available
          </div>
        )}
        
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-100 bg-opacity-80">
            <p className="text-red-600 text-center p-4">
              Failed to load image
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImagePreview; 