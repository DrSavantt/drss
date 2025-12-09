'use client';

import { useState, useEffect, useRef } from 'react';

interface LongTextQuestionProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  error?: string;
}

export default function LongTextQuestion({
  value,
  onChange,
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
          <span id="error-message" className="text-red-500 text-sm">
            {error}
          </span>
        )}
        <span className={`text-silver text-sm ${error ? 'ml-auto' : 'ml-auto'}`}>
          {charCount} / {maxLength} characters
        </span>
      </div>
    </div>
  );
}
