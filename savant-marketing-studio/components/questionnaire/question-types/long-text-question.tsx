'use client';

import { useState } from 'react';
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
  
  // Show counter when typing (focused) or near limits
  const showCounter = isFocused || (charCount > 0 && (charCount < minLength || charCount > maxLength * 0.8));
  const isUnderMin = charCount > 0 && charCount < minLength;
  const isNearMax = charCount > maxLength * 0.8;
  const isOverMax = charCount > maxLength;

  // Determine counter color
  const getCounterClass = () => {
    if (isOverMax) return 'text-destructive';
    if (isNearMax) return 'text-warning';
    if (isUnderMin) return 'text-warning';
    return 'text-muted-foreground/70';
  };

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
        style={{
          paddingLeft: 'var(--form-input-padding-x)',
          paddingRight: 'var(--form-input-padding-x)',
          paddingTop: 'var(--form-input-padding-y)',
          paddingBottom: 'var(--form-input-padding-y)',
        }}
        className={`
          w-full min-h-[120px] max-h-[400px]
          bg-transparent
          border-2 rounded-lg
          text-foreground text-lg leading-relaxed
          placeholder:text-muted-foreground/50
          resize-y
          transition-all duration-200
          focus:outline-none
          ${error 
            ? 'border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20' 
            : isFocused 
              ? 'border-primary focus:ring-2 focus:ring-primary/20' 
              : 'border-border hover:border-muted-foreground/50'
          }
        `}
      />
      
      {/* Feedback row - error and/or character counter */}
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
              <span className="text-warning">
                {minLength - charCount} more characters needed
              </span>
            )}
          </div>
          
          {showCounter && (
            <span className={getCounterClass()}>
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
