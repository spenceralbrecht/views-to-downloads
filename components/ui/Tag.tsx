import React from 'react';

type TagProps = {
  label: string;
  onRemove?: () => void;
  interactive?: boolean;
  selected?: boolean;
  onClick?: () => void;
};

/**
 * Capitalizes the first letter of a string
 */
const capitalizeFirstLetter = (string: string): string => {
  if (!string) return string;
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export function Tag({ 
  label, 
  onRemove, 
  interactive = false, 
  selected = false,
  onClick
}: TagProps) {
  return (
    <div 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${interactive ? 'cursor-pointer hover:bg-opacity-80' : ''} 
        ${selected 
          ? 'bg-blue-100 text-blue-800' 
          : 'bg-gray-100 text-gray-800'}`}
      onClick={onClick}
    >
      {capitalizeFirstLetter(label)}
      {onRemove && (
        <button
          type="button"
          className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full hover:bg-blue-200"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <span className="sr-only">Remove tag</span>
          <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
            <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
