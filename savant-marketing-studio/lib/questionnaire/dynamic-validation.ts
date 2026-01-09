import { z } from 'zod';
import type { 
  QuestionConfig,
  SectionConfig
} from './questions-config';
import { 
  getQuestionById as utilGetQuestionById,
  getQuestionByKey as utilGetQuestionByKey,
  shouldShowQuestion as utilShouldShowQuestion,
  filterEnabledQuestions
} from './questions-config';

// ============================================
// DATABASE FORMAT TYPES (snake_case from DB)
// ============================================

export interface DbQuestionConfig {
  question_key: string;
  type: 'long-text' | 'short-text' | 'multiple-choice' | 'checkbox' | 'file-upload';
  required: boolean;
  enabled: boolean;
  min_length?: number | null;
  max_length?: number | null;
  conditional_on?: { questionId: string; notEquals?: string; equals?: string } | null;
}

/**
 * Generate a Zod schema for a single question based on its config
 */
export function generateQuestionSchema(question: QuestionConfig): z.ZodTypeAny {
  switch (question.type) {
    case 'long-text':
    case 'short-text': {
      let schema = z.string();
      
      if (question.required && question.minLength && question.minLength > 0) {
        schema = schema.min(
          question.minLength, 
          `Please provide at least ${question.minLength} characters`
        );
      } else if (question.required) {
        schema = schema.min(1, 'This field is required');
      }
      
      if (question.maxLength) {
        schema = schema.max(
          question.maxLength, 
          `Please keep under ${question.maxLength} characters`
        );
      }
      
      return question.required ? schema : schema.optional();
    }
    
    case 'multiple-choice': {
      const baseSchema = z.string();
      return question.required 
        ? baseSchema.min(1, 'Please select an option')
        : baseSchema.optional();
    }
    
    case 'checkbox': {
      const baseSchema = z.array(z.string());
      return question.required
        ? baseSchema.min(1, 'Please select at least one option')
        : baseSchema.optional();
    }
    
    case 'file-upload': {
      // File uploads are typically optional and validated separately
      return z.array(z.any()).optional();
    }
    
    default:
      return z.any();
  }
}

/**
 * Generate a full Zod schema for all enabled questions
 * @param questions - Pre-fetched questions array
 * @param sections - Pre-fetched sections array (to check if section is enabled)
 */
export function generateFullSchema(
  questions: QuestionConfig[],
  sections: SectionConfig[]
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};
  const enabledSectionIds = sections.filter(s => s.enabled).map(s => s.id);
  
  filterEnabledQuestions(questions, enabledSectionIds).forEach(question => {
    shape[question.id] = generateQuestionSchema(question);
  });
  
  return z.object(shape);
}

/**
 * Validate a single question's value
 * Returns error message or null if valid
 * @param questions - Pre-fetched questions array
 * @param questionId - Question ID or key
 * @param value - Value to validate
 */
export function validateQuestion(
  questions: QuestionConfig[],
  questionId: string, 
  value: unknown
): string | null {
  // Try to find by ID first, then by key
  let question = utilGetQuestionById(questions, questionId);
  if (!question) {
    question = utilGetQuestionByKey(questions, questionId);
  }
  if (!question) return null;
  
  // Skip validation for disabled questions
  if (!question.enabled) return null;
  
  const schema = generateQuestionSchema(question);
  const result = schema.safeParse(value);
  
  if (!result.success) {
    return result.error.errors[0]?.message || 'Invalid value';
  }
  
  return null;
}

/**
 * Validate all questions for a section
 * Returns object with question IDs as keys and error messages as values
 * @param questions - Pre-fetched questions array
 * @param sections - Pre-fetched sections array
 * @param sectionId - Section ID to validate
 * @param formData - Current form data
 */
export function validateSection(
  questions: QuestionConfig[],
  sections: SectionConfig[],
  sectionId: number, 
  formData: Record<string, unknown>
): Record<string, string> {
  const errors: Record<string, string> = {};
  const section = sections.find(s => s.id === sectionId);
  const sectionEnabled = section?.enabled ?? true;
  
  const enabledSectionIds = sections.filter(s => s.enabled).map(s => s.id);
  
  filterEnabledQuestions(questions, enabledSectionIds)
    .filter(q => q.sectionId === sectionId)
    .filter(q => utilShouldShowQuestion(q, formData, sectionEnabled))
    .forEach(question => {
      const value = formData[question.id];
      const error = validateQuestion(questions, question.id, value);
      if (error) {
        errors[question.id] = error;
      }
    });
  
  return errors;
}

/**
 * Validate the entire questionnaire
 * Returns object with question IDs as keys and error messages as values
 * @param questions - Pre-fetched questions array
 * @param sections - Pre-fetched sections array
 * @param formData - Current form data
 */
export function validateFullQuestionnaire(
  questions: QuestionConfig[],
  sections: SectionConfig[],
  formData: Record<string, unknown>
): Record<string, string> {
  const errors: Record<string, string> = {};
  const enabledSectionIds = sections.filter(s => s.enabled).map(s => s.id);
  
  filterEnabledQuestions(questions, enabledSectionIds)
    .filter(q => {
      const section = sections.find(s => s.id === q.sectionId);
      return utilShouldShowQuestion(q, formData, section?.enabled ?? true);
    })
    .forEach(question => {
      const value = formData[question.id];
      const error = validateQuestion(questions, question.id, value);
      if (error) {
        errors[question.id] = error;
      }
    });
  
  return errors;
}

/**
 * Check if a section is valid (all required questions answered)
 * @param questions - Pre-fetched questions array
 * @param sections - Pre-fetched sections array
 * @param sectionId - Section ID to check
 * @param formData - Current form data
 */
export function isSectionValid(
  questions: QuestionConfig[],
  sections: SectionConfig[],
  sectionId: number, 
  formData: Record<string, unknown>
): boolean {
  const errors = validateSection(questions, sections, sectionId, formData);
  return Object.keys(errors).length === 0;
}

/**
 * Check if the entire questionnaire is valid
 * @param questions - Pre-fetched questions array
 * @param sections - Pre-fetched sections array
 * @param formData - Current form data
 */
export function isQuestionnaireValid(
  questions: QuestionConfig[],
  sections: SectionConfig[],
  formData: Record<string, unknown>
): boolean {
  const errors = validateFullQuestionnaire(questions, sections, formData);
  return Object.keys(errors).length === 0;
}

/**
 * Get count of validation errors for a section
 * @param questions - Pre-fetched questions array
 * @param sections - Pre-fetched sections array
 * @param sectionId - Section ID to check
 * @param formData - Current form data
 */
export function getSectionErrorCount(
  questions: QuestionConfig[],
  sections: SectionConfig[],
  sectionId: number, 
  formData: Record<string, unknown>
): number {
  const errors = validateSection(questions, sections, sectionId, formData);
  return Object.keys(errors).length;
}

/**
 * Get required question IDs that are visible (accounting for conditional logic)
 * @param questions - Pre-fetched questions array
 * @param sections - Pre-fetched sections array
 * @param formData - Current form data
 */
export function getVisibleRequiredQuestionIds(
  questions: QuestionConfig[],
  sections: SectionConfig[],
  formData: Record<string, unknown>
): string[] {
  const enabledSectionIds = sections.filter(s => s.enabled).map(s => s.id);
  
  return filterEnabledQuestions(questions, enabledSectionIds)
    .filter(q => q.required)
    .filter(q => {
      const section = sections.find(s => s.id === q.sectionId);
      return utilShouldShowQuestion(q, formData, section?.enabled ?? true);
    })
    .map(q => q.id);
}

/**
 * Get required question keys that are visible (for backward compatibility)
 * @param questions - Pre-fetched questions array
 * @param sections - Pre-fetched sections array
 * @param formData - Current form data
 */
export function getVisibleRequiredQuestionKeys(
  questions: QuestionConfig[],
  sections: SectionConfig[],
  formData: Record<string, unknown>
): string[] {
  const enabledSectionIds = sections.filter(s => s.enabled).map(s => s.id);
  
  return filterEnabledQuestions(questions, enabledSectionIds)
    .filter(q => q.required)
    .filter(q => {
      const section = sections.find(s => s.id === q.sectionId);
      return utilShouldShowQuestion(q, formData, section?.enabled ?? true);
    })
    .map(q => q.key);
}

/**
 * Calculate progress percentage based on completed required questions
 * @param questions - Pre-fetched questions array
 * @param sections - Pre-fetched sections array
 * @param completedQuestionKeys - Set of completed question keys
 * @param formData - Current form data
 */
export function calculateProgress(
  questions: QuestionConfig[],
  sections: SectionConfig[],
  completedQuestionKeys: Set<string>,
  formData: Record<string, unknown>
): number {
  const requiredKeys = getVisibleRequiredQuestionKeys(questions, sections, formData);
  if (requiredKeys.length === 0) return 100;
  
  const answeredCount = requiredKeys.filter(key => 
    completedQuestionKeys.has(key)
  ).length;
  
  return Math.round((answeredCount / requiredKeys.length) * 100);
}

// ============================================
// DATABASE FORMAT VALIDATION (snake_case)
// ============================================
// These functions work directly with database query results
// without requiring transformation to camelCase

/**
 * Generate a Zod schema from a raw database question config (snake_case fields)
 */
export function generateSchemaFromDbQuestion(question: DbQuestionConfig): z.ZodTypeAny {
  switch (question.type) {
    case 'long-text':
    case 'short-text': {
      let schema = z.string();
      
      if (question.required && question.min_length && question.min_length > 0) {
        schema = schema.min(
          question.min_length, 
          `Please provide at least ${question.min_length} characters`
        );
      } else if (question.required) {
        schema = schema.min(1, 'This field is required');
      }
      
      if (question.max_length) {
        schema = schema.max(
          question.max_length, 
          `Please keep under ${question.max_length} characters`
        );
      }
      
      return question.required ? schema : schema.optional();
    }
    
    case 'multiple-choice': {
      const baseSchema = z.string();
      return question.required 
        ? baseSchema.min(1, 'Please select an option')
        : baseSchema.optional();
    }
    
    case 'checkbox': {
      const baseSchema = z.array(z.string());
      return question.required
        ? baseSchema.min(1, 'Please select at least one option')
        : baseSchema.optional();
    }
    
    case 'file-upload': {
      // File uploads are typically optional and validated separately
      return z.array(z.any()).optional();
    }
    
    default:
      return z.any();
  }
}

/**
 * Generate a map of questionKey → schema from database questions
 * This replaces the hardcoded questionSchemas object from validation-schemas.ts
 * 
 * @param questions - Array of questions from database (snake_case format)
 * @returns Record mapping question keys (q1, q2, etc.) to Zod schemas
 */
export function generateQuestionKeySchemaMap(
  questions: DbQuestionConfig[]
): Record<string, z.ZodSchema> {
  return Object.fromEntries(
    questions
      .filter(q => q.enabled)
      .map(q => [q.question_key, generateSchemaFromDbQuestion(q)])
  );
}

/**
 * Validate a single question's value using database config
 * Returns error message or null if valid
 * 
 * @param questions - Array of questions from database
 * @param questionKey - Question key (e.g., "q1", "q2")
 * @param value - Value to validate
 */
export function validateQuestionByKey(
  questions: DbQuestionConfig[],
  questionKey: string,
  value: unknown
): string | null {
  const question = questions.find(q => q.question_key === questionKey);
  if (!question) return null;
  
  // Skip validation for disabled questions
  if (!question.enabled) return null;
  
  const schema = generateSchemaFromDbQuestion(question);
  const result = schema.safeParse(value);
  
  if (!result.success) {
    return result.error.errors[0]?.message || 'Invalid value';
  }
  
  return null;
}

/**
 * Check if a question should be validated based on conditional logic
 * Works with database format (snake_case)
 */
export function shouldValidateQuestion(
  question: DbQuestionConfig,
  formData: Record<string, unknown>
): boolean {
  if (!question.enabled) return false;
  
  if (question.conditional_on) {
    const dependsOnValue = formData[question.conditional_on.questionId];
    
    if (question.conditional_on.notEquals) {
      return dependsOnValue !== question.conditional_on.notEquals && 
             dependsOnValue !== '' && 
             dependsOnValue !== undefined;
    }
    
    if (question.conditional_on.equals) {
      return dependsOnValue === question.conditional_on.equals;
    }
  }
  
  return true;
}
