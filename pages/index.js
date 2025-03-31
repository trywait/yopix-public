import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import UploadWidget from '../components/image/UploadWidget';
import PixelArtProcessor from '../components/editor/PixelArtProcessor';
import ImagePreview from '../components/image/ImagePreview';
import DownloadButton from '../components/ui/DownloadButton';
import SimpleImagePreprocessor from '../components/image/ImagePreprocessor';
import Loader from '../components/ui/Loader';
import PixelEditor from '../components/editor/PixelEditor';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import HowItWorks from '../components/ui/HowItWorks';
import { removeBackground } from '@imgly/background-removal';

export default function Home() {
  // State management for the image processing pipeline
  const [sourceImage, setSourceImage] = useState(null);
  const [preprocessedImage, setPreprocessedImage] = useState(null);
  const [pixelatedImage, setPixelatedImage] = useState(null);
  const [editedImage, setEditedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreprocessing, setIsPreprocessing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [colorCount, setColorCount] = useState(8);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debug, setDebug] = useState([]);
  const [hasEditedPixels, setHasEditedPixels] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showNewImageModal, setShowNewImageModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  // Utility function to add debug messages with timestamps
  const addDebugMessage = (message) => {
    console.log(message);
    setDebug(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Check if the background removal library is properly loaded
  useEffect(() => {
    try {
      addDebugMessage('🔍 Checking if removeBackground function exists...');
      if (typeof removeBackground === 'function') {
        addDebugMessage('✅ removeBackground function found');
      } else {
        addDebugMessage('❌ removeBackground is not a function');
        setError('removeBackground is not available');
      }
    } catch (err) {
      addDebugMessage(`❌ Error checking library: ${err.message}`);
      setError(`Error: ${err.message}`);
    }
  }, []);

  /**
   * Handles the initial image upload and sets up the processing pipeline
   * @param {string} imageUrl - The URL of the uploaded image
   * @param {string} prompt - Optional AI prompt for image generation
   */
  const handleImageUpload = (imageUrl, prompt = '') => {
    try {
      console.log('[DEBUG] Processing new image upload');
      const cleanPrompt = prompt.trim();
      setError(null);
      setSourceImage(imageUrl);
      setPreprocessedImage(null);
      setPixelatedImage(null);
      setEditedImage(null);
      setIsPreprocessing(true);
      setIsProcessing(false);
      setAiPrompt(cleanPrompt);
    } catch (err) {
      console.error('Error handling image upload:', err);
      setError('Failed to process the uploaded image.');
      setIsPreprocessing(false);
      setIsProcessing(false);
    }
  };

  /**
   * Handles completion of the image preprocessing stage
   * @param {string} processedImage - URL of the preprocessed image
   */
  const handlePreprocessingComplete = (processedImage) => {
    try {
      console.log('[DEBUG] Image preprocessing completed');
      setPreprocessedImage(processedImage);
      setIsPreprocessing(false);
      setIsProcessing(true);
      setEditedImage(null);
      setHasEditedPixels(false);
    } catch (err) {
      console.error('Error completing preprocessing:', err);
      setError('Failed to complete image preprocessing.');
      setIsPreprocessing(false);
      setIsProcessing(false);
    }
  };

  /**
   * Handles completion of the pixel art processing stage
   * @param {Object} result - The processed pixel art result
   */
  const handleProcessingComplete = (result) => {
    try {
      console.log('[DEBUG] Pixel art processing completed');
      setPixelatedImage(result);
      setIsProcessing(false);
    } catch (err) {
      console.error('Error completing processing:', err);
      setError('Failed to complete image processing.');
      setIsProcessing(false);
    }
  };

  /**
   * Resets the application state to its initial values
   */
  const handleReset = () => {
    try {
      setSourceImage(null);
      setPreprocessedImage(null);
      setPixelatedImage(null);
      setEditedImage(null);
      setIsPreprocessing(false);
      setIsProcessing(false);
      setError(null);
      setAiPrompt('');
      sessionStorage.removeItem('yopix_crop_settings');
      console.log("[DEBUG] Application reset complete");
    } catch (err) {
      console.error('Error resetting state:', err);
      sessionStorage.clear();
      window.location.reload();
    }
  };

  /**
   * Handles navigation back to the cropping stage
   * Shows confirmation modal if there are unsaved edits
   */
  const handleBackToCropping = () => {
    console.log('[DEBUG] Current aiPrompt before back to cropping:', aiPrompt);
    if (hasEditedPixels) {
      setShowConfirmModal(true);
      return;
    }
    proceedToBackToCropping();
  };
  
  /**
   * Executes the back to cropping navigation after confirmation
   */
  const proceedToBackToCropping = () => {
    console.log('[DEBUG] Current aiPrompt in proceedToBackToCropping:', aiPrompt);
    setError(null);
    setPixelatedImage(null);
    setEditedImage(null);
    setHasEditedPixels(false);
    setIsProcessing(false);
    setIsPreprocessing(true);
    setShowConfirmModal(false);
    console.log("[DEBUG] Navigating back to cropping stage...");
  };
  
  const handleCancelBackToCropping = () => {
    setShowConfirmModal(false);
  };

  /**
   * Handles errors during the image processing pipeline
   * @param {string} errorMessage - The error message to display
   */
  const handleProcessingError = (errorMessage) => {
    console.error('Processing error:', errorMessage);
    setError(errorMessage);
    setIsPreprocessing(false);
    setIsProcessing(false);
  };

  /**
   * Updates the color count for pixel art generation
   * @param {Event} e - The change event from the color count input
   */
  const handleColorCountChange = (e) => {
    const count = parseInt(e.target.value, 10);
    setColorCount(count);
  };

  /**
   * Updates the color count using a preset value
   * @param {number} count - The preset color count to use
   */
  const handleColorCountPreset = (count) => {
    console.log(`[DEBUG] Setting color count to ${count}`);
    setColorCount(count);
    if (preprocessedImage) {
      console.log('[DEBUG] Triggering reprocessing with new color count');
      setPixelatedImage(null);
      setIsProcessing(true);
    }
  };

  /**
   * Handles direct file input changes
   * @param {Event} e - The change event from the file input
   */
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setSourceImage(imageUrl);
      setPreprocessedImage(null);
      setPixelatedImage(null);
      setEditedImage(null);
      setError(null);
      setDebug([]);
      addDebugMessage(`Selected image: ${file.name}`);
    }
  };

  /**
   * Removes the background from the source image using AI
   */
  const handleRemoveBackground = async () => {
    if (!sourceImage) {
      addDebugMessage('No image selected');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      addDebugMessage('Starting background removal process');

      const img = await loadImage(sourceImage);
      addDebugMessage(`Image loaded: ${img.width}x${img.height}`);

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/png', 1.0);
      });

      if (!blob) {
        throw new Error('Failed to create image blob');
      }
      
      addDebugMessage(`Image converted to blob: ${Math.round(blob.size / 1024)} KB`);

      // Configure background removal with local WASM files and proxy for model loading
      const config = {
        debug: true,
        progress: (progress) => {
          addDebugMessage(`Progress: ${Math.round(progress * 100)}%`);
        },
        wasmPaths: {
          'ort-wasm.wasm': '/models/ort-wasm.wasm',
          'ort-wasm-simd.wasm': '/models/ort-wasm-simd.wasm',
          'ort-wasm-threaded.wasm': '/models/ort-wasm-threaded.wasm',
          'ort-wasm-simd-threaded.wasm': '/models/ort-wasm-simd-threaded.wasm'
        },
        fetchModelData: async (modelUrl) => {
          addDebugMessage(`Fetching model from: ${modelUrl}`);
          try {
            const response = await fetch('/api/proxy-model?url=' + encodeURIComponent(modelUrl));
            if (!response.ok) {
              throw new Error(`Failed to fetch model: ${response.status} ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            addDebugMessage(`Model data loaded: ${Math.round(arrayBuffer.byteLength / (1024 * 1024))} MB`);
            return new Uint8Array(arrayBuffer);
          } catch (error) {
            addDebugMessage(`Error fetching model: ${error.message}`);
            throw error;
          }
        }
      };

      addDebugMessage('Calling removeBackground...');
      const result = await removeBackground(blob, config);
      
      if (!result) {
        throw new Error('Background removal returned no result');
      }

      const url = URL.createObjectURL(result);
      setPreprocessedImage(url);
      addDebugMessage('✅ Background removal successful!');
      
    } catch (error) {
      console.error('Error removing background:', error);
      setError('Failed to remove background: ' + error.message);
      addDebugMessage(`❌ ERROR: ${error.message}`);
      
      if (error.stack) {
        console.error('Stack trace:', error.stack);
        const stackLines = error.stack.split('\n').slice(0, 3).join('\n');
        addDebugMessage(`Stack: ${stackLines}`);
      }
      
    } finally {
      setLoading(false);
    }
  };

  /**
   * Utility function to load an image from a URL
   * @param {string} src - The URL of the image to load
   * @returns {Promise<HTMLImageElement>} The loaded image element
   */
  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error(`Failed to load image: ${e}`));
      img.src = src;
    });
  };

  /**
   * Initiates the pixel editing mode
   */
  const handleStartEditing = () => {
    setIsEditing(true);
  };

  /**
   * Handles completion of pixel editing
   * @param {Object} result - The edited image result
   */
  const handleEditingComplete = (result) => {
    setEditedImage(result);
    setIsEditing(false);
  };

  const handleEditingCancel = () => {
    setIsEditing(false);
  };
  
  /**
   * Updates the edit state flag when pixels are modified
   * @param {boolean} hasEdits - Whether there are unsaved edits
   */
  const handleEditStateChange = (hasEdits) => {
    setHasEditedPixels(hasEdits);
  };

  /**
   * Handles the new image button click
   * Shows confirmation modal if there are unsaved changes
   */
  const handleNewImageClick = () => {
    if (sourceImage || preprocessedImage || pixelatedImage || editedImage) {
      setShowNewImageModal(true);
      return;
    }
    proceedToNewImage();
  };
  
  const proceedToNewImage = () => {
    handleReset();
    setShowNewImageModal(false);
  };
  
  const handleCancelNewImage = () => {
    setShowNewImageModal(false);
  };

  /**
   * Handles direct pixel editing of an existing image
   * @param {string} imageUrl - The URL of the image to edit
   * @param {Object} metadata - Additional metadata about the image
   */
  const handleDirectPixelEdit = (imageUrl, metadata) => {
    try {
      console.log('[DEBUG] Starting direct pixel edit');
      setError(null);
      setSourceImage(imageUrl);
      setPreprocessedImage(imageUrl);
      setPixelatedImage({ url: imageUrl, metadata });
      setEditedImage(null);
      setIsPreprocessing(false);
      setIsProcessing(false);
      setIsEditing(true);
    } catch (err) {
      console.error('Error handling direct pixel edit:', err);
      setError('Failed to process the icon.');
      setIsEditing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Head>
        <title>YoPix - Pixel Art Generator</title>
        <meta name="description" content="Create pixel art from your images" />
        <link rel="icon" href="/favicon.ico" />
        <style jsx global>{`
          .pixelated {
            image-rendering: pixelated;
            image-rendering: crisp-edges;
          }
        `}</style>
      </Head>

      <Script 
        src="/lib/pixelit.js" 
        strategy="beforeInteractive"
        onLoad={() => console.log('Pixel It library loaded via Next.js Script')}
      />
      
      <ConfirmationModal 
        isOpen={showConfirmModal}
        title="Discard Pixel Edits?"
        message="You have made edits to your pixel art. If you go back to the cropping stage, these edits will be lost. Do you want to continue?"
        onConfirm={proceedToBackToCropping}
        onCancel={handleCancelBackToCropping}
      />

      <ConfirmationModal 
        isOpen={showNewImageModal}
        title="Start New Image?"
        message="Starting a new image will discard your current image and all progress. Do you want to continue?"
        onConfirm={proceedToNewImage}
        onCancel={handleCancelNewImage}
      />

      <main className="flex-grow container mx-auto p-4 md:p-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src="/logo.svg" alt="YoPix Logo" className="w-10 h-10" />
            <h1 className="text-4xl font-bold text-gray-900">YoPix</h1>
          </div>
          <p className="text-xl text-gray-600">Transform your images into true 16x16 pixel art</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
            <button 
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setError(null)}
            >
              <span className="text-2xl">&times;</span>
            </button>
          </div>
        )}

        {!sourceImage && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Choose an Image</h2>
            <UploadWidget 
              onImageUpload={handleImageUpload} 
              onDirectPixelEdit={handleDirectPixelEdit}
            />
          </div>
        )}

        {sourceImage && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            {console.log('[DEBUG] Render condition - sourceImage:', !!sourceImage, 'isPreprocessing:', isPreprocessing, 'isProcessing:', isProcessing, 'pixelatedImage:', !!pixelatedImage)}
            {isPreprocessing ? (
              <div>
                {console.log('[DEBUG] Rendering SimpleImagePreprocessor component')}
                <div className="mb-4">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 flex items-center mb-4"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    New Image
                  </button>
                  <h2 className="text-xl font-bold text-gray-800">Original Image</h2>
                </div>
                <SimpleImagePreprocessor
                  imageUrl={sourceImage}
                  onProcessed={handlePreprocessingComplete}
                  onError={handleProcessingError}
                />
              </div>
            ) : isProcessing ? (
              <div className="my-8">
                {console.log('[DEBUG] Rendering PixelArtProcessor component')}
                <h2 className="text-xl font-bold mb-4 text-gray-800">Creating Pixel Art</h2>
                <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                  <div className="mb-2">
                    <span className="font-medium">Color Count:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => handleColorCountPreset(2)} 
                      className={`px-3 py-1 rounded-md ${colorCount === 2 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    >
                      2
                    </button>
                    <button 
                      onClick={() => handleColorCountPreset(4)} 
                      className={`px-3 py-1 rounded-md ${colorCount === 4 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    >
                      4
                    </button>
                    <button 
                      onClick={() => handleColorCountPreset(8)} 
                      className={`px-3 py-1 rounded-md ${colorCount === 8 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    >
                      8
                    </button>
                    <button 
                      onClick={() => handleColorCountPreset(16)} 
                      className={`px-3 py-1 rounded-md ${colorCount === 16 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    >
                      16
                    </button>
                    <button 
                      onClick={() => handleColorCountPreset(32)} 
                      className={`px-3 py-1 rounded-md ${colorCount === 32 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    >
                      32
                    </button>
                    <button 
                      onClick={() => handleColorCountPreset(64)} 
                      className={`px-3 py-1 rounded-md ${colorCount === 64 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    >
                      64
                    </button>
                    <button 
                      onClick={() => handleColorCountPreset(256)} 
                      className={`px-3 py-1 rounded-md ${colorCount === 256 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    >
                      256
                    </button>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Select a color count for your pixel art
                  </div>
                </div>
                <PixelArtProcessor 
                  imageUrl={preprocessedImage} 
                  onProcessingComplete={handleProcessingComplete}
                  onError={handleProcessingError}
                  colorCount={colorCount}
                />
              </div>
            ) : isEditing ? (
              <PixelEditor
                pixelatedImageUrl={pixelatedImage.url || pixelatedImage}
                originalImageUrl={preprocessedImage}
                colorCount={colorCount}
                metadata={pixelatedImage.metadata}
                editedImageUrl={editedImage?.dataUrl}
                onComplete={(dataUrl, filename) => {
                  setEditedImage({ dataUrl, filename });
                  setIsEditing(false);
                }}
                onCancel={() => setIsEditing(false)}
                onEditStateChange={setHasEditedPixels}
              />
            ) : pixelatedImage || editedImage ? (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleBackToCropping}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                      Return to Cropping
                    </button>
                    <button
                      onClick={handleNewImageClick}
                      className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      New Image
                    </button>
                    
                    <button
                      onClick={handleStartEditing}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      Edit Pixels
                    </button>
                  </div>

                  {!editedImage && (
                    <div className="w-full sm:w-auto flex flex-col sm:items-end">
                      <div className="mb-2">
                        <span className="font-medium">Color Count:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button 
                          onClick={() => handleColorCountPreset(2)} 
                          className={`px-3 py-1 rounded-md ${colorCount === 2 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                        >
                          2
                        </button>
                        <button 
                          onClick={() => handleColorCountPreset(4)} 
                          className={`px-3 py-1 rounded-md ${colorCount === 4 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                        >
                          4
                        </button>
                        <button 
                          onClick={() => handleColorCountPreset(8)} 
                          className={`px-3 py-1 rounded-md ${colorCount === 8 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                        >
                          8
                        </button>
                        <button 
                          onClick={() => handleColorCountPreset(16)} 
                          className={`px-3 py-1 rounded-md ${colorCount === 16 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                        >
                          16
                        </button>
                        <button 
                          onClick={() => handleColorCountPreset(32)} 
                          className={`px-3 py-1 rounded-md ${colorCount === 32 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                        >
                          32
                        </button>
                        <button 
                          onClick={() => handleColorCountPreset(64)} 
                          className={`px-3 py-1 rounded-md ${colorCount === 64 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                        >
                          64
                        </button>
                        <button 
                          onClick={() => handleColorCountPreset(256)} 
                          className={`px-3 py-1 rounded-md ${colorCount === 256 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                        >
                          256
                        </button>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        Select a color count for your pixel art
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col md:flex-row gap-8 mb-6">
                  <div className="flex-1 hidden lg:block">
                    <h3 className="font-medium mb-2">Original Image</h3>
                    <ImagePreview 
                      imageUrl={preprocessedImage} 
                      pixelatedImageUrl={null}
                      forceOriginal={true} 
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium mb-2">
                      {editedImage ? 'Edited Pixel Art' : 'Pixelated Result'}
                    </h3>
                    <ImagePreview 
                      imageUrl={preprocessedImage}
                      pixelatedImageUrl={editedImage ? editedImage.dataUrl : (pixelatedImage.url || pixelatedImage)} 
                      forceOriginal={false}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <DownloadButton
                    imageUrl={editedImage ? editedImage.dataUrl : (pixelatedImage.download || pixelatedImage)}
                    filename={
                      pixelatedImage.metadata 
                        ? `yopix-${pixelatedImage.metadata.query.replace(/\s+/g, '+')}-${pixelatedImage.metadata.source}-${pixelatedImage.metadata.author}-edited.png`
                        : `yopix-${aiPrompt ? aiPrompt.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'pixel-art'}-${colorCount}colors${editedImage ? '-edited' : ''}.png`
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Processing complete. Something went wrong.</p>
                <button
                  onClick={() => setIsPreprocessing(true)}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}

        <HowItWorks />
      </main>

      <footer className="bg-gray-100 py-6 w-full mt-auto">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <div className="flex justify-center space-x-4 mb-2">
            <a 
              href="https://github.com/trywait/yopix-public" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Contribute to the project
            </a>
            <span className="text-gray-400">•</span>
            <a 
              href="https://yopix.ordinarytools.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              View Live Project
            </a>
          </div>
          <p>© 2025 YoPix. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
} 