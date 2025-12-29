'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Send, Loader2 } from 'lucide-react';

interface FormFooterProps {
  // Navigation state
  currentSectionIndex: number;
  totalSections: number;
  
  // Callbacks
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  
  // State
  isSubmitting?: boolean;
  canSubmit?: boolean;
}

/**
 * Footer navigation component for questionnaire forms.
 * Handles Previous/Next section navigation and final Submit.
 * 
 * Behavior:
 * - First section: Previous button is disabled
 * - Last section: Shows Submit button instead of Next
 * - Shows current section indicator (e.g., "Section 3 of 8")
 */
export function FormFooter({
  currentSectionIndex,
  totalSections,
  onPrevious,
  onNext,
  onSubmit,
  isSubmitting = false,
  canSubmit = true,
}: FormFooterProps) {
  const isFirstSection = currentSectionIndex === 0;
  const isLastSection = currentSectionIndex === totalSections - 1;

  return (
    <div className="flex items-center justify-between w-full">
      {/* Previous Button */}
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={isFirstSection}
        className="gap-2"
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </Button>

      {/* Section Indicator */}
      <span className="text-sm text-muted-foreground font-medium">
        Section {currentSectionIndex + 1} of {totalSections}
      </span>

      {/* Next/Submit Button */}
      {isLastSection ? (
        <Button
          onClick={onSubmit}
          disabled={isSubmitting || !canSubmit}
          className="gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Submit
              <Send className="w-4 h-4" />
            </>
          )}
        </Button>
      ) : (
        <Button onClick={onNext} className="gap-2">
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

