'use client';

import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { UploadedFile } from '@/lib/questionnaire/types';
import { renderValue } from '@/lib/questionnaire/render-utils';

interface ReviewSectionCardProps {
  sectionNumber: number;
  title: string;
  questions: Record<string, string | string[] | UploadedFile[] | undefined>;
  questionKeys: string[];
  requiredQuestions: string[];
  completedQuestions: Set<string>;
  onEdit: () => void;
}

export default function ReviewSectionCard({
  sectionNumber,
  title,
  questions,
  questionKeys,
  requiredQuestions,
  completedQuestions,
  onEdit,
}: ReviewSectionCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Check if all required questions in this section are completed
  const sectionRequiredQuestions = questionKeys.filter(q => requiredQuestions.includes(q));
  const allRequiredComplete = sectionRequiredQuestions.every(q => completedQuestions.has(q));
  const completedCount = questionKeys.filter(q => completedQuestions.has(q)).length;

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-all ${
        allRequiredComplete ? 'border-border' : 'border-red-500'
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between bg-surface hover:bg-surface-highlight transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-primary text-white flex items-center justify-center font-bold">
            {sectionNumber}
          </div>
          <div className="text-left">
            <h3 className="font-bold text-foreground">{title}</h3>
            <p className="text-sm text-silver">
              {completedCount}/{questionKeys.length} questions answered
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {allRequiredComplete ? (
            <Check className="w-5 h-5 text-green-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-silver" />
          ) : (
            <ChevronDown className="w-5 h-5 text-silver" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="p-4 border-t border-border space-y-4">
          {Object.entries(questions).map(([key, value]) => {
            const questionNumber = key.split('_')[0];
            const isRequired = requiredQuestions.includes(questionNumber);
            const isCompleted = completedQuestions.has(questionNumber);
            
            // Use safe render utility to handle all value types
            const displayValue = renderValue(value);

            return (
              <div
                key={key}
                className={`p-3 rounded-lg ${
                  isRequired && !isCompleted ? 'bg-red-500/10 border border-red-500' : 'bg-background'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground">
                    Q{questionNumber.substring(1)} {isRequired && <span className="text-red-500">*</span>}
                  </span>
                  {isRequired && !isCompleted && (
                    <span className="text-xs text-red-500">Required</span>
                  )}
                </div>
                {displayValue ? (
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {displayValue.length > 200
                      ? `${displayValue.substring(0, 200)}...`
                      : displayValue}
                  </p>
                ) : (
                  <p className="text-sm text-silver italic">Not answered</p>
                )}
              </div>
            );
          })}

          <button
            onClick={onEdit}
            className="w-full mt-4 px-4 py-2 border border-border rounded-lg hover:bg-surface-highlight transition-colors text-foreground font-medium"
          >
            Edit Section
          </button>
        </div>
      )}
    </div>
  );
}
