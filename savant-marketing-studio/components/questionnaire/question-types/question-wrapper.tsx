'use client';

import { HelpCircle } from 'lucide-react';

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
    <div className="mb-12">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <span className="bg-red-primary text-white rounded-full px-3 py-1 text-sm font-semibold flex-shrink-0">
            Q{questionNumber}
          </span>
          <div>
            <h3 className="font-bold text-lg text-foreground">
              {questionText}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </h3>
            {estimatedTime && (
              <span className="text-silver text-sm mt-1 inline-block">
                {estimatedTime}
              </span>
            )}
          </div>
        </div>
        {onHelpClick && (
          <button
            type="button"
            onClick={onHelpClick}
            className="p-2 rounded-lg hover:bg-surface-highlight transition-colors"
            aria-label="Help"
          >
            <HelpCircle className="w-5 h-5 text-silver" />
          </button>
        )}
      </div>
      <div className="ml-12">{children}</div>
    </div>
  );
}
