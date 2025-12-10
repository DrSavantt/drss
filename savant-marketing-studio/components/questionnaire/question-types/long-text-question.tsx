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
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`w-full px-4 py-3 bg-surface border rounded-lg text-base text-foreground placeholder:text-silver focus:outline-none focus:ring-1 transition-colors resize-y ${
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : 'border-border focus:border-red-primary focus:ring-red-primary'
        }`}
        style={{ minHeight: '150px', lineHeight: '1.6' }}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? 'error-message' : undefined}
      />
      <div className="flex items-center justify-between mt-2">
        {error && (
          <div className="flex-1 mr-4">
            <span id="error-message" className="text-red-500 text-sm block">
              {error}
            </span>
            {/* Show current character count if it's a minimum length error */}
            {error.includes('20 characters') && value.trim().length > 0 && (
              <span className="text-xs text-silver block mt-1">
                Current: {value.trim().length} characters
              </span>
            )}
            {error.includes('10 characters') && value.trim().length > 0 && (
              <span className="text-xs text-silver block mt-1">
                Current: {value.trim().length} characters
              </span>
            )}
          </div>
        )}
        <span className={`text-silver text-sm whitespace-nowrap ${error ? '' : 'ml-auto'}`}>
          {charCount} / {maxLength}
        </span>
      </div>
    </div>
  );
}
