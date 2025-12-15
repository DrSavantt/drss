'use client';

import React, { useRef, useEffect } from 'react';
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const isCompleted = (num: number) => completedSections.includes(num);
  const isCurrent = (num: number) => num === currentSection;

  // Scroll to current section on mobile
  useEffect(() => {
    if (scrollRef.current) {
      const currentButton = scrollRef.current.querySelector(`[data-section="${currentSection}"]`);
      if (currentButton) {
        currentButton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentSection]);

  return (
    <div className="w-full bg-surface border-b border-border">
      <div className="max-w-5xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Mobile: Horizontal scroll pills */}
        <div className="block lg:hidden">
          <div 
            ref={scrollRef}
            className="overflow-x-auto pb-2 -mx-2 px-2 questionnaire-stepper"
          >
            <div className="flex gap-2 min-w-max">
              {SECTIONS.map((section) => (
                <button
                  key={section.number}
                  data-section={section.number}
                  onClick={() => onSectionClick(section.number)}
                  className={`
                    px-3 py-2 rounded-lg whitespace-nowrap text-sm font-medium
                    transition-all min-h-[44px] flex items-center gap-2
                    ${isCompleted(section.number)
                      ? 'bg-green-500/10 text-green-500 border border-green-500/30'
                      : isCurrent(section.number)
                        ? 'bg-red-primary text-white'
                        : 'bg-surface-highlight text-silver border border-border'
                    }
                  `}
                >
                  {isCompleted(section.number) && (
                    <Check className="w-4 h-4" strokeWidth={3} />
                  )}
                  <span className="hidden xs:inline">{section.number}.</span>
                  <span>{section.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Mobile Step Counter */}
          <div className="text-center mt-3 pt-3 border-t border-border/50">
            <span className="text-xs sm:text-sm text-silver">
              Step <span className="text-foreground font-semibold">{currentSection}</span> of{' '}
              <span className="text-foreground font-semibold">8</span>
              <span className="mx-2 text-border">•</span>
              <span className="text-silver">
                {SECTIONS.find(s => s.number === currentSection)?.fullName}
              </span>
            </span>
          </div>
        </div>

        {/* Desktop: Full stepper track */}
        <div className="hidden lg:block">
          <div className="flex items-center justify-between pb-2">
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
                      font-semibold text-sm transition-all
                      ${isCompleted(section.number)
                        ? 'bg-green-500 text-white'
                        : isCurrent(section.number)
                          ? 'bg-red-primary text-white'
                          : 'border-2 border-mid-gray text-silver group-hover:border-light-gray group-hover:text-light-gray'
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
                      mt-2 text-xs font-medium transition-colors
                      ${isCompleted(section.number)
                        ? 'text-green-500'
                        : isCurrent(section.number)
                          ? 'text-red-primary'
                          : 'text-silver group-hover:text-light-gray'
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
                      flex-1 h-0.5 min-w-[20px] mx-1 transition-colors
                      ${isCompleted(section.number) ? 'bg-green-500' : 'bg-mid-gray'}
                    `}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Desktop Step Counter */}
          <div className="text-center mt-4 pt-4 border-t border-border/50">
            <span className="text-sm text-silver">
              Step <span className="text-foreground font-semibold">{currentSection}</span> of{' '}
              <span className="text-foreground font-semibold">8</span>
            </span>
            <span className="mx-3 text-border">•</span>
            <span className="text-sm text-silver">
              {SECTIONS.find(s => s.number === currentSection)?.fullName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export sections data for use in other components
export { SECTIONS };
