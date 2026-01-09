// ============================================
// DYNAMIC QUESTIONNAIRE TYPES
// Flexible types that work with ANY database-driven questions
// ============================================

import type { SectionConfig, QuestionConfig } from './questions-config';

// ===== UPLOADED FILE TYPE =====
// Used for file upload questions

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  file?: File;
}

// ===== RESPONSE VALUE TYPES =====
// All possible values a question response can have

export interface FileUploadValue {
  url: string;
  name: string;
  size: number;
  type: string;
}

/**
 * Response values can be:
 * - string: Text responses (short-text, long-text, multiple-choice single select)
 * - string[]: Multi-select responses (checkbox)
 * - UploadedFile[]: File upload responses
 * - null: No response yet
 */
export type QuestionResponseValue = 
  | string 
  | string[] 
  | UploadedFile[] 
  | FileUploadValue 
  | null;

// ===== DYNAMIC QUESTIONNAIRE DATA =====
// Flexible structure: section keys map to question responses

/**
 * QuestionnaireData is now dynamic - any section key can contain any question ID.
 * This allows the database to define the structure, not hardcoded types.
 * 
 * Example structure:
 * {
 *   "avatar_definition": {
 *     "q1_ideal_customer": "My ideal customer is...",
 *     "q2_avatar_criteria": ["criterion1", "criterion2"]
 *   },
 *   "dream_outcome": {
 *     "q6_dream_outcome": "Their dream is..."
 *   }
 * }
 */
export interface QuestionnaireData {
  [sectionKey: string]: {
    [questionId: string]: QuestionResponseValue;
  };
}

// ===== STATUS TYPES =====

export type FormStatus = 'idle' | 'saved' | 'saving' | 'error';

export type QuestionnaireStatus = 'not_started' | 'in_progress' | 'completed';

// ===== HELPER FUNCTIONS =====

/**
 * Build an empty questionnaire structure from config.
 * Creates the correct nested structure with default values based on question types.
 * 
 * @param sections - Array of section configs from database
 * @param questions - Array of question configs from database
 * @returns Empty QuestionnaireData with proper structure
 */
export function buildEmptyQuestionnaire(
  sections: SectionConfig[],
  questions: QuestionConfig[]
): QuestionnaireData {
  const data: QuestionnaireData = {};
  
  for (const section of sections) {
    if (!section.enabled) continue;
    
    data[section.key] = {};
    const sectionQuestions = questions.filter(
      q => q.sectionId === section.id && q.enabled
    );
    
    for (const question of sectionQuestions) {
      // Set default value based on question type
      if (question.type === 'checkbox') {
        data[section.key][question.id] = [];
      } else if (question.type === 'file-upload') {
        data[section.key][question.id] = [];
      } else {
        data[section.key][question.id] = '';
      }
    }
  }
  
  return data;
}

/**
 * Check if a question is required based on config (not hardcoded list).
 * 
 * @param questionId - The question ID to check (e.g., "q1_ideal_customer")
 * @param questions - Array of question configs from database
 * @returns true if question is required, false otherwise
 */
export function isQuestionRequired(
  questionId: string,
  questions: QuestionConfig[]
): boolean {
  const question = questions.find(q => q.id === questionId);
  return question?.required ?? false;
}

/**
 * Check if a question is required by key (e.g., "q1").
 * 
 * @param questionKey - The question key to check (e.g., "q1")
 * @param questions - Array of question configs from database
 * @returns true if question is required, false otherwise
 */
export function isQuestionRequiredByKey(
  questionKey: string,
  questions: QuestionConfig[]
): boolean {
  const question = questions.find(q => q.key === questionKey);
  return question?.required ?? false;
}

/**
 * Get all required question IDs from config.
 * Use this instead of the old hardcoded REQUIRED_QUESTIONS array.
 * 
 * @param questions - Array of question configs from database
 * @returns Array of required question IDs
 */
export function getRequiredQuestionIds(questions: QuestionConfig[]): string[] {
  return questions
    .filter(q => q.required && q.enabled)
    .map(q => q.id);
}

/**
 * Get all required question keys from config.
 * Use this instead of the old hardcoded REQUIRED_QUESTIONS array.
 * 
 * @param questions - Array of question configs from database
 * @returns Array of required question keys (e.g., ["q1", "q2", ...])
 */
export function getRequiredQuestionKeys(questions: QuestionConfig[]): string[] {
  return questions
    .filter(q => q.required && q.enabled)
    .map(q => q.key);
}

/**
 * Get all optional question IDs from config.
 * 
 * @param questions - Array of question configs from database
 * @returns Array of optional question IDs
 */
export function getOptionalQuestionIds(questions: QuestionConfig[]): string[] {
  return questions
    .filter(q => !q.required && q.enabled)
    .map(q => q.id);
}

/**
 * Get all optional question keys from config.
 * 
 * @param questions - Array of question configs from database
 * @returns Array of optional question keys
 */
export function getOptionalQuestionKeys(questions: QuestionConfig[]): string[] {
  return questions
    .filter(q => !q.required && q.enabled)
    .map(q => q.key);
}

/**
 * Get a flattened view of all question responses from nested QuestionnaireData.
 * Useful for forms that work with flat key-value pairs.
 * 
 * @param data - Nested QuestionnaireData
 * @returns Flat record of questionId -> value
 */
export function flattenQuestionnaireData(
  data: QuestionnaireData
): Record<string, QuestionResponseValue> {
  const flat: Record<string, QuestionResponseValue> = {};
  
  for (const sectionKey of Object.keys(data)) {
    const section = data[sectionKey];
    if (section && typeof section === 'object') {
      for (const questionId of Object.keys(section)) {
        flat[questionId] = section[questionId];
      }
    }
  }
  
  return flat;
}

/**
 * Get a specific question's value from QuestionnaireData.
 * Handles the nested section -> question structure.
 * 
 * @param data - The questionnaire data
 * @param questionId - The question ID to look for
 * @param sections - Section configs to know where to look
 * @param questions - Question configs to find section mapping
 * @returns The question's value or null if not found
 */
export function getQuestionValue(
  data: QuestionnaireData,
  questionId: string,
  sections: SectionConfig[],
  questions: QuestionConfig[]
): QuestionResponseValue {
  const question = questions.find(q => q.id === questionId);
  if (!question) return null;
  
  const section = sections.find(s => s.id === question.sectionId);
  if (!section) return null;
  
  return data[section.key]?.[questionId] ?? null;
}

/**
 * Set a specific question's value in QuestionnaireData.
 * Returns a new object (immutable update).
 * 
 * @param data - The current questionnaire data
 * @param sectionKey - The section key (e.g., "avatar_definition")
 * @param questionId - The question ID (e.g., "q1_ideal_customer")
 * @param value - The new value
 * @returns Updated QuestionnaireData
 */
export function setQuestionValue(
  data: QuestionnaireData,
  sectionKey: string,
  questionId: string,
  value: QuestionResponseValue
): QuestionnaireData {
  return {
    ...data,
    [sectionKey]: {
      ...data[sectionKey],
      [questionId]: value,
    },
  };
}
