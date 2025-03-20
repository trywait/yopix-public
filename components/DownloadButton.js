import React from 'react';
import { useState } from 'react';
import { storage } from '../utils/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

const DownloadButton = ({ imageUrl, filename = 'pixel-art.png' }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [shareableUrl, setShareableUrl] = useState(null);
  const [showShareUrl, setShowShareUrl] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = () => {
    console.log('[DEBUG] Download requested with filename:', filename);
    try {
      // Get the appropriate URL (either direct URL or download URL from object)
      const downloadUrl = typeof imageUrl === 'object' ? imageUrl.download : imageUrl;
      
      if (!downloadUrl) {
        console.error('No image URL provided for download');
        return;
      }

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      
      // Trigger the download
      link.click();
      
      // Clean up
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading image:', err);
    }
  };

  const handleShare = async () => {
    if (shareableUrl) {
      setShowShareUrl(true);
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      
      // Create a temporary canvas to ensure we're sharing exactly 16x16 pixels
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 16;
      tempCanvas.height = 16;
      const ctx = tempCanvas.getContext('2d');
      
      // Load the pixelated image
      const img = new Image();
      
      try {
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageUrl;
        });
        
        // Disable smoothing for crisp pixel art
        ctx.imageSmoothingEnabled = false;
        
        // Draw the image at exactly 16x16
        ctx.drawImage(img, 0, 0, 16, 16);
        
        // Get the exact 16x16 image as a data URL
        const exactSizeDataUrl = tempCanvas.toDataURL('image/png');
        
        // Generate a unique filename
        const timestamp = new Date().getTime();
        const randomString = Math.random().toString(36).substring(2, 8);
        const filename = `pixel-art-${timestamp}-${randomString}.png`;
        
        // Upload to Firebase Storage
        const storageRef = ref(storage, `pixel-art/${filename}`);
        await uploadString(storageRef, exactSizeDataUrl, 'data_url');
        
        // Get the download URL
        const url = await getDownloadURL(storageRef);
        setShareableUrl(url);
        setShowShareUrl(true);
        setIsUploading(false);
      } catch (err) {
        console.error('Error processing image for sharing:', err);
        setError('Failed to process the image for sharing.');
        setIsUploading(false);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image. Please try again.');
      setIsUploading(false);
    }
  };

  const copyToClipboard = () => {
    try {
      navigator.clipboard.writeText(shareableUrl)
        .then(() => {
          alert('URL copied to clipboard!');
        })
        .catch((err) => {
          console.error('Failed to copy URL: ', err);
          setError('Failed to copy URL to clipboard.');
        });
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      setError('Failed to access clipboard.');
    }
  };

  return (
    <div>
      <div className="p-3 bg-gray-100 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Download & Share</h3>
        
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-lg mb-3 text-sm">
            {error}
          </div>
        )}
        
        <div className="flex space-x-4">
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center flex-1 justify-center"
            disabled={!imageUrl}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download
          </button>
          
          <button
            onClick={handleShare}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center flex-1 justify-center"
            disabled={!imageUrl || isUploading}
          >
            {isUploading ? (
              <>
                <div className="animate-spin h-5 w-5 mr-2 border-t-2 border-white rounded-full"></div>
                Uploading...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
                Share
              </>
            )}
          </button>
        </div>
        
        {showShareUrl && shareableUrl && (
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-700 mb-1">Shareable Link:</p>
            <div className="flex">
              <input
                type="text"
                value={shareableUrl}
                readOnly
                className="flex-1 p-2 border border-gray-300 rounded-l-lg text-sm"
              />
              <button
                onClick={copyToClipboard}
                className="px-3 py-2 bg-gray-200 rounded-r-lg hover:bg-gray-300 transition"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadButton; 