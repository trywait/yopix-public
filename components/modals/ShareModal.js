import React from 'react';

const ShareModal = ({ isOpen, onClose, onDownload, filename }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Share on Yoto Icons</h2>
        <p className="text-gray-600 mb-6">
          Support the growing community of Yoto Icon creators by sharing your pixel art!
        </p>
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 text-gray-900">How to share:</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-900">
              <li>Download your pixel art</li>
              <li>Sign in to Yoto Icons</li>
              <li>Upload your downloaded art to Yoto Icons</li>
              <li>If you edited an existing Yoto Icon, please attribute the original author</li>
            </ol>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onDownload}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#4285f4] text-white rounded-md hover:bg-[#3367d6] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download
            </button>
            <a
              href="https://www.yotoicons.com/login"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white text-[#4285f4] rounded-md hover:bg-gray-50 transition-colors border border-[#4285f4]"
            >
              Sign in to Yoto Icons
            </a>
          </div>
          <button
            onClick={onClose}
            className="w-full text-gray-500 hover:text-gray-700 py-2 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal; 