'use client';

import React from 'react';
import { HelpCircle, Clock } from 'lucide-react';

interface QuestionWrapperProps {
  questionNumber: number;
  questionText: string;
  isRequired?: boolean;
  onHelpClick?: () => void;
  estimatedTime?: string;
  children: React.ReactNode;
}

export default function QuestionWrapper({
  questionNumber,
  questionText,
  isRequired = false,
  onHelpClick,
  estimatedTime,
  children,
}: QuestionWrapperProps) {
  return (
    <div className="relative bg-card border border-border rounded-xl p-6 hover:border-primary/40 transition-all duration-200 group">
      {/* Header Row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        {/* Left: Question Badge + Text */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center justify-center bg-primary/20 text-primary min-w-[40px] h-8 px-3 rounded-lg text-sm font-bold">
              Q{questionNumber}
            </span>
            {estimatedTime && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                <Clock className="w-3 h-3" />
                {estimatedTime}
              </span>
            )}
          </div>
          <p className="text-lg font-medium text-foreground leading-relaxed">
            {questionText}
            {isRequired && <span className="text-primary ml-1">*</span>}
          </p>
        </div>

        {/* Right: Help Button */}
        {onHelpClick && (
          <button
            type="button"
            onClick={onHelpClick}
            className="flex-shrink-0 p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-all duration-200"
            aria-label="Get help for this question"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Input Area */}
      <div className="mt-4">
        {children}
      </div>
    </div>
  );
}
