# Config-Driven Questionnaire System

## Overview

The questionnaire system has been refactored to be **100% config-driven**. All 34 questions and 8 sections are now defined in a single configuration file, making it trivial to:

- ✅ Enable/disable questions
- ✅ Enable/disable entire sections  
- ✅ Edit question text
- ✅ Reorder questions
- ✅ Change validation rules
- ✅ Update help content
- ✅ Add new questions

All existing functionality has been **preserved**:
- Auto-save to localStorage
- Progress tracking
- Server action submission
- Validation
- Help panel
- File uploads
- Conditional logic (Q30 → Q31/Q32)
- Navigation
- Review page

---

## Core Files

### 1. `/lib/questionnaire/questions-config.ts`
**The single source of truth for all questions and sections.**

Contains:
- `sections[]` - 8 section configs with titles, descriptions, time estimates
- `questions[]` - All 34 question configs with validation, help content, and options
- Helper functions for querying enabled/visible questions

**Example: Disable Faith Integration section**
```typescript
{
  id: 7,
  key: "faith_integration",
  title: "Faith Integration",
  description: "Optional: Define how faith integrates with your business",
  estimatedMinutes: 3,
  enabled: false,  // 👈 Just toggle this!
}
```

**Example: Disable individual question**
```typescript
{
  id: "q13_philosophical_problems",
  key: "q13",
  sectionId: 3,
  order: 13,
  text: "What philosophical problems exist?",
  type: "long-text",
  required: false,
  enabled: false,  // 👈 Just toggle this!
  // ...
}
```

### 2. `/components/questionnaire/question-renderer.tsx`
Universal question renderer that supports all question types:
- `long-text` - Textarea with min/max length
- `short-text` - Input field  
- `multiple-choice` - Single selection
- `checkbox` - Multiple selection
- `file-upload` - File upload with validation

### 3. `/components/questionnaire/section-renderer.tsx`
Renders all questions for a section dynamically from config. Handles:
- Conditional question display
- Progress calculation
- Help panel integration

### 4. `/lib/questionnaire/dynamic-validation.ts`
Generates Zod validation schemas dynamically from question configs. No more hardcoded validation!

### 5. `/components/questionnaire/help-system/config-help-content.tsx`
Reads help content directly from question config instead of separate help file.

---

## Key Features

### 1. **Dynamic Section/Question Counts**
The system automatically adapts to enabled sections:
- Progress indicators show correct counts
- Navigation only shows enabled sections  
- Completion calculation excludes disabled questions

### 2. **Conditional Logic**
Questions can show/hide based on other answers:

```typescript
{
  id: "q31_faith_mission",
  key: "q31",
  // ...
  conditionalOn: {
    questionId: "q30_faith_preference",
    notEquals: "separate"  // Only show if Q30 ≠ "separate"
  }
}
```

### 3. **Validation from Config**
Each question defines its own validation:

```typescript
{
  id: "q1_ideal_customer",
  type: "long-text",
  required: true,
  minLength: 50,
  maxLength: 1000,
  // ...
}
```

The system automatically generates Zod schemas and validates accordingly.

### 4. **Help Content in Config**
All help content lives with the question definition:

```typescript
{
  id: "q1_ideal_customer",
  // ...
  helpTitle: "Who is your IDEAL customer?",
  helpWhereToFind: [
    "Your CRM → Filter by highest lifetime value",
    "Accounting software → Who paid on time",
  ],
  helpHowToExtract: [
    "Pull top 10 customers by revenue",
    "Circle 3-4 you'd want 100 more of",
  ],
  helpGoodExample: "Service-based business owners making $1M-$10M...",
  helpWeakExample: "Small business owners who need marketing help.",
  helpQuickTip: "If you can't name 3 specific people, it's too vague."
}
```

---

## How to Use

### Enable/Disable a Section

Open `/lib/questionnaire/questions-config.ts` and toggle:

```typescript
{
  id: 7,
  key: "faith_integration",
  enabled: false,  // 👈 Set to false to hide entire section
}
```

**Result**: Section 7 disappears from navigation, progress, and stepper.

### Enable/Disable a Question

```typescript
{
  id: "q13_philosophical_problems",
  key: "q13",
  enabled: false,  // 👈 Set to false to hide this question
}
```

**Result**: Question is skipped, not counted in progress, not validated.

### Edit Question Text

```typescript
{
  id: "q1_ideal_customer",
  text: "Who is your IDEAL customer? Be specific.",  // 👈 Edit this
  placeholder: "Business owners making $1M-$10M...",  // 👈 And this
}
```

### Change Validation

```typescript
{
  id: "q1_ideal_customer",
  required: true,        // 👈 Make optional
  minLength: 50,        // 👈 Change minimum
  maxLength: 1000,      // 👈 Change maximum
}
```

### Reorder Questions

Change the `order` field (must be unique):

```typescript
{
  id: "q2_avatar_criteria",
  order: 1,  // 👈 Move Q2 before Q1
}
{
  id: "q1_ideal_customer",
  order: 2,  // 👈 Move Q1 after Q2
}
```

### Add a New Question

Add to the `questions[]` array:

```typescript
{
  id: "q35_new_question",
  key: "q35",
  sectionId: 8,
  order: 35,
  text: "Your new question text?",
  type: "long-text",
  required: true,
  enabled: true,
  minLength: 20,
  maxLength: 500,
  placeholder: "Type your answer...",
  helpTitle: "Help title",
  helpWhereToFind: ["Guidance 1", "Guidance 2"],
  helpQuickTip: "A helpful tip"
}
```

---

## Helper Functions

```typescript
// Get all enabled sections
const sections = getEnabledSections();

// Get all questions for a section
const questions = getQuestionsForSection(sectionId);

// Check if question should show (handles conditional logic)
const isVisible = shouldShowQuestion(questionId, formData);

// Get visible questions (respects conditionals + enabled)
const visible = getVisibleQuestions(formData);

// Find question by ID or key
const question = getQuestionById("q1_ideal_customer");
const question2 = getQuestionByKey("q1");
```

---

## Migration Notes

### Old Section Components (Deprecated)

The following components are deprecated but kept for reference:
- `/components/questionnaire/sections/avatar-definition-section.tsx`
- `/components/questionnaire/sections/dream-outcome-section.tsx`
- `/components/questionnaire/sections/problems-obstacles-section.tsx`
- `/components/questionnaire/sections/solution-methodology-section.tsx`
- `/components/questionnaire/sections/brand-voice-section.tsx`
- `/components/questionnaire/sections/proof-transformation-section.tsx`
- `/components/questionnaire/sections/faith-integration-section.tsx`
- `/components/questionnaire/sections/business-metrics-section.tsx`

All marked with `@deprecated` comments. These can be safely deleted after confirming the new system works.

### Data Structure (Unchanged)

The form data structure remains the same:
```typescript
{
  avatar_definition: {
    q1_ideal_customer: "...",
    q2_avatar_criteria: ["..."],
    // ...
  },
  dream_outcome: { /*...*/ },
  // ...
}
```

This ensures backward compatibility with existing saved data and server actions.

---

## Testing Checklist

- [x] All 34 questions render correctly
- [x] Disabled questions don't show
- [x] Disabled sections don't show
- [x] Validation works per question config
- [x] Help panel shows config-driven content
- [x] Conditional logic works (Q30 → Q31/Q32)
- [x] Progress calculates based on enabled questions only
- [x] Auto-save still works
- [x] Submit still works
- [x] Navigation respects enabled sections
- [x] File upload questions work
- [x] Multiple choice questions work
- [x] Checkbox questions work

---

## Example: Disable Faith Section

**Before:**
```
Sections: 1, 2, 3, 4, 5, 6, 7, 8 (8 total)
Questions: Q1-Q34 (34 total)
Progress: 27/27 required questions
```

**After setting `enabled: false` for section 7:**
```
Sections: 1, 2, 3, 4, 5, 6, 8 (7 total)
Questions: Q1-Q29, Q33-Q34 (31 total)
Progress: 27/27 required questions
```

The system automatically:
- Removes section 7 from stepper
- Skips Q30, Q31, Q32
- Recalculates progress
- Updates "Step X of Y" counters

---

## Benefits

1. **Single Source of Truth**: All questions in one file
2. **Zero Code Changes**: Enable/disable without touching components
3. **Easy Maintenance**: Update text, validation, help in one place
4. **Flexible**: Add/remove/reorder questions trivially
5. **Type-Safe**: Full TypeScript support
6. **Testable**: Pure config with helper functions
7. **Scalable**: Easy to add new question types

---

## Future Enhancements

Possible additions:
- Question dependencies (show Q5 only if Q3 === "yes")
- Multi-step conditional chains
- Dynamic question generation from API
- A/B testing different question flows
- Question templates/presets
- Import/export question configs
- Visual config editor UI

---

## Support

For questions or issues with the config system:
1. Check `/lib/questionnaire/questions-config.ts` for examples
2. Review `/components/questionnaire/question-renderer.tsx` for question types
3. See `/lib/questionnaire/dynamic-validation.ts` for validation rules
4. Reference deprecated section components for migration examples

