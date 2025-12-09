'use client';

import { Check } from 'lucide-react';

interface ProgressIndicatorProps {
  currentSection: number;
  completedSections: number[];
}

export default function ProgressIndicator({
  currentSection,
  completedSections,
}: ProgressIndicatorProps) {
  const sections = [1, 2, 3, 4, 5, 6, 7, 8];

  const getSectionState = (sectionNumber: number) => {
    if (completedSections.includes(sectionNumber)) return 'completed';
    if (sectionNumber === currentSection) return 'current';
    return 'future';
  };

  return (
    <div className="sticky top-20 z-30 bg-background border-b border-border py-4">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-center items-center gap-4">
          {sections.map((sectionNumber) => {
            const state = getSectionState(sectionNumber);
            return (
              <div key={sectionNumber} className="flex flex-col items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    state === 'completed'
                      ? 'bg-green-500 text-white'
                      : state === 'current'
                      ? 'bg-red-primary text-white'
                      : 'border-2 border-border bg-transparent'
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
                <span className="text-xs text-silver whitespace-nowrap">
                  Section {sectionNumber}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
