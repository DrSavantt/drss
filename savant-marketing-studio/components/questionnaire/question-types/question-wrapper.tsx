'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';

interface QuestionWrapperProps {
  questionNumber: number;
  questionText: string;
  isRequired?: boolean;
  onHelpClick?: () => void;
  estimatedTime?: string;
  children: React.ReactNode;
  /** Show keyboard hint below the input (e.g., "Press Enter ↵") */
  keyboardHint?: string;
}

export default function QuestionWrapper({
  questionNumber,
  questionText,
  isRequired = false,
  onHelpClick,
  estimatedTime,
  children,
  keyboardHint,
}: QuestionWrapperProps) {
  return (
    <div className="relative">
      {/* Question Number - Small, subtle, above question text */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-medium text-muted-foreground">
          Q{questionNumber}
        </span>
        {estimatedTime && (
          <span className="text-xs text-muted-foreground/70">
            · {estimatedTime}
          </span>
        )}
      </div>

      {/* Question Text - Hero element, large and prominent */}
      <div className="flex items-start gap-3">
        <h2 
          className="flex-1 max-w-2xl text-2xl md:text-3xl font-semibold text-foreground leading-tight"
          style={{ 
            fontSize: 'var(--form-question-size)',
            lineHeight: 'var(--form-question-line-height)',
            fontWeight: 'var(--form-question-weight)'
          }}
        >
          {questionText}
          {isRequired && (
            <span className="text-destructive/50 ml-1">*</span>
          )}
        </h2>

        {/* Help Button - Subtle, discoverable */}
        {onHelpClick && (
          <button
            type="button"
            onClick={onHelpClick}
            className="flex-shrink-0 p-1.5 text-muted-foreground/60 hover:text-foreground rounded-md transition-all duration-200 hover:bg-muted/50"
            aria-label="Get help for this question"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Input Area - Generous spacing from question */}
      <div className="mt-6">
        {children}
      </div>

      {/* Keyboard Hint - Subtle guidance */}
      {keyboardHint && (
        <p className="mt-3 text-xs text-muted-foreground/70 text-right">
          {keyboardHint}
        </p>
      )}
    </div>
  );
}
