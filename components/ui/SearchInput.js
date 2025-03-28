import React from 'react';

const SearchInput = ({
  value,
  onChange,
  onSubmit,
  placeholder,
  buttonText,
  isLoading,
  disabled,
  accentColor = 'blue', // Can be 'blue', 'green', or 'purple'
  label,
  helperText,
  autoFocus = true
}) => {
  const colorMap = {
    blue: {
      button: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500 disabled:bg-blue-300',
      input: 'focus:ring-blue-500'
    },
    green: {
      button: 'bg-green-500 hover:bg-green-600 focus:ring-green-500 disabled:bg-green-300',
      input: 'focus:ring-green-500'
    },
    purple: {
      button: 'bg-purple-500 hover:bg-purple-600 focus:ring-purple-500 disabled:bg-purple-300',
      input: 'focus:ring-purple-500'
    }
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <form onSubmit={onSubmit} className="flex">
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 ${colorMap[accentColor].input}`}
          disabled={disabled || isLoading}
          autoFocus={autoFocus}
        />
        <button
          type="submit"
          disabled={disabled || isLoading || !value.trim()}
          className={`px-6 py-2 text-white rounded-r-lg focus:outline-none focus:ring-2 ${colorMap[accentColor].button}`}
        >
          {isLoading ? 'Loading...' : buttonText}
        </button>
      </form>
      {helperText && (
        <p className="mt-2 text-xs text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default SearchInput; 