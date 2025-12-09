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
  validationError?: string;
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
  validationError,
}: StepFooterProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-40">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Previous Button */}
          <button
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Center: Step indicator and Save */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-silver">
              Step <span className="font-bold text-foreground">{currentStep}</span> of {totalSteps}
            </span>

            {/* Save Draft Button */}
            <button
              onClick={onSave}
              disabled={saveStatus === 'saving'}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-surface-highlight transition-colors disabled:opacity-50"
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Saving...</span>
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="hidden sm:inline">Saved</span>
                </>
              ) : saveStatus === 'error' ? (
                <>
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="hidden sm:inline">Error</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">Save Draft</span>
                </>
              )}
            </button>
          </div>

          {/* Next Button */}
          <button
            onClick={onNext}
            disabled={!canGoNext}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-red-primary text-white hover:bg-red-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            title={validationError || ''}
          >
            <span>{currentStep === totalSteps ? 'Review' : 'Next'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Validation Error Message */}
        {validationError && !canGoNext && (
          <div className="mt-3 text-center text-sm text-red-500 flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {validationError}
          </div>
        )}
      </div>
    </div>
  );
}
