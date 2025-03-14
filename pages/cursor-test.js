import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

export default function CursorTest() {
  const [colorCursor, setColorCursor] = useState(null);
  const canvasRef = useRef(null);
  const [isEyedropper, setIsEyedropper] = useState(false);
  
  // Generate a color cursor
  const generateColorCursor = (color) => {
    const cursorCanvas = document.createElement('canvas');
    cursorCanvas.width = 16;
    cursorCanvas.height = 16;
    const ctx = cursorCanvas.getContext('2d');
    
    // Draw cursor
    ctx.clearRect(0, 0, 16, 16);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 16, 16);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, 15, 15);
    
    return cursorCanvas.toDataURL('image/png');
  };
  
  // Set up test colors
  useEffect(() => {
    setColorCursor(generateColorCursor('red'));
  }, []);
  
  // Create the test canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Create a checkerboard pattern
    const squareSize = 20;
    for (let y = 0; y < canvas.height; y += squareSize) {
      for (let x = 0; x < canvas.width; x += squareSize) {
        ctx.fillStyle = (x + y) % (squareSize * 2) === 0 ? '#f0f0f0' : '#ffffff';
        ctx.fillRect(x, y, squareSize, squareSize);
      }
    }
  }, []);
  
  // Update cursor on the canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    
    if (isEyedropper) {
      // Direct base64 data URL for maximum compatibility
      canvasRef.current.style.cursor = "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABGdBTUEAALGPC/xhBQAAAJZJREFUWMPt10sKgDAMBNCZ3v8SbqXfUWasWBTNQhFmE5LA8AgB3EMNqRx39XzRMeucO9e31RijJQ+lDZYsDcMwDMMwzG8Y5k3M5zWXQimlZSU2xmwMQwhbT4wxljxsrV2b4mJKaetp7/3WExHZekJESx6sRx7Wmrg1aHlI5OXhlVv2Yf2Xf3lV/Zh8xzAMwzAMw7wxD0rYiKDDs38ZAAAAAElFTkSuQmCC') 1 20, crosshair";
    } else if (colorCursor) {
      // Color cursor
      canvasRef.current.style.cursor = `url(${colorCursor}) 0 0, crosshair`;
    } else {
      canvasRef.current.style.cursor = 'crosshair';
    }
  }, [isEyedropper, colorCursor]);
  
  return (
    <div className="p-8">
      <Head>
        <title>Cursor Test Page</title>
      </Head>
      
      <h1 className="text-2xl font-bold mb-4">Cursor Compatibility Test</h1>
      
      <div className="mb-6">
        <p className="mb-2">This page tests different cursor implementations to ensure they work in your browser.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-3">1. Canvas with Custom Cursor</h2>
          <p className="mb-2 text-sm text-gray-600">
            Displays either an eyedropper or color cursor based on the selected mode.
          </p>
          
          <div className="border border-gray-300 rounded-lg overflow-hidden bg-white relative mb-4">
            <canvas
              ref={canvasRef}
              width="300"
              height="300"
              className="w-full"
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setIsEyedropper(!isEyedropper)}
              className={`px-4 py-2 rounded-md ${isEyedropper ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              {isEyedropper ? 'Eyedropper Active' : 'Activate Eyedropper'}
            </button>
            
            <button
              onClick={() => setColorCursor(generateColorCursor(`rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`)) }
              className="px-4 py-2 bg-gray-200 rounded-md"
              disabled={isEyedropper}
            >
              Random Color Cursor
            </button>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-3">2. CSS Cursor Tests</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Standard CSS cursor (SVG)</p>
              <div 
                className="h-16 bg-blue-100 rounded flex items-center justify-center"
                style={{ cursor: "url('/icons/eyedropper-cursor.svg') 1 20, crosshair" }}
              >
                Hover here - SVG cursor
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Base64 Encoded PNG cursor</p>
              <div 
                className="h-16 bg-green-100 rounded flex items-center justify-center"
                style={{ cursor: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABGdBTUEAALGPC/xhBQAAAJZJREFUWMPt10sKgDAMBNCZ3v8SbqXfUWasWBTNQhFmE5LA8AgB3EMNqRx39XzRMeucO9e31RijJQ+lDZYsDcMwDMMwzG8Y5k3M5zWXQimlZSU2xmwMQwhbT4wxljxsrV2b4mJKaetp7/3WExHZekJESx6sRx7Wmrg1aHlI5OXhlVv2Yf2Xf3lV/Zh8xzAMwzAMw7wxD0rYiKDDs38ZAAAAAElFTkSuQmCC') 1 20, crosshair" }}
              >
                Hover here - Base64 PNG cursor
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Dynamic color cursor (updated on click)</p>
              <div 
                id="dynamic-cursor-area"
                className="h-16 bg-red-100 rounded flex items-center justify-center"
                style={{ cursor: colorCursor ? `url(${colorCursor}) 0 0, crosshair` : 'crosshair' }}
                onClick={() => setColorCursor(generateColorCursor(`rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`)) }
              >
                Click & hover here - Dynamic cursor will change
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-semibold">Troubleshooting</h3>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>If cursors don't work, try a different browser (Chrome usually has the best cursor support)</li>
          <li>Check your browser console for any errors</li>
          <li>Some browsers may restrict custom cursors to 32x32 pixels max</li>
          <li>Safari sometimes has issues with SVG cursors but works with PNG</li>
        </ul>
      </div>
    </div>
  );
} 