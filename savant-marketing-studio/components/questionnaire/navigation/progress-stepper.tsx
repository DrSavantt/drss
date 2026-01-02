'use client';

import React, { useMemo } from 'react';
import { Check } from 'lucide-react';
import { QuestionnaireConfigLike } from '@/lib/questionnaire/questionnaire-config-context';

interface ProgressStepperProps {
  currentSection: number;
  completedSections: number[];
  onSectionClick: (section: number) => void;
  config: QuestionnaireConfigLike; // Required: use database config
}

// Short names for step display
const SHORT_NAMES: Record<string, string> = {
  avatar_definition: 'Avatar',
  dream_outcome: 'Dream',
  problems_obstacles: 'Problems',
  solution_methodology: 'Solution',
  brand_voice: 'Voice',
  proof_transformation: 'Proof',
  faith_integration: 'Faith',
  business_metrics: 'Metrics',
};

export function ProgressStepper({
  currentSection,
  completedSections,
  onSectionClick,
  config,
}: ProgressStepperProps) {
  // Get enabled sections from database config
  const sections = useMemo(() => {
    const enabledSections = config.getEnabledSections();
    return enabledSections.map(s => ({
      number: s.id,
      name: SHORT_NAMES[s.key] || s.title.split(' ')[0],
      fullName: s.title,
      key: s.key,
    }));
  }, [config]);
  
  const totalSections = sections.length;
  
  const isCompleted = (num: number) => completedSections.includes(num);
  const isCurrent = (num: number) => num === currentSection;
  
  // Get the current section's position in enabled sections (1-indexed for display)
  const currentPosition = useMemo(() => {
    const index = sections.findIndex(s => s.number === currentSection);
    return index >= 0 ? index + 1 : 1;
  }, [sections, currentSection]);

  return (
    <div className="w-full bg-surface border-b border-border">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Desktop: Full stepper track */}
        <div>
          <div className="flex items-center justify-between pb-2">
            {sections.map((section, index) => (
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
                {index < sections.length - 1 && (
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

          {/* Step Counter */}
          <div className="text-center mt-4 pt-4 border-t border-border/50">
            <span className="text-sm text-silver">
              Step <span className="text-foreground font-semibold">{currentPosition}</span> of{' '}
              <span className="text-foreground font-semibold">{totalSections}</span>
            </span>
            <span className="mx-3 text-border">•</span>
            <span className="text-sm text-silver">
              {sections.find(s => s.number === currentSection)?.fullName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
