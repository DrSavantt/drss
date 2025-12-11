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
    <div className="relative bg-[#1a1a1a] border border-[#333333] rounded-xl p-6 mb-8 hover:border-red-500/40 transition-all duration-200 group">
      {/* Header Row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        {/* Left: Question Badge + Text */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center justify-center bg-red-500/20 text-red-500 min-w-[40px] h-8 px-3 rounded-lg text-sm font-bold">
              Q{questionNumber}
            </span>
            {estimatedTime && (
              <span className="flex items-center gap-1 text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-md">
                <Clock className="w-3 h-3" />
                {estimatedTime}
              </span>
            )}
          </div>
          <p className="text-lg font-medium text-white leading-relaxed">
            {questionText}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </p>
        </div>

        {/* Right: Help Button */}
        {onHelpClick && (
          <button
            type="button"
            onClick={onHelpClick}
            className="flex-shrink-0 p-2 text-gray-500 hover:text-red-500 hover:bg-white/5 rounded-lg transition-all duration-200"
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
