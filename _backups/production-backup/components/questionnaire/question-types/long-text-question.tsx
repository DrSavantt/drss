'use client';

import { useState, useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';

interface LongTextQuestionProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  error?: string;
}

export default function LongTextQuestion({
  value,
  onChange,
  onBlur,
  placeholder = 'Type your answer here...',
  minLength = 50,
  maxLength = 1000,
  error,
}: LongTextQuestionProps) {
  const [isFocused, setIsFocused] = useState(false);
  const charCount = value?.length || 0;
  
  // Only show counter when approaching limits or there's an issue
  const showCounter = charCount > 0 && (charCount < minLength || charCount > maxLength * 0.9);
  const isUnderMin = charCount > 0 && charCount < minLength;
  const isNearMax = charCount > maxLength * 0.9;
  const isOverMax = charCount > maxLength;

  return (
    <div className="space-y-2">
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          onBlur?.();
        }}
        placeholder={placeholder}
        rows={5}
        className={`
          w-full min-h-[140px] max-h-[400px]
          bg-black/50 
          border rounded-lg 
          p-4 
          text-white text-base leading-relaxed
          placeholder:text-gray-600
          resize-y
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
      
      {/* Conditional Counter/Feedback - Only shows when needed */}
      {(showCounter || error) && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {error && (
              <span className="flex items-center gap-1 text-red-500">
                <AlertCircle className="w-3 h-3" />
                {error}
              </span>
            )}
            {!error && isUnderMin && (
              <span className="text-yellow-500">
                Add more detail ({charCount}/{minLength} min)
              </span>
            )}
          </div>
          
          {(isNearMax || isOverMax) && (
            <span className={isOverMax ? 'text-red-500' : 'text-yellow-500'}>
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
