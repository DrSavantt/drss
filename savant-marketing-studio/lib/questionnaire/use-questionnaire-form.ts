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

export function useQuestionnaireForm(clientId: string): UseQuestionnaireFormReturn {
  const [formData, setFormData] = useState<QuestionnaireData>(EMPTY_QUESTIONNAIRE_DATA);
  const [currentSection, setCurrentSection] = useState(1);
  const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState<FormStatus>('saved');
  const [isDraft, setIsDraft] = useState(false);
  
  // Track if we've already restored from localStorage to prevent multiple restorations
  const hasRestoredRef = useRef(false);

  // Restore from localStorage on mount
  useEffect(() => {
    // Only restore once on true initial mount
    if (hasRestoredRef.current) {
      console.log('[RESTORE] Skipping - already restored');
      return;
    }

    console.log('[RESTORE] First mount - checking localStorage for draft, clientId:', clientId);
    
    try {
      const draftKey = `questionnaire_draft_${clientId}`;
      const completedKey = `questionnaire_completed_${clientId}`;
      const sectionKey = `questionnaire_section_${clientId}`;
      
      // Restore formData
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        console.log('[RESTORE] ✓ Found draft, restoring formData:', Object.keys(parsed));
        setFormData(parsed);
        setIsDraft(true);
      } else {
        console.log('[RESTORE] No draft found');
      }
        
      // Restore completedQuestions
      const savedCompleted = localStorage.getItem(completedKey);
      if (savedCompleted) {
        const parsed = JSON.parse(savedCompleted);
        console.log('[RESTORE] ✓ Found completedQuestions:', parsed);
        setCompletedQuestions(new Set(parsed));
        }

      // Restore current section
      const savedSection = localStorage.getItem(sectionKey);
      if (savedSection) {
        const sectionNum = parseInt(savedSection, 10);
        console.log('[RESTORE] ✓ Found saved section:', sectionNum);
        setCurrentSection(sectionNum);
      }
      
      // Mark as restored so this never runs again
      hasRestoredRef.current = true;
      console.log('[RESTORE] ✓ Restoration complete, will not run again');
      
      } catch (error) {
      console.error('[RESTORE] ❌ FAILED:', error);
    }
  }, [clientId]); // Still depends on clientId, but ref prevents multiple runs

  // Auto-save to localStorage - immediate, no debounce
  useEffect(() => {
    if (!formData) {
      console.log('[AUTO-SAVE] Skipping - no formData');
      return;
    }

    console.log('[AUTO-SAVE] Saving formData to localStorage:', {
      clientId,
      formDataKeys: Object.keys(formData),
      timestamp: new Date().toISOString()
    });

    try {
      const draftKey = `questionnaire_draft_${clientId}`;
      const completedKey = `questionnaire_completed_${clientId}`;
      
      // Save formData
      localStorage.setItem(draftKey, JSON.stringify(formData));
      console.log('[AUTO-SAVE] ✓ FormData saved to', draftKey);
      
      // Save completedQuestions
      localStorage.setItem(completedKey, JSON.stringify(Array.from(completedQuestions)));
      console.log('[AUTO-SAVE] ✓ CompletedQuestions saved to', completedKey);
      
      // Save current section
      localStorage.setItem(`questionnaire_section_${clientId}`, String(currentSection));
      console.log('[AUTO-SAVE] ✓ Current section saved:', currentSection);
      
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
    console.log(`[updateQuestion] ${questionId}:`, { value, type: typeof value });
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
                 questionId === 'q33') {
        const key = getQuestionKey(questionId);
        updated.brand_voice = {
          ...updated.brand_voice,
          [`${questionId}_${key}`]: value as string | UploadedFile[]
        };
      } else if (questionId === 'q24' || questionId === 'q25' || 
                 questionId === 'q26' || questionId === 'q27' ||
                 questionId === 'q34') {
        const key = getQuestionKey(questionId);
        updated.proof_transformation = {
          ...updated.proof_transformation,
          [`${questionId}_${key}`]: value as string | UploadedFile[]
        };
      } else if (questionId === 'q28' || questionId === 'q29' || 
                 questionId === 'q30') {
        const key = getQuestionKey(questionId);
        updated.faith_integration = {
          ...updated.faith_integration,
          [`${questionId}_${key}`]: value as string
        };
      } else if (questionId === 'q31' || questionId === 'q32') {
        const key = getQuestionKey(questionId);
        updated.business_metrics = {
          ...updated.business_metrics,
          [`${questionId}_${key}`]: value as string
        };
      }

      console.log(`[updateQuestion] Updated formData for ${questionId}:`, updated);
      return updated;
    });
  }, []);

  // Validate question
  const validateQuestion = useCallback((questionId: string): string | undefined => {
    const schema = questionSchemas[questionId];
    if (!schema) {
      console.log(`[validateQuestion] No schema found for ${questionId}`);
      return undefined;
    }

    // Get the value from formData
    const value = getQuestionValue(questionId, formData);
    const valueStr = Array.isArray(value) ? `Array[${value.length}]` : `"${value}"`;
    const valueLen = typeof value === 'string' ? value.length : Array.isArray(value) ? value.length : 'N/A';
    console.log(`[validateQuestion] ${questionId}: value=${valueStr}, length=${valueLen}`);

    try {
      schema.parse(value);
      console.log(`[validateQuestion] ${questionId}: VALID ✓`);
      return undefined;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errors' in error) {
        const zodError = error as { errors: Array<{ message: string }> };
        const errorMsg = zodError.errors?.[0]?.message || 'Invalid input';
        console.log(`[validateQuestion] ${questionId}: INVALID ✗ - ${errorMsg}`);
        console.error('Full Zod error:', error);
        return errorMsg;
      }
      console.log(`[validateQuestion] ${questionId}: INVALID ✗ (unknown error)`);
      console.error('Unknown validation error:', error);
      return 'Invalid input';
    }
  }, [formData]);

  // Mark question as completed - no validation gate
  const markQuestionCompleted = useCallback((questionId: string) => {
    console.log(`[markQuestionCompleted] Marking ${questionId} as complete (no validation)`);
    setCompletedQuestions(prev => new Set(prev).add(questionId));
  }, []);

  // Validate entire section - actually validates content, not just Set membership
  const validateSection = useCallback((sectionNumber: number): { isValid: boolean; error?: string } => {
    console.log(`[validateSection] Validating section ${sectionNumber}`);
    const sectionQuestionMap: Record<number, string[]> = {
      1: ['q1', 'q2', 'q3', 'q4', 'q5'],
      2: ['q6', 'q7', 'q8', 'q9', 'q10'],
      3: ['q11', 'q12', 'q14', 'q15'], // Q13 optional
      4: ['q16', 'q17', 'q18', 'q19'],
      5: ['q20', 'q21', 'q22', 'q23'],
      6: ['q24', 'q25', 'q27'], // Q26 optional
      7: [], // All optional (faith section)
      8: ['q31', 'q32'],
    };

    const requiredQuestions = sectionQuestionMap[sectionNumber] || [];
    console.log(`[validateSection] Required questions for section ${sectionNumber}:`, requiredQuestions);
    
    // Actually validate content, not just check Set membership
    const invalidQuestions = requiredQuestions.filter(q => {
      const error = validateQuestion(q);
      const isInvalid = error !== undefined;
      console.log(`[validateSection]   ${q}: ${isInvalid ? 'INVALID ✗' : 'VALID ✓'}`);
      return isInvalid;
    });

    console.log(`[validateSection] Section ${sectionNumber} invalid questions:`, invalidQuestions);
    
    if (invalidQuestions.length > 0) {
      return {
        isValid: false,
        error: `Please complete ${invalidQuestions.length} required question${invalidQuestions.length > 1 ? 's' : ''} with valid answers`,
      };
    }

    console.log(`[validateSection] Section ${sectionNumber}: VALID ✓`);
    return { isValid: true };
  }, [validateQuestion]);

  // Navigate to section - no validation
  const goToSection = useCallback((sectionNumber: number) => {
    console.log('[goToSection] Navigating to section:', sectionNumber);
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
    console.log('[goToNextStep] Called, current section:', currentSection);
    
    if (currentSection < 8) {
      console.log('[goToNextStep] Moving to section:', currentSection + 1);
      setCurrentSection(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    }
    
    console.log('[goToNextStep] Already on last section');
    return false;
  }, [currentSection]);

  const goToPreviousStep = useCallback(() => {
    console.log('[goToPreviousStep] Called, current section:', currentSection);
    if (currentSection > 1) {
      console.log('[goToPreviousStep] Moving to section:', currentSection - 1);
      setCurrentSection(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      console.log('[goToPreviousStep] Already on first section');
    }
  }, [currentSection]);

  // Manual save
  const manualSave = useCallback(() => {
    console.log('[MANUAL-SAVE] User clicked Save Draft button');
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
      console.log('[MANUAL-SAVE] ✓ Manual save completed successfully');
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
  console.log(`[getQuestionValue] ${questionId} → key: ${key}`);
  
  // Skip file upload questions - they don't need validation
  if (questionId === 'q33' || questionId === 'q34') return '';
  
  // Use exact matching to avoid q10 matching q1, q11 matching q1, etc.
  if (questionId === 'q1' || questionId === 'q2' || 
      questionId === 'q3' || questionId === 'q4' || 
      questionId === 'q5') {
    const value = (formData.avatar_definition as Record<string, string | string[]>)[key] || '';
    console.log(`[getQuestionValue] ${questionId} found in avatar_definition[${key}]:`, value);
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
  } else if (questionId === 'q24' || questionId === 'q25' || 
             questionId === 'q26' || questionId === 'q27') {
    const value = (formData.proof_transformation as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : '';
  } else if (questionId === 'q28' || questionId === 'q29' || 
             questionId === 'q30') {
    return (formData.faith_integration as Record<string, string>)[key] || '';
  } else if (questionId === 'q31' || questionId === 'q32') {
    const value = (formData.business_metrics as Record<string, string>)[key] || '';
    console.log(`[getQuestionValue] ${questionId} found in business_metrics:`, value);
    return value;
  }
  
  console.log(`[getQuestionValue] ${questionId}: NO MATCH, returning empty string`);
  return '';
}
