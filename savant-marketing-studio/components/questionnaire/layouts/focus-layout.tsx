'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sun, Moon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuestionRenderer } from '../question-renderer';
import type { QuestionConfig, SectionConfig } from '@/lib/questionnaire/questions-config';
import type { UploadedFile } from '../question-types/file-upload-question';

// ============================================
// FOCUS LAYOUT - ONE QUESTION AT A TIME
// Typeform-style immersive questionnaire experience
// ============================================

interface FocusLayoutProps {
  // Data
  sections: SectionConfig[];
  questions: QuestionConfig[];
  currentSectionIndex: number;
  currentSection: SectionConfig;
  flatFormData: Record<string, unknown>;
  
  // Callbacks
  updateQuestion: (questionId: string, value: unknown) => void;
  markQuestionCompleted: (questionKey: string) => void;
  onHelpClick: (question: QuestionConfig) => void;
  goToSection: (index: number) => void;
  
  // Progress
  progressPercent: number;
  completedSections: Set<string>;
  
  // Header props
  clientName: string;
  showThemeToggle?: boolean;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  
  // Submit
  onSubmit: () => void;
  isSubmitting?: boolean;
  canSubmit?: boolean;
  
  // Exit focus mode (when toggled via button, not prop)
  onExitFocusMode?: () => void;
}

export function FocusLayout({
  sections,
  questions,
  currentSectionIndex,
  currentSection,
  flatFormData,
  updateQuestion,
  markQuestionCompleted,
  onHelpClick,
  goToSection,
  clientName,
  showThemeToggle = false,
  isDarkMode = false,
  onToggleTheme,
  onSubmit,
  isSubmitting = false,
  canSubmit = true,
  onExitFocusMode,
}: FocusLayoutProps) {
  // ============================================
  // STATE
  // ============================================
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // ============================================
  // COMPUTED VALUES
  // ============================================
  
  // Questions for current section (enabled only, sorted by order)
  const currentQuestions = useMemo(() => {
    return questions
      .filter(q => q.sectionId === currentSection.id && q.enabled)
      .sort((a, b) => a.order - b.order);
  }, [questions, currentSection]);
  
  // Current question
  const currentQuestion = currentQuestions[currentQuestionIndex];
  
  // Global question number (across all sections)
  const globalQuestionNumber = useMemo(() => {
    // Count questions in previous sections
    let offset = 0;
    for (let i = 0; i < currentSectionIndex; i++) {
      const section = sections[i];
      offset += questions.filter(q => q.sectionId === section.id && q.enabled).length;
    }
    return offset + currentQuestionIndex + 1;
  }, [sections, questions, currentSectionIndex, currentQuestionIndex]);
  
  // Total questions across all sections
  const totalQuestions = useMemo(() => {
    return questions.filter(q => q.enabled).length;
  }, [questions]);
  
  // Check if we're on the last question of the last section
  const isLastQuestion = currentQuestionIndex === currentQuestions.length - 1 && 
                         currentSectionIndex === sections.length - 1;
  
  // Check if we're on the first question of the first section
  const isFirstQuestion = currentQuestionIndex === 0 && currentSectionIndex === 0;
  
  // ============================================
  // NAVIGATION FUNCTIONS
  // ============================================
  
  const goToPreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (currentSectionIndex > 0) {
      // Go to previous section - the useEffect below will set to last question
      const prevSection = sections[currentSectionIndex - 1];
      const prevSectionQuestions = questions.filter(
        q => q.sectionId === prevSection.id && q.enabled
      );
      goToSection(currentSectionIndex - 1);
      // Set to last question of previous section
      setCurrentQuestionIndex(Math.max(0, prevSectionQuestions.length - 1));
    }
  }, [currentQuestionIndex, currentSectionIndex, sections, questions, goToSection]);
  
  const goToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentSectionIndex < sections.length - 1) {
      // Go to first question of next section
      goToSection(currentSectionIndex + 1);
      setCurrentQuestionIndex(0);
    }
    // If last question of last section, do nothing (submit button handles it)
  }, [currentQuestionIndex, currentQuestions.length, currentSectionIndex, sections.length, goToSection]);
  
  // Reset question index when section changes (except when going backwards)
  useEffect(() => {
    // Only reset to 0 if we went forward or if index is out of bounds
    if (currentQuestionIndex >= currentQuestions.length) {
      setCurrentQuestionIndex(Math.max(0, currentQuestions.length - 1));
    }
  }, [currentSectionIndex, currentQuestions.length, currentQuestionIndex]);
  
  // ============================================
  // KEYBOARD HANDLER
  // ============================================
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if user is typing in textarea
      const target = e.target as HTMLElement;
      const isTextarea = target.tagName === 'TEXTAREA';
      const isInput = target.tagName === 'INPUT';
      
      // Enter advances to next question (except in textarea)
      if (e.key === 'Enter' && !e.shiftKey && !isTextarea) {
        e.preventDefault();
        if (!isLastQuestion) {
          goToNextQuestion();
        }
      }
      
      // Allow Shift+Tab to go back (when not in input/textarea)
      if (e.key === 'Tab' && e.shiftKey && !isInput && !isTextarea) {
        e.preventDefault();
        goToPreviousQuestion();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextQuestion, goToPreviousQuestion, isLastQuestion]);
  
  // ============================================
  // RENDER
  // ============================================
  
  // Safety check
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No questions available.</p>
      </div>
    );
  }
  
  // Progress based on question number
  const progressWidth = (globalQuestionNumber / totalQuestions) * 100;
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-primary">{clientName}</p>
            <p className="text-xs text-muted-foreground">Client Questionnaire</p>
          </div>
          <div className="flex items-center gap-2">
            {onExitFocusMode && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onExitFocusMode}
                className="text-muted-foreground hover:text-foreground gap-1"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Exit Focus</span>
              </Button>
            )}
            {showThemeToggle && onToggleTheme && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onToggleTheme}
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            )}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div 
            className="h-full bg-primary transition-all"
            style={{ 
              width: `${progressWidth}%`,
              transitionDuration: 'var(--form-transition-normal, 200ms)',
              transitionTimingFunction: 'var(--form-easing, cubic-bezier(0.4, 0, 0.2, 1))'
            }}
          />
        </div>
      </header>

      {/* Main content - centered question */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ 
                duration: 0.2,
                ease: [0.4, 0, 0.2, 1]
              }}
            >
              {/* Question counter */}
              <p className="text-sm text-muted-foreground mb-4">
                Question {globalQuestionNumber} of {totalQuestions}
              </p>
              
              {/* Question */}
              <QuestionRenderer
                question={currentQuestion}
                value={flatFormData[currentQuestion.id] as string | string[] | UploadedFile[]}
                onChange={(value) => updateQuestion(currentQuestion.id, value)}
                onBlur={() => markQuestionCompleted(currentQuestion.key)}
                onHelpClick={() => onHelpClick(currentQuestion)}
                globalQuestionNumber={globalQuestionNumber}
              />
              
              {/* Keyboard hint */}
              <p className="mt-6 text-xs text-muted-foreground/60 text-center">
                Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Enter ↵</kbd> to continue
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer navigation */}
      <footer className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={goToPreviousQuestion}
            disabled={isFirstQuestion}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          
          <span className="text-sm text-muted-foreground truncate max-w-[150px] sm:max-w-none">
            {currentSection.title}
          </span>
          
          {/* Show Submit on last question of last section */}
          {isLastQuestion ? (
            <Button 
              onClick={onSubmit} 
              disabled={!canSubmit || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          ) : (
            <Button onClick={goToNextQuestion} className="gap-2">
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

export default FocusLayout;
