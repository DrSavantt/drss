# Server-Side Validation Implementation

**Date:** December 11, 2024 (Updated: January 8, 2026)  
**Feature:** Dynamic Zod validation from database config  
**Priority:** High (identified in audit report)

---

## Architecture

### Before (Hardcoded - Removed)
```typescript
// OLD: lib/questionnaire/validation-schemas.ts (DELETED)
import { questionSchemas } from '@/lib/questionnaire/validation-schemas';
```
- 34 hardcoded Zod schemas (q1Schema through q34Schema)
- Required code changes to add/modify questions
- No sync with database configuration

### After (Dynamic - Current)
```typescript
// NEW: lib/questionnaire/dynamic-validation.ts
import { 
  generateQuestionKeySchemaMap, 
  shouldValidateQuestion,
  type DbQuestionConfig 
} from '@/lib/questionnaire/dynamic-validation';
```
- Schemas generated dynamically from database
- Adding/removing questions in database automatically updates validation
- Conditional logic read from database config

---

## Changes Made

### 1. Modified `app/actions/questionnaire.ts`

#### New Import (Dynamic Validation)
```typescript
import { 
  generateQuestionKeySchemaMap, 
  shouldValidateQuestion,
  type DbQuestionConfig 
} from '@/lib/questionnaire/dynamic-validation';
```

#### Updated Validation Function
```typescript
function validateQuestionnaireData(
  data: QuestionnaireData,
  questions: DbQuestionConfig[]  // Now accepts DB config
): {
  isValid: boolean;
  errors: Record<string, string>;
}
```

**Key Features:**
- Fetches question config from database
- Generates Zod schemas dynamically
- Uses conditional logic from database configuration
- Skips file upload fields (validated separately)
- Returns detailed error messages per field

#### Database Fetch Before Validation
```typescript
// Fetch questions config from database for dynamic validation
const { data: questionsData } = await supabase
  .from('questionnaire_questions')
  .select('question_key, type, required, enabled, min_length, max_length, conditional_on')
  .order('section_id, sort_order');

const questions = (questionsData || []) as DbQuestionConfig[];

// Validate questionnaire data before saving using dynamic schemas
const validation = validateQuestionnaireData(data, questions);
```

### 2. Added to `lib/questionnaire/dynamic-validation.ts`

#### New Type for Database Format
```typescript
export interface DbQuestionConfig {
  question_key: string;
  type: 'long-text' | 'short-text' | 'multiple-choice' | 'checkbox' | 'file-upload';
  required: boolean;
  enabled: boolean;
  min_length?: number | null;
  max_length?: number | null;
  conditional_on?: { questionId: string; notEquals?: string; equals?: string } | null;
}
```

#### New Functions
```typescript
// Generate schema from database question config
export function generateSchemaFromDbQuestion(question: DbQuestionConfig): z.ZodTypeAny

// Generate map of questionKey → schema (replaces hardcoded questionSchemas)
export function generateQuestionKeySchemaMap(questions: DbQuestionConfig[]): Record<string, z.ZodSchema>

// Validate single question by key
export function validateQuestionByKey(questions: DbQuestionConfig[], questionKey: string, value: unknown): string | null

// Check if question should be validated based on conditional logic
export function shouldValidateQuestion(question: DbQuestionConfig, formData: Record<string, unknown>): boolean
```

### 3. Deleted `lib/questionnaire/validation-schemas.ts`
- Removed 215 lines of hardcoded schemas
- All functionality now in dynamic-validation.ts

---

## Validation Rules (Now Database-Driven)

### Question Types Supported
| Type | Validation |
|------|------------|
| `long-text` | min_length, max_length from DB |
| `short-text` | min_length, max_length from DB |
| `multiple-choice` | Requires selection if required |
| `checkbox` | Requires at least one selection if required |
| `file-upload` | Skipped (validated separately) |

### Conditional Logic
Stored in `conditional_on` column:
```json
{
  "questionId": "q30_faith_preference",
  "notEquals": "separate"
}
```
- Questions with unmet conditions are skipped during validation
- Supports both `equals` and `notEquals` conditions

---

## Benefits of Dynamic Approach

### Configuration Changes
| Before | After |
|--------|-------|
| Edit TypeScript file | Update database |
| Redeploy application | Instant effect |
| Developer required | Admin can modify |

### Maintenance
| Before | After |
|--------|-------|
| 34 hardcoded schemas | 0 hardcoded schemas |
| Duplicate logic | Single source of truth |
| Manual sync required | Automatic sync |

### Flexibility
| Before | After |
|--------|-------|
| Fixed question count | Unlimited questions |
| Hardcoded limits | Database-configurable |
| Code changes needed | Database updates only |

---

## Testing

### Manual Test Cases

#### Test 1: Submit with Missing Required Field
**Steps:**
1. Fill out questionnaire
2. Leave Q1 empty (required)
3. Try to submit

**Expected:**
```
1 validation error found:

q1_ideal_customer: Please provide at least 20 characters
```

#### Test 2: Conditional Question Skip
**Steps:**
1. Set Q30 (Faith Preference) to "separate"
2. Leave Q31 and Q32 empty
3. Submit

**Expected:** Success (Q31/Q32 skipped due to conditional logic)

#### Test 3: Too Short Text
**Steps:**
1. Enter "test" in Q1 (needs min_length from DB)
2. Submit

**Expected:** Validation error with character count from database

---

## Security Benefits

- ✅ Validates all data server-side
- ✅ Enforces database-defined length limits
- ✅ Prevents database corruption
- ✅ Protects against client manipulation
- ✅ Respects conditional logic

---

## Files Changed

| File | Change |
|------|--------|
| `app/actions/questionnaire.ts` | Updated to use dynamic validation |
| `lib/questionnaire/dynamic-validation.ts` | Added DB format functions |
| `lib/questionnaire/validation-schemas.ts` | **DELETED** |

---

**Implementation Complete ✅**  
Server-side validation now uses database configuration for all validation rules.
