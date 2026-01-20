'use client';

import { useState, useEffect, useCallback } from 'react';
import { Check, AlertCircle } from 'lucide-react';

interface MultipleChoiceQuestionProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  options: { value: string; label: string }[];
  allowMultiple?: boolean;
  error?: string;
}

export default function MultipleChoiceQuestion({
  value,
  onChange,
  options,
  allowMultiple = false,
  error,
}: MultipleChoiceQuestionProps) {
  const [recentlySelected, setRecentlySelected] = useState<string | null>(null);
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  const handleSelect = useCallback((optionValue: string) => {
    // Trigger selection animation
    setRecentlySelected(optionValue);
    setTimeout(() => setRecentlySelected(null), 200);

    if (allowMultiple) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue];
      onChange(newValues);
    } else {
      onChange(optionValue);
    }
  }, [allowMultiple, selectedValues, onChange]);

  // Keyboard shortcut support (1-9 to select options)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle number keys 1-9
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9 && num <= options.length) {
        // Don't trigger if user is typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }
        e.preventDefault();
        handleSelect(options[num - 1].value);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options, handleSelect]);

  const isSelected = (optionValue: string) => selectedValues.includes(optionValue);

  return (
    <div className="space-y-3">
      {options.map((option, index) => {
        const selected = isSelected(option.value);
        const isAnimating = recentlySelected === option.value;
        
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.value)}
            className={`
              w-full flex items-center gap-4
              py-4 px-4 rounded-lg
              border-2 
              text-left
              transition-all duration-200
              ${isAnimating ? 'scale-[1.02]' : 'scale-100'}
              ${selected
                ? 'bg-primary/10 border-primary text-foreground'
                : 'border-transparent bg-muted/30 text-foreground hover:bg-muted/50'
              }
            `}
          >
            {/* Keyboard shortcut indicator */}
            <span className={`
              flex-shrink-0 w-6 h-6 rounded text-xs font-medium
              flex items-center justify-center
              transition-all duration-200
              ${selected 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
              }
            `}>
              {index + 1}
            </span>

            {/* Checkbox/Radio indicator */}
            <div 
              className={`
                flex-shrink-0 w-5 h-5 
                ${allowMultiple ? 'rounded' : 'rounded-full'}
                border-2 flex items-center justify-center
                transition-all duration-200
                ${selected
                  ? 'bg-primary border-primary'
                  : 'border-muted-foreground/40 bg-transparent'
                }
              `}
            >
              {selected && (
                allowMultiple ? (
                  <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                )
              )}
            </div>
            
            {/* Option label */}
            <span className="flex-1 text-base font-medium">{option.label}</span>
          </button>
        );
      })}
      
      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-destructive mt-2">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}

      {/* Keyboard hint */}
      {options.length <= 9 && (
        <p className="text-xs text-muted-foreground/70 text-right mt-1">
          Press 1-{Math.min(options.length, 9)} to select
        </p>
      )}
    </div>
  );
}
