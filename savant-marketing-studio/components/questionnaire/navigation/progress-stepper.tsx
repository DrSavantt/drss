'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface ProgressStepperProps {
  currentSection: number;
  completedSections: number[];
  onSectionClick: (section: number) => void;
}

const SECTIONS = [
  { number: 1, name: 'Avatar', fullName: 'Avatar Definition' },
  { number: 2, name: 'Dream', fullName: 'Dream Outcome' },
  { number: 3, name: 'Problems', fullName: 'Problems & Obstacles' },
  { number: 4, name: 'Solution', fullName: 'Solution & Methodology' },
  { number: 5, name: 'Voice', fullName: 'Brand Voice' },
  { number: 6, name: 'Proof', fullName: 'Proof & Transformation' },
  { number: 7, name: 'Faith', fullName: 'Faith Integration' },
  { number: 8, name: 'Metrics', fullName: 'Business Metrics' },
] as const;

export function ProgressStepper({
  currentSection,
  completedSections,
  onSectionClick,
}: ProgressStepperProps) {
  const isCompleted = (num: number) => completedSections.includes(num);
  const isCurrent = (num: number) => num === currentSection;
  const isUpcoming = (num: number) => !isCompleted(num) && !isCurrent(num);

  return (
    <div className="w-full bg-[#1a1a1a] border-b border-[#333333]">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Stepper Track */}
        <div className="flex items-center justify-between overflow-x-auto pb-2 scrollbar-hide">
          {SECTIONS.map((section, index) => (
            <React.Fragment key={section.number}>
              {/* Step */}
              <button
                type="button"
                onClick={() => onSectionClick(section.number)}
                className="flex flex-col items-center min-w-[72px] group cursor-pointer"
                aria-label={`Go to ${section.fullName}`}
              >
                {/* Circle */}
                <div
                  className={`
                    relative w-10 h-10 rounded-full flex items-center justify-center
                    transition-all duration-300 font-semibold text-sm
                    ${isCompleted(section.number)
                      ? 'bg-green-500 text-white'
                      : isCurrent(section.number)
                        ? 'bg-red-500 text-white ring-4 ring-red-500/30 animate-pulse'
                        : 'border-2 border-[#444444] text-gray-500 group-hover:border-gray-400 group-hover:text-gray-400'
                    }
                  `}
                >
                  {isCompleted(section.number) ? (
                    <Check className="w-5 h-5" strokeWidth={3} />
                  ) : (
                    <span>{section.number}</span>
                  )}
                </div>

                {/* Section Name */}
                <span
                  className={`
                    mt-2 text-xs font-medium transition-colors duration-200
                    ${isCompleted(section.number)
                      ? 'text-green-500'
                      : isCurrent(section.number)
                        ? 'text-red-500'
                        : 'text-gray-500 group-hover:text-gray-400'
                    }
                  `}
                >
                  {section.name}
                </span>
              </button>

              {/* Connecting Line (not after last) */}
              {index < SECTIONS.length - 1 && (
                <div
                  className={`
                    flex-1 h-0.5 min-w-[20px] mx-1
                    transition-colors duration-300
                    ${isCompleted(section.number) ? 'bg-green-500' : 'bg-[#333333]'}
                  `}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Counter */}
        <div className="text-center mt-4 pt-4 border-t border-[#333333]/50">
          <span className="text-sm text-gray-400">
            Step <span className="text-white font-semibold">{currentSection}</span> of{' '}
            <span className="text-white font-semibold">8</span>
          </span>
          <span className="mx-3 text-[#333333]">•</span>
          <span className="text-sm text-gray-500">
            {SECTIONS.find(s => s.number === currentSection)?.fullName}
          </span>
        </div>
      </div>
    </div>
  );
}

// Export sections data for use in other components
export { SECTIONS };
