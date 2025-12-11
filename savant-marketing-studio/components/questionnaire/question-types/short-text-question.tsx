'use client';

import { useState, useEffect } from 'react';

interface ShortTextQuestionProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  maxLength?: number;
  error?: string;
}

export default function ShortTextQuestion({
  value,
  onChange,
  onBlur,
  placeholder = 'Enter your answer...',
  maxLength = 100,
  error,
}: ShortTextQuestionProps) {
  const [charCount, setCharCount] = useState(value.length);

  useEffect(() => {
    setCharCount(value.length);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (maxLength && newValue.length > maxLength) return;
    onChange(newValue);
    setCharCount(newValue.length);
  };

  return (
    <div className="w-full">
      <input
        type="text"
        value={value || ''}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-4 py-3 bg-black border border-[#333333] rounded-lg text-base text-white placeholder:text-gray-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? 'error-message' : undefined}
      />
      
      {/* Error Message */}
      {error && (
        <div className="mt-2">
          <span id="error-message" className="text-red-500 text-sm">
            {error}
          </span>
        </div>
      )}

      {/* Character Counter - Only show when approaching limit */}
      {value.length > maxLength * 0.9 && (
        <div className="mt-2 text-xs text-yellow-500">
          Approaching limit: {value.length}/{maxLength}
        </div>
      )}
    </div>
  );
}
