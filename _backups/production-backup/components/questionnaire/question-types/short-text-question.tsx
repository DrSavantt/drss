'use client';

import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

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
  maxLength = 200,
  error,
}: ShortTextQuestionProps) {
  const [isFocused, setIsFocused] = useState(false);
  const charCount = value?.length || 0;
  const isNearMax = charCount > maxLength * 0.85;
  const isOverMax = charCount > maxLength;

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          onBlur?.();
        }}
        placeholder={placeholder}
        className={`
          w-full
          bg-black/50 
          border rounded-lg 
          px-4 py-3
          text-white text-base
          placeholder:text-gray-600
          transition-all duration-200
          ${error 
            ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
            : isFocused 
              ? 'border-red-500 ring-1 ring-red-500/50' 
              : 'border-[#333333] hover:border-[#444444]'
          }
          focus:outline-none
        `}
      />
      
      {/* Conditional Counter/Error */}
      {(error || isNearMax) && (
        <div className="flex items-center justify-between text-xs">
          {error && (
            <span className="flex items-center gap-1 text-red-500">
              <AlertCircle className="w-3 h-3" />
              {error}
            </span>
          )}
          {!error && <span />}
          
          {isNearMax && (
            <span className={isOverMax ? 'text-red-500' : 'text-yellow-500'}>
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
