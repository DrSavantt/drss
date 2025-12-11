'use client';

import { useState, useEffect, useRef } from 'react';

interface LongTextQuestionProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  maxLength?: number;
  error?: string;
  minLength?: number;
}

export default function LongTextQuestion({
  value,
  onChange,
  onBlur,
  placeholder = 'Enter your answer...',
  minLength,
  maxLength = 1000,
  error,
}: LongTextQuestionProps) {
  const [charCount, setCharCount] = useState(value.length);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCharCount(value.length);
    adjustHeight();
  }, [value]);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.max(textarea.scrollHeight, 150) + 'px';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (maxLength && newValue.length > maxLength) return;
    onChange(newValue);
    setCharCount(newValue.length);
  };

  return (
    <div className="w-full">
      <textarea
        ref={textareaRef}
        value={value || ''}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full min-h-[150px] bg-black border border-[#333333] rounded-lg p-4 text-white placeholder:text-gray-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 resize-y transition-colors"
        style={{ lineHeight: '1.6' }}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? 'error-message' : undefined}
      />
      
      {/* Error Message */}
      {error && (
        <div className="mt-2">
          <span id="error-message" className="text-red-500 text-sm block">
            {error}
          </span>
        </div>
      )}

      {/* Character Counter - Only show when needed */}
      {(value.length > 900 || (minLength && value.length < minLength && value.length > 0)) && (
        <div className="mt-2 text-xs">
          {value.length < minLength && value.length > 0 && (
            <span className="text-yellow-500">Please add more detail ({value.length}/{minLength} min)</span>
          )}
          {value.length > 900 && (
            <span className="text-yellow-500">Approaching limit: {value.length}/{maxLength}</span>
          )}
        </div>
      )}
    </div>
  );
}
