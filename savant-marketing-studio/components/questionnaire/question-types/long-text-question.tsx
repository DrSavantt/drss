'use client';

import { useState, useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { useDebouncedInput } from '@/hooks/use-debounced-value';

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
  
  // Use debounced input for smooth typing without lag
  const { value: localValue, onChange: handleLocalChange } = useDebouncedInput(
    value,
    onChange,
    500 // 500ms debounce for long text
  );
  
  const charCount = localValue?.length || 0;
  
  // Only show counter when approaching limits or there's an issue
  const showCounter = charCount > 0 && (charCount < minLength || charCount > maxLength * 0.9);
  const isUnderMin = charCount > 0 && charCount < minLength;
  const isNearMax = charCount > maxLength * 0.9;
  const isOverMax = charCount > maxLength;

  return (
    <div className="space-y-2">
      <textarea
        value={localValue || ''}
        onChange={(e) => handleLocalChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          onBlur?.();
        }}
        placeholder={placeholder}
        rows={5}
        className={`
          w-full min-h-[140px] max-h-[400px]
          bg-background 
          border rounded-lg 
          p-4 
          text-foreground text-base leading-relaxed
          placeholder:text-muted-foreground
          resize-y
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
      
      {/* Conditional Counter/Feedback - Only shows when needed */}
      {(showCounter || error) && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {error && (
              <span className="flex items-center gap-1 text-destructive">
                <AlertCircle className="w-3 h-3" />
                {error}
              </span>
            )}
            {!error && isUnderMin && (
              <span className="text-amber-500">
                Add more detail ({charCount}/{minLength} min)
              </span>
            )}
          </div>
          
          {(isNearMax || isOverMax) && (
            <span className={isOverMax ? 'text-destructive' : 'text-amber-500'}>
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
