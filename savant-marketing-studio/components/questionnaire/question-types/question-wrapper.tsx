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
}

export function QuestionWrapper({
  questionNumber,
  questionText,
  isRequired = false,
  onHelpClick,
  estimatedTime,
  children,
}: QuestionWrapperProps) {
  return (
    <div className="relative bg-[#1a1a1a] border border-[#333333] rounded-xl p-6 mb-8 hover:border-red-500/50 transition-colors duration-200">
      {/* Top Row: Question Number + Time */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center bg-red-500/20 text-red-500 px-3 py-1 rounded-lg text-sm font-medium">
          Q{questionNumber}
        </span>
        
        {estimatedTime && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <span>⏱️</span> {estimatedTime}
          </span>
        )}
      </div>

      {/* Question Text */}
      <p className="text-lg font-medium text-white mt-3 mb-4">
        {questionText}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </p>

      {/* Help Button - Absolute Positioned */}
      {onHelpClick && (
        <button
          type="button"
          onClick={onHelpClick}
          className="absolute top-6 right-6 text-gray-500 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-white/5"
          aria-label="Get help for this question"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      )}

      {/* Input Area */}
      <div className="mt-4">
        {children}
      </div>
    </div>
  );
}

export default QuestionWrapper;
