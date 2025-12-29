'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { QuestionnaireData, FormStatus, REQUIRED_QUESTIONS, EMPTY_QUESTIONNAIRE_DATA, UploadedFile } from './types';
import { questionSchemas } from './validation-schemas';
import { shouldShowQuestion } from './conditional-logic';

export interface UseQuestionnaireFormReturn {
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

export function useQuestionnaireForm(
  clientId: string, 
  existingData?: QuestionnaireData | null,
  isEditMode: boolean = false
): UseQuestionnaireFormReturn {
  const [formData, setFormData] = useState<QuestionnaireData>(EMPTY_QUESTIONNAIRE_DATA);
  const [currentSection, setCurrentSection] = useState(1);
  const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState<FormStatus>('saved');
  const [isDraft, setIsDraft] = useState(false);
  
  // Track if we've already restored from localStorage to prevent multiple restorations
  const hasRestoredRef = useRef(false);
  // Track if we've initialized with existing data in edit mode
  const hasInitializedEditDataRef = useRef(false);

  // Initialize with existing data in edit mode (takes priority over localStorage)
  useEffect(() => {
    if (isEditMode && existingData && !hasInitializedEditDataRef.current) {
      setFormData(existingData);
      
      // Mark all questions that have values as completed
      const completed = new Set<string>();
      const checkSection = (sectionData: Record<string, unknown>, prefix: string) => {
        Object.entries(sectionData).forEach(([key, value]) => {
          // Extract question number from key (e.g., q1_ideal_customer -> q1)
          const match = key.match(/^(q\d+)_/);
          if (match) {
            const questionId = match[1];
            if (value && (typeof value === 'string' ? value.trim() !== '' : Array.isArray(value) ? value.length > 0 : false)) {
              completed.add(questionId);
            }
          }
        });
      };
      
      checkSection(existingData.avatar_definition as unknown as Record<string, unknown>, 'avatar');
      checkSection(existingData.dream_outcome as unknown as Record<string, unknown>, 'dream');
      checkSection(existingData.problems_obstacles as unknown as Record<string, unknown>, 'problems');
      checkSection(existingData.solution_methodology as unknown as Record<string, unknown>, 'solution');
      checkSection(existingData.brand_voice as unknown as Record<string, unknown>, 'brand');
      checkSection(existingData.proof_transformation as unknown as Record<string, unknown>, 'proof');
      checkSection(existingData.faith_integration as unknown as Record<string, unknown>, 'faith');
      checkSection(existingData.business_metrics as unknown as Record<string, unknown>, 'business');
      
      setCompletedQuestions(completed);
      hasInitializedEditDataRef.current = true;
      hasRestoredRef.current = true; // Skip localStorage restore since we have existing data
    }
  }, [isEditMode, existingData]);

  // Restore from localStorage on mount (only for create mode, not edit mode)
  useEffect(() => {
    // Skip restore if we just cleared (reset button was clicked)
    if (sessionStorage.getItem('skipRestore') === 'true') {
      sessionStorage.removeItem('skipRestore');
      hasRestoredRef.current = true;
      return;
    }
    
    // Skip if in edit mode or already restored
    if (isEditMode || hasRestoredRef.current) {
      return;
    }
    
    try {
      const draftKey = `questionnaire_draft_${clientId}`;
      const completedKey = `questionnaire_completed_${clientId}`;
      const sectionKey = `questionnaire_section_${clientId}`;
      
      // Restore formData
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        setFormData(parsed);
        setIsDraft(true);
      }
        
      // Restore completedQuestions
      const savedCompleted = localStorage.getItem(completedKey);
      if (savedCompleted) {
        const parsed = JSON.parse(savedCompleted);
        setCompletedQuestions(new Set(parsed));
        }

      // Restore current section
      const savedSection = localStorage.getItem(sectionKey);
      if (savedSection) {
        const sectionNum = parseInt(savedSection, 10);
        setCurrentSection(sectionNum);
      }
      
      // Mark as restored so this never runs again
      hasRestoredRef.current = true;
      
      } catch (error) {
      console.error('[RESTORE] ❌ FAILED:', error);
    }
  }, [clientId, isEditMode]); // Still depends on clientId, but ref prevents multiple runs

  // Auto-save to localStorage - immediate, no debounce
  useEffect(() => {
    if (!formData) {
      return;
    }

    try {
      const draftKey = `questionnaire_draft_${clientId}`;
      const completedKey = `questionnaire_completed_${clientId}`;
      
      // Save formData
      localStorage.setItem(draftKey, JSON.stringify(formData));
      
      // Save completedQuestions
      localStorage.setItem(completedKey, JSON.stringify(Array.from(completedQuestions)));
      
      // Save current section
      localStorage.setItem(`questionnaire_section_${clientId}`, String(currentSection));
      
      setSaveStatus('saved');
      setIsDraft(true);
    } catch (error) {
      console.error('[AUTO-SAVE] ❌ FAILED:', error);
      setSaveStatus('error');
    }
  }, [formData, completedQuestions, currentSection, clientId]);

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
          `questionnaire_section_${clientId}`,
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
          `questionnaire_section_${clientId}`,
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
      // Use exact matching to avoid q10 matching q1, q11 matching q1, etc.
      if (questionId === 'q1' || questionId === 'q2' || 
          questionId === 'q3' || questionId === 'q4' || 
          questionId === 'q5') {
        updated.avatar_definition = {
          ...updated.avatar_definition,
          [`${questionId}_${getQuestionKey(questionId)}`]: value
        };
      } else if (questionId === 'q6' || questionId === 'q7' || 
                 questionId === 'q8' || questionId === 'q9' || 
                 questionId === 'q10') {
        const key = getQuestionKey(questionId);
        updated.dream_outcome = {
          ...updated.dream_outcome,
          [`${questionId}_${key}`]: value as string
        };
      } else if (questionId === 'q11' || questionId === 'q12' || 
                 questionId === 'q13' || questionId === 'q14' || 
                 questionId === 'q15') {
        const key = getQuestionKey(questionId);
        updated.problems_obstacles = {
          ...updated.problems_obstacles,
          [`${questionId}_${key}`]: value as string
        };
      } else if (questionId === 'q16' || questionId === 'q17' || 
                 questionId === 'q18' || questionId === 'q19') {
        const key = getQuestionKey(questionId);
        updated.solution_methodology = {
          ...updated.solution_methodology,
          [`${questionId}_${key}`]: value as string
        };
      } else if (questionId === 'q20' || questionId === 'q21' || 
                 questionId === 'q22' || questionId === 'q23' ||
                 questionId === 'q24') {
        const key = getQuestionKey(questionId);
        updated.brand_voice = {
          ...updated.brand_voice,
          [`${questionId}_${key}`]: value as string | UploadedFile[]
        };
      } else if (questionId === 'q25' || questionId === 'q26' || 
                 questionId === 'q27' || questionId === 'q28' ||
                 questionId === 'q29') {
        const key = getQuestionKey(questionId);
        updated.proof_transformation = {
          ...updated.proof_transformation,
          [`${questionId}_${key}`]: value as string | UploadedFile[]
        };
      } else if (questionId === 'q30' || questionId === 'q31' || 
                 questionId === 'q32') {
        const key = getQuestionKey(questionId);
        updated.faith_integration = {
          ...updated.faith_integration,
          [`${questionId}_${key}`]: value as string
        };
      } else if (questionId === 'q33' || questionId === 'q34') {
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
    if (!schema) {
      return undefined;
    }

    // Get the value from formData
    const value = getQuestionValue(questionId, formData);

    try {
      schema.parse(value);
      return undefined;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errors' in error) {
        const zodError = error as { errors: Array<{ message: string }> };
        const errorMsg = zodError.errors?.[0]?.message || 'Invalid input';
        return errorMsg;
      }
      return 'Invalid input';
    }
  }, [formData]);

  // Mark question as completed - no validation gate
  const markQuestionCompleted = useCallback((questionId: string) => {
    setCompletedQuestions(prev => new Set(prev).add(questionId));
  }, []);

  // Validate entire section - actually validates content, not just Set membership
  const validateSection = useCallback((sectionNumber: number): { isValid: boolean; error?: string } => {
    const sectionQuestionMap: Record<number, string[]> = {
      1: ['q1', 'q2', 'q3', 'q4', 'q5'],
      2: ['q6', 'q7', 'q8', 'q9', 'q10'],
      3: ['q11', 'q12', 'q14', 'q15'], // Q13 optional
      4: ['q16', 'q17', 'q18', 'q19'],
      5: ['q20', 'q21', 'q22', 'q23'],
      6: ['q25', 'q26', 'q28'], // Q27, Q29 optional
      7: [], // All optional (faith section)
      8: ['q33', 'q34'],
    };

    const requiredQuestions = sectionQuestionMap[sectionNumber] || [];
    
    // Actually validate content, not just check Set membership
    const invalidQuestions = requiredQuestions.filter(q => {
      const error = validateQuestion(q);
      const isInvalid = error !== undefined;
      return isInvalid;
    });
    
    if (invalidQuestions.length > 0) {
      return {
        isValid: false,
        error: `Please complete ${invalidQuestions.length} required question${invalidQuestions.length > 1 ? 's' : ''} with valid answers`,
      };
    }

    return { isValid: true };
  }, [validateQuestion]);

  // Navigate to section - no validation
  const goToSection = useCallback((sectionNumber: number) => {
    if (sectionNumber >= 1 && sectionNumber <= 8) {
    setCurrentSection(sectionNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Step navigation - simple boundary checks, no validation
  const canGoNext = useCallback(() => {
    return currentSection < 8;
  }, [currentSection]);

  const canGoPrevious = useCallback(() => {
    return currentSection > 1;
  }, [currentSection]);

  const goToNextStep = useCallback((): boolean => {
    if (currentSection < 8) {
      setCurrentSection(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    }
    
    return false;
  }, [currentSection]);

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
        `questionnaire_section_${clientId}`,
        currentSection.toString()
      );
      setSaveStatus('saved');
      setIsDraft(true);
    } catch (error) {
      console.error('[MANUAL-SAVE] ❌ Failed to save draft:', error);
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
    q24: 'brand_assets',
    q25: 'transformation_story',
    q26: 'measurable_results',
    q27: 'credentials',
    q28: 'guarantees',
    q29: 'proof_assets',
    q30: 'faith_preference',
    q31: 'faith_mission',
    q32: 'biblical_principles',
    q33: 'annual_revenue',
    q34: 'primary_goal',
  };
  return keyMap[questionId] || '';
}

// Helper function to get question value from formData
function getQuestionValue(questionId: string, formData: QuestionnaireData): string | string[] {
  const key = `${questionId}_${getQuestionKey(questionId)}`;
  
  // Skip file upload questions - they don't need validation
  if (questionId === 'q24' || questionId === 'q29') return '';
  
  // Use exact matching to avoid q10 matching q1, q11 matching q1, etc.
  if (questionId === 'q1' || questionId === 'q2' || 
      questionId === 'q3' || questionId === 'q4' || 
      questionId === 'q5') {
    const value = (formData.avatar_definition as Record<string, string | string[]>)[key] || '';
    return value;
  } else if (questionId === 'q6' || questionId === 'q7' || 
             questionId === 'q8' || questionId === 'q9' || 
             questionId === 'q10') {
    return (formData.dream_outcome as Record<string, string>)[key] || '';
  } else if (questionId === 'q11' || questionId === 'q12' || 
             questionId === 'q13' || questionId === 'q14' || 
             questionId === 'q15') {
    return (formData.problems_obstacles as Record<string, string>)[key] || '';
  } else if (questionId === 'q16' || questionId === 'q17' || 
             questionId === 'q18' || questionId === 'q19') {
    return (formData.solution_methodology as Record<string, string>)[key] || '';
  } else if (questionId === 'q20' || questionId === 'q21' || 
             questionId === 'q22' || questionId === 'q23') {
    const value = (formData.brand_voice as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : '';
  } else if (questionId === 'q25' || questionId === 'q26' || 
             questionId === 'q27' || questionId === 'q28') {
    const value = (formData.proof_transformation as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : '';
  } else if (questionId === 'q30' || questionId === 'q31' || 
             questionId === 'q32') {
    return (formData.faith_integration as Record<string, string>)[key] || '';
  } else if (questionId === 'q33' || questionId === 'q34') {
    const value = (formData.business_metrics as Record<string, string>)[key] || '';
    return value;
  }
  
  return '';
}
