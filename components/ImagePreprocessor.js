import { useState, useEffect, useRef, useCallback } from 'react';
import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';
import Cropper from 'react-easy-crop';

const SimpleImagePreprocessor = ({ imageUrl, onProcessed, onError }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [removeBackground, setRemoveBackground] = useState(false);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [backgroundRemovedUrl, setBackgroundRemovedUrl] = useState(null);
  const [backgroundColor, setBackgroundColor] = useState('transparent'); // Changed default from '#000000' to 'transparent'
  const [tempColorValue, setTempColorValue] = useState('transparent'); // Temporary state for color input
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [displayImage, setDisplayImage] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0, aspectRatio: 1 });
  const [colorPickerPosition, setColorPickerPosition] = useState({ top: 0, left: 0 });
  
  const imageRef = useRef(null);
  const isMountedRef = useRef(true);
  const containerRef = useRef(null);
  const colorPickerRef = useRef(null);
  const colorBoxRef = useRef(null);

  // Handle clicks outside the color picker to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setShowColorPicker(false);
      }
    }
    
    // Add event listener when color picker is showing
    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    // Clean up the event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorPicker]);

  // Initialize stored settings from sessionStorage if available
  useEffect(() => {
    const savedSettings = sessionStorage.getItem('yopix_crop_settings');
    if (savedSettings && imageUrl) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.imageUrl === imageUrl) {
          console.log('Restoring previous settings:', settings);
          if (settings.crop) setCrop(settings.crop);
          if (settings.zoom) setZoom(settings.zoom);
          if (settings.removeBackground !== undefined) setRemoveBackground(settings.removeBackground);
          if (settings.backgroundColor) {
            setBackgroundColor(settings.backgroundColor);
            setTempColorValue(settings.backgroundColor);
          }
          if (settings.backgroundRemovedUrl) setBackgroundRemovedUrl(settings.backgroundRemovedUrl);
        }
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, [imageUrl]);

  // Load the image when the component mounts
  useEffect(() => {
    if (!imageUrl) return;

      const loadImage = async () => {
        try {
        setIsLoading(true);
        
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          await new Promise((resolve, reject) => {
          img.onload = () => {
            // Capture image dimensions and aspect ratio
            const aspectRatio = img.width / img.height;
            setImageDimensions({
              width: img.width,
              height: img.height,
              aspectRatio: aspectRatio
            });
            resolve();
          };
            img.onerror = reject;
            img.src = imageUrl;
          });
          
        // Store the image reference and set the display image
        imageRef.current = img;
        
        // If returning to cropping with background removal previously enabled
        if (removeBackground) {
          // First check if we have the stored background removed URL
            if (backgroundRemovedUrl) {
            console.log('Restoring previously removed background');
            
            // Create a new image with the stored removed background
              const bgRemovedImg = new Image();
              bgRemovedImg.crossOrigin = 'anonymous';
            
              await new Promise((resolve, reject) => {
              bgRemovedImg.onload = () => {
                const aspectRatio = bgRemovedImg.width / bgRemovedImg.height;
                setImageDimensions({
                  width: bgRemovedImg.width,
                  height: bgRemovedImg.height,
                  aspectRatio: aspectRatio
                });
                resolve();
              };
                bgRemovedImg.onerror = reject;
                bgRemovedImg.src = backgroundRemovedUrl;
              });
            
            // Store the background-removed image
              imageRef.current = bgRemovedImg;
            
            // Apply stored background color if needed
            if (backgroundColor !== 'transparent' && backgroundColor !== '#000000') {
              console.log('Applying stored background color:', backgroundColor);
              const colorAppliedUrl = await applyBackgroundColor(backgroundRemovedUrl, backgroundColor);
              
              const colorAppliedImg = new Image();
              colorAppliedImg.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
                colorAppliedImg.onload = () => {
                  const aspectRatio = colorAppliedImg.width / colorAppliedImg.height;
                  setImageDimensions({
                    width: colorAppliedImg.width,
                    height: colorAppliedImg.height,
                    aspectRatio: aspectRatio
                  });
                  resolve();
                };
                colorAppliedImg.onerror = reject;
                colorAppliedImg.src = colorAppliedUrl;
              });
              
              // Update image reference with color applied
              imageRef.current = colorAppliedImg;
              setDisplayImage(colorAppliedUrl);
            } else {
              // No color needed, just use stored background-removed image
              setDisplayImage(backgroundRemovedUrl);
            }
          } else {
            // No stored background-removed URL, generate a new one
            console.log('No stored background-removed URL, generating new one');
            const bgRemovedUrl = await handleBackgroundRemoval(img);
            if (bgRemovedUrl) {
              const bgRemovedImg = new Image();
              bgRemovedImg.crossOrigin = 'anonymous';
          await new Promise((resolve, reject) => {
                bgRemovedImg.onload = () => {
                  const aspectRatio = bgRemovedImg.width / bgRemovedImg.height;
                  setImageDimensions({
                    width: bgRemovedImg.width,
                    height: bgRemovedImg.height,
                    aspectRatio: aspectRatio
                  });
                  resolve();
                };
                bgRemovedImg.onerror = reject;
                bgRemovedImg.src = bgRemovedUrl;
              });
              imageRef.current = bgRemovedImg;
              setDisplayImage(bgRemovedUrl);
              
              // Generate crop preview
              if (croppedAreaPixels) {
                generateCroppedImage(bgRemovedUrl, croppedAreaPixels);
              }
            }
          }
    } else {
          // No background removal, just use original image
          setDisplayImage(imageUrl);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading image:', error);
        onError('Error loading image. Please try again with a different image.');
        setIsLoading(false);
      }
    };
    
    loadImage();
  }, [imageUrl, onError, removeBackground, backgroundColor, backgroundRemovedUrl]);

  // Called when the crop is complete
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
    generateCroppedImage(displayImage, croppedAreaPixels);
    // Directly save crop settings when crop is complete to ensure state is preserved
    setTimeout(() => saveCropSettings(), 100);
  }, [displayImage]);

  // Creates the cropped image
  const generateCroppedImage = async (imageSrc, cropData) => {
    try {
      const image = new Image();
      image.src = imageSrc;
      
      await new Promise((resolve) => {
        image.onload = resolve;
      });
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size to the desired output (square aspect ratio)
      canvas.width = canvas.height = 512;
      
      // Draw the cropped image
      ctx.drawImage(
        image,
        cropData.x,
        cropData.y,
        cropData.width,
        cropData.height,
        0,
        0,
        canvas.width,
        canvas.height
      );
      
      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/png');
      setCroppedImageUrl(dataUrl);
      
      // Save settings
      saveCropSettings();
    } catch (error) {
      console.error('Error generating cropped image:', error);
    }
  };

  // Handle background removal using imgly
  const handleBackgroundRemoval = async (img) => {
    try {
      setIsRemovingBackground(true);
      
      console.log('Starting background removal process...');
      
      // Use a hidden canvas to prepare the image
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      // Draw the image to canvas - no background fill for transparency
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      // Get the image as PNG blob
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/png', 1.0);
      });
      
      if (!blob) {
        throw new Error('Failed to create image blob');
      }
      
      console.log('Image prepared, starting background removal...');
      
      // Use imgly background removal with fixed configuration
      const config = {
        debug: true,
        progress: (progress) => {
          console.log(`Background removal progress: ${Math.round(progress * 100)}%`);
        },
        // Use local WASM files
        wasmPaths: {
          'ort-wasm.wasm': '/models/ort-wasm.wasm',
          'ort-wasm-simd.wasm': '/models/ort-wasm-simd.wasm',
          'ort-wasm-threaded.wasm': '/models/ort-wasm-threaded.wasm',
          'ort-wasm-simd-threaded.wasm': '/models/ort-wasm-simd-threaded.wasm'
        },
        // Use a proxy for the model file to avoid SSL issues
        fetchModelData: async (modelUrl) => {
          console.log(`Fetching model from: ${modelUrl}`);
          
          try {
            // Instead of using the default model URL, we'll use our proxy
            const response = await fetch('/api/proxy-model?url=' + encodeURIComponent(modelUrl));
            
            if (!response.ok) {
              throw new Error(`Failed to fetch model: ${response.status} ${response.statusText}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            console.log(`Model data loaded: ${Math.round(arrayBuffer.byteLength / (1024 * 1024))} MB`);
            
            return new Uint8Array(arrayBuffer);
          } catch (error) {
            console.error(`Error fetching model: ${error.message}`);
            throw error;
          }
        }
      };
      
      const result = await imglyRemoveBackground(blob, config);
      
      console.log('Background removal completed successfully!');
      
      if (!result) {
        throw new Error('Background removal returned no result');
      }
      
      const url = URL.createObjectURL(result);
      setBackgroundRemovedUrl(url);
      setIsRemovingBackground(false);
      return url;
    } catch (error) {
      console.error('Error removing background:', error);
      setIsRemovingBackground(false);
      setRemoveBackground(false); // Reset the checkbox
      onError('Failed to remove background: ' + error.message);
    }
  };

  // Apply background color to image
  const applyBackgroundColor = (imageUrl, color) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        // Clear the canvas first to ensure transparency
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Only fill with background color if it's not 'transparent'
        if (color !== 'transparent') {
          // Fill canvas with the selected background color
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Draw the image on top
        ctx.drawImage(img, 0, 0);
        
        // Convert to data URL and resolve
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      };
      
      img.onerror = reject;
      img.src = imageUrl;
    });
  };

  // Handle background removal toggle
  const handleBackgroundRemovalToggle = async () => {
    const newValue = !removeBackground;
    setRemoveBackground(newValue);
    
    if (newValue && imageRef.current) {
      // Process background removal
      const backgroundRemovedUrl = await handleBackgroundRemoval(imageRef.current);
      if (backgroundRemovedUrl) {
        setBackgroundRemovedUrl(backgroundRemovedUrl);
        setDisplayImage(backgroundRemovedUrl);
        
        // Create a new image with background removed
        const bgRemovedImg = new Image();
        bgRemovedImg.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          bgRemovedImg.onload = () => {
            const aspectRatio = bgRemovedImg.width / bgRemovedImg.height;
            setImageDimensions({
              width: bgRemovedImg.width,
              height: bgRemovedImg.height,
              aspectRatio: aspectRatio
            });
            resolve();
          };
          bgRemovedImg.onerror = reject;
          bgRemovedImg.src = backgroundRemovedUrl;
        });
        
        // Apply background color if needed
        if (backgroundColor !== 'transparent') {
          try {
            const colorAppliedUrl = await applyBackgroundColor(backgroundRemovedUrl, backgroundColor);
            
            const colorAppliedImg = new Image();
            colorAppliedImg.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
              colorAppliedImg.onload = () => {
                const aspectRatio = colorAppliedImg.width / colorAppliedImg.height;
                setImageDimensions({
                  width: colorAppliedImg.width,
                  height: colorAppliedImg.height,
                  aspectRatio: aspectRatio
                });
                resolve();
              };
              colorAppliedImg.onerror = reject;
              colorAppliedImg.src = colorAppliedUrl;
            });
            
            // Update the image reference and display
            imageRef.current = colorAppliedImg;
            setDisplayImage(colorAppliedUrl);
            
            // Update the cropped preview
            if (croppedAreaPixels) {
              generateCroppedImage(colorAppliedUrl, croppedAreaPixels);
            }
          } catch (error) {
            console.error('Error applying background color:', error);
            
            // If color application fails, just use the background-removed image
            imageRef.current = bgRemovedImg;
            setDisplayImage(backgroundRemovedUrl);
            
            // Update the cropped preview
            if (croppedAreaPixels) {
              generateCroppedImage(backgroundRemovedUrl, croppedAreaPixels);
        }
      }
    } else {
          // No color needed, just use background-removed image
          imageRef.current = bgRemovedImg;
          setDisplayImage(backgroundRemovedUrl);
          
          // Update the cropped preview
          if (croppedAreaPixels) {
            generateCroppedImage(backgroundRemovedUrl, croppedAreaPixels);
          }
        }
      }
    } else if (imageUrl) {
      // Restore original image
      const originalImg = new Image();
      originalImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        originalImg.onload = () => {
          const aspectRatio = originalImg.width / originalImg.height;
          setImageDimensions({
            width: originalImg.width,
            height: originalImg.height, 
            aspectRatio: aspectRatio
          });
          resolve();
        };
        originalImg.onerror = reject;
        originalImg.src = imageUrl;
      });
      
      imageRef.current = originalImg;
      setDisplayImage(imageUrl);
      
      // Update the cropped preview
      if (croppedAreaPixels) {
        generateCroppedImage(imageUrl, croppedAreaPixels);
      }
    }
    
    saveCropSettings();
  };

  // Apply background color when it changes
  useEffect(() => {
    const applyColorChange = async () => {
      if (backgroundRemovedUrl && removeBackground && !isRemovingBackground) {
        try {
          console.log(`Applying background color: ${backgroundColor}`);
          
          const colorAppliedUrl = await applyBackgroundColor(backgroundRemovedUrl, backgroundColor);
          
          const colorAppliedImg = new Image();
          colorAppliedImg.crossOrigin = 'anonymous';
          
          await new Promise((resolve, reject) => {
            colorAppliedImg.onload = () => {
              const aspectRatio = colorAppliedImg.width / colorAppliedImg.height;
              setImageDimensions({
                width: colorAppliedImg.width,
                height: colorAppliedImg.height,
                aspectRatio: aspectRatio
              });
              resolve();
            };
            colorAppliedImg.onerror = reject;
            colorAppliedImg.src = colorAppliedUrl;
          });
          
          imageRef.current = colorAppliedImg;
          setDisplayImage(colorAppliedUrl);
          
          // Update the cropped preview
          if (croppedAreaPixels) {
            generateCroppedImage(colorAppliedUrl, croppedAreaPixels);
          }
        } catch (error) {
          console.error('Error applying background color in useEffect:', error);
        }
      }
    };
    
    applyColorChange();
  }, [backgroundColor, backgroundRemovedUrl, removeBackground, isRemovingBackground]);

  // Save settings to session storage
  const saveCropSettings = () => {
    try {
      const settings = {
        imageUrl,
        crop,
        zoom,
        removeBackground,
        backgroundColor,
        backgroundRemovedUrl
      };
      
      sessionStorage.setItem('yopix_crop_settings', JSON.stringify(settings));
      console.log('Crop settings saved to session storage');
    } catch (error) {
      console.error('Error saving crop settings:', error);
    }
  };

  // Handle continue button click
  const handleContinue = () => {
    if (croppedImageUrl) {
      // Explicitly save crop settings before proceeding to ensure they're available when returning
      saveCropSettings();
      onProcessed(croppedImageUrl);
    } else {
      onError('No cropped image available. Please try again.');
    }
  };

  // Handle zoom slider change
  const handleZoomChange = (e) => {
    // Convert from 0-100 to 1-10 range (allowing much closer zoom)
    const newZoom = parseFloat(e.target.value) / 100 * 9 + 1;
    setZoom(newZoom);
    // Save crop settings after zoom changes
    setTimeout(() => saveCropSettings(), 100);
  };

  // Handle crop position changes
  const handleCropChange = (newCrop) => {
    setCrop(newCrop);
    // Save crop settings after position changes
    setTimeout(() => saveCropSettings(), 100);
  };

  // Calculate zoom percentage for display
  const zoomPercentage = Math.round(((zoom - 1) / 9) * 100);

  return (
    <div className="w-full">
      {isLoading ? (
        <div className="text-center p-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mb-2"></div>
          <p className="text-blue-600 font-medium">Removing Background...</p>
        </div>
      ) : (
        <div>
          {/* Main content area - Two column layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left column - Cropper area */}
            <div className="lg:w-7/12">
              <div className="flex flex-col space-y-4">
                {/* Guidance tooltip for mobile view */}
                <div className="lg:hidden p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-xl mr-2">💡</span>
                    <p className="text-sm text-blue-700">
                      For best results with Yoto pixel art: Remove the background and zoom to fill as much of the frame as possible
                    </p>
                  </div>
                </div>

                {/* Image preview with crop frame */}
                <div 
                  ref={containerRef}
                  className="relative bg-gray-100 rounded-lg shadow-inner overflow-hidden w-full" 
                  style={{ 
                    position: 'relative', 
                    height: imageDimensions.aspectRatio >= 1 
                      ? 'min(calc(100vw - 40px), 500px)' // Square or wide images
                      : `min(calc((100vw - 40px) * ${imageDimensions.aspectRatio}), 500px)`, // Tall images
                    maxHeight: '500px',
                    aspectRatio: imageDimensions.aspectRatio >= 0.75 ? 'auto' : '1 / 1'
                  }}
                >
                  {displayImage && (
                    <Cropper
                      image={displayImage}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      onCropChange={handleCropChange}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                      cropShape="rect"
                      showGrid={true}
                      zoomWithScroll={true}
                      wheelZoom={true}
                      zoomSpeed={0.3}
                      minZoom={1}
                      maxZoom={10}
                      objectFit="contain"
                      style={{
                        containerStyle: {
                          position: 'relative',
                          width: '100%',
                          height: '100%',
                          background: removeBackground ? 
                            'repeating-conic-gradient(#f0f0f0 0% 25%, #ffffff 0% 50%) 50% / 16px 16px' : 
                            '#f0f0f0'
                        },
                        cropAreaStyle: {
                          border: '2px solid #3B82F6',
                          boxShadow: '0 0 0 9999em rgba(0, 0, 0, 0.5)'
                        }
                      }}
                    />
                  )}
                </div>
                
                {/* Crop frame instruction tooltip - moved outside the crop area */}
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-xl mr-2">🎯</span>
                    <p className="text-sm text-blue-700">
                      Click and drag to position crop frame
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column - Controls and cropped preview */}
            <div className="lg:w-5/12 flex flex-col">
              {/* Guidance tooltip for desktop view */}
              <div className="hidden lg:block mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <span className="text-xl mr-2">💡</span>
                  <p className="text-sm text-blue-700">
                    For best results with Yoto pixel art: Remove the background and zoom to fill as much of the frame as possible
                  </p>
                </div>
              </div>

              {/* Controls card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4">
                {/* Tab navigation */}
                <div className="flex border-b border-gray-200">
                  <h3 className="flex-1 py-2 px-4 font-medium text-blue-600 border-b-2 border-blue-500 bg-blue-50">
                    Adjust Image
                  </h3>
                </div>
                
                {/* Tab content area with compact controls */}
                <div className="p-4 space-y-4">
                  {/* Zoom control */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Zoom
                      </label>
                      <span className="text-xs font-medium text-gray-700">{zoomPercentage}%</span>
                    </div>
                    <input
                      type="range"
                      id="zoom-slider"
                      min="0"
                      max="100"
                      value={((zoom - 1) / 9) * 100}
                      onChange={handleZoomChange}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  
                  {/* Background removal option */}
                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id="removeBackground"
                        checked={removeBackground}
                        onChange={handleBackgroundRemovalToggle}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="removeBackground" className="ml-2 block text-sm font-medium text-gray-700">
                        Remove Background
                      </label>
                    </div>
                    
                    {/* Loading indicator for background removal */}
                    {isRemovingBackground && (
                      <div className="ml-6 mb-3 bg-blue-50 p-2 rounded-md flex items-center">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-blue-500 border-r-transparent mr-2"></div>
                        <span className="text-sm text-blue-600 font-medium">Removing background, please wait...</span>
                      </div>
                    )}

                    {/* Compact color picker */}
                    {removeBackground && (
                      <div className="flex items-center ml-6 mt-2 relative">
                        <label className="text-xs font-medium text-gray-500 mr-2">Color:</label>
                        <div 
                          ref={colorBoxRef}
                          className="w-6 h-6 border border-gray-300 cursor-pointer overflow-hidden relative"
                          style={{ 
                            backgroundColor: backgroundColor === 'transparent' ? 'transparent' : backgroundColor,
                            backgroundImage: backgroundColor === 'transparent' ? 
                              'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
                            backgroundSize: backgroundColor === 'transparent' ? '8px 8px' : 'auto',
                            backgroundPosition: backgroundColor === 'transparent' ? '0 0, 0 4px, 4px -4px, -4px 0px' : 'auto'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setColorPickerPosition({
                              top: rect.bottom + window.scrollY + 5,
                              left: rect.left + window.scrollX
                            });
                            setShowColorPicker(!showColorPicker);
                          }}
                        ></div>
                        <input
                          type="text"
                          value={tempColorValue}
                          onChange={(e) => {
                            setTempColorValue(e.target.value);
                          }}
                          onKeyDown={(e) => {
                            // Apply color on Enter key press
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (tempColorValue === 'transparent' || tempColorValue.match(/^#([0-9A-F]{3}){1,2}$/i)) {
                                setBackgroundColor(tempColorValue);
                              } else {
                                console.log('Invalid color format');
                                setTempColorValue(backgroundColor);
                              }
                            }
                          }}
                          onBlur={() => {
                            // Apply color on blur
                            if (tempColorValue === 'transparent' || tempColorValue.match(/^#([0-9A-F]{3}){1,2}$/i)) {
                              setBackgroundColor(tempColorValue);
                            } else {
                              console.log('Invalid color format, resetting to current color');
                              setTempColorValue(backgroundColor);
                            }
                          }}
                          className="ml-2 w-24 px-2 py-1 text-xs border border-gray-200 rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                        
                        {/* Color picker */}
                        {showColorPicker && (
                          <div 
                            ref={colorPickerRef}
                            className="fixed p-2 bg-white border rounded-md shadow-lg z-50"
                            style={{
                              top: `${colorPickerPosition.top}px`,
                              left: `${colorPickerPosition.left}px`
                            }}
                          >
                            <div className="grid grid-cols-6 gap-1">
                              {/* Add transparent as first option */}
                              <div
                                key="transparent"
                                className="w-5 h-5 border border-gray-300 cursor-pointer"
                                style={{ 
                                  backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                                  backgroundSize: '8px 8px',
                                  backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                                  backgroundColor: 'white'
                                }}
                                onClick={() => {
                                  setBackgroundColor('transparent');
                                  setTempColorValue('transparent');
                                  setShowColorPicker(false);
                                }}
                                title="Transparent"
                              ></div>
                              {['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff',
                                '#ffffff', '#cccccc', '#999999', '#666666', '#333333', '#000000'
                              ].map(color => (
                                <div
                                  key={color}
                                  className="w-5 h-5 border border-gray-300 cursor-pointer"
                                  style={{ backgroundColor: color }}
                                  onClick={() => {
                                    setBackgroundColor(color);
                                    setTempColorValue(color);
                                    setShowColorPicker(false);
                                  }}
                                ></div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Cropped image preview - desktop */}
              {croppedImageUrl && (
                <div className="hidden lg:block rounded-lg overflow-hidden bg-white shadow-sm flex-grow mb-4 border border-gray-200" style={{ maxHeight: '200px' }}>
                  <div className="flex flex-col h-full">
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Preview</h4>
                    </div>
                    <div 
                      className="flex-grow flex items-center justify-center overflow-hidden" 
                      style={{
                        backgroundImage: 'repeating-conic-gradient(#f0f0f0 0% 25%, #ffffff 0% 50%) 50% / 8px 8px',
                        backgroundColor: '#f9f9f9'
                      }}
                    >
                    <img 
                      src={croppedImageUrl} 
                      alt="Cropped" 
                        className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </div>
            </div>
              )}
              
              {/* Continue button */}
            <button
              onClick={handleContinue}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center justify-center"
            >
                <span>Continue to Processing</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
              
              {/* Helper text */}
              <p className="text-xs text-gray-500 mt-2 text-center">
                Drag within the image to position crop area
              </p>
            </div>
          </div>

          {/* Remove the tooltip from its old position */}
          <div className="mt-3">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              PREVIEW
            </h3>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleImagePreprocessor; 