'use client';

import { ArrowLeft, ArrowRight, Save, Check, Loader2, AlertCircle } from 'lucide-react';

interface StepFooterProps {
  currentStep: number;
  totalSteps: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSave: () => void;
  saveStatus: 'saved' | 'saving' | 'error';
}

export default function StepFooter({
  currentStep,
  totalSteps,
  canGoNext,
  canGoPrevious,
  onNext,
  onPrevious,
  onSave,
  saveStatus,
}: StepFooterProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 pb-safe-bottom">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Previous Button */}
          <button
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {/* Center: Step indicator and Save */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Step <span className="font-bold text-foreground">{currentStep}</span> of {totalSteps}
            </span>

            {/* Save Draft Button */}
            <button
              onClick={onSave}
              disabled={saveStatus === 'saving'}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Saved</span>
                </>
              ) : saveStatus === 'error' ? (
                <>
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <span>Error</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Draft</span>
                </>
              )}
            </button>
          </div>

          {/* Next Button */}
          <button
            onClick={onNext}
            disabled={!canGoNext}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            <span>{currentStep === totalSteps ? 'Review' : 'Next'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
