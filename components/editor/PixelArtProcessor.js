import React, { useState, useEffect, useRef } from 'react';

const PixelArtProcessor = ({ imageUrl, onProcessingComplete, onError, colorCount = 8 }) => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState(null);
  const [lastProcessedUrl, setLastProcessedUrl] = useState(null);
  const canvasRef = useRef(null);
  const hiddenImgRef = useRef(null);
  const isMountedRef = useRef(true); // Track if component is mounted

  // Set isMounted to false when component unmounts
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Process image when imageUrl or colorCount changes
  useEffect(() => {
    if (!imageUrl) return;
    
    // If only colorCount changed and we already have the image loaded, we can skip loading it again
    const isColorCountChangeOnly = imageUrl === lastProcessedUrl && hiddenImgRef.current && hiddenImgRef.current.complete;
    
    if (isColorCountChangeOnly) {
      console.log(`Color count changed to ${colorCount}, reprocessing image`);
      processLoadedImage(hiddenImgRef.current);
    } else {
      setLastProcessedUrl(imageUrl);
      loadAndProcessImage();
    }
  }, [imageUrl, colorCount, lastProcessedUrl, onProcessingComplete, onError]);

  const loadAndProcessImage = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      // Check if pixelit is available
      if (!window.pixelit) {
        console.error('Pixelit library not available');
        setError('Pixelit library not loaded. Please refresh the page and try again.');
        setIsProcessing(false);
        if (onError) onError('Pixelit library not loaded. Please refresh the page and try again.');
        return;
      }

      console.log('Pixelit library is available:', !!window.pixelit);

      // Create hidden image if it doesn't exist
      if (!hiddenImgRef.current) {
        hiddenImgRef.current = new Image();
      }

      // Wait for the image to load
      const img = hiddenImgRef.current;
      img.crossOrigin = "Anonymous"; // Add cross-origin attribute
      
      // Set up onload handler before setting src
      img.onload = () => {
        console.log('Image loaded successfully:', img.width, 'x', img.height);
        processLoadedImage(img);
      };

      img.onerror = (e) => {
        console.error('Failed to load the image:', e);
        const errorMsg = 'Failed to load the image. Please try another one.';
        if (isMountedRef.current) {
          setError(errorMsg);
          setIsProcessing(false);
          if (onError) onError(errorMsg);
        }
      };
      
      console.log('Setting image source:', imageUrl);
      img.src = imageUrl;
    } catch (err) {
      console.error('Error processing image:', err);
      const errorMsg = 'An error occurred while processing the image: ' + err.message;
      if (isMountedRef.current) {
        setError(errorMsg);
        setIsProcessing(false);
        if (onError) onError(errorMsg);
      }
    }
  };

  const processLoadedImage = (img) => {
    // Check if component is still mounted
    if (!isMountedRef.current) return;
    
    try {
      console.log(`Processing image with ${colorCount} colors, dimensions:`, img.width, 'x', img.height);
      console.log(`Memory usage: ${performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB' : 'Not available'}`);
      
      // Verify the image has loaded properly
      if (img.width === 0 || img.height === 0) {
        throw new Error('Source image has zero dimensions');
      }
      
      // Create a source canvas for the original image
      const sourceCanvas = document.createElement('canvas');
      sourceCanvas.width = img.width;
      sourceCanvas.height = img.height;
      const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
      sourceCtx.drawImage(img, 0, 0);
      
      // Verify the canvas has content
      try {
        const checkData = sourceCtx.getImageData(0, 0, 1, 1);
        console.log('Source canvas data check (first pixel):', checkData.data);
      } catch (e) {
        console.error('Failed to get image data from source canvas:', e);
      }
      
      console.time('extractColors');
      // Extract representative colors from the image - ENSURE we pass colorCount here
      const customPalette = extractRepresentativeColors(sourceCanvas, colorCount);
      console.timeEnd('extractColors');
      console.log('Extracted palette with', customPalette.length, 'colors:', customPalette.slice(0, 3));
      
      // Validate palette has the correct number of colors
      if (customPalette.length > colorCount) {
        console.warn(`Palette has ${customPalette.length} colors, limiting to ${colorCount}`);
        customPalette.length = colorCount;
      }
      
      // Create the pixelation canvas (16x16)
      const pixelCanvas = document.createElement('canvas');
      pixelCanvas.width = 16;
      pixelCanvas.height = 16;
      const pixelCtx = pixelCanvas.getContext('2d');
      
      // Draw the image at 16x16 resolution
      pixelCtx.drawImage(img, 0, 0, 16, 16);
      
      // Verify the pixelation canvas has content
      try {
        const checkData = pixelCtx.getImageData(0, 0, 1, 1);
        console.log('Pixelation canvas data check (first pixel):', checkData.data);
      } catch (e) {
        console.error('Failed to get image data from pixelation canvas:', e);
      }
      
      // Skip pixelit library and use enhanced fallback method directly
      console.log('Using enhanced pixelation method with', colorCount, 'colors');
      enhancedPixelation(pixelCanvas, customPalette);
      
    } catch (err) {
      console.error('Error processing canvas:', err);
      const errorMsg = 'Error processing image: ' + err.message;
      if (isMountedRef.current) {
        setError(errorMsg);
        setIsProcessing(false);
        if (onError) onError(errorMsg);
      }
    }
  };
  
  // Enhanced pixelation method as the primary method
  const enhancedPixelation = (pixelCanvas, palette) => {
    try {
      console.log('Starting enhanced pixelation with', palette.length, 'colors');
      console.time('enhancedPixelation');
      
      // Ensure palette size matches colorCount
      if (palette.length > colorCount) {
        console.warn(`Reducing palette from ${palette.length} to ${colorCount} colors in enhancedPixelation`);
        palette = palette.slice(0, colorCount);
      }
      
      // Get the canvas context and image data
      const ctx = pixelCanvas.getContext('2d', { willReadFrequently: true });
      const imageData = ctx.getImageData(0, 0, pixelCanvas.width, pixelCanvas.height);
      const pixels = imageData.data;
      
      // Apply the color palette to the pixels
      applyColorPalette(pixelCanvas, palette);
      
      // Create a downloadable 16x16 version
      const downloadableUrl = pixelCanvas.toDataURL('image/png');
      
      // Create a preview canvas with scaled-up result
      const previewCanvas = document.createElement('canvas');
      const scale = 16; // Scale up for preview
      previewCanvas.width = 16 * scale;
      previewCanvas.height = 16 * scale;
      
      const previewCtx = previewCanvas.getContext('2d');
      previewCtx.imageSmoothingEnabled = false;
      previewCtx.mozImageSmoothingEnabled = false;
      previewCtx.webkitImageSmoothingEnabled = false;
      previewCtx.msImageSmoothingEnabled = false;
      
      // Scale up the 16x16 image for preview
      previewCtx.drawImage(
        pixelCanvas,
        0, 0, 16, 16,
        0, 0, previewCanvas.width, previewCanvas.height
      );
      
      // Get the preview image URL
      const previewImageUrl = previewCanvas.toDataURL('image/png');
      
      // Verify the URLs are valid
      if (downloadableUrl === 'data:,' || previewImageUrl === 'data:,') {
        console.error('Generated empty data URL');
        // Try a simpler approach - just draw a colored square
        previewCtx.fillStyle = 'purple';
        previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
        const backupUrl = previewCanvas.toDataURL('image/png');
        
        // Complete processing with backup image
        if (isMountedRef.current) {
          setIsProcessing(false);
          console.log('Calling onProcessingComplete with backup image');
          onProcessingComplete({ preview: backupUrl, download: backupUrl });
        }
        return;
      }
      
      // Debug: Log the URLs
      console.log('Generated 16x16 image URL:', downloadableUrl.substring(0, 100) + '...');
      console.log('Generated preview image URL:', previewImageUrl.substring(0, 100) + '...');
      console.timeEnd('enhancedPixelation');
      
      // Check if component is still mounted before updating state
      if (isMountedRef.current) {
        // Complete processing
        setIsProcessing(false);
        console.log('Calling onProcessingComplete with enhanced image URLs');
        onProcessingComplete({ preview: previewImageUrl, download: downloadableUrl });
      }
    } catch (err) {
      console.error('Enhanced pixelation failed:', err);
      const errorMsg = 'Error processing image: ' + err.message;
      if (isMountedRef.current) {
        setError(errorMsg);
        setIsProcessing(false);
        if (onError) onError(errorMsg);
      }
    }
  };

  // Apply color palette to canvas with improved algorithm
  const applyColorPalette = (canvas, palette) => {
    console.log('Applying color palette with', palette.length, 'colors to canvas', canvas.width, 'x', canvas.height);
    
    // Ensure we have a valid palette with the correct number of colors
    if (!palette || palette.length === 0) {
      console.error('Invalid palette provided to applyColorPalette');
      // Use a default palette if none provided
      palette = [[0, 0, 0], [255, 255, 255]];
    }
    
    // Make sure we're actually limiting to the correct number of colors
    if (palette.length > colorCount) {
      console.log(`Limiting palette from ${palette.length} to ${colorCount} colors`);
      palette = palette.slice(0, colorCount);
    }
    
    // Debug the final palette
    debugPalette(palette);
    
    // Precalculate RGB values for fast lookup
    const paletteRgb = palette.map(color => ({
      r: color[0],
      g: color[1],
      b: color[2]
    }));
    
    try {
      // Get the canvas context and image data
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
      // For high color counts, use direct color extraction and apply dithering for 256 colors
      if (palette.length >= 128) {
        // For both 128 and 256 colors, use Floyd-Steinberg dithering to maximize color detail
        console.log(`Using Floyd-Steinberg dithering with ${palette.length} colors`);
        applyDithering(data, canvas.width, canvas.height, paletteRgb);
      } else {
        // Use a more efficient algorithm for finding the nearest color
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
          // Find the nearest color in the palette using Euclidean distance
          let minDistance = Infinity;
          let nearestColor = paletteRgb[0];
          
          for (const color of paletteRgb) {
            // Weighted RGB distance - human eyes are more sensitive to green
            const distance = 
              0.3 * Math.pow(r - color.r, 2) + 
              0.59 * Math.pow(g - color.g, 2) + 
              0.11 * Math.pow(b - color.b, 2);
        
        if (distance < minDistance) {
          minDistance = distance;
              nearestColor = color;
            }
          }
          
          // Apply the nearest color
          data[i] = nearestColor.r;
          data[i + 1] = nearestColor.g;
          data[i + 2] = nearestColor.b;
        }
      }
      
      // Put the processed image data back to the canvas
    ctx.putImageData(imageData, 0, 0);
    
    // Verify the canvas has content after processing
    try {
      const checkData = ctx.getImageData(0, 0, 1, 1);
        console.log('Canvas data check after palette application (first pixel):', checkData.data);
    } catch (e) {
      console.error('Failed to get image data after palette application:', e);
      }
      
    } catch (e) {
      console.error('Failed to apply color palette:', e);
    }
  };

  // Utility function to debug the palette
  const debugPalette = (palette) => {
    console.log(`Final palette has ${palette.length} colors:`);
    
    // Create a string representation of the palette for logging
    const paletteStr = palette.map(color => 
      `rgb(${color[0]}, ${color[1]}, ${color[2]})`
    ).join(", ");
    
    console.log(`Palette: ${paletteStr}`);
    
    // Count how many colors are actually used
    const uniqueColors = new Set(palette.map(color => `${color[0]},${color[1]},${color[2]}`));
    console.log(`Unique colors in palette: ${uniqueColors.size}`);
  };

  // Apply Floyd-Steinberg dithering for highest color detail (256 colors)
  const applyDithering = (data, width, height, palette) => {
    console.log('Applying Floyd-Steinberg dithering for 256 colors');
    
    // Create a copy of the original data to work with
    const newData = new Uint8ClampedArray(data.length);
    for (let i = 0; i < data.length; i++) {
      newData[i] = data[i];
    }
    
    // Apply dithering
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Get the current pixel color
        const r = newData[idx];
        const g = newData[idx + 1];
        const b = newData[idx + 2];
        
        // Find the nearest color in the palette
        let nearestColor = findNearestColor(r, g, b, palette);
        
        // Calculate the quantization error
        const errorR = r - nearestColor.r;
        const errorG = g - nearestColor.g;
        const errorB = b - nearestColor.b;
        
        // Apply the nearest color to the original data
        data[idx] = nearestColor.r;
        data[idx + 1] = nearestColor.g;
        data[idx + 2] = nearestColor.b;
        
        // Distribute the error to neighboring pixels (Floyd-Steinberg algorithm)
        // Right pixel: 7/16 of error
        if (x < width - 1) {
          const rightIdx = idx + 4;
          newData[rightIdx] = Math.min(255, Math.max(0, newData[rightIdx] + errorR * 7 / 16));
          newData[rightIdx + 1] = Math.min(255, Math.max(0, newData[rightIdx + 1] + errorG * 7 / 16));
          newData[rightIdx + 2] = Math.min(255, Math.max(0, newData[rightIdx + 2] + errorB * 7 / 16));
        }
        
        // Bottom-left pixel: 3/16 of error
        if (x > 0 && y < height - 1) {
          const botLeftIdx = idx + width * 4 - 4;
          newData[botLeftIdx] = Math.min(255, Math.max(0, newData[botLeftIdx] + errorR * 3 / 16));
          newData[botLeftIdx + 1] = Math.min(255, Math.max(0, newData[botLeftIdx + 1] + errorG * 3 / 16));
          newData[botLeftIdx + 2] = Math.min(255, Math.max(0, newData[botLeftIdx + 2] + errorB * 3 / 16));
        }
        
        // Bottom pixel: 5/16 of error
        if (y < height - 1) {
          const botIdx = idx + width * 4;
          newData[botIdx] = Math.min(255, Math.max(0, newData[botIdx] + errorR * 5 / 16));
          newData[botIdx + 1] = Math.min(255, Math.max(0, newData[botIdx + 1] + errorG * 5 / 16));
          newData[botIdx + 2] = Math.min(255, Math.max(0, newData[botIdx + 2] + errorB * 5 / 16));
        }
        
        // Bottom-right pixel: 1/16 of error
        if (x < width - 1 && y < height - 1) {
          const botRightIdx = idx + width * 4 + 4;
          newData[botRightIdx] = Math.min(255, Math.max(0, newData[botRightIdx] + errorR * 1 / 16));
          newData[botRightIdx + 1] = Math.min(255, Math.max(0, newData[botRightIdx + 1] + errorG * 1 / 16));
          newData[botRightIdx + 2] = Math.min(255, Math.max(0, newData[botRightIdx + 2] + errorB * 1 / 16));
        }
      }
    }
  };

  // Apply simple dithering for 128 colors
  const applySimpleDithering = (data, width, height, palette) => {
    console.log('Applying simple dithering for 128 colors');
    
    // Apply simple ordered dithering
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Get the current pixel color
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        // Apply a slight adjustment based on position for subtle dithering
        const adjustment = ((x % 2) * 2 - 1) * ((y % 2) * 2 - 1) * 5;
        const adjustedR = Math.min(255, Math.max(0, r + adjustment));
        const adjustedG = Math.min(255, Math.max(0, g + adjustment));
        const adjustedB = Math.min(255, Math.max(0, b + adjustment));
        
        // Find the nearest color in the palette for the adjusted color
        const nearestColor = findNearestColor(adjustedR, adjustedG, adjustedB, palette);
        
        // Apply the nearest color
        data[idx] = nearestColor.r;
        data[idx + 1] = nearestColor.g;
        data[idx + 2] = nearestColor.b;
      }
    }
  };

  // Helper function to find the nearest color in the palette
  const findNearestColor = (r, g, b, palette) => {
    let minDistance = Infinity;
    let nearestColor = palette[0];
    
    for (const color of palette) {
      // Weighted RGB distance - human eyes are more sensitive to green
      const distance = 
        0.3 * Math.pow(r - color.r, 2) + 
        0.59 * Math.pow(g - color.g, 2) + 
        0.11 * Math.pow(b - color.b, 2);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestColor = color;
      }
    }
    
    return nearestColor;
  };

  // Convert RGB to HSL
  const rgbToHsl = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      
      h /= 6;
    }

    return [h * 360, s * 100, l * 100];
  };

  // Convert HSL to RGB
  const hslToRgb = (h, s, l) => {
    h /= 360;
    s /= 100;
    l /= 100;
    
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  };

  // Enhanced HSL-based color distance function for more perceptually accurate color comparison
  const colorDistanceHSL = (h1, s1, l1, h2, s2, l2) => {
    // Normalize hue difference
    let hueDiff = Math.abs(h1 - h2);
    if (hueDiff > 180) {
      hueDiff = 360 - hueDiff;
    }
    
    // Weight the components based on human perception
    // Hue differences matter more when saturation is high
    const hueWeight = (s1 + s2) / 200 * 2.0;
    // Saturation differences matter more when lightness is moderate
    const satWeight = (1 - Math.abs(l1 - 50) / 50) * 1.5;
    // Lightness differences are always important
    const lightWeight = 2.0;
    
    return Math.sqrt(
      hueWeight * (hueDiff / 180) ** 2 +
      satWeight * ((s1 - s2) / 100) ** 2 +
      lightWeight * ((l1 - l2) / 100) ** 2
    );
  };

  // Replace the existing colorDistance function with the improved perceptual version
  const colorDistance = (r1, g1, b1, r2, g2, b2) => {
    // Convert to HSL for more perceptual comparison
    const [h1, s1, l1] = rgbToHsl(r1, g1, b1);
    const [h2, s2, l2] = rgbToHsl(r2, g2, b2);
    
    return colorDistanceHSL(h1, s1, l1, h2, s2, l2);
  };

  // Extract representative colors from the image with improved diversity
  const extractRepresentativeColors = (canvas, colorCount) => {
    console.log(`Extracting ${colorCount} representative colors from ${canvas.width}x${canvas.height} image`);
    
    try {
      // Use the same direct color extraction approach for all color counts
      return getActualColors(canvas, colorCount);
    } catch (error) {
      console.error('Error in color extraction:', error);
      // Fallback to a diverse palette
      return createDiversePalette(colorCount);
    }
  };
  
  // Get actual colors from the image with minimal processing
  const getActualColors = (canvas, maxColors) => {
    console.log(`Getting actual colors from image for color count (${maxColors})`);
    
    try {
      // Special handling for 256 colors - use a larger color set with more diversity
      if (maxColors >= 256) {
        console.log('Using higher precision color extraction for 256 colors');
        return getHighPrecisionColors(canvas);
      }
      
      // Special handling for 2-color mode - ensure black and white with proper separation
      if (maxColors <= 2) {
        console.log('Using optimized 2-color extraction (black and white)');
        
        // For 2 colors, we'll do a luminance-based separation
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
        // Calculate the average luminance
        let totalLuminance = 0;
        let pixelCount = 0;
        
    for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i + 3] < 128) continue; // Skip transparent pixels
          
          // Calculate luminance (perceived brightness)
          // Using the formula: 0.299*R + 0.587*G + 0.114*B
          const luminance = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
          totalLuminance += luminance;
          pixelCount++;
        }
        
        const avgLuminance = totalLuminance / pixelCount;
        console.log(`Average luminance: ${avgLuminance}`);
        
        // Find the average color of pixels above and below the luminance threshold
        let darkR = 0, darkG = 0, darkB = 0, darkCount = 0;
        let lightR = 0, lightG = 0, lightB = 0, lightCount = 0;
        
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i + 3] < 128) continue; // Skip transparent pixels
          
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          
          if (luminance < avgLuminance) {
            darkR += r;
            darkG += g;
            darkB += b;
            darkCount++;
          } else {
            lightR += r;
            lightG += g;
            lightB += b;
            lightCount++;
          }
        }
        
        // Calculate average colors or use black/white as fallback
        let darkColor = [0, 0, 0];
        let lightColor = [255, 255, 255];
        
        if (darkCount > 0) {
          darkColor = [
            Math.round(darkR / darkCount),
            Math.round(darkG / darkCount),
            Math.round(darkB / darkCount)
          ];
          
          // Push darker if not dark enough
          if (darkColor[0] > 60 || darkColor[1] > 60 || darkColor[2] > 60) {
            darkColor = [
              Math.max(0, darkColor[0] - 60),
              Math.max(0, darkColor[1] - 60),
              Math.max(0, darkColor[2] - 60)
            ];
          }
        }
        
        if (lightCount > 0) {
          lightColor = [
            Math.round(lightR / lightCount),
            Math.round(lightG / lightCount),
            Math.round(lightB / lightCount)
          ];
          
          // Push lighter if not light enough
          if (lightColor[0] < 200 || lightColor[1] < 200 || lightColor[2] < 200) {
            lightColor = [
              Math.min(255, lightColor[0] + 60),
              Math.min(255, lightColor[1] + 60),
              Math.min(255, lightColor[2] + 60)
            ];
          }
        }
        
        console.log('2-color palette:', darkColor, lightColor);
        return [darkColor, lightColor];
      }
      
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      
      // We'll use an object to track unique colors
      const uniqueColors = {};
      let colorCount = 0;
      
      // Sample pixels and count occurrences
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] < 128) continue; // Skip transparent pixels
        
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        
        // For smaller color counts, quantize the colors to reduce the number of unique colors
        let quantizedR = r;
        let quantizedG = g;
        let quantizedB = b;
        
        if (maxColors < 64) {
          // More aggressive quantization for smaller color counts
          const levels = maxColors <= 8 ? 3 : maxColors <= 16 ? 4 : maxColors <= 32 ? 5 : 6;
          const step = 256 / levels;
          
          quantizedR = Math.floor(r / step) * step;
          quantizedG = Math.floor(g / step) * step;
          quantizedB = Math.floor(b / step) * step;
        } else if (maxColors < 128) {
          // Light quantization for medium color counts
          const step = 16; // Step of 16 gives 16 levels per channel
          quantizedR = Math.floor(r / step) * step;
          quantizedG = Math.floor(g / step) * step;
          quantizedB = Math.floor(b / step) * step;
        }
        
        // Use string key for the RGB color
        const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
        
        if (uniqueColors[colorKey]) {
          uniqueColors[colorKey].count++;
          // Update average color for more accurate representation
          const count = uniqueColors[colorKey].count;
          uniqueColors[colorKey].rgb = [
            Math.round((uniqueColors[colorKey].rgb[0] * (count - 1) + r) / count),
            Math.round((uniqueColors[colorKey].rgb[1] * (count - 1) + g) / count),
            Math.round((uniqueColors[colorKey].rgb[2] * (count - 1) + b) / count)
          ];
        } else {
          uniqueColors[colorKey] = {
          rgb: [r, g, b],
          count: 1
          };
          colorCount++;
        }
      }
      
      console.log(`Found ${colorCount} unique colors in the image after quantization`);
      
      // If we have fewer colors than requested, ensure we have black and white
      if (colorCount <= maxColors) {
        const result = Object.values(uniqueColors).map(c => c.rgb);
        
        // Always ensure black and white for good contrast when color count is small
        if (maxColors <= 16) {
          const hasBlack = result.some(c => c[0] < 30 && c[1] < 30 && c[2] < 30);
          const hasWhite = result.some(c => c[0] > 225 && c[1] > 225 && c[2] > 225);
          
          if (!hasBlack) result.push([0, 0, 0]);
          if (!hasWhite) result.push([255, 255, 255]);
        }
        
        return result;
      }
      
      // Convert to array and sort by frequency
      const colorArray = Object.values(uniqueColors);
      colorArray.sort((a, b) => b.count - a.count);
      
      const selectedColors = colorArray.slice(0, maxColors).map(c => c.rgb);
      
      // For low color counts, ensure black and white for good contrast
      if (maxColors <= 16) {
        const hasBlack = selectedColors.some(c => c[0] < 30 && c[1] < 30 && c[2] < 30);
        const hasWhite = selectedColors.some(c => c[0] > 225 && c[1] > 225 && c[2] > 225);
        
        // Add black and white by replacing least frequent colors if needed
        if (!hasBlack && selectedColors.length >= maxColors) {
          selectedColors[selectedColors.length - 1] = [0, 0, 0];
        } else if (!hasBlack) {
          selectedColors.push([0, 0, 0]);
        }
        
        if (!hasWhite && selectedColors.length >= maxColors) {
          selectedColors[selectedColors.length - 2] = [255, 255, 255];
        } else if (!hasWhite && selectedColors.length < maxColors) {
          selectedColors.push([255, 255, 255]);
        }
      }
      
      return selectedColors.slice(0, maxColors);
    } catch (error) {
      console.error('Error extracting actual colors:', error);
      // Fall back to diverse palette
      return createDiversePalette(maxColors);
    }
  };

  // Enhanced color extraction for 256 colors
  const getHighPrecisionColors = (canvas) => {
    console.log('Using improved high precision color extraction');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    // We'll use an object to track unique colors
    const uniqueColors = {};
    let colorCount = 0;
    
    // First, analyze all colors to find perceptual min/max
    let minR = 255, minG = 255, minB = 255;
    let maxR = 0, maxG = 0, maxB = 0;
    let totalR = 0, totalG = 0, totalB = 0;
    let pixelCount = 0;
    
    // Sample every 4th pixel (enough for analysis) to improve performance
    for (let i = 0; i < pixels.length; i += 16) {
      if (pixels[i + 3] < 128) continue; // Skip transparent pixels
      
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      // Update min/max
      minR = Math.min(minR, r);
      minG = Math.min(minG, g);
      minB = Math.min(minB, b);
      maxR = Math.max(maxR, r);
      maxG = Math.max(maxG, g);
      maxB = Math.max(maxB, b);
      
      // Update totals for average
      totalR += r;
      totalG += g;
      totalB += b;
      pixelCount++;
    }
    
    // Calculate averages
    const avgR = totalR / pixelCount;
    const avgG = totalG / pixelCount;
    const avgB = totalB / pixelCount;
    
    console.log(`Color range: R(${minR}-${maxR}), G(${minG}-${maxG}), B(${minB}-${maxB})`);
    console.log(`Color average: R(${avgR.toFixed(1)}), G(${avgG.toFixed(1)}), B(${avgB.toFixed(1)})`);
    
    // Calculate range for each channel
    const rangeR = maxR - minR;
    const rangeG = maxG - minG;
    const rangeB = maxB - minB;
    
    // Process pixels - use improved quantization that adapts to the image's color range
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] < 128) continue; // Skip transparent pixels
      
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      // For high color counts, use adaptive quantization based on the image's color range
      // This helps distribute colors more evenly across the actual range used in the image
      
      // For 256 colors, divide each channel into 6-7 levels depending on the channel's range
      // This gives a theoretical maximum of 6*7*7 = 294 colors, but typically results in fewer
      const rLevels = Math.max(6, Math.ceil(rangeR / 42)); // ~42 is 255/6
      const gLevels = Math.max(6, Math.ceil(rangeG / 42));
      const bLevels = Math.max(6, Math.ceil(rangeB / 42));
      
      // Calculate the step size for each channel based on the range
      const rStep = rangeR / (rLevels - 1) || 1;
      const gStep = rangeG / (gLevels - 1) || 1;
      const bStep = rangeB / (bLevels - 1) || 1;
      
      // Quantize relative to the min value of each channel
      const rNormalized = r - minR;
      const gNormalized = g - minG;
      const bNormalized = b - minB;
      
      // Calculate the quantized values
      const rQuantized = Math.round(Math.round(rNormalized / rStep) * rStep + minR);
      const gQuantized = Math.round(Math.round(gNormalized / gStep) * gStep + minG);
      const bQuantized = Math.round(Math.round(bNormalized / bStep) * bStep + minB);
      
      // Use string key for the RGB color
      const colorKey = `${rQuantized},${gQuantized},${bQuantized}`;
      
      if (uniqueColors[colorKey]) {
        uniqueColors[colorKey].count++;
        // Update average color for more accurate representation
        const count = uniqueColors[colorKey].count;
        uniqueColors[colorKey].rgb = [
          Math.round((uniqueColors[colorKey].rgb[0] * (count - 1) + r) / count),
          Math.round((uniqueColors[colorKey].rgb[1] * (count - 1) + g) / count),
          Math.round((uniqueColors[colorKey].rgb[2] * (count - 1) + b) / count)
        ];
      } else {
        uniqueColors[colorKey] = {
          rgb: [r, g, b],
          count: 1
        };
        colorCount++;
      }
    }
    
    console.log(`Found ${colorCount} unique colors after adaptive quantization`);
    
    // Convert to array and sort by frequency (most frequent first)
    const colorArray = Object.values(uniqueColors);
    colorArray.sort((a, b) => b.count - a.count);
    
    // Take the top colors, but ensure color diversity by adding some less frequent colors
    let selectedColors = [];
    
    // Initially take the most frequent colors (2/3 of desired count)
    const frequentColorCount = Math.floor(256 * 0.67);
    selectedColors = colorArray.slice(0, frequentColorCount).map(c => c.rgb);
    
    // Convert all colors to HSL for better diversity analysis
    const selectedHSL = selectedColors.map(rgb => rgbToHsl(...rgb));
    
    // Add more colors, but ensure they're diverse
    for (let i = frequentColorCount; i < colorArray.length && selectedColors.length < 256; i++) {
      const newColor = colorArray[i].rgb;
      const newHSL = rgbToHsl(...newColor);
      
      // Check if this color is diverse enough compared to already selected colors
      let isDiverse = true;
      for (const hsl of selectedHSL) {
        // Calculate perceptual distance
        const distance = colorDistanceHSL(newHSL[0], newHSL[1], newHSL[2], hsl[0], hsl[1], hsl[2]);
        
        // If too similar to an existing color, skip it
        if (distance < 0.05) {
          isDiverse = false;
          break;
        }
      }
      
      if (isDiverse) {
        selectedColors.push(newColor);
        selectedHSL.push(newHSL);
      }
    }
    
    // If we still need more colors, add a diverse color ramp
    if (selectedColors.length < 256) {
      console.log(`Adding additional diverse colors to reach 256 (current: ${selectedColors.length})`);
      
      // Add a grayscale ramp
      const grayNeeded = 256 - selectedColors.length;
      const grayStep = Math.max(5, Math.floor(255 / grayNeeded));
      
      for (let i = 0; i < 255 && selectedColors.length < 256; i += grayStep) {
        const val = i;
        selectedColors.push([val, val, val]);
      }
      
      // If still not enough, add extra hue variations
      if (selectedColors.length < 256) {
        for (let h = 0; h < 360 && selectedColors.length < 256; h += 20) {
          for (let s of [100, 75, 50, 25]) {
            for (let l of [25, 50, 75]) {
              if (selectedColors.length >= 256) break;
              selectedColors.push(hslToRgb(h, s, l));
            }
          }
        }
      }
    }
    
    console.log(`Final high precision palette has ${selectedColors.length} colors`);
    return selectedColors.slice(0, 256);
  };
  
  // For 128 colors, also improve the palette creation
  const createDiversePalette = (count) => {
    console.log(`Creating diverse palette with ${count} colors`);
    
    // Always include black and white
    const palette = [[0, 0, 0], [255, 255, 255]];
    
    if (count <= 2) return palette;

    // For 256 colors, create an improved perceptual palette
    if (count >= 256) {
      // Create an HSL-based color palette for better perceptual distribution
      
      // Add a full hue circle at multiple saturation and lightness levels
      for (let h = 0; h < 360; h += 20) {  // 18 hues
        for (let s of [100, 75, 50]) {      // 3 saturation levels
          for (let l of [25, 50, 75]) {     // 3 lightness levels
            if (palette.length < 256) {
              palette.push(hslToRgb(h, s, l));
            }
          }
        }
      }
      
      // Add a grayscale ramp (more values at the ends for better contrast)
      const grays = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240];
      for (const gray of grays) {
        if (palette.length < 256) {
          palette.push([gray, gray, gray]);
        }
      }
      
      // Add some pure RGB primary and secondary colors
      if (palette.length < 256) palette.push([255, 0, 0]);
      if (palette.length < 256) palette.push([0, 255, 0]);
      if (palette.length < 256) palette.push([0, 0, 255]);
      if (palette.length < 256) palette.push([255, 255, 0]);
      if (palette.length < 256) palette.push([255, 0, 255]);
      if (palette.length < 256) palette.push([0, 255, 255]);
      
      // Fill remaining slots with additional hues
      for (let h = 10; h < 360 && palette.length < 256; h += 20) {
        palette.push(hslToRgb(h, 100, 50));
      }
      
      console.log(`Created perceptual HSL palette with ${palette.length} colors`);
      return palette.slice(0, 256);
    }
    
    // For 128 colors, create an enhanced perceptual palette with better coverage
    if (count >= 128) {
      // Create a more detailed HSL-based palette with better color distribution
      
      // Create a full hue circle with more granular steps
      for (let h = 0; h < 360; h += 15) {  // 24 hues (more granular)
        for (let s of [100, 80, 60, 40]) {  // 4 saturation levels (more levels)
          for (let l of [30, 50, 70]) {     // 3 lightness levels
            if (palette.length < 128) {
              palette.push(hslToRgb(h, s, l));
            }
          }
        }
      }
      
      // Add primary and secondary colors with variations
      const primaryColors = [
        [255, 0, 0],    // Red
        [255, 128, 0],  // Orange
        [255, 255, 0],  // Yellow
        [128, 255, 0],  // Lime
        [0, 255, 0],    // Green
        [0, 255, 128],  // Spring green
        [0, 255, 255],  // Cyan
        [0, 128, 255],  // Azure
        [0, 0, 255],    // Blue
        [128, 0, 255],  // Violet
        [255, 0, 255],  // Magenta
        [255, 0, 128]   // Rose
      ];
      
      // Add primary colors and some variations
      for (const color of primaryColors) {
        if (palette.length < 128) palette.push(color);
        
        // Add darker and lighter variants
        if (palette.length < 128) {
          const [h, s, l] = rgbToHsl(...color);
          
          // Darker variation
          if (l > 20) palette.push(hslToRgb(h, s, Math.max(10, l - 20)));
          
          // Lighter variation
          if (l < 80) palette.push(hslToRgb(h, s, Math.min(90, l + 20)));
        }
      }
      
      // Add a grayscale ramp with finer control
      for (let i = 15; i <= 240 && palette.length < 128; i += 15) {
        palette.push([i, i, i]);
      }
      
      // If we still need more colors, add more hue variations
      for (let h = 0; h < 360 && palette.length < 128; h += 30) {
        for (let s of [90, 70, 50, 30]) {
          for (let l of [25, 50, 75]) {
            if (palette.length < 128) {
              const rgb = hslToRgb(h, s, l);
              
              // Check if this color is distinct enough from existing colors
              let isDuplicate = false;
              for (const existingColor of palette) {
                const [er, eg, eb] = existingColor;
                if (Math.abs(er - rgb[0]) < 8 && 
                    Math.abs(eg - rgb[1]) < 8 && 
                    Math.abs(eb - rgb[2]) < 8) {
                  isDuplicate = true;
                  break;
                }
              }
              
              if (!isDuplicate) {
                palette.push(rgb);
              }
            }
          }
        }
      }
      
      console.log(`Created enhanced perceptual HSL palette with ${palette.length} colors for 128-color mode`);
      return palette.slice(0, 128);
    }

    // Primary colors
    palette.push([255, 0, 0]);    // Red
    palette.push([0, 255, 0]);    // Green
    palette.push([0, 0, 255]);    // Blue
    
    // Secondary colors
    palette.push([255, 255, 0]);  // Yellow
    palette.push([0, 255, 255]);  // Cyan
    palette.push([255, 0, 255]);  // Magenta
    
    // Tertiary colors
    palette.push([255, 128, 0]);  // Orange
    palette.push([128, 255, 0]);  // Chartreuse
    palette.push([0, 255, 128]);  // Spring green
    palette.push([0, 128, 255]);  // Azure
    palette.push([128, 0, 255]);  // Violet
    palette.push([255, 0, 128]);  // Rose
    
    // Add gray levels
    palette.push([128, 128, 128]); // Gray
    palette.push([192, 192, 192]); // Light gray
    palette.push([64, 64, 64]);    // Dark gray
    
    // Add more colors if needed
    if (count > palette.length) {
      // Add more hues distributed throughout the spectrum
      const hueStep = 360 / (count - palette.length);
      for (let i = 0; i < 360 && palette.length < count; i += hueStep) {
        palette.push(hslToRgb(i, 100, 50));
      }
    }
    
    // Ensure we don't exceed the requested count
    return palette.slice(0, count);
  };

  return (
    <div className="w-full relative">
      {error && (
        <div className="text-red-500 mb-4 p-2 bg-red-50 rounded-md">
          <p className="font-medium">Error: {error}</p>
        </div>
      )}
      
      {isProcessing && (
        <div className="text-center p-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-sm text-gray-600">Processing image with {colorCount} colors...</p>
        </div>
      )}
      
      <canvas 
        ref={canvasRef} 
        className="hidden" 
        width="16" 
        height="16" 
        data-color-count={colorCount}
      />
    </div>
  );
};

export default PixelArtProcessor; 