import React, { useState, useEffect, useRef } from 'react';

const PixelEditor = ({ 
  pixelatedImageUrl, // The pixelated image result from PixelArtProcessor
  colorCount, // The current color count used for pixelation
  onComplete, // Callback when editing is complete
  onCancel // Callback to cancel and return to previous step
}) => {
  const [editorCanvas, setEditorCanvas] = useState(null);
  const [colors, setColors] = useState([]); // Extracted color palette
  const [selectedColor, setSelectedColor] = useState(null);
  const [customColor, setCustomColor] = useState('#000000');
  const [history, setHistory] = useState([]); // For undo/redo
  const [currentStep, setCurrentStep] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isEyedropper, setIsEyedropper] = useState(false);
  const canvasRef = useRef(null);
  const colorPickerRef = useRef(null);
  const [colorPickerHue, setColorPickerHue] = useState(0);
  const [colorPickerSaturation, setColorPickerSaturation] = useState(100);
  const [colorPickerLightness, setColorPickerLightness] = useState(50);
  const colorGradientRef = useRef(null);
  const hueSliderRef = useRef(null);
  const [isDraggingColorGradient, setIsDraggingColorGradient] = useState(false);
  const [isDraggingHueSlider, setIsDraggingHueSlider] = useState(false);

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
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions to match the 16x16 original pixelated image
    canvas.width = 16;
    canvas.height = 16;
    
    // Draw the pixelated image
    ctx.drawImage(img, 0, 0, 16, 16);
    
    // Extract the color palette
    const colors = extractColorsFromCanvas(canvas);
    setColors(colors);
    setSelectedColor(colors[0]);
    
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

  // Handle pixel editing
  const handleCanvasClick = (e) => {
    if (!editorCanvas || (!selectedColor && !isEyedropper)) return;
    
    // Calculate pixel position
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = editorCanvas.width / rect.width;
    const scaleY = editorCanvas.height / rect.height;
    
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    const ctx = editorCanvas.getContext('2d');
    
    if (isEyedropper) {
      // Get the color at the clicked pixel
      const pixel = ctx.getImageData(x, y, 1, 1).data;
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
      return;
    }
    
    // Draw the selected color at this pixel
    ctx.fillStyle = selectedColor.rgba;
    ctx.fillRect(x, y, 1, 1);
    
    // Add to history
    addToHistory();
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

  // Get hue value from hex color
  const getHue = (hex) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    
    const { r, g, b } = rgb;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    
    let h = 0;
    
    if (max === min) {
      return 0;
    }
    
    const d = max - min;
    
    if (max === r) {
      h = (g - b) / d + (g < b ? 6 : 0);
    } else if (max === g) {
      h = (b - r) / d + 2;
    } else {
      h = (r - g) / d + 4;
    }
    
    h = Math.round(h * 60);
    
    return h;
  };
  
  // Update RGB values and convert back to hex
  const updateRgbValue = (component, value) => {
    const rgb = hexToRgb(customColor) || { r: 0, g: 0, b: 0 };
    rgb[component] = Math.max(0, Math.min(255, parseInt(value) || 0));
    setCustomColor(rgbToHex(rgb.r, rgb.g, rgb.b));
  };

  // Update HSL values when custom color changes
  useEffect(() => {
    if (customColor) {
      const rgb = hexToRgb(customColor);
      if (rgb) {
        const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
        setColorPickerHue(h);
        setColorPickerSaturation(s);
        setColorPickerLightness(Math.min(l, 100)); // Cap at 100%
      }
    }
  }, [customColor]);

  // Convert RGB to HSL
  const rgbToHsl = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0;
      }
      
      h = h / 6;
    }
    
    return { 
      h: Math.round(h * 360), 
      s: Math.round(s * 100), 
      l: Math.round(l * 100) 
    };
  };
  
  // Convert HSL to RGB with better handling for lightness
  const hslToRgb = (h, s, l) => {
    h /= 360;
    s /= 100;
    l /= 100;
    
    // Ensure valid values (sometimes UI can cause slightly out of bounds values)
    h = Math.max(0, Math.min(1, h));
    s = Math.max(0, Math.min(1, s));
    l = Math.max(0, Math.min(1, l));
    
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
    
    return { 
      r: Math.round(r * 255), 
      g: Math.round(g * 255), 
      b: Math.round(b * 255) 
    };
  };
  
  // Handle click on the color gradient
  const handleColorGradientClick = (e) => {
    if (!colorGradientRef.current) return;
    
    const rect = colorGradientRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    
    // x = saturation (0% at left, 100% at right)
    // y = lightness (100% at top, 0% at bottom) - normalized to 0-100
    const s = Math.round(x * 100);
    const l = Math.round((1 - y) * 100);
    
    setColorPickerSaturation(s);
    setColorPickerLightness(l);
    
    // Update hex color
    const rgb = hslToRgb(colorPickerHue, s, l);
    setCustomColor(rgbToHex(rgb.r, rgb.g, rgb.b));
  };
  
  // Handle click on the hue slider
  const handleHueSliderClick = (e) => {
    if (!hueSliderRef.current) return;
    
    const rect = hueSliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    
    const h = Math.round(x * 360);
    setColorPickerHue(h);
    
    // Update hex color
    const rgb = hslToRgb(h, colorPickerSaturation, colorPickerLightness);
    setCustomColor(rgbToHex(rgb.r, rgb.g, rgb.b));
  };

  // Add event listeners for drag operations
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingColorGradient && colorGradientRef.current) {
        // Update color based on drag position in the gradient
        handleColorGradientMove(e);
      } else if (isDraggingHueSlider && hueSliderRef.current) {
        // Update hue based on drag position in the slider
        handleHueSliderMove(e);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingColorGradient(false);
      setIsDraggingHueSlider(false);
    };

    // Add event listeners
    if (isDraggingColorGradient || isDraggingHueSlider) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingColorGradient, isDraggingHueSlider]);

  // Handle mouse movement in the color gradient
  const handleColorGradientMove = (e) => {
    if (!colorGradientRef.current) return;
    
    const rect = colorGradientRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    
    // x = saturation (0% at left, 100% at right)
    // y = lightness (100% at top, 0% at bottom) - normalized to 0-100
    const s = Math.round(x * 100);
    const l = Math.round((1 - y) * 100);
    
    setColorPickerSaturation(s);
    setColorPickerLightness(l);
    
    // Update hex color
    const rgb = hslToRgb(colorPickerHue, s, l);
    setCustomColor(rgbToHex(rgb.r, rgb.g, rgb.b));
  };
  
  // Handle mouse down in the color gradient
  const handleColorGradientMouseDown = (e) => {
    setIsDraggingColorGradient(true);
    handleColorGradientMove(e); // Update color immediately on click
  };
  
  // Handle mouse movement in the hue slider
  const handleHueSliderMove = (e) => {
    if (!hueSliderRef.current) return;
    
    const rect = hueSliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    
    const h = Math.round(x * 360);
    setColorPickerHue(h);
    
    // Update hex color
    const rgb = hslToRgb(h, colorPickerSaturation, colorPickerLightness);
    setCustomColor(rgbToHex(rgb.r, rgb.g, rgb.b));
  };
  
  // Handle mouse down in the hue slider
  const handleHueSliderMouseDown = (e) => {
    setIsDraggingHueSlider(true);
    handleHueSliderMove(e); // Update hue immediately on click
  };

  return (
    <div className="pixel-editor">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Pixel Editor</h3>
        <p className="text-sm text-gray-600">Edit your pixel art by clicking on individual pixels</p>
      </div>
      
      <div className="editor-container flex flex-col md:flex-row gap-6">
        {/* Canvas area */}
        <div className="flex-1">
          <div className="canvas-wrapper border border-gray-300 rounded-lg overflow-hidden bg-white relative aspect-square max-w-md mx-auto">
            <div className="checkerboard-bg" style={{
              backgroundImage: 'repeating-conic-gradient(#f0f0f0 0% 25%, #ffffff 0% 50%) 50% / 16px 16px',
              width: '100%',
              height: '100%',
              position: 'absolute'
            }}></div>
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="pixel-canvas"
              style={{
                imageRendering: 'pixelated',
                width: '100%',
                height: '100%',
                cursor: isEyedropper ? 'crosshair' : 'pointer',
                aspectRatio: '1',
                position: 'relative'
              }}
            />
          </div>
        </div>
        
        {/* Controls area */}
        <div className="md:w-64">
          {/* Color picker */}
          <div className="mb-4 relative">
            <h4 className="font-medium mb-2">Add Custom Color</h4>
            
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm"
                placeholder="#RRGGBB"
              />
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-8 h-8 border border-gray-300 rounded-md"
                style={{ backgroundColor: customColor }}
              ></button>
              <button
                onClick={addCustomColor}
                className="px-2 py-1 bg-blue-500 text-white rounded-md text-sm"
              >
                Add
              </button>
              <button
                onClick={toggleEyedropper}
                className={`w-8 h-8 flex items-center justify-center rounded-md ${isEyedropper ? 'bg-blue-100 border-blue-500 border-2' : 'bg-gray-100 border border-gray-300'}`}
                title="Eyedropper - Pick color from image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.354 13.354a.5.5 0 01-.708 0l-3-3a.5.5 0 01.708-.708L6 12.293l6.646-6.647a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3-3z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            {showColorPicker && (
              <div 
                ref={colorPickerRef}
                className="absolute z-10 mt-1 bg-white rounded-md shadow-lg border border-gray-300"
                style={{ width: '300px' }}
              >
                {/* Main color selection area */}
                <div className="p-4">
                  {/* Color gradient area */}
                  <div 
                    ref={colorGradientRef}
                    className="relative mb-3 h-48 rounded overflow-hidden cursor-crosshair"
                    onClick={handleColorGradientClick}
                    onMouseDown={handleColorGradientMouseDown}
                  >
                    <div 
                      className="absolute inset-0" 
                      style={{
                        backgroundImage: 'linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, rgba(255,255,255,0))',
                        backgroundBlendMode: 'normal',
                        backgroundColor: `hsl(${colorPickerHue}, 100%, 50%)`
                      }}
                    ></div>
                    {/* Color selector circle - positioned based on color values */}
                    <div 
                      className="absolute w-4 h-4 rounded-full border-2 border-white" 
                      style={{ 
                        transform: 'translate(-50%, -50%)', 
                        boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
                        left: `${colorPickerSaturation}%`,
                        top: `${100 - colorPickerLightness}%`
                      }}
                    ></div>
                  </div>
                  
                  {/* Hue slider */}
                  <div 
                    ref={hueSliderRef}
                    className="relative mb-5 h-5 cursor-pointer"
                    onClick={handleHueSliderClick}
                    onMouseDown={handleHueSliderMouseDown}
                  >
                    <div 
                      className="absolute inset-0 rounded"
                      style={{
                        backgroundImage: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)'
                      }}
                    ></div>
                    {/* Hue selector */}
                    <div 
                      className="absolute w-4 h-full top-0 rounded-sm border border-white"
                      style={{ 
                        left: `${(colorPickerHue / 360) * 100}%`,
                        transform: 'translateX(-50%)',
                        boxShadow: '0 0 0 1px rgba(0,0,0,0.3)'
                      }}
                    ></div>
                  </div>
                  
                  {/* Color preview & eyedropper */}
                  <div className="flex items-center mb-4">
                    <div 
                      className="w-10 h-10 rounded-md mr-2 border border-gray-300" 
                      style={{ backgroundColor: customColor }}
                    ></div>
                    <button 
                      className="p-1 border border-gray-200 rounded"
                      title="Pick a color from the screen"
                      onClick={() => {
                        setShowColorPicker(false);
                        toggleEyedropper();
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6.354 13.354a.5.5 0 01-.708 0l-3-3a.5.5 0 01.708-.708L6 12.293l6.646-6.647a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3-3z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Hex input */}
                    <input
                      type="text"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="ml-auto w-24 px-2 py-1 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  
                  {/* RGB inputs */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div>
                      <input 
                        type="number" 
                        min="0" 
                        max="255"
                        value={hexToRgb(customColor)?.r || 0}
                        onChange={(e) => updateRgbValue('r', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm mb-1"
                      />
                      <label className="text-xs text-center block">R</label>
                    </div>
                    <div>
                      <input 
                        type="number" 
                        min="0" 
                        max="255"
                        value={hexToRgb(customColor)?.g || 0}
                        onChange={(e) => updateRgbValue('g', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm mb-1"
                      />
                      <label className="text-xs text-center block">G</label>
                    </div>
                    <div>
                      <input 
                        type="number" 
                        min="0" 
                        max="255"
                        value={hexToRgb(customColor)?.b || 0}
                        onChange={(e) => updateRgbValue('b', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm mb-1"
                      />
                      <label className="text-xs text-center block">B</label>
                    </div>
                  </div>
                  
                  {/* Presets */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Presets</label>
                    <div className="grid grid-cols-8 gap-1">
                      {["#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", 
                        "#FFFF00", "#FF00FF", "#00FFFF", "#FF9900", "#9900FF",
                        "#009900", "#990000", "#999999", "#CCCCCC", "#663300", "#333333"].map((color, idx) => (
                        <button
                          key={idx}
                          className="w-6 h-6 border border-gray-300 rounded-sm"
                          style={{ backgroundColor: color }}
                          onClick={() => setCustomColor(color)}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Add to palette button */}
                  <div className="flex justify-end">
                    <button
                      onClick={addCustomColor}
                      className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm"
                    >
                      Add to Palette
                    </button>
                  </div>
                </div>
                
                {/* Cancel button */}
                <div 
                  className="bg-gray-100 py-3 px-4 rounded-b-md text-center cursor-pointer"
                  onClick={() => setShowColorPicker(false)}
                >
                  <span className="text-gray-600">Cancel</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Color palette */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Color Palette</h4>
            <div className="color-palette grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
              {colors.map((color, index) => (
                <button
                  key={index}
                  className={`w-8 h-8 rounded-md border ${selectedColor === color ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300'}`}
                  style={{ 
                    backgroundColor: color.rgba, 
                    backgroundImage: color.a < 255 
                      ? 'repeating-conic-gradient(#f0f0f0 0% 25%, #ffffff 0% 50%) 50% / 8px 8px' 
                      : 'none'
                  }}
                  onClick={() => setSelectedColor(color)}
                  title={color.hex}
                />
              ))}
            </div>
          </div>
          
          {/* Tools */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Tools</h4>
            <div className="flex space-x-2">
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