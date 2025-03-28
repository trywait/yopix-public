import React from 'react';
import { useState } from 'react';
import ShareModal from '../modals/ShareModal';
import { buttonStyles } from '../../styles/buttons';

const DownloadButton = ({ imageUrl, filename = 'pixel-art.png' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      setError('Failed to download image. Please try again.');
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 relative z-10">
        <button
          onClick={handleDownload}
          className={`${buttonStyles.base} ${buttonStyles.primary}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Download
        </button>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-white bg-purple-500 hover:bg-purple-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
          Share
        </button>
      </div>
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDownload={handleDownload}
        filename={filename}
      />
    </div>
  );
};

export default DownloadButton; 