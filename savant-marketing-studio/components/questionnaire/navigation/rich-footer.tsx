'use client';

import { useState } from 'react';
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

interface RichFooterProps {
  clientId: string;
  currentSection: number;
  onPrevious: () => void;
  onNext: () => void;
  saveStatus: 'idle' | 'saving' | 'saved';
  isLastSection?: boolean;
}

const SECTION_NAMES = [
  'Avatar Definition',
  'Dream Outcome',
  'Problems & Obstacles',
  'Solution & Methodology',
  'Brand Voice',
  'Proof & Transformation',
  'Faith Integration',
  'Business Metrics',
] as const;

export function RichFooter({
  clientId,
  currentSection,
  onPrevious,
  onNext,
  saveStatus,
  isLastSection = false,
}: RichFooterProps) {
  console.log('[FOOTER] Received clientId:', clientId);
  
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  
  const isFirstSection = currentSection === 1;
  const previousName = currentSection > 1 ? SECTION_NAMES[currentSection - 2] : null;
  const nextName = currentSection < 8 ? SECTION_NAMES[currentSection] : null;


  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      {/* Gradient fade effect */}
      <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-black to-transparent pointer-events-none" />
      
      {/* Footer content */}
      <div className="bg-surface/95 backdrop-blur-xl border-t border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 md:py-4">
          {/* Mobile Layout - Two column with status above */}
          <div className="block md:hidden">
            {/* Save Status Row */}
            <div className="flex items-center justify-center gap-4 mb-3">
              <div className="flex items-center gap-1.5">
                {saveStatus === 'saving' && (
                  <>
                    <Loader2 className="w-3 h-3 text-silver animate-spin" />
                    <span className="text-xs text-silver">Saving...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-500">Saved</span>
                  </>
                )}
                {saveStatus === 'idle' && (
                  <>
                    <Circle className="w-2 h-2 text-silver fill-silver" />
                    <span className="text-xs text-silver">Draft</span>
                  </>
                )}
              </div>
              <span className="text-xs text-foreground">
                Step <span className="text-red-primary font-semibold">{currentSection}</span>/8
              </span>
            </div>
            
            {/* Buttons Row */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onPrevious}
                disabled={isFirstSection}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg min-h-[48px]
                  border border-border 
                  transition-all duration-200
                  ${isFirstSection
                    ? 'opacity-40 cursor-not-allowed text-silver'
                    : 'text-foreground hover:bg-surface-highlight active:bg-surface-highlight'
                  }
                `}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="font-medium">Previous</span>
              </button>
              
              <button
                type="button"
                onClick={onNext}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg min-h-[48px]
                  font-medium transition-all duration-200
                  ${isLastSection
                    ? 'bg-green-500 text-white active:bg-green-600'
                    : 'bg-red-primary text-white active:bg-red-primary/90'
                  }
                `}
              >
                <span>{isLastSection ? 'Review' : 'Next'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Desktop Layout - Three column */}
          <div className="hidden md:grid grid-cols-3 items-center gap-4">
            
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
                    ? 'opacity-40 cursor-not-allowed text-silver'
                    : 'text-light-gray hover:bg-surface-highlight hover:border-mid-gray hover:text-foreground'
                  }
                `}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="font-medium">Previous</span>
              </button>
              {previousName && !isFirstSection && (
                <span className="text-xs text-silver mt-1.5 pl-1 truncate max-w-[140px]">
                  {previousName}
                </span>
              )}
            </div>

            {/* CENTER: Step Counter + Save Status */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-sm text-foreground font-medium">
                Step <span className="text-red-primary">{currentSection}</span> of 8
              </span>
              
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-center gap-1.5">
                  {saveStatus === 'saving' && (
                    <>
                      <Loader2 className="w-3 h-3 text-silver animate-spin" />
                      <span className="text-xs text-silver">Saving...</span>
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
                      <Circle className="w-2 h-2 text-silver fill-silver" />
                      <span className="text-xs text-silver">Draft</span>
                    </>
                  )}
                </div>
                
                <span className="text-mid-gray">•</span>
                
                <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs text-silver hover:text-red-primary transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  </AlertDialogTrigger>
                  
                  <AlertDialogContent className="bg-surface border-border max-w-[90vw] md:max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-foreground">
                        Clear Form?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-silver">
                        This will delete all your current answers and start fresh. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                      <AlertDialogCancel className="border-border bg-transparent text-light-gray hover:bg-surface-highlight hover:text-foreground min-h-[44px]">
                        Cancel
                      </AlertDialogCancel>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          console.log('[RESET] Clearing localStorage');
                          
                          // Clear the keys
                          localStorage.removeItem(`questionnaire_draft_${clientId}`);
                          localStorage.removeItem(`questionnaire_completed_${clientId}`);
                          localStorage.removeItem(`questionnaire_section_${clientId}`);
                          
                          // Set a flag to prevent auto-save on next mount
                          sessionStorage.setItem('skipRestore', 'true');
                          
                          console.log('[RESET] Navigating to fresh page');
                          
                          // Navigate to same URL (forces fresh mount)
                          window.location.href = window.location.pathname + '?reset=true';
                        }}
                        className="inline-flex h-11 min-h-[44px] items-center justify-center rounded-md bg-red-primary hover:bg-red-primary/90 px-4 py-2 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-primary focus:ring-offset-2 focus:ring-offset-surface"
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
                    : 'bg-red-primary text-white hover:bg-red-primary/90 shadow-lg shadow-red-primary/20'
                  }
                `}
              >
                <span>{isLastSection ? 'Review' : 'Next'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              {nextName && !isLastSection && (
                <span className="text-xs text-silver mt-1.5 pr-1 truncate max-w-[140px]">
                  {nextName}
                </span>
              )}
              {isLastSection && (
                <span className="text-xs text-silver mt-1.5 pr-1">
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
