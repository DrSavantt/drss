'use client';

import { useState, useEffect, useCallback } from 'react';
import { QuestionnaireData, FormStatus, REQUIRED_QUESTIONS, EMPTY_QUESTIONNAIRE_DATA } from './types';
import { questionSchemas } from './validation-schemas';
import { shouldShowQuestion } from './conditional-logic';

interface UseQuestionnaireFormReturn {
  formData: QuestionnaireData;
  currentSection: number;
  completedQuestions: Set<string>;
  progress: number;
  saveStatus: FormStatus;
  updateQuestion: (questionId: string, value: string | string[]) => void;
  validateQuestion: (questionId: string) => string | undefined;
  markQuestionCompleted: (questionId: string) => void;
  goToSection: (sectionNumber: number) => void;
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
      } catch (error) {
        console.error('Failed to restore draft:', error);
      }
    }
  }, [clientId]);

  // Auto-save to localStorage every 30 seconds
  useEffect(() => {
    if (!formData) return;

    setSaveStatus('saving');
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
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, [formData, completedQuestions, clientId]);

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
  const updateQuestion = useCallback((questionId: string, value: string | string[]) => {
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
                 questionId.startsWith('q22') || questionId.startsWith('q23')) {
        const key = getQuestionKey(questionId);
        updated.brand_voice = {
          ...updated.brand_voice,
          [`${questionId}_${key}`]: value as string
        };
      } else if (questionId.startsWith('q24') || questionId.startsWith('q25') || 
                 questionId.startsWith('q26') || questionId.startsWith('q27')) {
        const key = getQuestionKey(questionId);
        updated.proof_transformation = {
          ...updated.proof_transformation,
          [`${questionId}_${key}`]: value as string
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

  // Navigate to section
  const goToSection = useCallback((sectionNumber: number) => {
    setCurrentSection(sectionNumber);
    const element = document.getElementById(`section-${sectionNumber}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

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
      setSaveStatus('saved');
      setIsDraft(true);
    } catch (error) {
      console.error('Failed to save draft:', error);
      setSaveStatus('error');
    }
  }, [formData, completedQuestions, clientId]);

  return {
    formData,
    currentSection,
    completedQuestions,
    progress: progress(),
    saveStatus,
    updateQuestion,
    validateQuestion,
    markQuestionCompleted,
    goToSection,
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
  };
  return keyMap[questionId] || '';
}

// Helper function to get question value from formData
function getQuestionValue(questionId: string, formData: QuestionnaireData): string | string[] {
  const key = `${questionId}_${getQuestionKey(questionId)}`;
  
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
    return (formData.brand_voice as Record<string, string>)[key] || '';
  } else if (questionId.startsWith('q24') || questionId.startsWith('q25') || 
             questionId.startsWith('q26') || questionId.startsWith('q27')) {
    return (formData.proof_transformation as Record<string, string>)[key] || '';
  } else if (questionId.startsWith('q28') || questionId.startsWith('q29') || 
             questionId.startsWith('q30')) {
    return (formData.faith_integration as Record<string, string>)[key] || '';
  } else if (questionId.startsWith('q31') || questionId.startsWith('q32')) {
    return (formData.business_metrics as Record<string, string>)[key] || '';
  }
  
  return '';
}
