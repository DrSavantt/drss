'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { QuestionnaireData, FormStatus, UploadedFile, buildEmptyQuestionnaire } from './types';
import type { 
  SectionConfig,
  QuestionConfig
} from './questions-config';
import { 
  validateQuestion as dynamicValidateQuestion,
  calculateProgress,
  getVisibleRequiredQuestionKeys
} from './dynamic-validation';
import { useQuestionnaireConfigOptional } from './questionnaire-config-context';
import { debounce } from '@/lib/utils';
import { setStorageItem, getStorageItem, removeStorageItem } from '@/lib/utils/async-storage';

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
  // New config-aware helpers
  enabledSections: { id: number; title: string; key: string }[];
  isLastSection: boolean;
  isFirstSection: boolean;
  // Auto-save features
  lastSaved: Date | null;
  saveNow: () => Promise<void>;
  submitQuestionnaire: () => Promise<{ success: boolean; data?: any; error?: string }>;
}

export function useQuestionnaireForm(
  clientId: string, 
  existingData?: QuestionnaireData | null,
  isEditMode: boolean = false
): UseQuestionnaireFormReturn {
  // Try to get config from context (if within provider)
  const contextConfig = useQuestionnaireConfigOptional();
  
  // Require context - throw error if not available
  if (!contextConfig) {
    throw new Error('useQuestionnaireForm must be used within a QuestionnaireConfigProvider');
  }
  
  // Create wrapper functions using context
  const getEnabledSectionsLive = useCallback(() => {
    return contextConfig.getEnabledSections();
  }, [contextConfig]);
  
  const getQuestionByKeyLive = useCallback((key: string) => {
    return contextConfig.getQuestionByKey(key);
  }, [contextConfig]);
  
  const getQuestionsForSectionLive = useCallback((sectionId: number) => {
    return contextConfig.getQuestionsForSection(sectionId);
  }, [contextConfig]);
  
  const shouldShowQuestionLive = useCallback((questionId: string, formData: Record<string, unknown>) => {
    return contextConfig.shouldShowQuestion(questionId, formData);
  }, [contextConfig]);
  
  const isLastEnabledSectionLive = useCallback((sectionId: number) => {
    return contextConfig.isLastEnabledSection(sectionId);
  }, [contextConfig]);
  
  const isFirstEnabledSectionLive = useCallback((sectionId: number) => {
    return contextConfig.isFirstEnabledSection(sectionId);
  }, [contextConfig]);
  
  const getNextEnabledSectionIdLive = useCallback((sectionId: number) => {
    return contextConfig.getNextEnabledSectionId(sectionId);
  }, [contextConfig]);
  
  const getPreviousEnabledSectionIdLive = useCallback((sectionId: number) => {
    return contextConfig.getPreviousEnabledSectionId(sectionId);
  }, [contextConfig]);

  // ============================================
  // STATE DECLARATIONS
  // ============================================
  
  // Initialize with empty object - will be populated when config loads or from existing data
  const [formData, setFormData] = useState<QuestionnaireData>(() => {
    // If we have existing data, use it
    if (existingData && Object.keys(existingData).length > 0) {
      return existingData;
    }
    // Otherwise start with empty object - will be initialized when config loads
    return {};
  });
  const [currentSection, setCurrentSection] = useState(1); // Will be updated in useEffect to first enabled section
  const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState<FormStatus>('saved');
  const [isDraft, setIsDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Track if we've already restored from localStorage to prevent multiple restorations
  const hasRestoredRef = useRef(false);
  // Track if we've initialized with existing data in edit mode
  const hasInitializedEditDataRef = useRef(false);
  // Track if we've loaded from server
  const hasLoadedFromServerRef = useRef(false);

  // ============================================
  // AUTO-SAVE TO SERVER FUNCTIONS
  // ============================================
  
  /**
   * Check if questionnaire data has any meaningful answers (not just empty strings)
   */
  const hasContent = useCallback((data: QuestionnaireData): boolean => {
    // Check if any section has any non-empty answers
    return Object.values(data).some(section => {
      if (!section || typeof section !== 'object') return false;
      return Object.values(section).some(answer => {
        if (answer === null || answer === undefined || answer === '') return false;
        if (Array.isArray(answer) && answer.length === 0) return false;
        if (typeof answer === 'object' && !Array.isArray(answer) && Object.keys(answer).length === 0) return false;
        return true;
      });
    });
  }, []);

  /**
   * Save to server (auto-save draft)
   * SANITIZED: Only saves if there's actual content to prevent {} in database
   */
  const saveToServer = useCallback(async (data: QuestionnaireData) => {
    if (!clientId) return;
    if (isEditMode) return; // Don't auto-save in edit mode
    
    // Skip if data is empty object
    if (Object.keys(data).length === 0) return;
    
    // IMPORTANT: Skip if there's no actual content
    // This prevents saving {} or forms with only empty strings
    if (!hasContent(data)) {
      return;
    }
    
    setSaveStatus('saving');
    try {
      const response = await fetch('/api/questionnaire-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          response_data: data
        })
      });
      
      if (!response.ok) throw new Error('Save failed');
      
      const result = await response.json();
      
      // If server skipped the save, don't update lastSaved
      if (result.action === 'skipped') {
        setSaveStatus('idle');
        return;
      }
      
      setSaveStatus('saved');
      setLastSaved(new Date());
      
      // Reset to idle after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Auto-save to server failed:', error);
      setSaveStatus('error');
      // Don't throw - let localStorage backup work
    }
  }, [clientId, isEditMode, hasContent]);

  /**
   * Debounced server save (5 seconds)
   */
  const debouncedServerSave = useMemo(
    () => debounce(saveToServer, 5000),
    [saveToServer]
  );

  /**
   * Load existing response from server
   */
  const loadFromServer = useCallback(async () => {
    if (!clientId) return;
    if (isEditMode) return; // Edit mode loads from existingData prop
    if (hasLoadedFromServerRef.current) return;
    
    try {
      const response = await fetch(`/api/questionnaire-response/${clientId}/latest`);
      if (!response.ok) return; // No existing response, that's okay
      
      const { data } = await response.json();
      
      if (data?.response_data && data.status === 'draft') {
        // Load draft from server
        setFormData(data.response_data);
        setIsDraft(true);
        
        // Mark completed questions
        const completed = new Set<string>();
        const checkSection = (sectionData: Record<string, unknown>) => {
          Object.entries(sectionData).forEach(([key, value]) => {
            const match = key.match(/^(q\d+)_/);
            if (match) {
              const questionId = match[1];
              if (value && (typeof value === 'string' ? value.trim() !== '' : Array.isArray(value) ? value.length > 0 : false)) {
                completed.add(questionId);
              }
            }
          });
        };
        
        Object.values(data.response_data).forEach((section: any) => {
          if (section && typeof section === 'object') {
            checkSection(section as Record<string, unknown>);
          }
        });
        
        setCompletedQuestions(completed);
        hasLoadedFromServerRef.current = true;
        hasRestoredRef.current = true; // Skip localStorage restore
      }
    } catch (error) {
      console.error('Failed to load from server:', error);
      // Continue with localStorage/empty form if server load fails
    }
  }, [clientId, isEditMode]);

  /**
   * Submit questionnaire (finalize draft)
   */
  const submitQuestionnaire = useCallback(async () => {
    if (!clientId) return { success: false, error: 'No client ID' };
    
    // First save current state to ensure latest data is on server
    await saveToServer(formData);
    
    try {
      const response = await fetch(`/api/questionnaire-response/${clientId}/submit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submitted_by: 'admin' })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Submit failed');
      }
      
      const { data } = await response.json();
      
      // Clear localStorage draft (async, non-blocking)
      await removeStorageItem(`questionnaire_draft_${clientId}`);
      await removeStorageItem(`questionnaire_completed_${clientId}`);
      await removeStorageItem(`questionnaire_section_${clientId}`);
      
      setIsDraft(false);
      
      return { success: true, data };
    } catch (error) {
      console.error('Submit failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to submit questionnaire' 
      };
    }
  }, [clientId, formData, saveToServer]);

  // Get enabled sections from config (live from database if context available)
  const enabledSections = getEnabledSectionsLive().map(s => ({
    id: s.id,
    title: s.title,
    key: s.key
  }));

  // Check section position (using live config)
  const isLastSection = isLastEnabledSectionLive(currentSection);
  const isFirstSection = isFirstEnabledSectionLive(currentSection);

  // Sync currentSection with database config when it loads
  useEffect(() => {
    if (contextConfig && contextConfig.isLoaded && !hasRestoredRef.current) {
      const dbEnabledSections = contextConfig.getEnabledSections();
      
      // Check if current section is still valid in database config
      const isCurrentSectionValid = dbEnabledSections.some(s => s.id === currentSection);
      
      if (!isCurrentSectionValid && dbEnabledSections.length > 0) {
        setCurrentSection(dbEnabledSections[0].id);
      }
    }
  }, [contextConfig, currentSection]);

  // Initialize empty questionnaire structure when config loads (if no existing data)
  const hasInitializedEmptyFormRef = useRef(false);
  useEffect(() => {
    if (contextConfig && contextConfig.isLoaded && !hasInitializedEmptyFormRef.current) {
      // Only initialize if formData is empty and we don't have existing data
      if (Object.keys(formData).length === 0 && !existingData) {
        const emptyForm = buildEmptyQuestionnaire(
          contextConfig.sections,
          contextConfig.questions
        );
        setFormData(emptyForm);
        hasInitializedEmptyFormRef.current = true;
      }
    }
  }, [contextConfig, formData, existingData]);

  // Initialize with existing data in edit mode (takes priority over localStorage)
  useEffect(() => {
    if (isEditMode && existingData && !hasInitializedEditDataRef.current) {
      setFormData(existingData);
      
      // Mark all questions that have values as completed
      const completed = new Set<string>();
      const checkSection = (sectionData: Record<string, unknown>) => {
        if (!sectionData || typeof sectionData !== 'object') return;
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
      
      // Dynamically iterate through all sections in existingData
      Object.values(existingData).forEach(sectionData => {
        checkSection(sectionData as Record<string, unknown>);
      });
      
      setCompletedQuestions(completed);
      hasInitializedEditDataRef.current = true;
      hasRestoredRef.current = true; // Skip localStorage restore since we have existing data
    }
  }, [isEditMode, existingData]);

  // Load from server on mount (takes priority over localStorage)
  useEffect(() => {
    loadFromServer();
  }, [loadFromServer]);

  // Restore from localStorage on mount (only for create mode, not edit mode)
  // This runs after server load, so it acts as a fallback
  useEffect(() => {
    async function restoreDraft() {
      // Skip restore if we just cleared (reset button was clicked)
      if (sessionStorage.getItem('skipRestore') === 'true') {
        sessionStorage.removeItem('skipRestore');
        hasRestoredRef.current = true;
        return;
      }
      
      // Skip if in edit mode, already restored, or loaded from server
      if (isEditMode || hasRestoredRef.current || hasLoadedFromServerRef.current) {
        return;
      }
      
      try {
        const draftKey = `questionnaire_draft_${clientId}`;
        const completedKey = `questionnaire_completed_${clientId}`;
        const sectionKey = `questionnaire_section_${clientId}`;
        
        // Restore formData (async)
        const savedDraft = await getStorageItem<QuestionnaireData>(draftKey);
        if (savedDraft) {
          setFormData(savedDraft);
          setIsDraft(true);
        }
          
        // Restore completedQuestions (async)
        const savedCompleted = await getStorageItem<string[]>(completedKey);
        if (savedCompleted) {
          setCompletedQuestions(new Set(savedCompleted));
        }

        // Restore current section (ensure it's an enabled section) (async)
        const savedSection = await getStorageItem<string>(sectionKey);
        if (savedSection) {
          const sectionNum = parseInt(savedSection, 10);
          const enabled = getEnabledSectionsLive();
          const isEnabled = enabled.some(s => s.id === sectionNum);
          if (isEnabled) {
            setCurrentSection(sectionNum);
          }
        }
        
        // Mark as restored so this never runs again
        hasRestoredRef.current = true;
        
      } catch (error) {
        console.error('[RESTORE] ❌ FAILED:', error);
      }
    }
    
    restoreDraft();
  }, [clientId, isEditMode, getEnabledSectionsLive]); // Still depends on clientId, but ref prevents multiple runs

  // Auto-save to server (debounced) when form data changes
  useEffect(() => {
    if (Object.keys(formData).length > 0 && !isEditMode) {
      debouncedServerSave(formData);
    }
    
    // Cleanup: cancel pending debounced save on unmount
    return () => {
      debouncedServerSave.cancel();
    };
  }, [formData, debouncedServerSave, isEditMode]);

  // Auto-save to localStorage - async, debounced to prevent blocking
  useEffect(() => {
    if (!formData) {
      return;
    }

    // Debounce auto-save to avoid excessive localStorage writes
    const saveTimer = setTimeout(async () => {
      try {
        const draftKey = `questionnaire_draft_${clientId}`;
        const completedKey = `questionnaire_completed_${clientId}`;
        const sectionKey = `questionnaire_section_${clientId}`;
        
        // Save formData (async, non-blocking)
        await setStorageItem(draftKey, formData);
        
        // Save completedQuestions (async, non-blocking)
        await setStorageItem(completedKey, Array.from(completedQuestions));
        
        // Save current section (async, non-blocking)
        await setStorageItem(sectionKey, String(currentSection));
        
        setSaveStatus('saved');
        setIsDraft(true);
      } catch (error) {
        console.error('[AUTO-SAVE] ❌ FAILED:', error);
        setSaveStatus('error');
      }
    }, 1000); // 1 second debounce for localStorage

    return () => clearTimeout(saveTimer);
  }, [formData, completedQuestions, currentSection, clientId]);

  // Save when component unmounts or user navigates away
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Save immediately before page closes/navigates
      // Note: We use sync version here because beforeunload needs to be synchronous
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
      // Final save on unmount - async to avoid blocking
      setStorageItem(`questionnaire_draft_${clientId}`, formData);
      setStorageItem(`questionnaire_completed_${clientId}`, Array.from(completedQuestions));
      setStorageItem(`questionnaire_section_${clientId}`, currentSection.toString());
    };
  }, [formData, completedQuestions, currentSection, clientId]);

  // Calculate progress using config-based helper
  const progress = useCallback(() => {
    // Convert formData to flat structure for conditional logic checks
    const flatFormData: Record<string, unknown> = {};
    Object.entries(formData).forEach(([sectionKey, sectionData]) => {
      Object.entries(sectionData as Record<string, unknown>).forEach(([key, value]) => {
        flatFormData[key] = value;
      });
    });
    
    return calculateProgress(
      contextConfig.questions,
      contextConfig.sections,
      completedQuestions,
      flatFormData
    );
  }, [completedQuestions, formData, contextConfig]);

  // Update question value - dynamically looks up section from config
  const updateQuestion = useCallback((questionId: string, value: string | string[] | UploadedFile[]) => {
    setFormData(prev => {
      // Get the question config to find the full key and section (use live config)
      const question = getQuestionByKeyLive(questionId);
      if (!question) {
        console.warn(`Question not found in config: ${questionId}`);
        return prev;
      }
      
      // Find the section for this question
      const section = contextConfig.sections.find(s => s.id === question.sectionId);
      if (!section) {
        console.warn(`Section not found for question: ${questionId}`);
        return prev;
      }
      
      const fullKey = question.id; // e.g., "q1_ideal_customer"
      const sectionKey = section.key; // e.g., "avatar_definition"
      
      // Update dynamically using section key from config
      return {
        ...prev,
        [sectionKey]: {
          ...(prev[sectionKey] || {}),
          [fullKey]: value
        }
      };
    });
  }, [getQuestionByKeyLive, contextConfig.sections]);

  // Validate question using dynamic validation
  const validateQuestion = useCallback((questionId: string): string | undefined => {
    // Get the value from formData (use live config)
    const question = getQuestionByKeyLive(questionId);
    if (!question) return undefined;
    
    const value = getQuestionValue(questionId, formData, getQuestionByKeyLive, contextConfig.sections);
    const error = dynamicValidateQuestion(contextConfig.questions, questionId, value);
    return error || undefined;
  }, [formData, getQuestionByKeyLive, contextConfig]);

  // Mark question as completed - no validation gate
  const markQuestionCompleted = useCallback((questionId: string) => {
    setCompletedQuestions(prev => new Set(prev).add(questionId));
  }, []);

  // Validate entire section - uses config-based question list (live from database)
  const validateSection = useCallback((sectionNumber: number): { isValid: boolean; error?: string } => {
    const sectionQuestions = getQuestionsForSectionLive(sectionNumber);
    
    // Get required questions that are visible
    const flatFormData: Record<string, unknown> = {};
    Object.entries(formData).forEach(([, sectionData]) => {
      Object.entries(sectionData as Record<string, unknown>).forEach(([key, value]) => {
        flatFormData[key] = value;
      });
    });
    
    const requiredQuestions = sectionQuestions.filter(q => 
      q.required && shouldShowQuestionLive(q.id, flatFormData)
    );
    
    // Validate each required question
    const invalidQuestions = requiredQuestions.filter(q => {
      const error = validateQuestion(q.key);
      return error !== undefined;
    });
    
    if (invalidQuestions.length > 0) {
      return {
        isValid: false,
        error: `Please complete ${invalidQuestions.length} required question${invalidQuestions.length > 1 ? 's' : ''} with valid answers`,
      };
    }

    return { isValid: true };
  }, [validateQuestion, formData, getQuestionsForSectionLive, shouldShowQuestionLive]);

  // Navigate to section - validates it's an enabled section (live from database)
  const goToSection = useCallback((sectionNumber: number) => {
    const enabled = getEnabledSectionsLive();
    const isEnabled = enabled.some(s => s.id === sectionNumber);
    if (isEnabled) {
      setCurrentSection(sectionNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [getEnabledSectionsLive]);

  // Step navigation - uses config to find next/previous enabled section (live from database)
  const canGoNext = useCallback(() => {
    return !isLastEnabledSectionLive(currentSection);
  }, [currentSection, isLastEnabledSectionLive]);

  const canGoPrevious = useCallback(() => {
    return !isFirstEnabledSectionLive(currentSection);
  }, [currentSection, isFirstEnabledSectionLive]);

  const goToNextStep = useCallback((): boolean => {
    const nextSectionId = getNextEnabledSectionIdLive(currentSection);
    if (nextSectionId !== null) {
      setCurrentSection(nextSectionId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    }
    return false;
  }, [currentSection, getNextEnabledSectionIdLive]);

  const goToPreviousStep = useCallback(() => {
    const prevSectionId = getPreviousEnabledSectionIdLive(currentSection);
    if (prevSectionId !== null) {
      setCurrentSection(prevSectionId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentSection, getPreviousEnabledSectionIdLive]);

  // Manual save
  const manualSave = useCallback(async () => {
    try {
      setSaveStatus('saving');
      
      await setStorageItem(`questionnaire_draft_${clientId}`, formData);
      await setStorageItem(`questionnaire_completed_${clientId}`, Array.from(completedQuestions));
      await setStorageItem(`questionnaire_section_${clientId}`, currentSection.toString());
      
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
    enabledSections,
    isLastSection,
    isFirstSection,
    // Auto-save features
    lastSaved,
    saveNow: () => saveToServer(formData),
    submitQuestionnaire,
  };
}

// Helper function to get question value from formData using question key
// Now uses dynamic section lookup from config instead of hardcoded section IDs
function getQuestionValue(
  questionKey: string, 
  formData: QuestionnaireData,
  getQuestionByKeyFn: (key: string) => QuestionConfig | undefined,
  sections?: SectionConfig[]
): string | string[] {
  const question = getQuestionByKeyFn(questionKey);
  if (!question) return '';
  
  const fullKey = question.id;
  
  // Skip file upload questions - they don't need validation
  if (question.type === 'file-upload') return '';
  
  // Find section key dynamically
  const section = sections?.find(s => s.id === question.sectionId);
  if (!section) {
    // Fallback: try to find section data by iterating through formData
    for (const sectionData of Object.values(formData)) {
      if (sectionData && typeof sectionData === 'object' && fullKey in sectionData) {
        const value = (sectionData as Record<string, unknown>)[fullKey];
        if (typeof value === 'string') return value;
        if (Array.isArray(value)) return value as string[];
        return '';
      }
    }
    return '';
  }
  
  // Get value from the section using dynamic key
  const sectionData = formData[section.key];
  if (!sectionData) return '';
  
  const value = sectionData[fullKey];
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.every(v => typeof v === 'string')) return value as string[];
  return '';
}
