'use client';

import { useState } from 'react';
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
  placeholder = 'Type your answer here...',
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
        style={{
          paddingLeft: 'var(--form-input-padding-x)',
          paddingRight: 'var(--form-input-padding-x)',
        }}
        className={`
          w-full h-14
          bg-transparent
          border-2 rounded-lg
          text-foreground text-lg
          placeholder:text-muted-foreground/50
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
      
      {/* Conditional Counter/Error */}
      {(error || isNearMax) && (
        <div className="flex items-center justify-between text-xs">
          {error ? (
            <span className="flex items-center gap-1 text-destructive">
              <AlertCircle className="w-3 h-3" />
              {error}
            </span>
          ) : (
            <span />
          )}
          
          {isNearMax && (
            <span className={isOverMax ? 'text-destructive' : 'text-warning'}>
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
