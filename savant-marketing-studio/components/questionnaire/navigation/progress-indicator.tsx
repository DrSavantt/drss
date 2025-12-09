'use client';

import { Check } from 'lucide-react';

interface ProgressIndicatorProps {
  currentSection: number;
  completedSections: number[];
  onStepClick?: (step: number) => void;
}

export default function ProgressIndicator({
  currentSection,
  completedSections,
  onStepClick,
}: ProgressIndicatorProps) {
  const sections = [1, 2, 3, 4, 5, 6, 7, 8];

  const getSectionState = (sectionNumber: number) => {
    if (completedSections.includes(sectionNumber)) return 'completed';
    if (sectionNumber === currentSection) return 'current';
    return 'future';
  };

  const canNavigateToStep = (sectionNumber: number) => {
    // Can go back to any previous step or completed step
    return sectionNumber <= currentSection || completedSections.includes(sectionNumber);
  };

  return (
    <div className="sticky top-0 z-30 bg-background border-b border-border py-4">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-3">
          <span className="text-sm text-silver">
            Step <span className="font-bold text-foreground text-lg">{currentSection}</span> of 8
          </span>
        </div>
        <div className="flex justify-center items-center gap-3">
          {sections.map((sectionNumber) => {
            const state = getSectionState(sectionNumber);
            const canNavigate = canNavigateToStep(sectionNumber);
            
            return (
              <button
                key={sectionNumber}
                onClick={() => canNavigate && onStepClick?.(sectionNumber)}
                disabled={!canNavigate}
                className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                  canNavigate ? 'cursor-pointer' : 'cursor-not-allowed'
                }`}
              >
                <div
                  className={`rounded-full flex items-center justify-center transition-all duration-300 ${
                    state === 'completed'
                      ? 'w-10 h-10 bg-green-500 text-white'
                      : state === 'current'
                      ? 'w-12 h-12 bg-red-primary text-white scale-110'
                      : 'w-8 h-8 border-2 border-border bg-transparent'
                  }`}
                >
                  {state === 'completed' ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className={`text-sm font-semibold ${state === 'future' ? 'text-silver' : ''}`}>
                      {sectionNumber}
                    </span>
                  )}
                </div>
                <span className="text-xs text-silver whitespace-nowrap hidden sm:block">
                  {state === 'current' ? 'Current' : state === 'completed' ? 'Done' : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

