import React, { useState, useEffect, useRef } from 'react';
import { RgbaStringColorPicker } from "react-colorful";

const PixelEditor = ({ 
  pixelatedImageUrl, // The pixelated image result from PixelArtProcessor
  originalImageUrl, // The original cropped image
  colorCount, // The current color count used for pixelation
  onComplete, // Callback when editing is complete
  onCancel, // Callback to cancel and return to previous step
  onEditStateChange // Callback to notify parent when edits are made
}) => {
  const [editorCanvas, setEditorCanvas] = useState(null);
  const [colors, setColors] = useState([]); // Extracted color palette
  const [selectedColor, setSelectedColor] = useState(null);
  const [customColor, setCustomColor] = useState('#000000');
  const [history, setHistory] = useState([]); // For undo/redo
  const [currentStep, setCurrentStep] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isEyedropper, setIsEyedropper] = useState(false);
  const [isPainting, setIsPainting] = useState(false); // Track if user is currently painting
  const [lastPaintedPixel, setLastPaintedPixel] = useState({ x: -1, y: -1 }); // Track last painted pixel to avoid duplicates
  const [hasEdits, setHasEdits] = useState(false); // Track if user has made any edits
  const [backgroundPreview, setBackgroundPreview] = useState('checkerboard'); // Add this state
  const canvasRef = useRef(null);
  const colorPickerRef = useRef(null);

  // Initialize the editor with the pixelated image
  useEffect(() => {
    if (!pixelatedImageUrl || !canvasRef.current) return;
    
    // Load the pixelated image
    const img = new Image();
    img.onload = () => {
      // Set up the editor canvas
      setupCanvas(img);
    };
    
    // Get the appropriate URL (preview or direct)
    const imageSource = typeof pixelatedImageUrl === 'object' ? 
      pixelatedImageUrl.preview : pixelatedImageUrl;
    
    img.src = imageSource;
  }, [pixelatedImageUrl]);

  // Notify parent component when edit state changes
  useEffect(() => {
    if (onEditStateChange) {
      onEditStateChange(hasEdits);
    }
  }, [hasEdits, onEditStateChange]);

  // Handle clicks outside the color picker
  useEffect(() => {
    if (!showColorPicker) return;

    const handleClickOutside = (event) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorPicker]);

  // Set up the editor canvas
  const setupCanvas = (img) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true });
    
    // Set canvas dimensions to match the 16x16 original pixelated image
    canvas.width = 16;
    canvas.height = 16;
    
    // Clear canvas with transparency
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the pixelated image
    ctx.drawImage(img, 0, 0, 16, 16);
    
    // Extract the color palette
    const colors = extractColorsFromCanvas(canvas);
    setColors(colors);
    setSelectedColor(colors[0]);
    setCustomColor(colors[0].hex); // Also set the custom color to match
    
    // Initialize history
    const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([initialState]);
    setCurrentStep(0);
    
    setEditorCanvas(canvas);
  };

  // Extract colors from the canvas
  const extractColorsFromCanvas = (canvas) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Find unique colors in the image
    const uniqueColors = new Set();
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue; // Skip transparent pixels
      
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      const colorKey = `${r},${g},${b},${a}`;
      uniqueColors.add(colorKey);
    }
    
    // Convert to array of color objects
    return Array.from(uniqueColors).map(colorKey => {
      const [r, g, b, a] = colorKey.split(',').map(Number);
      return { 
        r, g, b, a, 
        rgba: `rgba(${r},${g},${b},${a/255})`,
        hex: rgbToHex(r, g, b)
      };
    });
  };

  // Convert RGB to Hex
  const rgbToHex = (r, g, b) => {
    return '#' + [r, g, b]
      .map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('');
  };

  // Convert Hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
      a: 255
    } : null;
  };

  // Add a custom color to the palette
  const addCustomColor = () => {
    if (!customColor) return;
    
    const rgb = hexToRgb(customColor);
    if (!rgb) return;
    
    const newColor = {
      ...rgb,
      rgba: `rgba(${rgb.r},${rgb.g},${rgb.b},1)`,
      hex: customColor
    };
    
    // Check if color already exists
    const colorExists = colors.some(color => 
      color.r === newColor.r && color.g === newColor.g && color.b === newColor.b
    );
    
    if (!colorExists) {
      setColors([...colors, newColor]);
    }
    
    setSelectedColor(newColor);
    setShowColorPicker(false);
  };

  // Paint a pixel at the given coordinates
  const paintPixel = (x, y) => {
    if (!editorCanvas || !selectedColor || isEyedropper) return;
    
    // Skip if we're painting the same pixel (prevents duplicating history)
    if (lastPaintedPixel.x === x && lastPaintedPixel.y === y) return;
    
    const ctx = editorCanvas.getContext('2d', { willReadFrequently: true });
    
    // Always clear the pixel first to ensure we're replacing, not layering
    ctx.clearRect(x, y, 1, 1);
    
    // If the color isn't fully transparent, paint with it
    if (selectedColor.a > 0) {
      ctx.fillStyle = selectedColor.rgba;
      ctx.fillRect(x, y, 1, 1);
    }
    
    // Update last painted pixel
    setLastPaintedPixel({ x, y });
    
    // Mark that edits have been made
    setHasEdits(true);
  };

  // Calculate pixel coordinates from mouse event
  const getPixelCoordinates = (e) => {
    if (!canvasRef.current || !editorCanvas) return null;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = editorCanvas.width / rect.width;
    const scaleY = editorCanvas.height / rect.height;
    
    return {
      x: Math.floor((e.clientX - rect.left) * scaleX),
      y: Math.floor((e.clientY - rect.top) * scaleY)
    };
  };

  // Handle mouse down on canvas
  const handleCanvasMouseDown = (e) => {
    if (isEyedropper) {
      handleCanvasClick(e); // Use existing eyedropper functionality
      return;
    }
    
    if (!selectedColor) return;
    
    // Start painting
    setIsPainting(true);
    
    // Paint the initial pixel
    const coords = getPixelCoordinates(e);
    if (coords) {
      paintPixel(coords.x, coords.y);
    }
  };

  // Handle mouse move on canvas
  const handleCanvasMouseMove = (e) => {
    if (!isPainting || !selectedColor || isEyedropper) return;
    
    const coords = getPixelCoordinates(e);
    if (coords) {
      paintPixel(coords.x, coords.y);
    }
  };

  // Handle mouse up on canvas
  const handleCanvasMouseUp = () => {
    if (isPainting) {
      setIsPainting(false);
      setLastPaintedPixel({ x: -1, y: -1 });
      addToHistory(); // Add to history after a drag operation is complete
    }
  };

  // Handle mouse leave on canvas
  const handleCanvasMouseLeave = () => {
    if (isPainting) {
      setIsPainting(false);
      setLastPaintedPixel({ x: -1, y: -1 });
      addToHistory(); // Add to history when leaving the canvas
    }
  };

  // Handle canvas click
  const handleCanvasClick = (e) => {
    if (!editorCanvas) return;
    
    // Calculate pixel position
    const coords = getPixelCoordinates(e);
    if (!coords) return;
    
    const ctx = editorCanvas.getContext('2d', { alpha: true });
    
    if (isEyedropper) {
      // Get the color at the clicked pixel
      const pixel = ctx.getImageData(coords.x, coords.y, 1, 1).data;
      const pickedColor = {
        r: pixel[0],
        g: pixel[1],
        b: pixel[2],
        a: pixel[3],
        rgba: `rgba(${pixel[0]},${pixel[1]},${pixel[2]},${pixel[3]/255})`,
        hex: rgbToHex(pixel[0], pixel[1], pixel[2])
      };
      
      setSelectedColor(pickedColor);
      setCustomColor(pickedColor.hex);
      setIsEyedropper(false); // Exit eyedropper mode
      return; // Early return to prevent painting
    }
    
    if (!selectedColor) return;
    
    // For single clicks, add to history directly
    if (!isPainting) {
      paintPixel(coords.x, coords.y);
      addToHistory();
    }
  };

  // Add current state to history
  const addToHistory = () => {
    const ctx = editorCanvas.getContext('2d');
    const newState = ctx.getImageData(0, 0, editorCanvas.width, editorCanvas.height);
    
    // If we're in the middle of the history, truncate it
    const newHistory = history.slice(0, currentStep + 1);
    newHistory.push(newState);
    
    setHistory(newHistory);
    setCurrentStep(newHistory.length - 1);
    
    // Mark that edits have been made if this isn't the initial state
    if (currentStep >= 0 || newHistory.length > 1) {
      setHasEdits(true);
    }
  };

  // Undo last action
  const handleUndo = () => {
    if (currentStep <= 0) return;
    
    const newStep = currentStep - 1;
    const ctx = editorCanvas.getContext('2d');
    ctx.putImageData(history[newStep], 0, 0);
    setCurrentStep(newStep);
  };

  // Redo last undone action
  const handleRedo = () => {
    if (currentStep >= history.length - 1) return;
    
    const newStep = currentStep + 1;
    const ctx = editorCanvas.getContext('2d');
    ctx.putImageData(history[newStep], 0, 0);
    setCurrentStep(newStep);
  };

  // Complete editing and return result
  const handleComplete = () => {
    if (!editorCanvas) return;
    
    // Create a scaled-up version for preview
    const previewCanvas = document.createElement('canvas');
    const scale = 16;
    previewCanvas.width = editorCanvas.width * scale;
    previewCanvas.height = editorCanvas.height * scale;
    
    const previewCtx = previewCanvas.getContext('2d');
    previewCtx.imageSmoothingEnabled = false;
    previewCtx.drawImage(
      editorCanvas, 
      0, 0, editorCanvas.width, editorCanvas.height,
      0, 0, previewCanvas.width, previewCanvas.height
    );
    
    const result = {
      preview: previewCanvas.toDataURL('image/png'),
      download: editorCanvas.toDataURL('image/png')
    };
    
    onComplete(result);
  };

  // Toggle eyedropper mode
  const toggleEyedropper = () => {
    setIsEyedropper(!isEyedropper);
  };

  // Update RGB values and convert back to hex
  const updateRgbValue = (component, value) => {
    const rgb = hexToRgb(customColor) || { r: 0, g: 0, b: 0 };
    const alpha = selectedColor?.a || 255;
    rgb[component] = Math.max(0, Math.min(255, parseInt(value) || 0));
    const newHex = rgbToHex(rgb.r, rgb.g, rgb.b);
    setCustomColor(newHex);
    
    // Create a temporary color object to immediately update the preview
    const tempColor = {
      r: rgb.r,
      g: rgb.g,
      b: rgb.b,
      a: alpha,
      rgba: `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha/255})`,
      hex: newHex
    };
    setSelectedColor(tempColor);
  };
  
  // Update selectedColor when customColor changes
  useEffect(() => {
    if (customColor) {
      const rgb = hexToRgb(customColor);
      if (rgb) {
        // Preserve the current alpha value when updating color
        const alpha = selectedColor?.a || 255;
        const tempColor = {
          r: rgb.r,
          g: rgb.g,
          b: rgb.b,
          a: alpha,
          rgba: `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha/255})`,
          hex: customColor
        };
        setSelectedColor(tempColor);
      }
    }
  }, [customColor]);

  // Create canvas for color cursor with direct implementation
  useEffect(() => {
    if (!canvasRef.current) return;
    
    try {
      // Reset classes for visual indicator
      const canvas = canvasRef.current;
      canvas.classList.remove('eyedropper-mode', 'color-mode', 'eraser-mode');
      
      // Set canvas background to be transparent
      canvas.style.background = 'none';
      
      if (isEyedropper) {
        // Add visual indicator class
        canvas.classList.add('eyedropper-mode');
        
        // Try three different approaches for eyedropper cursor
        const eyedropperCursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAF7mlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjAtMDEtMzFUMTk6MjM6MjArMDE6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAxLTMxVDE5OjI4OjU3KzAxOjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIwLTAxLTMxVDE5OjI4OjU3KzAxOjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjc3NzE0YjBkLWI3YmYtNDM5Ny04MzA1LWJkMzQzYWJhNWFmYSIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjQ2MjJlNzFhLTBjNTAtNzg0My04OTRiLWUyODZmMzY5OGUzYiIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjQ1ZTAxZDczLTFiMTYtNGRkYS04OTRjLWFjMTBmMGNlNWI1ZCI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NDVlMDFkNzMtMWIxNi00ZGRhLTg5NGMtYWMxMGYwY2U1YjVkIiBzdEV2dDp3aGVuPSIyMDIwLTAxLTMxVDE5OjIzOjIwKzAxOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoTWFjaW50b3NoKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NzczMTRiMGQtYjdiZi00Mzk3LTgzMDUtYmQzNDNhYmE1YWZhIiBzdEV2dDp3aGVuPSIyMDIwLTAxLTMxVDE5OjI4OjU3KzAxOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoTWFjaW50b3NoKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz5OJuCqAAAD1UlEQVRYhcWXb0xbVRTAf/e+tlQGlK5/NjJwZOA6HIYxxq2LkWA2IbLAXDJJ+KJZ4heTJX7wA5nJgITs04yx+GViEIiJIURchoFgXAQdbg4iyIzjz9baUWjLKKWlr++d/VFKade+UVA8ybe8957T3/n33HOVKIpC9ZdNS+IgmeMgzUeSm+EQxMQ91gRBTivQaDQaAGTJGDZSy7YsG7MRIQlA2CgPJ2KUjNGxX4bCl8LGTwFZ1mtLAOxs7FyqhNLSUi5cuEBxcTG9vb1ER0ej1+uj9jscDpxOJw6Hg4sXL9La2jpvIAvApk2bNiQnJ09ZrVZycnIoKCigrKzM7/zo6GhSUlJISUmhqKiIs2fPcv36dYaHh/2bJyqKkkbw7HrpKStTkSTB85WPsvVJPc4xF5KQeKIsm8GhW0iSpP3r1m3zNR8UXhQExmGXFcXnLlVwfjQvlxybhS2FuUwojjl1vvxmZGjQnB7wI6pLKyoIQbvbbbOnmZKY9IrYnG7P3NR/uiUVzfN34JwKZXn4wUfPd1cUWXaLSCuQoMKWUqAaFBhODuiJnQOQUeAUiNlCRMSqSk6WxI0Wq/Z8VwX4Ioi2XqqiIQMKCCk0HRMCwQWBFkJ4AEGIuCZScaF/L4Qoz6NMiYAxqECk6UuJkgJ/zQ94nrAr8FpkIRKSEAqg+d8I0IYF8G9NqQJsCVFImrn8XmRJUgUYt29/LDYuPvnfm1P27uygOLfYfSBjb1hFNptNdHV1idHRUZGVlRUW/PT3p8Xlny+LqakpMelyiVcrK8X8AE92dnZlbW1tw8DAQMiT0FdfqBp3bX2mUoQB8J3z8/Mbamtrz9XXh+5O9y9QVV8fAzA3Yjxg8vT09EzU19eXtbS0hASZ2wOCCvbR1tbWnGg0Glf7+/vLmpubQwItc8VGOcnvnZqamka9Xn+yoqLiVE9PT4z6TRBMQVBHUOU8derUyeLi4oYdO3Y4/AwHSA0NIKoEr0dFRUVDbW3tO319fUZ/g2XSZgRoJicnjzU1NZ2w2WzbA+2Wgw56oqsLDA0N5TU3N5+w2+1ZgXZLroDXfRTBurVareVtbW0n+vv7/xbhRQDdYttwtfepUMTGxm5vb28/1tnZuYOlJpQIJTb0+8vHnzpY9Z+SWq12ZfctsCO53JKwAEgzf1Z1Y4Vsl/PfB43RfezffwyzKfQGmHBkXE4nPxw7Rsa+LGw7075XFpHT7XbfMm5Jyz13vu/rUPOeAzTlZGXpvALuDg2z7nEjLvfEg55P3wDhyjYGfZxJMgAAAABJRU5ErkJggg==') 3 16, pointer`;
        canvas.style.cursor = eyedropperCursor;
      } else if (selectedColor) {
        // Add visual indicator class
        canvas.classList.add(selectedColor.a < 128 ? 'eraser-mode' : 'color-mode');
        
        // Create a simple color cursor - make it larger (32x32) for better visibility
        const cursorCanvas = document.createElement('canvas');
        cursorCanvas.width = 32;
        cursorCanvas.height = 32;
        const ctx = cursorCanvas.getContext('2d');
        
        // Draw cursor with selected color
        ctx.clearRect(0, 0, 32, 32);
        
        if (selectedColor.a < 128) {
          // Draw eraser cursor
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(8, 8);
          ctx.lineTo(24, 24);
          ctx.moveTo(24, 8);
          ctx.lineTo(8, 24);
          ctx.stroke();
          
          // Draw circle around X
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(16, 16, 12, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Draw color square
          ctx.fillStyle = selectedColor.rgba;
          ctx.fillRect(0, 0, 32, 32);
          
          // Draw strong black border for visibility
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 2;
          ctx.strokeRect(1, 1, 30, 30);
          
          // Draw white inner border for contrast
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 1;
          ctx.strokeRect(3, 3, 26, 26);
        }
        
        // Apply directly to canvas with centered hotspot
        const dataURL = cursorCanvas.toDataURL('image/png');
        canvas.style.cursor = `url(${dataURL}) 16 16, ${selectedColor.a < 128 ? 'not-allowed' : 'crosshair'}`;
      } else {
        // Default cursor
        canvas.style.cursor = 'crosshair';
      }
    } catch (error) {
      console.error("Error setting cursor:", error);
      // Fallback to simple CSS cursor
      if (canvasRef.current) {
        canvasRef.current.style.cursor = isEyedropper ? 'crosshair' : 'pointer';
      }
    }
  }, [isEyedropper, selectedColor]);

  return (
    <div className="pixel-editor">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Pixel Editor</h3>
        <p className="text-sm text-gray-600">Edit your pixel art by clicking or dragging on pixels</p>
      </div>
      
      <div className="editor-container grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Original image - hidden on small screens */}
        <div className="hidden md:block md:col-span-4 lg:col-span-3">
          <h4 className="font-medium mb-2 text-center">Original Image</h4>
          <div className="border border-gray-300 rounded-lg overflow-hidden bg-white relative aspect-square max-w-md mx-auto shadow-sm">
            <div className="checkerboard-bg" style={{
              backgroundImage: 'repeating-conic-gradient(#f0f0f0 0% 25%, #ffffff 0% 50%) 50% / 16px 16px',
              width: '100%',
              height: '100%',
              position: 'absolute'
            }}></div>
            {originalImageUrl && (
              <img 
                src={originalImageUrl} 
                alt="Original cropped image" 
                className="w-full h-full object-contain relative z-10"
              />
            )}
          </div>
        </div>
        
        {/* Canvas area */}
        <div className="md:col-span-4 lg:col-span-5">
          {/* Background Preview Selector */}
          <div className="mb-3 text-center">
            <h4 className="font-medium mb-2">Background Preview</h4>
            <div className="inline-flex space-x-2 bg-gray-50 rounded-lg p-1">
              <button
                onClick={() => setBackgroundPreview('checkerboard')}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  backgroundPreview === 'checkerboard' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Checkerboard
              </button>
              <button
                onClick={() => setBackgroundPreview('white')}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  backgroundPreview === 'white' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                White
              </button>
              <button
                onClick={() => setBackgroundPreview('black')}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  backgroundPreview === 'black' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Black
              </button>
            </div>
          </div>

          <div className={`canvas-wrapper border border-gray-300 rounded-lg overflow-hidden relative aspect-square max-w-md mx-auto ${isEyedropper ? 'eyedropper-active' : selectedColor ? 'color-active' : ''}`}>
            {/* Background layer */}
            <div 
              className="absolute inset-0" 
              style={{
                backgroundColor: backgroundPreview === 'white' ? 'white' : 
                               backgroundPreview === 'black' ? 'black' : 'transparent',
                backgroundImage: backgroundPreview === 'checkerboard' 
                  ? 'linear-gradient(45deg, #e0e0e0 25%, transparent 25%), linear-gradient(-45deg, #e0e0e0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e0e0e0 75%), linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)'
                  : 'none',
                backgroundSize: backgroundPreview === 'checkerboard' ? '8px 8px' : undefined,
                backgroundPosition: backgroundPreview === 'checkerboard' ? '0 0, 0 4px, 4px -4px, -4px 0px' : undefined,
                zIndex: 0
              }}
            />
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseLeave}
              className={`pixel-canvas relative z-10 ${isEyedropper ? 'eyedropper-mode' : selectedColor ? 'color-mode' : ''}`}
              style={{
                imageRendering: 'pixelated',
                width: '100%',
                height: '100%',
                aspectRatio: '1',
                background: 'none'
              }}
            />
          </div>
          
          {/* Tools immediately below canvas */}
          <div className="mt-3 flex justify-center space-x-3 mb-4">
            <button
              className="px-3 py-1 bg-gray-200 rounded-md disabled:opacity-50"
              onClick={handleUndo}
              disabled={currentStep <= 0}
            >
              Undo
            </button>
            <button
              className="px-3 py-1 bg-gray-200 rounded-md disabled:opacity-50"
              onClick={handleRedo}
              disabled={currentStep >= history.length - 1}
            >
              Redo
            </button>
          </div>
          
          {/* Eyedropper notification moved below canvas */}
          {isEyedropper && 
            <p className="bg-blue-100 text-blue-800 p-2 rounded mb-4">
              <strong>Eyedropper mode active</strong> - Click on a pixel to pick its color
            </p>
          }
        </div>
        
        {/* Controls area */}
        <div className="md:col-span-4 lg:col-span-4">
          {/* Color palette first for quicker access */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Color Palette</h4>
            <div className="color-palette grid grid-cols-8 gap-0.5 max-h-40 overflow-y-auto p-1 border border-gray-200 rounded">
              {colors.map((color, index) => (
                <button
                  key={index}
                  className={`w-6 h-6 rounded-sm ${selectedColor === color ? 'ring-1 ring-blue-500' : 'border border-gray-300'}`}
                  style={{ 
                    backgroundColor: color.rgba, 
                    backgroundImage: color.a < 255 
                      ? 'repeating-conic-gradient(#f0f0f0 0% 25%, #ffffff 0% 50%) 50% / 4px 4px' 
                      : 'none'
                  }}
                  onClick={() => setSelectedColor(color)}
                  title={color.hex}
                />
              ))}
            </div>
          </div>
          
          {/* Color picker */}
          <div className="mb-4 relative">
            <h4 className="font-medium mb-2">Add Custom Color</h4>
            <p className="text-xs text-gray-600 mb-2">
              Select any color to begin painting immediately
            </p>
            
            <div className="flex items-center space-x-2">
              <button 
                className={`w-8 h-8 flex items-center justify-center border rounded-md ${isEyedropper ? 'bg-blue-100 border-blue-500 border-2 shadow-sm' : 'border-gray-200 hover:bg-gray-100'}`}
                title="Sample color from the canvas"
                onClick={toggleEyedropper}
              >
                <img src="/icons/eyedropper.svg" alt="Eyedropper" className="w-5 h-5" />
              </button>
              <button 
                className={`w-8 h-8 flex items-center justify-center border rounded-md ${selectedColor?.a < 128 ? 'bg-blue-100 border-blue-500 border-2 shadow-sm' : 'border-gray-200 hover:bg-gray-100'}`}
                title="Eraser (transparent)"
                onClick={() => {
                  setSelectedColor({
                    r: 0, g: 0, b: 0, a: 0,
                    rgba: 'rgba(0,0,0,0)',
                    hex: 'transparent'
                  });
                  setCustomColor('transparent');
                }}
              >
                <img src="/icons/eraser.svg" alt="Eraser" className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={selectedColor ? customColor : ''}
                onChange={(e) => {
                  if (e.target.value === 'transparent') {
                    setSelectedColor({
                      r: 0, g: 0, b: 0, a: 0,
                      rgba: 'rgba(0,0,0,0)',
                      hex: 'transparent'
                    });
                  }
                  setCustomColor(e.target.value);
                }}
                className="w-32 px-2 py-1 border border-gray-300 rounded-md text-sm"
                placeholder="#RRGGBB"
              />
              <div className="relative w-8 h-8">
                <div 
                  className="absolute inset-0 rounded-md"
                  style={{
                    backgroundImage: 'linear-gradient(45deg, #e0e0e0 25%, transparent 25%), linear-gradient(-45deg, #e0e0e0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e0e0e0 75%), linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)',
                    backgroundSize: '8px 8px',
                    backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
                  }}
                />
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className={`absolute inset-0 border rounded-md ${selectedColor && selectedColor.hex === customColor ? 'border-blue-500 ring-1 ring-blue-300' : 'border-gray-300'}`}
                  style={{ 
                    backgroundColor: selectedColor?.rgba || 'transparent'
                  }}
                  title="Click to open color picker - This color is ready for painting"
                />
              </div>
              <button
                onClick={addCustomColor}
                className="px-2 py-1 bg-blue-500 text-white rounded-md text-sm"
              >
                Add
              </button>
            </div>
            
            {showColorPicker && (
              <div 
                ref={colorPickerRef}
                className="absolute z-10 mt-1 bg-white rounded-md shadow-lg border border-gray-300 p-4 w-full"
              >
                {/* Main color selection area - using react-colorful */}
                <RgbaStringColorPicker 
                  color={selectedColor?.rgba || 'rgba(0,0,0,1)'}
                  onChange={(color) => {
                    // Parse the rgba color string
                    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
                    if (match) {
                      const [_, r, g, b, a = "1"] = match;
                      const alpha = Math.round(parseFloat(a) * 255);
                      const hex = rgbToHex(parseInt(r), parseInt(g), parseInt(b));
                      setCustomColor(hex);
                      
                      const tempColor = {
                        r: parseInt(r),
                        g: parseInt(g),
                        b: parseInt(b),
                        a: alpha,
                        rgba: color,
                        hex: hex
                      };
                      setSelectedColor(tempColor);
                    }
                  }}
                />
                
                {/* Color input and preview area */}
                <div className="flex items-center mt-3 space-x-3">
                  <div 
                    className="w-10 h-10 rounded-md border border-gray-300" 
                    style={{ backgroundColor: customColor }}
                  ></div>
                  <div className="flex-1 flex items-center">
                    <input
                      type="text"
                      value={customColor}
                      onChange={(e) => {
                        setCustomColor(e.target.value);
                        // The color will be updated when the input loses focus or when Enter is pressed
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const rgb = hexToRgb(customColor);
                          if (rgb) {
                            const tempColor = {
                              r: rgb.r,
                              g: rgb.g,
                              b: rgb.b,
                              a: 255,
                              rgba: `rgba(${rgb.r},${rgb.g},${rgb.b},1)`,
                              hex: customColor
                            };
                            setSelectedColor(tempColor);
                          }
                        }
                      }}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded-md text-sm"
                      placeholder="#RRGGBB"
                    />
                    <button 
                      className="w-8 h-8 ml-1 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-100"
                      title="Sample color from the canvas"
                      onClick={() => {
                        setShowColorPicker(false);
                        toggleEyedropper();
                      }}
                    >
                      <img src="/icons/eyedropper.svg" alt="Eyedropper" className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {/* RGB inputs for fine-tuning */}
                <div className="flex mt-3 space-x-2">
                  <div className="flex flex-col items-center">
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={selectedColor?.r || 0}
                      onChange={(e) => {
                        updateRgbValue('r', e.target.value);
                      }}
                      className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
                    />
                    <span className="text-xs mt-1">R</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={selectedColor?.g || 0}
                      onChange={(e) => {
                        updateRgbValue('g', e.target.value);
                      }}
                      className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
                    />
                    <span className="text-xs mt-1">G</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={selectedColor?.b || 0}
                      onChange={(e) => {
                        updateRgbValue('b', e.target.value);
                      }}
                      className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
                    />
                    <span className="text-xs mt-1">B</span>
                  </div>
                </div>
                
                {/* Presets */}
                <div className="mt-4 mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Presets</label>
                  <div className="grid grid-cols-8 gap-1">
                    {["#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", 
                      "#FFFF00", "#FF00FF", "#00FFFF", "#FF9900", "#9900FF",
                      "#009900", "#990000", "#999999", "#CCCCCC", "#663300", "#333333"].map((color, idx) => (
                      <button
                        key={idx}
                        className="w-6 h-6 border border-gray-300 rounded-sm hover:border-blue-500"
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          setCustomColor(color);
                          // We don't need to manually update selectedColor since the useEffect will handle it
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex justify-between mt-4">
                  <button
                    onClick={() => setShowColorPicker(false)}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addCustomColor}
                    className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm"
                  >
                    Add to Palette
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="mt-4 space-y-2">
            <button
              onClick={handleComplete}
              className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Save Edits
            </button>
            <button
              onClick={onCancel}
              className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PixelEditor; 