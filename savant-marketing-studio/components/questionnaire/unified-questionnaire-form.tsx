'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SidebarLayout, PillsLayout, FocusLayout } from './layouts';
import { FormFooter } from './navigation/form-footer';
import { QuestionRenderer } from './question-renderer';
import HelpPanel from './help-system/help-panel';
import { ConfigHelpContent } from './help-system/config-help-content';
import type { 
  UnifiedQuestionnaireFormProps, 
  SaveStatus 
} from '@/lib/questionnaire/unified-types';
import type { QuestionConfig, SectionConfig } from '@/lib/questionnaire/questions-config';
import type { QuestionnaireData } from '@/lib/questionnaire/types';
import type { QuestionnaireConfigLike } from '@/lib/questionnaire/questionnaire-config-context';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create empty form data structure based on sections
 */
function createEmptyFormData(sections: SectionConfig[]): Record<string, Record<string, unknown>> {
  return sections.reduce((acc, section) => {
    acc[section.key] = {};
    return acc;
  }, {} as Record<string, Record<string, unknown>>);
}

/**
 * Flatten nested form data for question renderer
 * Converts { avatar_definition: { q1_ideal_customer: 'value' } } to { q1_ideal_customer: 'value' }
 */
function flattenFormData(formData: Record<string, Record<string, unknown>>): Record<string, unknown> {
  const flat: Record<string, unknown> = {};
  Object.values(formData).forEach(section => {
    if (section && typeof section === 'object') {
      Object.entries(section).forEach(([key, value]) => {
        flat[key] = value;
      });
    }
  });
  return flat;
}

/**
 * Check if a value is considered a valid answer
 */
function hasValidAnswer(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function UnifiedQuestionnaireForm({
  mode,
  clientId,
  clientName,
  token: _token, // Reserved for future token-based auth
  userId: _userId, // Reserved for future user tracking
  sections,
  questions,
  initialData,
  onSave,
  onSubmit,
  onCancel: _onCancel, // Reserved for cancel functionality
  showHeader: _showHeader = true, // Reserved for header toggle
  showProgress: _showProgress = true, // Reserved for progress toggle
  showThemeToggle = mode === 'public',
  showSaveButton = true,
  autoSave = true,
  autoSaveDelay = 3000,
  isDarkMode: externalDarkMode,
  onToggleTheme: externalToggleTheme,
  layout: layoutProp,
}: UnifiedQuestionnaireFormProps) {
  
  // Refs for debouncing
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedRef = useRef(false);
  
  // Determine layout based on mode or explicit prop
  const layout = layoutProp ?? (mode === 'embedded' ? 'sidebar' : 'pills');
  
  // ============================================
  // STATE
  // ============================================
  
  const [formData, setFormData] = useState<Record<string, Record<string, unknown>>>(() => {
    if (initialData) {
      return initialData as unknown as Record<string, Record<string, unknown>>;
    }
    return createEmptyFormData(sections);
  });
  
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  
  // Initialize completedQuestions from initialData if provided
  const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(() => {
    if (!initialData) return new Set();
    
    // Scan all questions and mark those with valid answers as completed
    const completed = new Set<string>();
    const flatData: Record<string, unknown> = {};
    
    // Flatten initial data
    Object.values(initialData as Record<string, Record<string, unknown>>).forEach(section => {
      if (section && typeof section === 'object') {
        Object.entries(section).forEach(([key, value]) => {
          flatData[key] = value;
        });
      }
    });
    
    // Check each question for valid answers
    questions.forEach(q => {
      const value = flatData[q.id];
      if (hasValidAnswer(value)) {
        completed.add(q.key);
      }
    });
    
    return completed;
  });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [internalDarkMode, setInternalDarkMode] = useState(false);
  const [helpQuestion, setHelpQuestion] = useState<QuestionConfig | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  
  // Use external theme control if provided, otherwise use internal state
  const isDark = externalDarkMode ?? internalDarkMode;
  
  // ============================================
  // MEMOIZED VALUES
  // ============================================
  
  // Get enabled sections only - preserve the order from props (already sorted by sort_order)
  // DO NOT re-sort by id, as that ignores the user's custom sort_order
  const enabledSections = useMemo(() => 
    sections.filter(s => s.enabled),
    [sections]
  );
  
  // Get current section
  const currentSection = enabledSections[currentSectionIndex];
  
  // Get questions for current section
  const currentQuestions = useMemo(() => {
    if (!currentSection) return [];
    return questions
      .filter(q => q.sectionId === currentSection.id && q.enabled)
      .sort((a, b) => a.order - b.order);
  }, [questions, currentSection]);
  
  // Calculate global question number offset for current section
  // This is the count of all enabled questions in sections BEFORE the current one
  const questionNumberOffset = useMemo(() => {
    let offset = 0;
    for (let i = 0; i < currentSectionIndex; i++) {
      const section = enabledSections[i];
      if (section) {
        const sectionQuestionCount = questions.filter(
          q => q.sectionId === section.id && q.enabled
        ).length;
        offset += sectionQuestionCount;
      }
    }
    return offset;
  }, [enabledSections, currentSectionIndex, questions]);
  
  // Flatten form data for question renderer
  const flatFormData = useMemo(() => flattenFormData(formData), [formData]);
  
  // Calculate progress
  const progressPercent = useMemo(() => {
    const enabledQuestions = questions.filter(q => q.enabled);
    if (enabledQuestions.length === 0) return 0;
    return Math.round((completedQuestions.size / enabledQuestions.length) * 100);
  }, [questions, completedQuestions]);
  
  // Create a config-like object for help content
  const configLike: QuestionnaireConfigLike = useMemo(() => ({
    getEnabledSections: () => enabledSections,
    getSectionById: (id: number) => sections.find(s => s.id === id),
    getSectionByKey: (key: string) => sections.find(s => s.key === key),
    getEnabledQuestions: () => questions.filter(q => q.enabled),
    getQuestionsForSection: (sectionId: number) => 
      questions.filter(q => q.sectionId === sectionId && q.enabled).sort((a, b) => a.order - b.order),
    getQuestionById: (id: string) => questions.find(q => q.id === id),
    getQuestionByKey: (key: string) => questions.find(q => q.key === key),
    shouldShowQuestion: (questionId: string, data: Record<string, unknown>) => {
      const question = questions.find(q => q.id === questionId);
      if (!question || !question.enabled) return false;
      if (question.conditionalOn) {
        const dependsOnValue = data[question.conditionalOn.questionId];
        if (question.conditionalOn.notEquals) {
          return dependsOnValue !== question.conditionalOn.notEquals && 
                 dependsOnValue !== '' && 
                 dependsOnValue !== undefined;
        }
        if (question.conditionalOn.equals) {
          return dependsOnValue === question.conditionalOn.equals;
        }
      }
      return true;
    },
    getNextEnabledSectionId: (currentSectionId: number) => {
      const currentIdx = enabledSections.findIndex(s => s.id === currentSectionId);
      if (currentIdx === -1 || currentIdx === enabledSections.length - 1) return null;
      return enabledSections[currentIdx + 1].id;
    },
    getPreviousEnabledSectionId: (currentSectionId: number) => {
      const currentIdx = enabledSections.findIndex(s => s.id === currentSectionId);
      if (currentIdx <= 0) return null;
      return enabledSections[currentIdx - 1].id;
    },
    isLastEnabledSection: (sectionId: number) => 
      enabledSections[enabledSections.length - 1]?.id === sectionId,
    isFirstEnabledSection: (sectionId: number) => 
      enabledSections[0]?.id === sectionId,
  }), [sections, questions, enabledSections]);
  
  // ============================================
  // UPDATE QUESTION HANDLER
  // ============================================
  
  const updateQuestion = useCallback((questionId: string, value: unknown) => {
    const question = questions.find(q => q.id === questionId || q.key === questionId);
    if (!question) return;
    
    const section = sections.find(s => s.id === question.sectionId);
    if (!section) return;
    
    setFormData(prev => ({
      ...prev,
      [section.key]: {
        ...prev[section.key],
        [question.id]: value, // Use question.id (e.g., q1_ideal_customer) as key
      },
    }));
    
    // Update completed questions
    if (hasValidAnswer(value)) {
      setCompletedQuestions(prev => new Set([...prev, question.key]));
    } else {
      setCompletedQuestions(prev => {
        const next = new Set(prev);
        next.delete(question.key);
        return next;
      });
    }
  }, [questions, sections]);
  
  // Mark question as completed (for onBlur)
  // Note: questionKey is the short key (e.g., "q1"), but flatFormData uses question.id (e.g., "q1_ideal_customer")
  const markQuestionCompleted = useCallback((questionKey: string) => {
    // Find the question to get its id for lookup
    const question = questions.find(q => q.key === questionKey);
    if (!question) return;
    
    const value = flatFormData[question.id];
    if (hasValidAnswer(value)) {
      setCompletedQuestions(prev => new Set([...prev, questionKey]));
    }
  }, [flatFormData, questions]);
  
  // ============================================
  // EFFECTS
  // ============================================
  
  // Check section completion when questions are completed
  useEffect(() => {
    const newCompletedSections = new Set<string>();
    
    enabledSections.forEach(section => {
      const sectionQuestions = questions.filter(
        q => q.sectionId === section.id && q.enabled && q.required
      );
      
      // If section has no required questions, it's automatically complete
      if (sectionQuestions.length === 0) {
        newCompletedSections.add(section.key);
        return;
      }
      
      const allRequiredAnswered = sectionQuestions.every(q => 
        completedQuestions.has(q.key)
      );
      
      if (allRequiredAnswered) {
        newCompletedSections.add(section.key);
      }
    });
    
    setCompletedSections(newCompletedSections);
  }, [completedQuestions, enabledSections, questions]);
  
  // Auto-save to localStorage
  useEffect(() => {
    if (!autoSave || mode === 'preview') return;
    
    const key = `questionnaire_draft_${clientId}`;
    const data = {
      formData,
      currentSectionIndex,
      completedQuestions: Array.from(completedQuestions),
      savedAt: new Date().toISOString(),
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [formData, currentSectionIndex, completedQuestions, clientId, autoSave, mode]);
  
  // Auto-save to server (debounced)
  useEffect(() => {
    if (!autoSave || !onSave || mode === 'preview') return;
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      return; // Skip first render
    }
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    setSaveStatus('saving');
    
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await onSave(formData as unknown as QuestionnaireData);
        setSaveStatus('saved');
        setLastSaved(new Date());
        
        // Reset to idle after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        setSaveStatus('error');
        console.error('Auto-save failed:', error);
      }
    }, autoSaveDelay);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, autoSave, autoSaveDelay, onSave, mode]);
  
  // Load from localStorage on mount (only if no initial data)
  useEffect(() => {
    if (initialData || mode === 'preview') return;
    
    const key = `questionnaire_draft_${clientId}`;
    const saved = localStorage.getItem(key);
    
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.formData) {
          setFormData(data.formData);
        }
        if (typeof data.currentSectionIndex === 'number') {
          setCurrentSectionIndex(data.currentSectionIndex);
        }
        if (Array.isArray(data.completedQuestions)) {
          setCompletedQuestions(new Set(data.completedQuestions));
        }
      } catch (error) {
        console.error('Failed to restore draft:', error);
      }
    }
  }, [clientId, initialData, mode]);
  
  // ============================================
  // NAVIGATION HANDLERS
  // ============================================
  
  const goToSection = useCallback((index: number) => {
    if (index >= 0 && index < enabledSections.length) {
      setCurrentSectionIndex(index);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [enabledSections.length]);
  
  const goToPrevious = useCallback(() => {
    goToSection(currentSectionIndex - 1);
  }, [currentSectionIndex, goToSection]);
  
  const goToNext = useCallback(() => {
    goToSection(currentSectionIndex + 1);
  }, [currentSectionIndex, goToSection]);
  
  // ============================================
  // SAVE & SUBMIT HANDLERS
  // ============================================
  
  const handleSave = useCallback(async () => {
    if (!onSave) return;
    
    setSaveStatus('saving');
    try {
      await onSave(formData as unknown as QuestionnaireData);
      setSaveStatus('saved');
      setLastSaved(new Date());
      
      // Reset to idle after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      console.error('[UnifiedQuestionnaireForm] Save failed:', error);
    }
  }, [formData, onSave]);
  
  const handleSubmit = useCallback(async () => {
    if (!onSubmit) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData as unknown as QuestionnaireData);
      
      // Clear localStorage draft
      try {
        localStorage.removeItem(`questionnaire_draft_${clientId}`);
      } catch {
        // Ignore localStorage errors
      }
      
    } catch (error) {
      console.error('[UnifiedQuestionnaireForm] Submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, clientId, onSubmit]);
  
  // ============================================
  // THEME & HELP HANDLERS
  // ============================================
  
  const toggleTheme = useCallback(() => {
    if (externalToggleTheme) {
      externalToggleTheme();
    } else {
      setInternalDarkMode(prev => !prev);
    }
  }, [externalToggleTheme]);
  
  const openHelp = useCallback((question: QuestionConfig) => {
    setHelpQuestion(question);
  }, []);
  
  const closeHelp = useCallback(() => {
    setHelpQuestion(null);
  }, []);
  
  const toggleFocusMode = useCallback(() => {
    setIsFocusMode(prev => !prev);
  }, []);
  
  // ============================================
  // RENDER
  // ============================================
  
  // Don't render if no sections
  if (!currentSection || enabledSections.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No questionnaire sections configured.
      </div>
    );
  }
  
  // Render questions for current section
  const questionsContent = (
    <div className="space-y-8">
      {currentQuestions.map((question, indexInSection) => {
        // Check if question should be shown (conditional logic)
        const shouldShow = configLike.shouldShowQuestion(question.id, flatFormData);
        if (!shouldShow) return null;
        
        // Global question number = offset from previous sections + position in current section (1-based)
        const globalQuestionNumber = questionNumberOffset + indexInSection + 1;
        
        return (
          <QuestionRenderer
            key={question.id}
            question={question}
            value={flatFormData[question.id] as string | string[] | import('./question-types/file-upload-question').UploadedFile[]}
            onChange={(value) => updateQuestion(question.id, value)}
            onBlur={() => markQuestionCompleted(question.key)}
            onHelpClick={() => openHelp(question)}
            globalQuestionNumber={globalQuestionNumber}
          />
        );
      })}
    </div>
  );
  
  // Render footer navigation
  const footerContent = (
    <FormFooter
      currentSectionIndex={currentSectionIndex}
      totalSections={enabledSections.length}
      onPrevious={goToPrevious}
      onNext={goToNext}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      canSubmit={completedSections.size === enabledSections.length}
    />
  );
  
  // Compute canSubmit for focus layout
  const canSubmit = completedSections.size === enabledSections.length;
  
  // Render based on layout
  const renderLayout = () => {
    // Focus mode takes priority when user toggles it on
    // Also renders if layout prop is explicitly set to 'focus'
    if (isFocusMode || layout === 'focus') {
      return (
        <FocusLayout
          sections={enabledSections}
          questions={questions}
          currentSectionIndex={currentSectionIndex}
          currentSection={currentSection}
          flatFormData={flatFormData}
          updateQuestion={updateQuestion}
          markQuestionCompleted={markQuestionCompleted}
          onHelpClick={openHelp}
          goToSection={goToSection}
          progressPercent={progressPercent}
          completedSections={completedSections}
          clientName={clientName}
          showThemeToggle={showThemeToggle}
          isDarkMode={isDark}
          onToggleTheme={toggleTheme}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          canSubmit={canSubmit}
          onExitFocusMode={isFocusMode ? () => setIsFocusMode(false) : undefined}
        />
      );
    }
    
    // Sidebar layout - V0-style 2-column
    if (layout === 'sidebar') {
      return (
        <SidebarLayout
          sections={enabledSections}
          currentSectionIndex={currentSectionIndex}
          completedSections={completedSections}
          onSectionClick={goToSection}
          progressPercent={progressPercent}
          currentSection={currentSection}
          onSave={showSaveButton && onSave ? handleSave : undefined}
          isSaving={saveStatus === 'saving'}
          lastSaved={lastSaved}
          onToggleFocusMode={toggleFocusMode}
          footer={footerContent}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSection?.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {questionsContent}
            </motion.div>
          </AnimatePresence>
        </SidebarLayout>
      );
    }
    
    // Default: Pills layout - horizontal tabs
    return (
      <PillsLayout
        sections={enabledSections}
        currentSectionIndex={currentSectionIndex}
        completedSections={completedSections}
        onSectionClick={goToSection}
        progressPercent={progressPercent}
        currentSection={currentSection}
        clientName={clientName}
        showThemeToggle={showThemeToggle}
        isDarkMode={isDark}
        onToggleTheme={toggleTheme}
        onToggleFocusMode={toggleFocusMode}
        saveStatus={saveStatus}
        lastSaved={lastSaved}
        footer={footerContent}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSection?.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {questionsContent}
          </motion.div>
        </AnimatePresence>
      </PillsLayout>
    );
  };
  
  const formContent = renderLayout();
  
  return (
    <>
      {formContent}
      
      {/* Help Panel - Slides in from right */}
      <HelpPanel
        isOpen={!!helpQuestion}
        onClose={closeHelp}
      >
        {helpQuestion && (
          <ConfigHelpContent 
            questionId={helpQuestion.id} 
            config={configLike}
          />
        )}
      </HelpPanel>
    </>
  );
}

export default UnifiedQuestionnaireForm;

