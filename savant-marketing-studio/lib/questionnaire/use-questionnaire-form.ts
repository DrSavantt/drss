'use client';

import { useState, useEffect, useCallback } from 'react';
import { QuestionnaireData, FormStatus, REQUIRED_QUESTIONS, EMPTY_QUESTIONNAIRE_DATA, UploadedFile } from './types';
import { questionSchemas } from './validation-schemas';
import { shouldShowQuestion } from './conditional-logic';

interface UseQuestionnaireFormReturn {
  formData: QuestionnaireData;
  currentSection: number;
  completedQuestions: Set<string>;
  progress: number;
  saveStatus: FormStatus;
  updateQuestion: (questionId: string, value: string | string[] | UploadedFile[]) => void;
  validateQuestion: (questionId: string) => string | undefined;
  validateSection: (sectionNumber: number) => { isValid: boolean; error?: string };
  markQuestionCompleted: (questionId: string) => void;
  goToSection: (sectionNumber: number) => void;
  goToNextStep: () => boolean;
  goToPreviousStep: () => void;
  canGoNext: () => boolean;
  canGoPrevious: () => boolean;
  manualSave: () => void;
  isDraft: boolean;
}

export function useQuestionnaireForm(clientId: string): UseQuestionnaireFormReturn {
  const [formData, setFormData] = useState<QuestionnaireData>(EMPTY_QUESTIONNAIRE_DATA);
  const [currentSection, setCurrentSection] = useState(1);
  const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState<FormStatus>('saved');
  const [isDraft, setIsDraft] = useState(false);

  // Restore from localStorage on mount
  useEffect(() => {
    const draft = localStorage.getItem(`questionnaire_draft_${clientId}`);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFormData(parsed);
        setIsDraft(true);
        
        // Restore completed questions
        const completed = localStorage.getItem(`questionnaire_completed_${clientId}`);
        if (completed) {
          setCompletedQuestions(new Set(JSON.parse(completed)));
        }

        // Restore current step
        const savedStep = localStorage.getItem(`questionnaire_current_step_${clientId}`);
        if (savedStep) {
          setCurrentSection(parseInt(savedStep, 10));
        }
      } catch (error) {
        console.error('Failed to restore draft:', error);
      }
    }
  }, [clientId]);

  // Auto-save to localStorage with 1 second debounce
  useEffect(() => {
    if (!formData) return;

    // Check if form has any content
    const hasContent = Object.values(formData).some(section => 
      Object.values(section).some(value => {
        if (typeof value === 'string') return value.length > 0;
        if (Array.isArray(value)) return value.length > 0;
        return false;
      })
    );

    if (!hasContent) return;

    setSaveStatus('saving');
    
    // Debounce 1 second after last keystroke
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          `questionnaire_draft_${clientId}`,
          JSON.stringify(formData)
        );
        localStorage.setItem(
          `questionnaire_completed_${clientId}`,
          JSON.stringify(Array.from(completedQuestions))
        );
        setSaveStatus('saved');
        setIsDraft(true);
      } catch (error) {
        console.error('Failed to save draft:', error);
        setSaveStatus('error');
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [formData, completedQuestions, clientId]);

  // Save when component unmounts or user navigates away
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Save immediately before page closes/navigates
      try {
        localStorage.setItem(
          `questionnaire_draft_${clientId}`,
          JSON.stringify(formData)
        );
        localStorage.setItem(
          `questionnaire_completed_${clientId}`,
          JSON.stringify(Array.from(completedQuestions))
        );
        localStorage.setItem(
          `questionnaire_current_step_${clientId}`,
          currentSection.toString()
        );
      } catch (error) {
        console.error('Failed to save on navigation:', error);
      }
    };

    // Browser navigation (closing tab, clicking back, etc)
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup: save on unmount (navigating to different route)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Final save on unmount
      try {
        localStorage.setItem(
          `questionnaire_draft_${clientId}`,
          JSON.stringify(formData)
        );
        localStorage.setItem(
          `questionnaire_completed_${clientId}`,
          JSON.stringify(Array.from(completedQuestions))
        );
        localStorage.setItem(
          `questionnaire_current_step_${clientId}`,
          currentSection.toString()
        );
      } catch (error) {
        console.error('Failed to save on unmount:', error);
      }
    };
  }, [formData, completedQuestions, currentSection, clientId]);

  // Calculate progress
  const progress = useCallback(() => {
    const visibleRequired = REQUIRED_QUESTIONS.filter(q => 
      shouldShowQuestion(q, formData)
    );
    const answeredRequired = Array.from(completedQuestions).filter(q =>
      visibleRequired.includes(q)
    );
    return Math.round((answeredRequired.length / visibleRequired.length) * 100);
  }, [completedQuestions, formData]);

  // Update question value
  const updateQuestion = useCallback((questionId: string, value: string | string[] | UploadedFile[]) => {
    setFormData(prev => {
      const updated = { ...prev };
      
      // Determine which section this question belongs to
      if (questionId.startsWith('q1') || questionId.startsWith('q2') || 
          questionId.startsWith('q3') || questionId.startsWith('q4') || 
          questionId.startsWith('q5')) {
        updated.avatar_definition = {
          ...updated.avatar_definition,
          [`${questionId}_${getQuestionKey(questionId)}`]: value
        };
      } else if (questionId.startsWith('q6') || questionId.startsWith('q7') || 
                 questionId.startsWith('q8') || questionId.startsWith('q9') || 
                 questionId.startsWith('q10')) {
        const key = getQuestionKey(questionId);
        updated.dream_outcome = {
          ...updated.dream_outcome,
          [`${questionId}_${key}`]: value as string
        };
      } else if (questionId.startsWith('q11') || questionId.startsWith('q12') || 
                 questionId.startsWith('q13') || questionId.startsWith('q14') || 
                 questionId.startsWith('q15')) {
        const key = getQuestionKey(questionId);
        updated.problems_obstacles = {
          ...updated.problems_obstacles,
          [`${questionId}_${key}`]: value as string
        };
      } else if (questionId.startsWith('q16') || questionId.startsWith('q17') || 
                 questionId.startsWith('q18') || questionId.startsWith('q19')) {
        const key = getQuestionKey(questionId);
        updated.solution_methodology = {
          ...updated.solution_methodology,
          [`${questionId}_${key}`]: value as string
        };
      } else if (questionId.startsWith('q20') || questionId.startsWith('q21') || 
                 questionId.startsWith('q22') || questionId.startsWith('q23') ||
                 questionId === 'q33') {
        const key = getQuestionKey(questionId);
        updated.brand_voice = {
          ...updated.brand_voice,
          [`${questionId}_${key}`]: value as string | UploadedFile[]
        };
      } else if (questionId.startsWith('q24') || questionId.startsWith('q25') || 
                 questionId.startsWith('q26') || questionId.startsWith('q27') ||
                 questionId === 'q34') {
        const key = getQuestionKey(questionId);
        updated.proof_transformation = {
          ...updated.proof_transformation,
          [`${questionId}_${key}`]: value as string | UploadedFile[]
        };
      } else if (questionId.startsWith('q28') || questionId.startsWith('q29') || 
                 questionId.startsWith('q30')) {
        const key = getQuestionKey(questionId);
        updated.faith_integration = {
          ...updated.faith_integration,
          [`${questionId}_${key}`]: value as string
        };
      } else if (questionId.startsWith('q31') || questionId.startsWith('q32')) {
        const key = getQuestionKey(questionId);
        updated.business_metrics = {
          ...updated.business_metrics,
          [`${questionId}_${key}`]: value as string
        };
      }

      return updated;
    });
  }, []);

  // Validate question
  const validateQuestion = useCallback((questionId: string): string | undefined => {
    const schema = questionSchemas[questionId];
    if (!schema) return undefined;

    // Get the value from formData
    const value = getQuestionValue(questionId, formData);

    try {
      schema.parse(value);
      return undefined;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errors' in error) {
        const zodError = error as { errors: Array<{ message: string }> };
        return zodError.errors?.[0]?.message || 'Invalid input';
      }
      return 'Invalid input';
    }
  }, [formData]);

  // Mark question as completed
  const markQuestionCompleted = useCallback((questionId: string) => {
    setCompletedQuestions(prev => new Set(prev).add(questionId));
  }, []);

  // Validate entire section
  const validateSection = useCallback((sectionNumber: number): { isValid: boolean; error?: string } => {
    const sectionQuestionMap: Record<number, string[]> = {
      1: ['q1', 'q2', 'q3', 'q4', 'q5'],
      2: ['q6', 'q7', 'q8', 'q9', 'q10'],
      3: ['q11', 'q12', 'q14', 'q15'], // Q13 optional
      4: ['q16', 'q17', 'q18', 'q19'],
      5: ['q20', 'q21', 'q22', 'q23'],
      6: ['q24', 'q25', 'q27'], // Q26 optional
      7: [], // All optional
      8: ['q31', 'q32'],
    };

    const requiredQuestions = sectionQuestionMap[sectionNumber] || [];
    const incompleteQuestions = requiredQuestions.filter(q => !completedQuestions.has(q));

    if (incompleteQuestions.length > 0) {
      return {
        isValid: false,
        error: `Please complete ${incompleteQuestions.length} required question${incompleteQuestions.length > 1 ? 's' : ''} before continuing`,
      };
    }

    return { isValid: true };
  }, [completedQuestions]);

  // Navigate to section
  const goToSection = useCallback((sectionNumber: number) => {
    setCurrentSection(sectionNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Step navigation
  const canGoNext = useCallback(() => {
    return validateSection(currentSection).isValid;
  }, [currentSection, validateSection]);

  const canGoPrevious = useCallback(() => {
    return currentSection > 1;
  }, [currentSection]);

  const goToNextStep = useCallback((): boolean => {
    const validation = validateSection(currentSection);
    if (!validation.isValid) {
      return false;
    }
    if (currentSection < 8) {
      setCurrentSection(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    }
    return false;
  }, [currentSection, validateSection]);

  const goToPreviousStep = useCallback(() => {
    if (currentSection > 1) {
      setCurrentSection(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentSection]);

  // Manual save
  const manualSave = useCallback(() => {
    try {
      localStorage.setItem(
        `questionnaire_draft_${clientId}`,
        JSON.stringify(formData)
      );
      localStorage.setItem(
        `questionnaire_completed_${clientId}`,
        JSON.stringify(Array.from(completedQuestions))
      );
      localStorage.setItem(
        `questionnaire_current_step_${clientId}`,
        currentSection.toString()
      );
      setSaveStatus('saved');
      setIsDraft(true);
    } catch (error) {
      console.error('Failed to save draft:', error);
      setSaveStatus('error');
    }
  }, [formData, completedQuestions, currentSection, clientId]);

  return {
    formData,
    currentSection,
    completedQuestions,
    progress: progress(),
    saveStatus,
    updateQuestion,
    validateQuestion,
    validateSection,
    markQuestionCompleted,
    goToSection,
    goToNextStep,
    goToPreviousStep,
    canGoNext,
    canGoPrevious,
    manualSave,
    isDraft,
  };
}

// Helper function to get question key from question ID
function getQuestionKey(questionId: string): string {
  const keyMap: Record<string, string> = {
    q1: 'ideal_customer',
    q2: 'avatar_criteria',
    q3: 'demographics',
    q4: 'psychographics',
    q5: 'platforms',
    q6: 'dream_outcome',
    q7: 'status',
    q8: 'time_to_result',
    q9: 'effort_sacrifice',
    q10: 'proof',
    q11: 'external_problems',
    q12: 'internal_problems',
    q13: 'philosophical_problems',
    q14: 'past_failures',
    q15: 'limiting_beliefs',
    q16: 'core_offer',
    q17: 'unique_mechanism',
    q18: 'differentiation',
    q19: 'delivery_vehicle',
    q20: 'voice_type',
    q21: 'personality_words',
    q22: 'signature_phrases',
    q23: 'avoid_topics',
    q24: 'transformation_story',
    q25: 'measurable_results',
    q26: 'credentials',
    q27: 'guarantees',
    q28: 'faith_preference',
    q29: 'faith_mission',
    q30: 'biblical_principles',
    q31: 'annual_revenue',
    q32: 'primary_goal',
    q33: 'brand_assets',
    q34: 'proof_assets',
  };
  return keyMap[questionId] || '';
}

// Helper function to get question value from formData
function getQuestionValue(questionId: string, formData: QuestionnaireData): string | string[] {
  const key = `${questionId}_${getQuestionKey(questionId)}`;
  
  // Skip file upload questions - they don't need validation
  if (questionId === 'q33' || questionId === 'q34') return '';
  
  if (questionId.startsWith('q1') || questionId.startsWith('q2') || 
      questionId.startsWith('q3') || questionId.startsWith('q4') || 
      questionId.startsWith('q5')) {
    return (formData.avatar_definition as Record<string, string | string[]>)[key] || '';
  } else if (questionId.startsWith('q6') || questionId.startsWith('q7') || 
             questionId.startsWith('q8') || questionId.startsWith('q9') || 
             questionId.startsWith('q10')) {
    return (formData.dream_outcome as Record<string, string>)[key] || '';
  } else if (questionId.startsWith('q11') || questionId.startsWith('q12') || 
             questionId.startsWith('q13') || questionId.startsWith('q14') || 
             questionId.startsWith('q15')) {
    return (formData.problems_obstacles as Record<string, string>)[key] || '';
  } else if (questionId.startsWith('q16') || questionId.startsWith('q17') || 
             questionId.startsWith('q18') || questionId.startsWith('q19')) {
    return (formData.solution_methodology as Record<string, string>)[key] || '';
  } else if (questionId.startsWith('q20') || questionId.startsWith('q21') || 
             questionId.startsWith('q22') || questionId.startsWith('q23')) {
    const value = (formData.brand_voice as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : '';
  } else if (questionId.startsWith('q24') || questionId.startsWith('q25') || 
             questionId.startsWith('q26') || questionId.startsWith('q27')) {
    const value = (formData.proof_transformation as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : '';
  } else if (questionId.startsWith('q28') || questionId.startsWith('q29') || 
             questionId.startsWith('q30')) {
    return (formData.faith_integration as Record<string, string>)[key] || '';
  } else if (questionId.startsWith('q31') || questionId.startsWith('q32')) {
    return (formData.business_metrics as Record<string, string>)[key] || '';
  }
  
  return '';
}
