'use client';

import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { useDebouncedInput } from '@/hooks/use-debounced-value';

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
  
  // Use debounced input for smooth typing without lag
  const { value: localValue, onChange: handleLocalChange } = useDebouncedInput(
    value,
    onChange,
    300 // 300ms debounce for short text
  );
  
  const charCount = localValue?.length || 0;
  const isNearMax = charCount > maxLength * 0.85;
  const isOverMax = charCount > maxLength;

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={localValue || ''}
        onChange={(e) => handleLocalChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          onBlur?.();
        }}
        placeholder={placeholder}
        className={`
          w-full
          bg-background 
          border rounded-lg 
          px-4 py-3
          text-foreground text-base
          placeholder:text-muted-foreground
          transition-all duration-200
          ${error 
            ? 'border-destructive focus:border-destructive focus:ring-1 focus:ring-destructive' 
            : isFocused 
              ? 'border-primary ring-1 ring-ring' 
              : 'border-border hover:border-border/80'
          }
          focus:outline-none
        `}
      />
      
      {/* Conditional Counter/Error */}
      {(error || isNearMax) && (
        <div className="flex items-center justify-between text-xs">
          {error && (
            <span className="flex items-center gap-1 text-destructive">
              <AlertCircle className="w-3 h-3" />
              {error}
            </span>
          )}
          {!error && <span />}
          
          {isNearMax && (
            <span className={isOverMax ? 'text-destructive' : 'text-amber-500'}>
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
