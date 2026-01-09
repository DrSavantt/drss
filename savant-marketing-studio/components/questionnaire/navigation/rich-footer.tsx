'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check, Loader2, Circle, RotateCcw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { QuestionnaireConfigLike } from '@/lib/questionnaire/questionnaire-config-context';

interface RichFooterProps {
  clientId: string;
  currentSection: number;
  onPrevious: () => void;
  onNext: () => void;
  saveStatus: 'idle' | 'saving' | 'saved';
  isLastSection?: boolean;
  config: QuestionnaireConfigLike; // Required: use database config
}

export function RichFooter({
  clientId,
  currentSection,
  onPrevious,
  onNext,
  saveStatus,
  isLastSection = false,
  config,
}: RichFooterProps) {
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // Get enabled sections from database config
  const enabledSections = useMemo(() => {
    return config.getEnabledSections();
  }, [config]);
  const totalSections = enabledSections.length;
  
  // Get current position (1-indexed)
  const currentPosition = useMemo(() => {
    const index = enabledSections.findIndex(s => s.id === currentSection);
    return index >= 0 ? index + 1 : 1;
  }, [enabledSections, currentSection]);

  const isFirstSection = config.isFirstEnabledSection(currentSection);
  
  // Get previous and next section names from database config
  const previousSectionId = config.getPreviousEnabledSectionId(currentSection);
  const nextSectionId = config.getNextEnabledSectionId(currentSection);
  const previousName = previousSectionId 
    ? config.getSectionById(previousSectionId)?.title
    : null;
  const nextName = nextSectionId 
    ? config.getSectionById(nextSectionId)?.title 
    : null;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50">
      {/* Gradient fade effect */}
      <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />

      {/* Footer content */}
      <div className="bg-card/95 backdrop-blur-xl border-t border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          {/* Three column layout */}
          <div className="grid grid-cols-3 items-center gap-4">

            {/* LEFT: Previous Button */}
            <div className="flex flex-col items-start">
              <button
                type="button"
                onClick={onPrevious}
                disabled={isFirstSection}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg min-h-[44px]
                  border border-border 
                  transition-all duration-200
                  ${isFirstSection
                    ? 'opacity-40 cursor-not-allowed text-muted-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:border-border/80 hover:text-foreground'
                  }
                `}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="font-medium">Previous</span>
              </button>
              {previousName && !isFirstSection && (
                <span className="text-xs text-muted-foreground mt-1.5 pl-1 truncate max-w-[140px]">
                  {previousName}
                </span>
              )}
            </div>

            {/* CENTER: Step Counter + Save Status */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-sm text-foreground font-medium">
                Step <span className="text-primary">{currentPosition}</span> of {totalSections}
              </span>

              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-center gap-1.5">
                  {saveStatus === 'saving' && (
                    <>
                      <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
                      <span className="text-xs text-muted-foreground">Saving...</span>
                    </>
                  )}
                  {saveStatus === 'saved' && (
                    <>
                      <Check className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-500">Auto-saved</span>
                    </>
                  )}
                  {saveStatus === 'idle' && (
                    <>
                      <Circle className="w-2 h-2 text-muted-foreground fill-current" />
                      <span className="text-xs text-muted-foreground">Draft</span>
                    </>
                  )}
                </div>

                <span className="text-muted-foreground/50">•</span>

                <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  </AlertDialogTrigger>

                  <AlertDialogContent className="bg-card border-border max-w-[90vw] md:max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-foreground">
                        Clear Form?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground">
                        This will delete all your current answers and start fresh. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter className="flex-row gap-2">
                      <AlertDialogCancel className="border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground min-h-[44px]">
                        Cancel
                      </AlertDialogCancel>
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();

                          // Clear the keys (can use sync since page reloads immediately)
                          localStorage.removeItem(`questionnaire_draft_${clientId}`);
                          localStorage.removeItem(`questionnaire_completed_${clientId}`);
                          localStorage.removeItem(`questionnaire_section_${clientId}`);

                          // Set a flag to prevent auto-save on next mount
                          sessionStorage.setItem('skipRestore', 'true');

                          // Navigate to same URL (forces fresh mount)
                          window.location.href = window.location.pathname + '?reset=true';
                        }}
                        className="inline-flex h-11 min-h-[44px] items-center justify-center rounded-md bg-destructive hover:bg-destructive/90 px-4 py-2 text-sm font-semibold text-destructive-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 focus:ring-offset-card"
                      >
                        Clear Everything
                      </button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* RIGHT: Next Button */}
            <div className="flex flex-col items-end">
              <button
                type="button"
                onClick={onNext}
                className={`
                  flex items-center gap-2 px-5 py-2.5 rounded-lg min-h-[44px]
                  font-medium transition-all duration-200
                  ${isLastSection
                    ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20'
                  }
                `}
              >
                <span>{isLastSection ? 'Review' : 'Next'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              {nextName && !isLastSection && (
                <span className="text-xs text-muted-foreground mt-1.5 pr-1 truncate max-w-[140px]">
                  {nextName}
                </span>
              )}
              {isLastSection && (
                <span className="text-xs text-muted-foreground mt-1.5 pr-1">
                  Review Answers
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
