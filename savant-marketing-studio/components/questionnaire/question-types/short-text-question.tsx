'use client';

import { useState, useEffect } from 'react';

interface ShortTextQuestionProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  error?: string;
}

export default function ShortTextQuestion({
  value,
  onChange,
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
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`w-full px-4 py-3 bg-surface border rounded-lg text-base text-foreground placeholder:text-silver focus:outline-none focus:ring-1 transition-colors ${
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : 'border-border focus:border-red-primary focus:ring-red-primary'
        }`}
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
