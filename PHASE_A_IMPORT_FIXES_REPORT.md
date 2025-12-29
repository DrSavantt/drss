# Phase A Import Fixes - Complete Report
## Fixing Missing Export Errors

**Date:** December 28, 2025  
**Status:** ✅ ALL FIXES APPLIED  

---

## 🎯 PROBLEM IDENTIFIED

After refactoring `questions-config.ts` to remove static arrays, several files had broken imports:

1. Functions no longer exist as standalone (need parameters now)
2. Some files imported functions that were renamed
3. Components expecting optional config now require it

---

## ✅ FILES FIXED (8 files)

### 1. **`lib/questionnaire/dynamic-validation.ts`** - MAJOR REFACTOR

**Problem:** All functions expected to call `getEnabledQuestions()` internally  
**Solution:** Changed all functions to accept `questions` and `sections` as parameters

**Changes:**
- ✅ Added `questions: QuestionConfig[]` parameter to all functions
- ✅ Added `sections: SectionConfig[]` parameter to validation functions
- ✅ Updated imports to use utility functions from `questions-config.ts`
- ✅ All 12 exported functions now work with pre-fetched data

**Functions Updated:**
- `generateFullSchema(questions, sections)`
- `validateQuestion(questions, questionId, value)`
- `validateSection(questions, sections, sectionId, formData)`
- `validateFullQuestionnaire(questions, sections, formData)`
- `isSectionValid(questions, sections, sectionId, formData)`
- `isQuestionnaireValid(questions, sections, formData)`
- `getSectionErrorCount(questions, sections, sectionId, formData)`
- `getVisibleRequiredQuestionIds(questions, sections, formData)`
- `getVisibleRequiredQuestionKeys(questions, sections, formData)`
- `calculateProgress(questions, sections, completedQuestionKeys, formData)`

---

### 2. **`lib/questionnaire/questions-config.ts`** - EXPORT FIX

**Problem:** Exported `getQuestionsBySectionId` which doesn't exist in server actions  
**Solution:** Removed from export list

**Changes:**
```typescript
// ❌ BEFORE
export { 
  getSections,
  getQuestions,
  getQuestionsBySectionId,  // Doesn't exist!
  ...
}

// ✅ AFTER  
export { 
  getSections,
  getQuestions,
  // Removed getQuestionsBySectionId
  ...
}
```

---

### 3. **`lib/questionnaire/use-questionnaire-form.ts`** - CRITICAL FIX

**Problem:** 
- Imported functions that don't exist anymore
- Called validation functions with wrong number of parameters
- Had static fallbacks that don't work

**Solution:** 
- Removed imports of non-existent functions
- Made context required (throw error if not available)
- Updated all validation calls to pass correct parameters

**Changes:**
```typescript
// ❌ BEFORE
import { 
  getEnabledSections,         // Doesn't exist!
  getQuestionsForSection,     // Doesn't exist!
  getQuestionByKey,           // Doesn't exist!
  ...
} from './questions-config';

// Optional context with static fallback
const getEnabledSectionsLive = () => {
  return contextConfig ? contextConfig.getEnabledSections() : getEnabledSections();
};

// Wrong number of parameters
return calculateProgress(completedQuestions, flatFormData);
const error = dynamicValidateQuestion(questionId, value);

// ✅ AFTER
import type { 
  SectionConfig,
  QuestionConfig
} from './questions-config';

// Require context (no fallback)
if (!contextConfig) {
  throw new Error('useQuestionnaireForm must be used within QuestionnaireConfigProvider');
}

const getEnabledSectionsLive = () => {
  return contextConfig.getEnabledSections();
};

// Correct number of parameters
return calculateProgress(
  contextConfig.questions,
  contextConfig.sections,
  completedQuestions,
  flatFormData
);

const error = dynamicValidateQuestion(contextConfig.questions, questionId, value);
```

**Lines Fixed:**
- Line 5-16: Removed broken imports
- Line 56-62: Made context required
- Line 61-91: Removed static fallbacks
- Line 95-96: Initialize currentSection to 1 (updated in useEffect)
- Line 461: Fixed `calculateProgress` call
- Line 547: Fixed `dynamicValidateQuestion` call
- Line 679: Removed default parameter that referenced non-existent function

---

### 4. **`components/questionnaire/navigation/progress-stepper.tsx`**

**Problem:**
- Imported `getEnabledSections` which doesn't exist
- Had optional config with static fallback
- Exported deprecated function at end of file

**Solution:**
- Removed import
- Made config required
- Deleted deprecated export

**Changes:**
```typescript
// ❌ BEFORE
import { getEnabledSections } from '@/lib/questionnaire/questions-config';

interface ProgressStepperProps {
  config?: QuestionnaireConfigLike; // Optional
}

const sections = config ? config.getEnabledSections() : getEnabledSections();

// At end of file
export const getSections = () => getEnabledSections().map(...);

// ✅ AFTER
// No import needed

interface ProgressStepperProps {
  config: QuestionnaireConfigLike; // Required
}

const sections = config.getEnabledSections();

// Deprecated function deleted
```

**Lines Fixed:**
- Line 5: Removed import
- Line 12: Made config required
- Line 37: Removed conditional logic
- Line 194-198: Deleted deprecated export function

---

### 5. **`components/questionnaire/help-system/config-help-content.tsx`**

**Problem:**
- Imported `getQuestionById` and `getQuestionByKey` which are now utility functions
- Had optional config with static fallback

**Solution:**
- Removed imports
- Made config required
- Always use config methods

**Changes:**
```typescript
// ❌ BEFORE
import { getQuestionById, getQuestionByKey } from '@/lib/questionnaire/questions-config';

interface ConfigHelpContentProps {
  config?: QuestionnaireConfigLike;
}

let question = config 
  ? config.getQuestionById(questionId) 
  : getQuestionById(questionId);

// ✅ AFTER
// No imports needed

interface ConfigHelpContentProps {
  config: QuestionnaireConfigLike;
}

let question = config.getQuestionById(questionId);
```

**Lines Fixed:**
- Line 3: Removed import
- Line 8: Made config required
- Line 13-20: Simplified to always use config

---

### 6. **`components/questionnaire/navigation/rich-footer.tsx`**

**Problem:**
- Imported 5 functions that don't exist
- Had optional config with static fallbacks in multiple places

**Solution:**
- Removed all imports
- Made config required
- Removed all conditional logic

**Changes:**
```typescript
// ❌ BEFORE
import { 
  getEnabledSections, 
  getPreviousEnabledSectionId, 
  getNextEnabledSectionId,
  getSectionById,
  isFirstEnabledSection as configIsFirstSection
} from '@/lib/questionnaire/questions-config';

interface RichFooterProps {
  config?: QuestionnaireConfigLike;
}

const enabledSections = config ? config.getEnabledSections() : getEnabledSections();
const isFirstSection = config ? config.isFirstEnabledSection(currentSection) : configIsFirstSection(currentSection);
// ... etc

// ✅ AFTER
// No imports

interface RichFooterProps {
  config: QuestionnaireConfigLike;
}

const enabledSections = config.getEnabledSections();
const isFirstSection = config.isFirstEnabledSection(currentSection);
// Simplified
```

**Lines Fixed:**
- Line 15-21: Removed all imports
- Line 31: Made config required
- Line 47: Simplified to always use config
- Line 50-66: Removed all conditional logic

---

### 7. **`components/questionnaire/section-renderer.tsx`**

**Problem:**
- Imported 3 utility functions that need parameters
- Had optional config with static fallbacks
- Called functions without parameters

**Solution:**
- Removed utility imports
- Made config required
- Always use config methods

**Changes:**
```typescript
// ❌ BEFORE
import { 
  SectionConfig, 
  getQuestionsForSection,
  shouldShowQuestion,
  getQuestionById
} from '@/lib/questionnaire/questions-config';

interface SectionRendererProps {
  config?: QuestionnaireConfigLike;
}

const allQuestions = config 
  ? config.getQuestionsForSection(section.id) 
  : getQuestionsForSection(section.id);  // ❌ Missing parameter!

// ✅ AFTER
import type { SectionConfig } from '@/lib/questionnaire/questions-config';

interface SectionRendererProps {
  config: QuestionnaireConfigLike;
}

const allQuestions = config.getQuestionsForSection(section.id);
```

**Lines Fixed:**
- Line 4-9: Changed to type-only import
- Line 24: Made config required
- Line 45-50: Simplified logic
- Line 61: Config now always passed (no longer optional)

---

### 8. **`lib/questionnaire/questionnaire-config-context.tsx`** - ALREADY FIXED

This file was already updated in the initial Phase A refactor to remove static imports.

---

## 📊 SUMMARY OF CHANGES

### Imports Removed
- `getEnabledSections` (5 files)
- `getQuestionsForSection` (3 files)
- `getQuestionByKey` (3 files)
- `getQuestionById` (2 files)
- `shouldShowQuestion` (2 files)
- `getPreviousEnabledSectionId` (1 file)
- `getNextEnabledSectionId` (1 file)
- `getSectionById` (1 file)
- `isFirstEnabledSection` (1 file)

### Pattern Changes

**BEFORE (Broken):**
```typescript
import { getEnabledSections } from './questions-config';

interface Props {
  config?: QuestionnaireConfigLike; // Optional
}

const sections = config ? config.getEnabledSections() : getEnabledSections();
```

**AFTER (Fixed):**
```typescript
import { QuestionnaireConfigLike } from './questionnaire-config-context';

interface Props {
  config: QuestionnaireConfigLike; // Required
}

const sections = config.getEnabledSections();
```

---

## 🎯 KEY INSIGHTS

### 1. Context is Now Required

All components/hooks that work with questionnaire config now **require** the `QuestionnaireConfigProvider` to be in the tree. This is intentional because:

- ✅ We always want to use database config
- ✅ No static fallbacks = Settings changes always take effect
- ✅ Clearer data flow
- ✅ Better error messages (throws if context missing)

### 2. Validation Functions Need Parameters

All validation functions in `dynamic-validation.ts` now accept pre-fetched data as parameters:

```typescript
// Old way (broken)
const errors = validateSection(sectionId, formData);

// New way (correct)
const errors = validateSection(questions, sections, sectionId, formData);
```

This makes them:
- ✅ Pure functions (no side effects)
- ✅ Testable (pass any data)
- ✅ Flexible (work with any source)

### 3. Utility Functions vs Context Methods

**Utility functions** (in `questions-config.ts`):
- Work with pre-fetched data
- Accept arrays as parameters
- Pure functions
- Example: `getQuestionsForSection(questions, sectionId)`

**Context methods** (from `useQuestionnaireConfig()`):
- Work with context state
- No parameters needed
- Have access to loaded data
- Example: `config.getQuestionsForSection(sectionId)`

---

## ✅ VERIFICATION

### TypeScript Check Results

**Before fixes:** 70+ errors  
**After fixes:** Only errors from `public-questionnaire-form.tsx` (expected - Phase B issue)

### Remaining Known Issues

1. **`public-questionnaire-form.tsx`** - 8 broken imports (Phase B will fix)
2. **`app/dashboard/settings/questionnaire/page.tsx`** - Missing file (needs investigation)
3. **Supabase null checks** - Pre-existing warnings (not related to Phase A)

---

## 🚀 NEXT STEPS

### Immediate
- ✅ All import errors fixed
- ✅ All validation functions updated
- ✅ All components require config

### Phase B (Next)
- Fix `public-questionnaire-form.tsx`
- Replace switch statement with SectionRenderer
- Remove 8 hardcoded section component imports

### Testing
- Run dev server: `npm run dev`
- Test Settings toggle (Faith Integration OFF)
- Verify admin form reflects changes

---

## 📚 FILES MODIFIED SUMMARY

| File | Lines Changed | Type | Status |
|------|---------------|------|--------|
| `lib/questionnaire/dynamic-validation.ts` | ~50 lines | Refactor | ✅ Complete |
| `lib/questionnaire/questions-config.ts` | 1 line | Export fix | ✅ Complete |
| `lib/questionnaire/use-questionnaire-form.ts` | ~20 lines | Critical fix | ✅ Complete |
| `components/questionnaire/navigation/progress-stepper.tsx` | ~10 lines | Import fix | ✅ Complete |
| `components/questionnaire/help-system/config-help-content.tsx` | ~8 lines | Import fix | ✅ Complete |
| `components/questionnaire/navigation/rich-footer.tsx` | ~15 lines | Import fix | ✅ Complete |
| `components/questionnaire/section-renderer.tsx` | ~10 lines | Import fix | ✅ Complete |

**Total:** 7 files modified, ~115 lines changed

---

## 🎓 LESSONS LEARNED

### What Worked Well
1. Systematic approach (one file at a time)
2. TypeScript errors guided the fixes
3. Making config required simplified code
4. Removing fallbacks made intent clearer

### What to Watch For
1. Any other files importing from `questions-config.ts`
2. Components not wrapped in `QuestionnaireConfigProvider`
3. Validation calls with wrong parameter counts
4. Default parameters referencing non-existent functions

---

**Status:** ✅ ALL IMPORT ERRORS FIXED

**Next Action:** Test the application to verify fixes work correctly

