// ============================================
// CONFIG-DRIVEN QUESTIONNAIRE SYSTEM
// Database-backed configuration
// ============================================

// ===== TYPE DEFINITIONS =====

export type QuestionType = 'long-text' | 'short-text' | 'multiple-choice' | 'checkbox' | 'file-upload';

export interface QuestionOption {
  value: string;
  label: string;
}

export interface QuestionConfig {
  id: string;                    // e.g., "q1_ideal_customer"
  key: string;                   // e.g., "q1" (for backward compat)
  sectionId: number;
  order: number;
  text: string;
  type: QuestionType;
  required: boolean;
  enabled: boolean;
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
  helpTitle?: string;
  helpWhereToFind?: string[];
  helpHowToExtract?: string[];
  helpGoodExample?: string;
  helpWeakExample?: string;
  helpQuickTip?: string;
  options?: QuestionOption[];    // For multiple-choice/checkbox
  acceptedFileTypes?: string[];  // For file-upload
  maxFileSize?: number;          // In MB
  maxFiles?: number;             // For file-upload
  fileDescription?: string;      // Description for file upload
  conditionalOn?: {              // Show only if another question has specific value
    questionId: string;
    notEquals?: string;
    equals?: string;
  };
}

export interface SectionConfig {
  id: number;
  key: string;                   // e.g., "avatar_definition"
  title: string;
  description: string;
  estimatedMinutes: number;
  enabled: boolean;
}

export interface QuestionHelp {
  id: number;
  questionId: string;
  title?: string;
  whereToFind?: string[];
  howToExtract?: string[];
  goodExample?: string;
  weakExample?: string;
  quickTip?: string;
}

// ============================================
// DATABASE QUERY FUNCTIONS
// ============================================

/**
 * Re-export server actions for convenience.
 * These functions query the database and should be called from server components.
 * For client components, use useQuestionnaireConfig() hook instead.
 */
export { 
  getSections,
  getEnabledSections,
  getQuestions,
  getQuestionsWithHelp,
  updateSection,
  updateQuestion,
  updateHelp,
  toggleSection,
  toggleQuestion,
  reorderSections,
  reorderQuestions
} from '@/app/actions/questionnaire-config';

// ============================================
// CLIENT-SAFE UTILITY FUNCTIONS
// ============================================

/**
 * Get questions for a specific section from pre-fetched data.
 * This is a pure function that works with already-loaded data.
 */
export function getQuestionsForSection(
  questions: QuestionConfig[],
  sectionId: number
): QuestionConfig[] {
  return questions
    .filter(q => q.sectionId === sectionId && q.enabled)
    .sort((a, b) => a.order - b.order);
}

/**
 * Get a specific question by ID from pre-fetched data.
 */
export function getQuestionById(
  questions: QuestionConfig[],
  questionId: string
): QuestionConfig | undefined {
  return questions.find(q => q.id === questionId);
}

/**
 * Get a specific question by key from pre-fetched data.
 */
export function getQuestionByKey(
  questions: QuestionConfig[],
  questionKey: string
): QuestionConfig | undefined {
  return questions.find(q => q.key === questionKey);
}

/**
 * Get section by ID from pre-fetched data.
 */
export function getSectionById(
  sections: SectionConfig[],
  sectionId: number
): SectionConfig | undefined {
  return sections.find(s => s.id === sectionId);
}

/**
 * Get section by key from pre-fetched data.
 */
export function getSectionByKey(
  sections: SectionConfig[],
  sectionKey: string
): SectionConfig | undefined {
  return sections.find(s => s.key === sectionKey);
}

/**
 * Filter enabled sections from pre-fetched data.
 */
export function filterEnabledSections(sections: SectionConfig[]): SectionConfig[] {
  return sections
    .filter(s => s.enabled)
    .sort((a, b) => a.id - b.id);
}

/**
 * Filter enabled questions from pre-fetched data.
 */
export function filterEnabledQuestions(
  questions: QuestionConfig[],
  enabledSectionIds: number[]
): QuestionConfig[] {
  return questions
    .filter(q => q.enabled && enabledSectionIds.includes(q.sectionId))
    .sort((a, b) => a.sectionId - b.sectionId || a.order - b.order);
}

/**
 * Calculate total estimated time for sections.
 */
export function getTotalEstimatedTime(sections: SectionConfig[]): number {
  return sections
    .filter(s => s.enabled)
    .reduce((total, s) => total + (s.estimatedMinutes || 5), 0);
}

/**
 * Check if a question should be shown based on conditional logic.
 */
export function shouldShowQuestion(
  question: QuestionConfig,
  formData: Record<string, unknown>,
  sectionEnabled: boolean = true
): boolean {
  if (!question.enabled || !sectionEnabled) return false;
  
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
}

/**
 * Get the next enabled section ID after the current one.
 */
export function getNextEnabledSectionId(
  sections: SectionConfig[],
  currentSectionId: number
): number | null {
  const enabledSections = filterEnabledSections(sections);
  const currentIndex = enabledSections.findIndex(s => s.id === currentSectionId);
  
  if (currentIndex === -1 || currentIndex === enabledSections.length - 1) {
    return null;
  }
  
  return enabledSections[currentIndex + 1].id;
}

/**
 * Get the previous enabled section ID before the current one.
 */
export function getPreviousEnabledSectionId(
  sections: SectionConfig[],
  currentSectionId: number
): number | null {
  const enabledSections = filterEnabledSections(sections);
  const currentIndex = enabledSections.findIndex(s => s.id === currentSectionId);
  
  if (currentIndex <= 0) {
    return null;
  }
  
  return enabledSections[currentIndex - 1].id;
}

/**
 * Check if a section is the last enabled section.
 */
export function isLastEnabledSection(
  sections: SectionConfig[],
  sectionId: number
): boolean {
  const enabledSections = filterEnabledSections(sections);
  return enabledSections[enabledSections.length - 1]?.id === sectionId;
}

/**
 * Check if a section is the first enabled section.
 */
export function isFirstEnabledSection(
  sections: SectionConfig[],
  sectionId: number
): boolean {
  const enabledSections = filterEnabledSections(sections);
  return enabledSections[0]?.id === sectionId;
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate a question answer against its configuration.
 */
export function validateQuestionAnswer(
  question: QuestionConfig,
  answer: unknown
): { valid: boolean; error?: string } {
  if (question.required) {
    if (answer === undefined || answer === null || answer === '') {
      return { valid: false, error: 'This field is required' };
    }
    
    if (Array.isArray(answer) && answer.length === 0) {
      return { valid: false, error: 'Please select at least one option' };
    }
  }
  
  if (typeof answer === 'string') {
    if (question.minLength && answer.length < question.minLength) {
      return { 
        valid: false, 
        error: `Minimum ${question.minLength} characters required` 
      };
    }
    
    if (question.maxLength && answer.length > question.maxLength) {
      return { 
        valid: false, 
        error: `Maximum ${question.maxLength} characters allowed` 
      };
    }
  }
  
  return { valid: true };
}

/**
 * Validate all required questions in a section.
 */
export function validateSectionAnswers(
  questions: QuestionConfig[],
  formData: Record<string, unknown>,
  sectionId: number
): { valid: boolean; errors: Record<string, string> } {
  const sectionQuestions = getQuestionsForSection(questions, sectionId);
  const errors: Record<string, string> = {};
  
  for (const question of sectionQuestions) {
    // Skip conditional questions that shouldn't be shown
    if (!shouldShowQuestion(question, formData)) {
      continue;
    }
    
    const answer = formData[question.key];
    const validation = validateQuestionAnswer(question, answer);
    
    if (!validation.valid && validation.error) {
      errors[question.key] = validation.error;
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}
