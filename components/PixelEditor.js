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
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isEyedropper, setIsEyedropper] = useState(false);
  const [isPainting, setIsPainting] = useState(false);
  const [isPaintBucket, setIsPaintBucket] = useState(false);
  const [isBrush, setIsBrush] = useState(true);
  const [lastPaintedPixel, setLastPaintedPixel] = useState({ x: -1, y: -1 });
  const [hasEdits, setHasEdits] = useState(false);
  const [backgroundPreview, setBackgroundPreview] = useState('checkerboard');
  const [isEraser, setIsEraser] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const canvasRef = useRef(null);
  const colorPickerRef = useRef(null);
  const currentStepRef = useRef(0);
  const historyRef = useRef([]);
  const canvasContextRef = useRef(null);
  const isInitializedRef = useRef(false);
  const [activeTab, setActiveTab] = useState('editor');
  const [lastCanvasState, setLastCanvasState] = useState(null);
  const [canvasImageData, setCanvasImageData] = useState(null);
  const [previousTool, setPreviousTool] = useState('brush');

  // Add keyboard shortcut support for undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if we're in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if ((e.ctrlKey || e.metaKey) && ((e.shiftKey && e.key === 'z') || e.key === 'y')) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Add effect to reinitialize canvas when switching back to editor
  useEffect(() => {
    if (activeTab === 'editor' && canvasRef.current && pixelatedImageUrl) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true, alpha: true });
        
        // If we have history, use the current state
        if (historyRef.current.length > 0 && currentStep >= 0) {
          ctx.putImageData(historyRef.current[currentStep], 0, 0);
        } else {
          // Otherwise reinitialize from the image
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.drawImage(img, 0, 0, 16, 16);
        }
      };
      
      const imageSource = typeof pixelatedImageUrl === 'object' ? 
        pixelatedImageUrl.preview : pixelatedImageUrl;
      
      img.src = imageSource;
    }
  }, [activeTab, pixelatedImageUrl, currentStep]);

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

  // Add this function to handle canvas scaling
  const setupCanvasScaling = (canvas, ctx) => {
    // Set the canvas size to match container while maintaining aspect ratio
    const container = canvas.parentElement;
    const containerSize = Math.min(container.clientWidth, container.clientHeight);
    
    // Set display size
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    
    // Set actual pixel size to 16x16
    canvas.width = 16;
    canvas.height = 16;
    
    // Disable image smoothing for crisp pixels
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    ctx.oImageSmoothingEnabled = false;
  };

  // Modify the setupCanvas function to properly initialize history
  const setupCanvas = (img) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true });
    canvasContextRef.current = ctx;
    
    // Set up canvas scaling
    setupCanvasScaling(canvas, ctx);
    
    // Clear canvas with transparency
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the pixelated image
    ctx.drawImage(img, 0, 0, 16, 16);
    
    // Extract the color palette
    const colors = extractColorsFromCanvas(canvas);
    setColors(colors);
    setSelectedColor(colors[0]);
    setCustomColor(colors[0].hex);
    
    // Initialize history with the current state
    const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current = [initialState];
    currentStepRef.current = 0;
    setCurrentStep(0);
    
    // Store the initial state for tab switching
    setCanvasImageData(initialState);
    
    setEditorCanvas(canvas);
    isInitializedRef.current = true;
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

  // Flood fill implementation
  const floodFill = (startX, startY, targetColor, replacementColor) => {
    if (!canvasContextRef.current || !isInitializedRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvasContextRef.current;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Convert colors to arrays for comparison
    const target = [targetColor.r, targetColor.g, targetColor.b, targetColor.a];
    const replacement = [replacementColor.r, replacementColor.g, replacementColor.b, replacementColor.a];
    
    // Check if target color matches replacement color to prevent infinite loop
    if (target.every((val, i) => val === replacement[i])) return;
    
    // Use a Set for better performance with large areas
    const pixelsToFill = new Set();
    pixelsToFill.add(`${startX},${startY}`);
    
    while (pixelsToFill.size > 0) {
      const [x, y] = pixelsToFill.values().next().value.split(',').map(Number);
      pixelsToFill.delete(`${x},${y}`);
      
      // Check bounds
      if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;
      
      // Get current pixel index
      const index = (y * canvas.width + x) * 4;
      
      // Check if pixel matches target color
      if (
        data[index] === target[0] &&
        data[index + 1] === target[1] &&
        data[index + 2] === target[2] &&
        data[index + 3] === target[3]
      ) {
        // Replace color
        data[index] = replacement[0];
        data[index + 1] = replacement[1];
        data[index + 2] = replacement[2];
        data[index + 3] = replacement[3];
        
        // Add adjacent pixels to set
        pixelsToFill.add(`${x + 1},${y}`);
        pixelsToFill.add(`${x - 1},${y}`);
        pixelsToFill.add(`${x},${y + 1}`);
        pixelsToFill.add(`${x},${y - 1}`);
      }
    }
    
    // Update canvas with new image data
    ctx.putImageData(imageData, 0, 0);
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
    if (!canvasContextRef.current || !isInitializedRef.current) return;
    
    // Skip if we're painting the same pixel (prevents duplicating history)
    if (lastPaintedPixel.x === x && lastPaintedPixel.y === y) return;
    
    // Always clear the pixel first to ensure we're replacing, not layering
    canvasContextRef.current.clearRect(x, y, 1, 1);
    
    // If not erasing, paint with the selected color
    if (!isEraser && selectedColor?.a > 0) {
      canvasContextRef.current.fillStyle = selectedColor.rgba;
      canvasContextRef.current.fillRect(x, y, 1, 1);
    }
    
    // Update last painted pixel
    setLastPaintedPixel({ x, y });
  };

  // Ensure clean state before capturing history
  const captureHistory = () => {
    if (!canvasRef.current || !canvasContextRef.current) return;
    
    // Reset painting state first
    setIsPainting(false);
    setLastPaintedPixel({ x: -1, y: -1 });
    
    // Capture the current state
    const newState = canvasContextRef.current.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // Update canvasImageData to track the latest state
    setCanvasImageData(newState);
    
    // Remove any future states if we're not at the end of history
    const newHistory = historyRef.current.slice(0, currentStepRef.current + 1);
    newHistory.push(newState);
    historyRef.current = newHistory;
    currentStepRef.current = newHistory.length - 1;
    
    // Update React state last
    setCurrentStep(newHistory.length - 1);
    setHasEdits(true);
  };

  // Handle mouse up on canvas
  const handleCanvasMouseUp = () => {
    if (isPainting) {
      // Ensure we're done painting before capturing history
      requestAnimationFrame(() => {
        captureHistory();
      });
    }
  };

  // Handle mouse leave on canvas
  const handleCanvasMouseLeave = () => {
    if (isPainting) {
      captureHistory();
    }
    // Reset cursor when leaving canvas
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'crosshair';
    }
  };

  // Handle mouse down on canvas
  const handleCanvasMouseDown = (e) => {
    if (isEyedropper) {
      handleCanvasClick(e);
      return;
    }
    
    if (isPaintBucket) {
      // Handle paint bucket...
      const coords = getPixelCoordinates(e);
      if (!coords) return;
      
      const pixel = canvasContextRef.current.getImageData(coords.x, coords.y, 1, 1).data;
      const targetColor = {
        r: pixel[0],
        g: pixel[1],
        b: pixel[2],
        a: pixel[3]
      };
      
      // Set fill style before flood fill
      canvasContextRef.current.fillStyle = selectedColor.rgba;
      
      // Perform flood fill
      floodFill(coords.x, coords.y, targetColor, selectedColor);
      
      // Start painting state to trigger history capture on mouse up
      setIsPainting(true);
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

  // Handle canvas click
  const handleCanvasClick = (e) => {
    if (!canvasContextRef.current || !isInitializedRef.current) return;
    
    // Calculate pixel position
    const coords = getPixelCoordinates(e);
    if (!coords) return;
    
    if (isEyedropper) {
      // Handle eyedropper...
      const pixel = canvasContextRef.current.getImageData(coords.x, coords.y, 1, 1).data;
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
      
      // Restore previous tool
      setIsEyedropper(false);
      switch (previousTool) {
        case 'brush':
          setIsBrush(true);
          break;
        case 'paintBucket':
          setIsPaintBucket(true);
          break;
        case 'eraser':
          setIsEraser(true);
          break;
        default:
          setIsBrush(true);
      }
      return;
    }
    
    if (!selectedColor) return;
    
    // For single clicks with normal brush
    if (!isPainting) {
      paintPixel(coords.x, coords.y);
      captureHistory();
    }
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

  // Handle mouse move on canvas
  const handleCanvasMouseMove = (e) => {
    if (!isPainting || !selectedColor || isEyedropper) return;
    
    const coords = getPixelCoordinates(e);
    if (coords) {
      paintPixel(coords.x, coords.y);
    }
  };

  // Undo last action
  const handleUndo = () => {
    if (!canvasContextRef.current || !historyRef.current.length || !isInitializedRef.current) return;
    
    if (currentStepRef.current <= 0) return;
    
    // Reset painting state first
    setIsPainting(false);
    setLastPaintedPixel({ x: -1, y: -1 });
    
    const newStep = currentStepRef.current - 1;
    const newState = historyRef.current[newStep];
    
    // Update canvas immediately
    canvasContextRef.current.putImageData(newState, 0, 0);
    
    // Update canvasImageData to ensure we save the correct state
    setCanvasImageData(newState);
    
    // Update step ref synchronously
    currentStepRef.current = newStep;
    
    // Update React state last
    setCurrentStep(newStep);
    setHasEdits(true);
  };

  // Redo last undone action
  const handleRedo = () => {
    if (!canvasContextRef.current || !historyRef.current.length || !isInitializedRef.current) return;
    
    if (currentStepRef.current >= historyRef.current.length - 1) return;
    
    const newStep = currentStepRef.current + 1;
    const newState = historyRef.current[newStep];
    
    // Update canvas immediately
    canvasContextRef.current.putImageData(newState, 0, 0);
    
    // Update canvasImageData to ensure we save the correct state
    setCanvasImageData(newState);
    
    // Update step ref synchronously
    currentStepRef.current = newStep;
    
    // Update React state last
    setCurrentStep(newStep);
    setHasEdits(true);
  };

  // Modify the handleComplete function to ensure we're using the current canvas state
  const handleComplete = () => {
    // Create a temporary canvas to handle the save operation
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 16;
    tempCanvas.height = 16;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true, alpha: true });
    tempCtx.imageSmoothingEnabled = false;

    // Get the current state directly from the canvas if we're in editor mode
    let currentState;
    if (activeTab === 'editor' && canvasRef.current && canvasContextRef.current) {
      currentState = canvasContextRef.current.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    } else {
      // Otherwise use the stored state
      currentState = canvasImageData || 
        (historyRef.current.length > 0 ? historyRef.current[currentStep] : null);
    }

    if (currentState) {
      // Apply the current state to the temporary canvas
      tempCtx.putImageData(currentState, 0, 0);
      
      // Create a scaled-up version for preview
      const previewCanvas = document.createElement('canvas');
      const scale = 16;
      previewCanvas.width = tempCanvas.width * scale;
      previewCanvas.height = tempCanvas.height * scale;
      
      const previewCtx = previewCanvas.getContext('2d');
      previewCtx.imageSmoothingEnabled = false;
      
      // Draw the current state to the preview canvas
      previewCtx.drawImage(
        tempCanvas, 
        0, 0, tempCanvas.width, tempCanvas.height,
        0, 0, previewCanvas.width, previewCanvas.height
      );
      
      const result = {
        preview: previewCanvas.toDataURL('image/png'),
        download: tempCanvas.toDataURL('image/png')
      };
      
      onComplete(result);
    } else {
      // If no state is available, use the original pixelated image
      const img = new Image();
      img.onload = () => {
        tempCtx.drawImage(img, 0, 0, 16, 16);
        
        // Create preview version
        const previewCanvas = document.createElement('canvas');
        const scale = 16;
        previewCanvas.width = tempCanvas.width * scale;
        previewCanvas.height = tempCanvas.height * scale;
        
        const previewCtx = previewCanvas.getContext('2d');
        previewCtx.imageSmoothingEnabled = false;
        
        previewCtx.drawImage(
          tempCanvas,
          0, 0, tempCanvas.width, tempCanvas.height,
          0, 0, previewCanvas.width, previewCanvas.height
        );
        
        const result = {
          preview: previewCanvas.toDataURL('image/png'),
          download: tempCanvas.toDataURL('image/png')
        };
        
        onComplete(result);
      };
      
      const imageSource = typeof pixelatedImageUrl === 'object' ? 
        pixelatedImageUrl.preview : pixelatedImageUrl;
      
      img.src = imageSource;
    }
  };

  // Toggle eraser mode
  const toggleEraser = () => {
    if (!isEraser) {
      setPreviousTool('eraser');
      setIsEraser(true);
      setIsEyedropper(false);
      setIsPaintBucket(false);
      setIsBrush(false);
    }
  };

  // Toggle eyedropper mode
  const toggleEyedropper = () => {
    if (!isEyedropper) {
      // Store current tool before switching to eyedropper
      if (isBrush) setPreviousTool('brush');
      if (isPaintBucket) setPreviousTool('paintBucket');
      if (isEraser) setPreviousTool('eraser');
      
      setIsEyedropper(true);
      setIsPaintBucket(false);
      setIsBrush(false);
      setIsEraser(false);
    }
  };

  // Toggle paint bucket mode
  const togglePaintBucket = () => {
    if (!isPaintBucket) {
      setPreviousTool('paintBucket');
      setIsPaintBucket(true);
      setIsEyedropper(false);
      setIsBrush(false);
      setIsEraser(false);
    }
    // Reset cursor when toggling paint bucket
    if (canvasRef.current) {
      canvasRef.current.style.cursor = !isPaintBucket ? 'crosshair' : 'pointer';
    }
  };

  // Toggle brush mode
  const toggleBrush = () => {
    if (!isBrush) {
      setPreviousTool('brush');
      setIsBrush(true);
      setIsEyedropper(false);
      setIsPaintBucket(false);
      setIsEraser(false);
    }
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
    if (customColor && !showColorPicker) { // Only update when not actively using the color picker
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
      } else if (isEraser) {
        // Draw eraser cursor
        const cursorCanvas = document.createElement('canvas');
        cursorCanvas.width = 32;
        cursorCanvas.height = 32;
        const ctx = cursorCanvas.getContext('2d');
        
        // Draw X with black outline
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
        
        // Apply cursor
        const dataURL = cursorCanvas.toDataURL('image/png');
        canvas.style.cursor = `url(${dataURL}) 16 16, not-allowed`;
      } else if (selectedColor) {
        // Add visual indicator class
        canvas.classList.add('color-mode');
        
        // Create a simple color cursor - make it larger (32x32) for better visibility
        const cursorCanvas = document.createElement('canvas');
        cursorCanvas.width = 32;
        cursorCanvas.height = 32;
        const ctx = cursorCanvas.getContext('2d');
        
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
        
        // Apply cursor
        const dataURL = cursorCanvas.toDataURL('image/png');
        canvas.style.cursor = `url(${dataURL}) 16 16, crosshair`;
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
  }, [isEyedropper, selectedColor, isEraser]);

  // Modify the handleTabSwitch function to properly handle state
  const handleTabSwitch = (tab) => {
    if (tab === 'original' && canvasRef.current && canvasContextRef.current) {
      // Store the current canvas state before switching away
      try {
        const imageData = canvasContextRef.current.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
        setCanvasImageData(imageData);
        
        // Also update history if needed
        if (historyRef.current.length === 0 || 
            !areImageDatasEqual(imageData, historyRef.current[currentStep])) {
          historyRef.current.push(imageData);
          currentStepRef.current = historyRef.current.length - 1;
          setCurrentStep(currentStepRef.current);
        }
      } catch (error) {
        console.error("Error storing canvas state:", error);
      }
    }

    if (tab === 'editor' && pixelatedImageUrl) {
      const img = new Image();
      img.onload = () => {
        if (!canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true });
        canvasContextRef.current = ctx;
        
        // Set canvas dimensions and disable smoothing
        canvas.width = 16;
        canvas.height = 16;
        ctx.imageSmoothingEnabled = false;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Restore canvas state with proper history management
        if (canvasImageData) {
          try {
            ctx.putImageData(canvasImageData, 0, 0);
            
            // Ensure history is properly initialized
            if (historyRef.current.length === 0) {
              historyRef.current = [canvasImageData];
              currentStepRef.current = 0;
              setCurrentStep(0);
            }
            // Update history if this state isn't already the latest
            else if (!areImageDatasEqual(canvasImageData, historyRef.current[currentStep])) {
              // Remove any future states if we're not at the end of history
              historyRef.current = historyRef.current.slice(0, currentStep + 1);
              historyRef.current.push(canvasImageData);
              currentStepRef.current = historyRef.current.length - 1;
              setCurrentStep(currentStepRef.current);
            }
          } catch (error) {
            console.error("Error restoring canvas state:", error);
            fallbackToHistory(ctx, img);
          }
        } else {
          fallbackToHistory(ctx, img);
        }

        // Restore cursor state
        requestAnimationFrame(() => {
          updateCursor(canvas);
        });
      };
      
      const imageSource = typeof pixelatedImageUrl === 'object' ? 
        pixelatedImageUrl.preview : pixelatedImageUrl;
      
      img.src = imageSource;
    }
    setActiveTab(tab);
  };

  // Helper function to compare ImageData objects
  const areImageDatasEqual = (imageData1, imageData2) => {
    if (!imageData1 || !imageData2) return false;
    if (imageData1.width !== imageData2.width || 
        imageData1.height !== imageData2.height) return false;
    
    const data1 = imageData1.data;
    const data2 = imageData2.data;
    
    for (let i = 0; i < data1.length; i++) {
      if (data1[i] !== data2[i]) return false;
    }
    return true;
  };

  // Helper function to fallback to history or original image
  const fallbackToHistory = (ctx, img) => {
    try {
      if (historyRef.current.length > 0 && currentStep >= 0) {
        ctx.putImageData(historyRef.current[currentStep], 0, 0);
      } else {
        // Draw from the original image
        ctx.drawImage(img, 0, 0, 16, 16);
        
        // Initialize history with the original state
        const initialState = ctx.getImageData(0, 0, 16, 16);
        historyRef.current = [initialState];
        currentStepRef.current = 0;
        setCurrentStep(0);
      }
    } catch (error) {
      console.error("Error in fallback:", error);
      // Last resort: draw the original image
      ctx.drawImage(img, 0, 0, 16, 16);
    }
  };

  // Helper function to update cursor
  const updateCursor = (canvas) => {
    if (isEyedropper) {
      canvas.classList.add('eyedropper-mode');
      canvas.style.cursor = `url('/icons/eyedropper-cursor.svg') 1 20, crosshair`;
    } else if (isEraser) {
      const cursorCanvas = document.createElement('canvas');
      cursorCanvas.width = 32;
      cursorCanvas.height = 32;
      const cursorCtx = cursorCanvas.getContext('2d');
      
      // Draw X with black outline
      cursorCtx.strokeStyle = 'black';
      cursorCtx.lineWidth = 2;
      cursorCtx.beginPath();
      cursorCtx.moveTo(8, 8);
      cursorCtx.lineTo(24, 24);
      cursorCtx.moveTo(24, 8);
      cursorCtx.lineTo(8, 24);
      cursorCtx.stroke();
      
      // Draw circle around X
      cursorCtx.strokeStyle = 'white';
      cursorCtx.lineWidth = 1;
      cursorCtx.beginPath();
      cursorCtx.arc(16, 16, 12, 0, Math.PI * 2);
      cursorCtx.stroke();
      
      const dataURL = cursorCanvas.toDataURL('image/png');
      canvas.style.cursor = `url(${dataURL}) 16 16, not-allowed`;
    } else if (selectedColor) {
      const cursorCanvas = document.createElement('canvas');
      cursorCanvas.width = 32;
      cursorCanvas.height = 32;
      const cursorCtx = cursorCanvas.getContext('2d');
      
      // Draw color square
      cursorCtx.fillStyle = selectedColor.rgba;
      cursorCtx.fillRect(0, 0, 32, 32);
      
      // Draw strong black border for visibility
      cursorCtx.strokeStyle = 'black';
      cursorCtx.lineWidth = 2;
      cursorCtx.strokeRect(1, 1, 30, 30);
      
      // Draw white inner border for contrast
      cursorCtx.strokeStyle = 'white';
      cursorCtx.lineWidth = 1;
      cursorCtx.strokeRect(3, 3, 26, 26);
      
      const dataURL = cursorCanvas.toDataURL('image/png');
      canvas.style.cursor = `url(${dataURL}) 16 16, crosshair`;
    } else {
      canvas.style.cursor = 'crosshair';
    }
  };

  // Add resize observer to handle container size changes
  useEffect(() => {
    if (!canvasRef.current || !canvasContextRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (activeTab === 'editor') {
        setupCanvasScaling(canvasRef.current, canvasContextRef.current);
        if (historyRef.current[currentStep]) {
          canvasContextRef.current.putImageData(historyRef.current[currentStep], 0, 0);
        }
      }
    });

    resizeObserver.observe(canvasRef.current.parentElement);

    return () => resizeObserver.disconnect();
  }, [activeTab, currentStep]);

  // Add effect to handle canvas restoration
  useEffect(() => {
    if (activeTab === 'editor' && canvasContextRef.current && lastCanvasState) {
      requestAnimationFrame(() => {
        canvasContextRef.current.putImageData(lastCanvasState, 0, 0);
      });
    }
  }, [activeTab, lastCanvasState]);

  return (
    <div className="pixel-editor max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Pixel Editor</h3>
        <p className="text-sm text-gray-600">Edit your pixel art by clicking or dragging on pixels</p>
      </div>
      
      <div className="editor-container grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Main Canvas Area */}
        <div className="lg:col-span-3">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-3">
            <button
              onClick={() => handleTabSwitch('editor')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg -mb-px ${
                activeTab === 'editor'
                  ? 'text-blue-600 border-x border-t border-b-white border-gray-200 bg-white'
                  : 'text-gray-500 hover:text-gray-700 border-b border-gray-200'
              }`}
            >
              Editor Canvas
            </button>
            <button
              onClick={() => handleTabSwitch('original')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg -mb-px ${
                activeTab === 'original'
                  ? 'text-blue-600 border-x border-t border-b-white border-gray-200 bg-white'
                  : 'text-gray-500 hover:text-gray-700 border-b border-gray-200'
              }`}
            >
              Original Image
            </button>
          </div>

          {/* Canvas Display Area */}
          <div className="relative">
            {/* Background Controls - Only show for editor tab */}
            {activeTab === 'editor' && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 text-sm">Canvas Background</h4>
                  <div className="inline-flex space-x-1 bg-gray-50 rounded-lg p-1">
                    <button
                      onClick={() => setBackgroundPreview('checkerboard')}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        backgroundPreview === 'checkerboard' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Transparent
                    </button>
                    <button
                      onClick={() => setBackgroundPreview('white')}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        backgroundPreview === 'white' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      White
                    </button>
                    <button
                      onClick={() => setBackgroundPreview('black')}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        backgroundPreview === 'black' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Black
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Canvas/Image Container */}
            <div className="border border-gray-300 rounded-lg overflow-hidden relative aspect-square">
              {activeTab === 'editor' ? (
                <>
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
                    className="pixel-canvas absolute inset-0"
                    style={{
                      imageRendering: 'pixelated',
                      width: '100%',
                      height: '100%',
                      aspectRatio: '1',
                      background: 'none'
                    }}
                  />
                </>
              ) : (
                <div className="relative w-full h-full">
                  <div className="checkerboard-bg absolute inset-0" style={{
                    backgroundImage: 'repeating-conic-gradient(#f0f0f0 0% 25%, #ffffff 0% 50%) 50% / 16px 16px'
                  }}></div>
                  {originalImageUrl && (
                    <img 
                      src={originalImageUrl} 
                      alt="Original cropped image" 
                      className="relative z-10 w-full h-full object-contain"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Undo/Redo controls - Only show for editor tab */}
            {activeTab === 'editor' && (
              <div className="mt-3 flex justify-center space-x-3">
                <button
                  className="px-3 py-1 bg-gray-200 text-gray-900 rounded-md disabled:opacity-50 hover:bg-gray-300"
                  onClick={handleUndo}
                  disabled={currentStep <= 0}
                >
                  Undo
                </button>
                <button
                  className="px-3 py-1 bg-gray-200 text-gray-900 rounded-md disabled:opacity-50 hover:bg-gray-300"
                  onClick={handleRedo}
                  disabled={currentStep >= historyRef.current.length - 1}
                >
                  Redo
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tools and Color Controls */}
        <div className="lg:col-span-1">
          {/* Action Buttons - Moved to top */}
          <div className="mb-4 space-y-2">
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

          <div className="space-y-3">
            {/* Tools Section */}
            <div className="bg-white p-2.5 rounded-lg border border-gray-200">
              <h4 className="font-medium mb-2 text-gray-900 text-sm">Drawing Tools</h4>
              <div className="grid grid-cols-2 gap-1.5">
                <button 
                  className={`flex items-center justify-center space-x-2 p-1.5 rounded-md ${
                    isBrush ? 'bg-blue-100 border-blue-500 border-2 text-gray-900' : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                  }`}
                  onClick={toggleBrush}
                  title="Paint brush"
                >
                  <img src="/icons/brush.svg" alt="Brush" className="w-4 h-4" />
                  <span className="text-xs">Brush</span>
                </button>
                <button 
                  className={`flex items-center justify-center space-x-2 p-1.5 rounded-md ${
                    isEyedropper ? 'bg-blue-100 border-blue-500 border-2 text-gray-900' : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                  }`}
                  onClick={toggleEyedropper}
                  title="Sample color from the canvas"
                >
                  <img src="/icons/eyedropper.svg" alt="Eyedropper" className="w-4 h-4" />
                  <span className="text-xs">Pick</span>
                </button>
                <button 
                  className={`flex items-center justify-center space-x-2 p-1.5 rounded-md ${
                    isEraser ? 'bg-blue-100 border-blue-500 border-2 text-gray-900' : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                  }`}
                  onClick={toggleEraser}
                  title="Eraser (transparent)"
                >
                  <img src="/icons/eraser.svg" alt="Eraser" className="w-4 h-4" />
                  <span className="text-xs">Erase</span>
                </button>
                <button 
                  className={`flex items-center justify-center space-x-2 p-1.5 rounded-md ${
                    isPaintBucket ? 'bg-blue-100 border-blue-500 border-2 text-gray-900' : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                  }`}
                  onClick={togglePaintBucket}
                  title="Paint bucket (fill)"
                >
                  <img src="/icons/paintbucket.svg" alt="Paint Bucket" className="w-4 h-4" />
                  <span className="text-xs">Fill</span>
                </button>
              </div>
            </div>

            {/* Color Controls */}
            <div className="bg-white p-2.5 rounded-lg border border-gray-200">
              <div className="space-y-3">
                {/* Custom Color Section */}
                <div>
                  <h4 className="font-medium mb-1.5 text-gray-900 text-sm">Custom Color</h4>
                  <div className="flex items-center gap-1.5">
                    <div className="relative w-6 h-6 flex-shrink-0">
                      <div 
                        className="absolute inset-0 rounded"
                        style={{
                          backgroundImage: 'linear-gradient(45deg, #e0e0e0 25%, transparent 25%), linear-gradient(-45deg, #e0e0e0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e0e0e0 75%), linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)',
                          backgroundSize: '6px 6px',
                          backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px'
                        }}
                      />
                      <button
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className={`absolute inset-0 border rounded ${selectedColor && selectedColor.hex === customColor ? 'ring-2 ring-blue-500' : 'border-gray-300'}`}
                        style={{ 
                          backgroundColor: selectedColor?.rgba || 'transparent'
                        }}
                        title="Click to open color picker"
                      />
                    </div>
                    <input
                      type="text"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="flex-1 min-w-0 px-1.5 py-1 border border-gray-300 rounded text-sm"
                      placeholder="#RRGGBB"
                    />
                    <button
                      onClick={addCustomColor}
                      className="flex-shrink-0 h-6 w-6 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 inline-flex items-center justify-center"
                      title="Add to palette"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Color Palette */}
                <div>
                  <h4 className="font-medium mb-1.5 text-gray-900 text-sm">Color Palette</h4>
                  <div className="color-palette flex flex-wrap gap-0.5 p-0.5 border border-gray-200 rounded bg-white max-h-[120px] overflow-y-auto">
                    {colors.map((color, index) => (
                      <button
                        key={index}
                        className={`w-8 h-8 rounded-sm ${selectedColor === color ? 'ring-1 ring-blue-500' : 'border border-gray-200'}`}
                        style={{ 
                          backgroundColor: color.rgba, 
                          backgroundImage: color.a < 255 
                            ? 'repeating-conic-gradient(#f0f0f0 0% 25%, #ffffff 0% 50%) 50% / 4px 4px' 
                            : 'none'
                        }}
                        onClick={() => {
                          setSelectedColor(color);
                          if (!isBrush && !isEyedropper && !isPaintBucket) {
                            setIsBrush(true);
                          }
                        }}
                        title={color.hex}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Color Picker Popup */}
      {showColorPicker && (
        <div 
          ref={colorPickerRef}
          className="fixed z-50 p-4 bg-white rounded-lg shadow-xl border border-gray-200"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '90vw',
            width: '320px'
          }}
        >
          <RgbaStringColorPicker 
            color={selectedColor?.rgba || 'rgba(0,0,0,1)'}
            onChange={(color) => {
              const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
              if (match) {
                const [_, r, g, b, a = "1"] = match;
                const alpha = Math.round(parseFloat(a) * 255);
                const hex = rgbToHex(parseInt(r), parseInt(g), parseInt(b));
                
                const tempColor = {
                  r: parseInt(r),
                  g: parseInt(g),
                  b: parseInt(b),
                  a: alpha,
                  rgba: color,
                  hex: hex
                };
                
                setSelectedColor(tempColor);
                setCustomColor(hex);
              }
            }}
          />
          
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => setShowColorPicker(false)}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md"
            >
              Close
            </button>
            <button
              onClick={addCustomColor}
              className="px-3 py-1 bg-blue-500 text-white rounded-md"
            >
              Add to Palette
            </button>
          </div>
        </div>
      )}

      {/* Eyedropper notification */}
      {isEyedropper && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg shadow-lg z-50">
          Click on a pixel to pick its color
        </div>
      )}
    </div>
  );
};

export default PixelEditor;