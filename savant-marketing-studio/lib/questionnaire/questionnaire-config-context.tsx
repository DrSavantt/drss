'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { 
  SectionConfig, 
  QuestionConfig
} from './questions-config';

// Types matching database structure
interface DbSectionConfig {
  id: number;
  key: string;
  title: string;
  description: string | null;
  estimated_minutes: number;
  sort_order: number;
  enabled: boolean;
}

interface DbQuestionWithHelp {
  id: string;
  section_id: number;
  question_key: string;
  sort_order: number;
  text: string;
  type: string;
  required: boolean;
  enabled: boolean;
  min_length: number | null;
  max_length: number | null;
  placeholder: string | null;
  options: { value: string; label: string }[] | null;
  conditional_on: { questionId: string; notEquals?: string; equals?: string } | null;
  accepted_file_types: string[] | null;
  max_file_size: number | null;
  max_files: number | null;
  file_description: string | null;
  help?: {
    id: number;
    question_id: string;
    title: string | null;
    where_to_find: string[] | null;
    how_to_extract: string[] | null;
    good_example: string | null;
    weak_example: string | null;
    quick_tip: string | null;
  };
}

// Transform database section to config section format
function transformSection(dbSection: DbSectionConfig): SectionConfig {
  return {
    id: dbSection.id,
    key: dbSection.key,
    title: dbSection.title,
    description: dbSection.description || '',
    estimatedMinutes: dbSection.estimated_minutes,
    enabled: dbSection.enabled,
  };
}

// Transform database question to config question format
function transformQuestion(dbQuestion: DbQuestionWithHelp): QuestionConfig {
  return {
    id: dbQuestion.id,
    key: dbQuestion.question_key,
    sectionId: dbQuestion.section_id,
    order: dbQuestion.sort_order,
    text: dbQuestion.text,
    type: dbQuestion.type as QuestionConfig['type'],
    required: dbQuestion.required,
    enabled: dbQuestion.enabled,
    minLength: dbQuestion.min_length ?? undefined,
    maxLength: dbQuestion.max_length ?? undefined,
    placeholder: dbQuestion.placeholder ?? undefined,
    options: dbQuestion.options ?? undefined,
    conditionalOn: dbQuestion.conditional_on ?? undefined,
    acceptedFileTypes: dbQuestion.accepted_file_types ?? undefined,
    maxFileSize: dbQuestion.max_file_size ?? undefined,
    maxFiles: dbQuestion.max_files ?? undefined,
    fileDescription: dbQuestion.file_description ?? undefined,
    // Help content
    helpTitle: dbQuestion.help?.title ?? undefined,
    helpWhereToFind: dbQuestion.help?.where_to_find ?? undefined,
    helpHowToExtract: dbQuestion.help?.how_to_extract ?? undefined,
    helpGoodExample: dbQuestion.help?.good_example ?? undefined,
    helpWeakExample: dbQuestion.help?.weak_example ?? undefined,
    helpQuickTip: dbQuestion.help?.quick_tip ?? undefined,
  };
}

interface QuestionnaireConfigState {
  sections: SectionConfig[];
  questions: QuestionConfig[];
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Shared interface for config access - can be used by components that support
 * both static config and database-driven config.
 */
export interface QuestionnaireConfigLike {
  getEnabledSections: () => SectionConfig[];
  getSectionById: (id: number) => SectionConfig | undefined;
  getSectionByKey: (key: string) => SectionConfig | undefined;
  getEnabledQuestions: () => QuestionConfig[];
  getQuestionsForSection: (sectionId: number) => QuestionConfig[];
  getQuestionById: (id: string) => QuestionConfig | undefined;
  getQuestionByKey: (key: string) => QuestionConfig | undefined;
  shouldShowQuestion: (questionId: string, formData: Record<string, unknown>) => boolean;
  getNextEnabledSectionId: (currentSectionId: number) => number | null;
  getPreviousEnabledSectionId: (currentSectionId: number) => number | null;
  isLastEnabledSection: (sectionId: number) => boolean;
  isFirstEnabledSection: (sectionId: number) => boolean;
}

interface QuestionnaireConfigContextType extends QuestionnaireConfigState, QuestionnaireConfigLike {
  refresh: () => Promise<void>;
}

const QuestionnaireConfigContext = createContext<QuestionnaireConfigContextType | null>(null);

interface QuestionnaireConfigProviderProps {
  children: ReactNode;
  // Optional: pass pre-fetched data from server component
  initialSections?: SectionConfig[];
  initialQuestions?: QuestionConfig[];
}

export function QuestionnaireConfigProvider({ 
  children,
  initialSections,
  initialQuestions
}: QuestionnaireConfigProviderProps) {
  const [state, setState] = useState<QuestionnaireConfigState>({
    sections: initialSections || [],
    questions: initialQuestions || [],
    isLoaded: !!(initialSections && initialQuestions),
    isLoading: false,
    error: null,
  });

  // Fetch on mount if not pre-loaded - ONLY ONCE
  useEffect(() => {
    // Skip if already loaded or currently loading
    if (state.isLoaded || state.isLoading) {
      return;
    }

    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchConfig = async () => {
      if (!isMounted) return;
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        // Create timeout promise (10 seconds for API route)
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('API request timeout after 10 seconds'));
          }, 10000);
        });
        
        // Fetch from API route
        const fetchPromise = fetch('/api/questionnaire-config', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
        
        // Clear timeout if fetch succeeded
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `API returned ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!isMounted) return;
        
        if (!data.sections || !data.questions) {
          throw new Error('Invalid API response: missing sections or questions');
        }
        
        const sections = data.sections.map(transformSection);
        const questions = data.questions.map(transformQuestion);
        
        setState({
          sections,
          questions,
          isLoaded: true,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('[QuestionnaireConfig] Fetch failed:', error);
        
        if (!isMounted) return;
        
        // Set error state - components should handle gracefully
        setState(prev => ({
          ...prev,
          isLoaded: false,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load config',
        }));
      }
    };

    fetchConfig();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []); // Empty deps - run only once on mount

  // Helper functions that use live data
  const getEnabledSections = useCallback(() => {
    return state.sections
      .filter(s => s.enabled)
      .sort((a, b) => a.id - b.id);
  }, [state.sections]);

  const getSectionById = useCallback((id: number) => {
    return state.sections.find(s => s.id === id);
  }, [state.sections]);

  const getSectionByKey = useCallback((key: string) => {
    return state.sections.find(s => s.key === key);
  }, [state.sections]);

  const getEnabledQuestions = useCallback(() => {
    const enabledSectionIds = getEnabledSections().map(s => s.id);
    return state.questions
      .filter(q => q.enabled && enabledSectionIds.includes(q.sectionId))
      .sort((a, b) => a.sectionId - b.sectionId || a.order - b.order);
  }, [state.questions, getEnabledSections]);

  const getQuestionsForSection = useCallback((sectionId: number) => {
    return state.questions
      .filter(q => q.sectionId === sectionId && q.enabled)
      .sort((a, b) => a.order - b.order);
  }, [state.questions]);

  const getQuestionById = useCallback((id: string) => {
    return state.questions.find(q => q.id === id);
  }, [state.questions]);

  const getQuestionByKey = useCallback((key: string) => {
    return state.questions.find(q => q.key === key);
  }, [state.questions]);

  const shouldShowQuestion = useCallback((
    questionId: string, 
    formData: Record<string, unknown>
  ) => {
    const question = getQuestionById(questionId);
    if (!question || !question.enabled) return false;
    
    // Check if the section is enabled
    const section = getSectionById(question.sectionId);
    if (!section || !section.enabled) return false;
    
    if (question.conditionalOn) {
      const dependsOnValue = formData[question.conditionalOn.questionId];
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
  }, [getQuestionById, getSectionById]);

  const getNextEnabledSectionId = useCallback((currentSectionId: number) => {
    const enabledSections = getEnabledSections();
    const currentIndex = enabledSections.findIndex(s => s.id === currentSectionId);
    if (currentIndex === -1 || currentIndex === enabledSections.length - 1) return null;
    return enabledSections[currentIndex + 1].id;
  }, [getEnabledSections]);

  const getPreviousEnabledSectionId = useCallback((currentSectionId: number) => {
    const enabledSections = getEnabledSections();
    const currentIndex = enabledSections.findIndex(s => s.id === currentSectionId);
    if (currentIndex <= 0) return null;
    return enabledSections[currentIndex - 1].id;
  }, [getEnabledSections]);

  const isLastEnabledSection = useCallback((sectionId: number) => {
    const enabledSections = getEnabledSections();
    return enabledSections[enabledSections.length - 1]?.id === sectionId;
  }, [getEnabledSections]);

  const isFirstEnabledSection = useCallback((sectionId: number) => {
    const enabledSections = getEnabledSections();
    return enabledSections[0]?.id === sectionId;
  }, [getEnabledSections]);

  // Manual refresh function (for settings page or manual reload)
  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch('/api/questionnaire-config', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Refresh failed');
      }
      
      const data = await response.json();
      
      if (!data.sections || !data.questions) {
        throw new Error('Invalid response data');
      }
      
      const sections = data.sections.map(transformSection);
      const questions = data.questions.map(transformQuestion);
      
      setState({
        sections,
        questions,
        isLoaded: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('[QuestionnaireConfig] Refresh failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to refresh',
      }));
    }
  }, []);

  const value: QuestionnaireConfigContextType = {
    ...state,
    refresh,
    getEnabledSections,
    getSectionById,
    getSectionByKey,
    getEnabledQuestions,
    getQuestionsForSection,
    getQuestionById,
    getQuestionByKey,
    shouldShowQuestion,
    getNextEnabledSectionId,
    getPreviousEnabledSectionId,
    isLastEnabledSection,
    isFirstEnabledSection,
  };

  return (
    <QuestionnaireConfigContext.Provider value={value}>
      {children}
    </QuestionnaireConfigContext.Provider>
  );
}

/**
 * Hook to access questionnaire config from the database.
 * Must be used within a QuestionnaireConfigProvider.
 */
export function useQuestionnaireConfig(): QuestionnaireConfigContextType {
  const context = useContext(QuestionnaireConfigContext);
  if (!context) {
    throw new Error('useQuestionnaireConfig must be used within a QuestionnaireConfigProvider');
  }
  return context;
}

/**
 * Optional hook - returns config if in provider, otherwise returns null.
 * Useful for components that may or may not be in the provider.
 */
export function useQuestionnaireConfigOptional(): QuestionnaireConfigContextType | null {
  return useContext(QuestionnaireConfigContext);
}

