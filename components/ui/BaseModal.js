import React from 'react';

const BaseModal = ({ 
  title, 
  onClose, 
  children, 
  footer,
  accentColor = 'blue', // Can be 'blue', 'green', or 'purple'
  showExpanded = false
}) => {
  const colorMap = {
    blue: {
      ring: 'ring-blue-500',
      hover: 'hover:text-blue-700',
    },
    green: {
      ring: 'ring-green-500',
      hover: 'hover:text-green-700',
    },
    purple: {
      ring: 'ring-purple-500',
      hover: 'hover:text-purple-700',
    }
  };

  return (
    <div 
      className="w-full bg-white rounded-lg flex flex-col" 
      style={{ 
        minHeight: 'min-content',
        maxHeight: showExpanded ? '90vh' : 'auto'
      }}
    >
      {/* Header */}
      <div className="bg-white flex-shrink-0">
        <div className="p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className={`text-gray-500 ${colorMap[accentColor].hover} focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-lg p-1`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pb-4">
          <div className="max-w-3xl mx-auto">
            {children}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-100 flex-shrink-0">
        <div className="p-4 flex justify-between items-center">
          {footer}
        </div>
      </div>
    </div>
  );
};

export default BaseModal; 