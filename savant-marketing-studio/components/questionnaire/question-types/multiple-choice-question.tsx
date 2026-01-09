'use client';

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
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  const handleSelect = (optionValue: string) => {
    if (allowMultiple) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue];
      onChange(newValues);
    } else {
      onChange(optionValue);
    }
  };

  const isSelected = (optionValue: string) => selectedValues.includes(optionValue);

  return (
    <div className="space-y-3">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => handleSelect(option.value)}
          className={`
            w-full flex items-center gap-4 
            p-4 rounded-lg 
            border transition-all duration-200
            text-left
            ${isSelected(option.value)
              ? 'bg-primary/10 border-primary text-foreground'
              : 'bg-muted/50 border-border text-muted-foreground hover:border-border/80 hover:bg-muted'
            }
          `}
        >
          {/* Checkbox/Radio indicator */}
          <div 
            className={`
              flex-shrink-0 w-5 h-5 rounded-${allowMultiple ? 'md' : 'full'} 
              border-2 flex items-center justify-center
              transition-all duration-200
              ${isSelected(option.value)
                ? 'bg-primary border-primary'
                : 'border-muted-foreground/50'
              }
            `}
          >
            {isSelected(option.value) && (
              <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
            )}
          </div>
          
          {/* Option label */}
          <span className="flex-1 text-base">{option.label}</span>
        </button>
      ))}
      
      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-destructive mt-2">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}
    </div>
  );
}
