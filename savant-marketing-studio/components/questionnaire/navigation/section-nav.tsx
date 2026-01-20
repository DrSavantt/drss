'use client';

import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback } from 'react';

interface SectionNavProps {
  sections: Array<{
    id: number;
    key: string;
    title: string;
    enabled: boolean;
  }>;
  currentSectionIndex: number;
  completedSections: Set<string>;
  onSectionClick: (index: number) => void;
  progressPercent: number;
}

type SectionState = 'completed' | 'current' | 'future';

export function SectionNav({
  sections,
  currentSectionIndex,
  completedSections,
  onSectionClick,
  progressPercent,
}: SectionNavProps) {
  const currentSection = sections[currentSectionIndex];
  const totalSections = sections.length;

  const getSectionState = useCallback((section: typeof sections[0], index: number): SectionState => {
    if (completedSections.has(section.key)) return 'completed';
    if (index === currentSectionIndex) return 'current';
    return 'future';
  }, [completedSections, currentSectionIndex]);

  const canNavigateToSection = useCallback((state: SectionState): boolean => {
    // Allow clicking any section except current (already there)
    return state !== 'current';
  }, []);

  const handleCircleClick = useCallback((index: number, state: SectionState) => {
    if (canNavigateToSection(state)) {
      onSectionClick(index);
    }
  }, [canNavigateToSection, onSectionClick]);

  const handleKeyDown = useCallback((
    e: React.KeyboardEvent,
    index: number,
    state: SectionState
  ) => {
    if ((e.key === 'Enter' || e.key === ' ') && canNavigateToSection(state)) {
      e.preventDefault();
      onSectionClick(index);
    }
  }, [canNavigateToSection, onSectionClick]);

  const goToPrevious = useCallback(() => {
    if (currentSectionIndex > 0) {
      onSectionClick(currentSectionIndex - 1);
    }
  }, [currentSectionIndex, onSectionClick]);

  const goToNext = useCallback(() => {
    if (currentSectionIndex < totalSections - 1) {
      onSectionClick(currentSectionIndex + 1);
    }
  }, [currentSectionIndex, totalSections, onSectionClick]);

  const getCircleClasses = (state: SectionState): string => {
    const base = 'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-200';
    
    switch (state) {
      case 'completed':
        return `${base} bg-success text-success-foreground cursor-pointer hover:scale-105`;
      case 'current':
        return `${base} border-2 border-primary bg-primary/10 text-primary cursor-default`;
      case 'future':
        return `${base} border-2 border-muted-foreground/50 text-muted-foreground hover:border-muted-foreground hover:scale-105 cursor-pointer`;
    }
  };

  const getLineClasses = (indexBefore: number): string => {
    const base = 'h-0.5 w-8 mx-1 transition-colors duration-200';
    // Line is "completed" if the section AFTER it is completed or current
    const nextSection = sections[indexBefore + 1];
    const nextState = nextSection ? getSectionState(nextSection, indexBefore + 1) : 'future';
    
    if (nextState === 'completed' || (indexBefore < currentSectionIndex)) {
      return `${base} bg-success`;
    }
    return `${base} bg-muted-foreground/20`;
  };

  return (
    <div className="w-full">
      {/* Section Label */}
      <p className="text-sm text-muted-foreground text-center mb-4">
        Section {currentSectionIndex + 1} of {totalSections}: {currentSection?.title}
      </p>

      {/* Desktop: Step Circles with Lines */}
      <div className="hidden md:flex items-center justify-center">
        {sections.map((section, index) => {
          const state = getSectionState(section, index);
          const isClickable = canNavigateToSection(state);
          
          return (
            <div key={section.id} className="flex items-center">
              {/* Circle */}
              <div
                role="button"
                tabIndex={isClickable ? 0 : -1}
                aria-label={isClickable ? `Go to section ${section.title}` : section.title}
                aria-current={state === 'current' ? 'step' : undefined}
                aria-disabled={state === 'current' ? 'true' : undefined}
                onClick={() => handleCircleClick(index, state)}
                onKeyDown={(e) => handleKeyDown(e, index, state)}
                className={getCircleClasses(state)}
              >
                {state === 'completed' ? (
                  <Check className="w-5 h-5" strokeWidth={2.5} />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Connecting Line (not after last circle) */}
              {index < sections.length - 1 && (
                <div className={getLineClasses(index)} />
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop: Section Titles Below Circles */}
      <div className="hidden md:flex justify-center mt-3 gap-1">
        {sections.map((section, index) => {
          // Calculate width to align with circles + lines
          // Each circle is 40px (w-10), line is 32px (w-8) + 8px margins (mx-1 * 2)
          const isLast = index === sections.length - 1;
          
          return (
            <div
              key={section.id}
              className="flex items-start"
              style={{ width: isLast ? '40px' : '88px' }} // 40px circle + 48px line for non-last
            >
              <span 
                className={`
                  text-xs text-center w-10 truncate
                  ${index === currentSectionIndex 
                    ? 'text-foreground font-medium' 
                    : 'text-muted-foreground'
                  }
                `}
                title={section.title}
              >
                {section.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile: Compact Navigation */}
      <div className="flex md:hidden items-center justify-center gap-4">
        {/* Previous Arrow */}
        <button
          type="button"
          onClick={goToPrevious}
          disabled={currentSectionIndex === 0}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          aria-label="Previous section"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Current Section Circle */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-2 border-primary bg-primary/10 text-primary"
          aria-current="step"
        >
          {currentSectionIndex + 1}
        </div>

        {/* Next Arrow */}
        <button
          type="button"
          onClick={goToNext}
          disabled={currentSectionIndex === totalSections - 1}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          aria-label="Next section"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          {progressPercent}% complete
        </p>
      </div>
    </div>
  );
}

export default SectionNav;
