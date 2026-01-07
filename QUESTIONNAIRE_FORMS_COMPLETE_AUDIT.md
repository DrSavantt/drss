# QUESTIONNAIRE FORMS AUDIT - COMPLETE REPORT

**Date:** December 28, 2025  
**Status:** ✅ AUDIT COMPLETE - NO CHANGES MADE  
**Purpose:** Identify ALL questionnaire form implementations, classify OLD vs NEW code, and recommend cleanup strategy

---

## EXECUTIVE SUMMARY

### What I Found:
- **2 Form Entry Points** (Public + Internal)
- **1 Unified Form System** (Database-driven, using SectionRenderer + QuestionRenderer)
- **⚠️ MAJOR ISSUE:** Hardcoded legacy code WITHIN the new system that needs cleanup
- **NO duplicate implementations** - Good news!

### The Problem:
The NEW database-driven form system has **OLD hardcoded remnants** embedded in supporting files. This creates a hybrid system that's 80% modern, 20% legacy.

---

## PART 1: ROUTES FOUND

### ✅ Route 1: Public Client Form
**Path:** `/form/[token]/page.tsx`  
**Lines:** 94  
**Purpose:** Public questionnaire for clients (accessed via email link)  
**Status:** ✨ **NEW - KEEP**

**What It Does:**
- Server component that fetches client by token
- Loads config from database (sections + questions)
- Renders `<PublicQuestionnaireForm>` component
- Shows completion page if already submitted

**Imports:**
```typescript
import { createClient } from '@/lib/supabase/server'
import { PublicQuestionnaireForm } from '@/components/questionnaire/public-questionnaire-form'
import { getSections, getQuestionsWithHelp } from '@/app/actions/questionnaire-config'
```

**Renders:**
```tsx
<PublicQuestionnaireForm 
  client={{ id, name, email, intake_responses, user_id }} 
  token={token}
  sections={enabledSections}
  questions={enabledQuestions}
/>
```

**Classification:** ✨ **NEW** - Database-driven, uses modern architecture

---

### ✅ Route 2: Internal Dashboard Form
**Path:** `/dashboard/clients/onboarding/[id]/page.tsx`  
**Lines:** 400  
**Purpose:** Internal form for staff to fill out questionnaires for clients  
**Status:** ✨ **NEW - KEEP**

**What It Does:**
- Client component with database config context
- Uses `useQuestionnaireConfig()` hook for live database config
- Renders same `<SectionRenderer>` as public form
- Supports create mode AND edit mode
- Auto-saves to server every 5 seconds

**Imports:**
```typescript
import { ProgressStepper } from '@/components/questionnaire/navigation/progress-stepper'
import { RichFooter } from '@/components/questionnaire/navigation/rich-footer'
import { useQuestionnaireForm } from '@/lib/questionnaire/use-questionnaire-form'
import { QuestionnaireReview } from '@/components/questionnaire/review'
import { SectionRenderer } from '@/components/questionnaire/section-renderer'
import { useQuestionnaireConfig } from '@/lib/questionnaire/questionnaire-config-context'
```

**Renders:**
```tsx
<ProgressStepper currentSection={...} config={config} />
<SectionRenderer 
  section={currentSectionConfig}
  formData={flatFormData}
  updateQuestion={updateQuestion}
  config={config}
/>
<RichFooter {...} config={config} />
```

**Classification:** ✨ **NEW** - Database-driven, uses modern architecture

---

### ✅ Route 3: Completion Page
**Path:** `/form/[token]/complete/page.tsx`  
**Lines:** 31  
**Purpose:** Thank you page after form submission  
**Status:** ✨ **NEW - KEEP**

**What It Does:**
- Simple static thank you message
- Shows checkmark icon
- No form logic

**Classification:** ✨ **NEW** - Simple completion page, no issues

---

### ❌ Route 4: Settings Page (NOT A FORM)
**Path:** `/dashboard/settings/questionnaire/page.tsx`  
**Purpose:** Admin settings to configure questionnaire  
**Status:** NOT A FORM - Excluded from audit

---

## PART 2: COMPONENTS FOUND

### Core Form Components (Database-Driven, Clean)

#### ✅ 1. PublicQuestionnaireForm
**Path:** `components/questionnaire/public-questionnaire-form.tsx`  
**Lines:** 521  
**Parent:** `/form/[token]/page.tsx`  
**Status:** ✨ **NEW - KEEP**

**What It Does:**
- Receives sections + questions from database as props
- Manages form state (formData, currentSection, completedQuestions)
- Auto-saves to localStorage + server
- Navigation between sections
- Progress tracking
- Theme toggle (dark/light mode)
- Renders `<SectionRenderer>` for current section

**Key Features:**
- ✅ Database-driven (props passed from server)
- ✅ Uses SectionRenderer
- ✅ Auto-save (localStorage + server debounced 3s)
- ✅ Progress calculation
- ✅ Clean modern UI with animations

**Classification:** ✨ **NEW** - Perfect implementation

---

#### ✅ 2. SectionRenderer
**Path:** `components/questionnaire/section-renderer.tsx`  
**Lines:** 82  
**Used By:** Both public and internal forms  
**Status:** ✨ **NEW - KEEP**

**What It Does:**
- Takes a `SectionConfig` and renders all its questions
- Gets questions from `config.getQuestionsForSection(section.id)`
- Filters visible questions using `config.shouldShowQuestion()`
- Renders each question with `<QuestionRenderer>`
- Manages help panel state

**Code Structure:**
```tsx
<SectionContainer title={...} description={...}>
  {visibleQuestions.map(question => (
    <QuestionRenderer
      question={question}
      value={formData[question.id]}
      onChange={...}
      onHelpClick={...}
    />
  ))}
</SectionContainer>
```

**Classification:** ✨ **NEW** - Database-driven, perfect

---

#### ✅ 3. QuestionRenderer
**Path:** `components/questionnaire/question-renderer.tsx`  
**Lines:** 134  
**Used By:** SectionRenderer  
**Status:** ✨ **NEW - KEEP**

**What It Does:**
- Takes a `QuestionConfig` and renders appropriate input
- Switch statement based on question.type:
  - `long-text` → LongTextQuestion
  - `short-text` → ShortTextQuestion
  - `multiple-choice` → MultipleChoiceQuestion (single)
  - `checkbox` → MultipleChoiceQuestion (multi)
  - `file-upload` → FileUploadQuestion
- Wraps in QuestionWrapper (shows question number, text, help icon)

**Classification:** ✨ **NEW** - Database-driven, perfect

---

### Supporting Components (All Clean)

#### ✅ Question Type Components
**Path:** `components/questionnaire/question-types/`  
**Files:** 
- `long-text-question.tsx`
- `short-text-question.tsx`
- `multiple-choice-question.tsx`
- `file-upload-question.tsx`
- `question-wrapper.tsx`

**Status:** ✨ **NEW - KEEP** - All clean, reusable, type-safe

---

#### ✅ Navigation Components
**Path:** `components/questionnaire/navigation/`  
**Files:**
- `progress-stepper.tsx` - Top progress bar with section pills
- `rich-footer.tsx` - Bottom sticky navigation
- `section-nav.tsx` - Sidebar section navigation (unused?)
- `progress-indicator.tsx` - Old progress component (unused?)
- `step-footer.tsx` - Old footer component (unused?)

**Status:** ✨ **NEW - KEEP** (but some may be unused legacy)

---

#### ✅ Help System Components
**Path:** `components/questionnaire/help-system/`  
**Files:**
- `help-panel.tsx` - Sliding help panel
- `help-trigger.tsx` - Help icon button
- `config-help-content.tsx` - Displays help from database config

**Status:** ✨ **NEW - KEEP** - All clean

---

#### ✅ Section Components
**Path:** `components/questionnaire/sections/`  
**Files:**
- `section-container.tsx` - Wraps section content
- `section-header.tsx` - Section title/description
- `section-header-card.tsx` - Alternative header style

**Status:** ✨ **NEW - KEEP** - All clean

---

### ⚠️ PROBLEM COMPONENTS (Have Hardcoded Legacy Code)

#### ⚠️ 1. QuestionnaireReview
**Path:** `components/questionnaire/review/questionnaire-review.tsx`  
**Lines:** 262  
**Used By:** Internal form (review step before submit)  
**Status:** ⚠️ **NEW but with HARDCODED sections**

**The Problem:**
Lines 148-226 have **HARDCODED section mappings**:

```tsx
<ReviewSectionCard
  sectionNumber={1}
  title="Avatar Definition"
  questions={formData.avatar_definition}
  questionKeys={['q1', 'q2', 'q3', 'q4', 'q5']}
  requiredQuestions={REQUIRED_QUESTIONS}
  completedQuestions={completedQuestions}
  onEdit={() => handleEditSection(1)}
/>

<ReviewSectionCard
  sectionNumber={2}
  title="Dream Outcome & Value Equation"
  questions={formData.dream_outcome}
  questionKeys={['q6', 'q7', 'q8', 'q9', 'q10']}
  ...
/>
// ... 6 more hardcoded sections
```

**Issues:**
- ❌ Hardcoded section numbers (1-8)
- ❌ Hardcoded section titles
- ❌ Hardcoded section keys (avatar_definition, dream_outcome, etc.)
- ❌ Hardcoded question keys
- ❌ Uses `REQUIRED_QUESTIONS` array from types.ts
- ❌ Assumes exactly 8 sections

**Should Be:**
```tsx
{config.getEnabledSections().map(section => (
  <ReviewSectionCard
    key={section.id}
    section={section}
    questions={formData}
    config={config}
  />
))}
```

---

#### ⚠️ 2. ResponseViewer
**Path:** `components/questionnaire/response-viewer.tsx`  
**Lines:** 181  
**Used By:** Questionnaire responses page  
**Status:** ✨ **NEW - CLEAN** (Actually, this one is OK - it receives sections as props)

---

### ⚠️ PROBLEM LIB FILES (Core Logic Issues)

#### ⚠️ 3. use-questionnaire-form.ts
**Path:** `lib/questionnaire/use-questionnaire-form.ts`  
**Lines:** 714  
**Used By:** Internal dashboard form  
**Status:** ⚠️ **NEW but with MASSIVE hardcoded switch statement**

**The Problem:**
Lines 485-534 have **HARDCODED SWITCH CASE** for section mapping:

```typescript
const updateQuestion = useCallback((questionId: string, value: ...) => {
  setFormData(prev => {
    const updated = { ...prev };
    const question = getQuestionByKeyLive(questionId);
    const sectionId = question.sectionId;
    
    // ❌ HARDCODED SWITCH STATEMENT
    switch (sectionId) {
      case 1:
        updated.avatar_definition = {
          ...updated.avatar_definition,
          [fullKey]: value
        };
        break;
      case 2:
        updated.dream_outcome = {
          ...updated.dream_outcome,
          [fullKey]: value as string
        };
        break;
      case 3:
        updated.problems_obstacles = {
          ...updated.problems_obstacles,
          [fullKey]: value as string
        };
        break;
      // ... cases 4-8 hardcoded
    }
    return updated;
  });
}, [getQuestionByKeyLive]);
```

**Similar Issues:**
- Lines 290-300: `checkSection()` function hardcodes section keys
- Lines 690-714: `getQuestionValue()` helper has same switch statement

**Should Be:**
Dynamic object access using section.key from database:
```typescript
const section = getSectionById(sectionId);
updated[section.key] = {
  ...updated[section.key],
  [fullKey]: value
};
```

---

#### ⚠️ 4. types.ts
**Path:** `lib/questionnaire/types.ts`  
**Lines:** 130  
**Used By:** Everything  
**Status:** ⚠️ **COMPLETELY HARDCODED - This is the ROOT PROBLEM**

**The Problem:**
Lines 10-61: **ENTIRE QuestionnaireData interface is hardcoded**

```typescript
export interface QuestionnaireData {
  avatar_definition: {
    q1_ideal_customer: string;
    q2_avatar_criteria: string[];
    q3_demographics: string;
    q4_psychographics: string;
    q5_platforms: string;
  };
  dream_outcome: {
    q6_dream_outcome: string;
    q7_status: string;
    q8_time_to_result: string;
    q9_effort_sacrifice: string;
    q10_proof: string;
  };
  problems_obstacles: { ... };
  solution_methodology: { ... };
  brand_voice: { ... };
  proof_transformation: { ... };
  faith_integration: { ... };
  business_metrics: { ... };
}
```

**Also Hardcoded:**
- Lines 65-73: `REQUIRED_QUESTIONS` array
- Lines 75-77: `OPTIONAL_QUESTIONS` array
- Lines 79-130: `EMPTY_QUESTIONNAIRE_DATA` object

**Should Be:**
```typescript
export type QuestionnaireData = Record<string, Record<string, any>>;
// OR
export interface QuestionnaireData {
  [sectionKey: string]: {
    [questionId: string]: string | string[] | UploadedFile[];
  };
}
```

---

## PART 3: CODE STRUCTURE BREAKDOWN

### File 1: `/form/[token]/page.tsx` (Public Form Route)

**IMPORTS:**
```typescript
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PublicQuestionnaireForm } from '@/components/questionnaire/public-questionnaire-form'
import { getSections, getQuestionsWithHelp } from '@/app/actions/questionnaire-config'
```

**RENDERS:**
```tsx
<PublicQuestionnaireForm 
  client={client} 
  token={token}
  sections={enabledSections}  // From database
  questions={enabledQuestions}  // From database
/>
```

**USES HOOKS:**
- None (server component)

---

### File 2: `/dashboard/clients/onboarding/[id]/page.tsx` (Internal Form Route)

**IMPORTS:**
```typescript
import { ProgressStepper } from '@/components/questionnaire/navigation/progress-stepper'
import { RichFooter } from '@/components/questionnaire/navigation/rich-footer'
import { useQuestionnaireForm } from '@/lib/questionnaire/use-questionnaire-form'
import { QuestionnaireReview } from '@/components/questionnaire/review'
import { SectionRenderer } from '@/components/questionnaire/section-renderer'
import { useQuestionnaireConfig } from '@/lib/questionnaire/questionnaire-config-context'
```

**RENDERS:**
```tsx
<ProgressStepper currentSection={...} config={config} />

{!showReview ? (
  <SectionRenderer
    section={currentSectionConfig}
    formData={flatFormData}
    updateQuestion={updateQuestion}
    config={config}
  />
) : (
  <QuestionnaireReview clientId={clientId} mode={mode} />
)}

<RichFooter onNext={...} onPrevious={...} config={config} />
```

**USES HOOKS:**
- `useParams()` - Get clientId from URL
- `useSearchParams()` - Get mode (create/edit) and step
- `useRouter()` - Navigation
- `useQuestionnaireConfig()` - Database config context
- `useQuestionnaireForm()` - Form state management
- `useState()` - Local UI state (showReview, loading, etc.)
- `useEffect()` - URL sync, keyboard shortcuts, data loading

---

### File 3: `components/questionnaire/public-questionnaire-form.tsx`

**IMPORTS:**
```typescript
import { SectionRenderer } from './section-renderer'
import { submitPublicQuestionnaire, savePublicQuestionnaireProgress } from '@/app/actions/questionnaire'
import type { QuestionConfig, SectionConfig } from '@/lib/questionnaire/questions-config'
import { QuestionnaireData, EMPTY_QUESTIONNAIRE_DATA } from '@/lib/questionnaire/types'
```

**RENDERS:**
```tsx
<div className="max-w-4xl mx-auto">
  <header>
    <h1>Client Questionnaire</h1>
    <Button onClick={toggleTheme}>Theme</Button>
  </header>

  <Progress value={progressPercent} />

  {/* Section pills navigation */}
  <div className="flex gap-2">
    {sections.map(section => <button>...</button>)}
  </div>

  {/* Current section */}
  <AnimatePresence>
    <SectionRenderer
      section={currentSection}
      formData={flatFormData}
      updateQuestion={updateQuestion}
      config={mockConfig}
    />
  </AnimatePresence>

  {/* Footer navigation */}
  <div className="fixed bottom-0">
    <Button onClick={goToPrevious}>Previous</Button>
    <Button onClick={isLastSection ? handleSubmit : goToNext}>
      {isLastSection ? 'Submit' : 'Next'}
    </Button>
  </div>
</div>
```

**USES HOOKS:**
- `useState()` - Form state, current section, completed questions
- `useEffect()` - Load from localStorage, auto-save to server
- `useCallback()` - updateQuestion, markQuestionCompleted
- `useMemo()` - Transform database format to component format

---

## PART 4: OLD vs NEW CLASSIFICATION

| File Path | Type | OLD/NEW | Delete? | Reason |
|-----------|------|---------|---------|--------|
| **ROUTES** |
| `app/form/[token]/page.tsx` | Route | ✨ NEW | ❌ KEEP | Database-driven, perfect |
| `app/form/[token]/complete/page.tsx` | Route | ✨ NEW | ❌ KEEP | Simple thank you page |
| `app/dashboard/clients/onboarding/[id]/page.tsx` | Route | ✨ NEW | ❌ KEEP | Database-driven, perfect |
| **CORE COMPONENTS** |
| `components/questionnaire/public-questionnaire-form.tsx` | Component | ✨ NEW | ❌ KEEP | Clean implementation |
| `components/questionnaire/section-renderer.tsx` | Component | ✨ NEW | ❌ KEEP | Database-driven renderer |
| `components/questionnaire/question-renderer.tsx` | Component | ✨ NEW | ❌ KEEP | Type-based renderer |
| **QUESTION TYPES** |
| `components/questionnaire/question-types/long-text-question.tsx` | Component | ✨ NEW | ❌ KEEP | Clean reusable input |
| `components/questionnaire/question-types/short-text-question.tsx` | Component | ✨ NEW | ❌ KEEP | Clean reusable input |
| `components/questionnaire/question-types/multiple-choice-question.tsx` | Component | ✨ NEW | ❌ KEEP | Clean reusable input |
| `components/questionnaire/question-types/file-upload-question.tsx` | Component | ✨ NEW | ❌ KEEP | Clean reusable input |
| `components/questionnaire/question-types/question-wrapper.tsx` | Component | ✨ NEW | ❌ KEEP | Clean wrapper |
| **NAVIGATION** |
| `components/questionnaire/navigation/progress-stepper.tsx` | Component | ✨ NEW | ❌ KEEP | Modern, config-driven |
| `components/questionnaire/navigation/rich-footer.tsx` | Component | ✨ NEW | ❌ KEEP | Modern, config-driven |
| `components/questionnaire/navigation/section-nav.tsx` | Component | ⚠️ LEGACY? | ⚠️ AUDIT | May be unused |
| `components/questionnaire/navigation/progress-indicator.tsx` | Component | ⚠️ LEGACY? | ⚠️ AUDIT | May be unused |
| `components/questionnaire/navigation/step-footer.tsx` | Component | ⚠️ LEGACY? | ⚠️ AUDIT | May be unused |
| **SECTIONS** |
| `components/questionnaire/sections/section-container.tsx` | Component | ✨ NEW | ❌ KEEP | Clean wrapper |
| `components/questionnaire/sections/section-header.tsx` | Component | ✨ NEW | ❌ KEEP | Clean header |
| `components/questionnaire/sections/section-header-card.tsx` | Component | ✨ NEW | ❌ KEEP | Alternative header |
| **HELP SYSTEM** |
| `components/questionnaire/help-system/help-panel.tsx` | Component | ✨ NEW | ❌ KEEP | Sliding panel |
| `components/questionnaire/help-system/help-trigger.tsx` | Component | ✨ NEW | ❌ KEEP | Help button |
| `components/questionnaire/help-system/config-help-content.tsx` | Component | ✨ NEW | ❌ KEEP | DB-driven help |
| **REVIEW** |
| `components/questionnaire/review/questionnaire-review.tsx` | Component | ⚠️ **HYBRID** | ⚠️ **REFACTOR** | Has hardcoded sections |
| `components/questionnaire/review/review-section-card.tsx` | Component | ✨ NEW | ❌ KEEP | Clean card component |
| **VIEWERS** |
| `components/questionnaire/response-viewer.tsx` | Component | ✨ NEW | ❌ KEEP | Clean, prop-driven |
| `components/questionnaire/response-history.tsx` | Component | ✨ NEW | ❌ KEEP | Version history |
| **LIB FILES** |
| `lib/questionnaire/use-questionnaire-form.ts` | Hook | ⚠️ **HYBRID** | ⚠️ **REFACTOR** | Hardcoded switch cases |
| `lib/questionnaire/types.ts` | Types | ⚠️ **LEGACY** | ⚠️ **REFACTOR** | Completely hardcoded |
| `lib/questionnaire/questions-config.ts` | Types | ✨ NEW | ❌ KEEP | Database types |
| `lib/questionnaire/questionnaire-config-context.tsx` | Context | ✨ NEW | ❌ KEEP | DB config provider |
| `lib/questionnaire/dynamic-validation.ts` | Util | ✨ NEW | ❌ KEEP | Config-based validation |
| `lib/questionnaire/validation-schemas.ts` | Schemas | ⚠️ LEGACY? | ⚠️ AUDIT | May be unused |
| `lib/questionnaire/conditional-logic.ts` | Util | ✨ NEW | ❌ KEEP | Config-based logic |

---

## PART 5: CONNECTION MAP

```
PUBLIC FORM FLOW:
─────────────────

/form/[token]
  │
  ├─ Fetches: Database config (sections + questions)
  │
  └─► PublicQuestionnaireForm
        │
        ├─ State: formData, currentSection, completedQuestions
        │
        ├─► SectionRenderer
        │     │
        │     ├─► QuestionRenderer
        │     │     │
        │     │     ├─► LongTextQuestion
        │     │     ├─► ShortTextQuestion
        │     │     ├─► MultipleChoiceQuestion
        │     │     └─► FileUploadQuestion
        │     │
        │     └─► SectionContainer
        │           └─► SectionHeader
        │
        ├─► HelpPanel
        │     └─► ConfigHelpContent
        │
        └─► Footer Navigation (Previous/Next/Submit)


INTERNAL FORM FLOW:
───────────────────

/dashboard/clients/onboarding/[id]
  │
  ├─ Context: QuestionnaireConfigProvider (live DB config)
  │
  ├─ Hook: useQuestionnaireForm (state management)
  │    ├─ Form state (formData, completedQuestions)
  │    ├─ Auto-save (localStorage + server)
  │    └─ ⚠️ HARDCODED switch cases for section mapping
  │
  ├─► ProgressStepper (top navigation)
  │     └─ Config-driven section pills
  │
  ├─► SectionRenderer (same as public form)
  │     └─► QuestionRenderer (same as public form)
  │           └─► Question inputs (same as public form)
  │
  ├─► QuestionnaireReview (if on review step)
  │     ├─ ⚠️ HARDCODED 8 sections
  │     └─► ReviewSectionCard (x8)
  │
  └─► RichFooter (bottom navigation)
        ├─ Previous/Next buttons
        ├─ Save status indicator
        └─ Auto-save timestamp


VIEWER FLOW (Read-Only):
─────────────────────────

/dashboard/clients/[id]/questionnaire-responses
  │
  ├─ Fetches: Client response data + database config
  │
  └─► ResponseViewer
        │
        ├─ Receives: sections[] (from DB) + responseData
        │
        └─► Collapsible section cards
              └─► Question/answer pairs
```

---

## PART 6: DELETION CANDIDATES

### ❌ Files to DELETE (Unused Legacy)

Based on my analysis, these files MAY be unused:

1. **`components/questionnaire/navigation/section-nav.tsx`**
   - Reason: Old sidebar navigation, replaced by ProgressStepper
   - Verify: Search codebase for imports

2. **`components/questionnaire/navigation/progress-indicator.tsx`**
   - Reason: Old progress component, replaced by ProgressStepper
   - Verify: Search codebase for imports

3. **`components/questionnaire/navigation/step-footer.tsx`**
   - Reason: Old footer component, replaced by RichFooter
   - Verify: Search codebase for imports

4. **`lib/questionnaire/validation-schemas.ts`**
   - Reason: May be replaced by dynamic-validation.ts
   - Verify: Check if it's imported anywhere

**ACTION REQUIRED:**
```bash
# Check if these are imported anywhere
grep -r "section-nav" --include="*.tsx" --include="*.ts" savant-marketing-studio/
grep -r "progress-indicator" --include="*.tsx" --include="*.ts" savant-marketing-studio/
grep -r "step-footer" --include="*.tsx" --include="*.ts" savant-marketing-studio/
grep -r "validation-schemas" --include="*.tsx" --include="*.ts" savant-marketing-studio/
```

---

## PART 7: FILES TO REFACTOR (Priority Order)

### 🔥 CRITICAL - BLOCKS TRUE DATABASE-DRIVEN SYSTEM

#### 1. `lib/questionnaire/types.ts` (ROOT PROBLEM)
**Priority:** 🔥 **CRITICAL - FIX FIRST**  
**Lines:** 130  
**Issue:** Entire `QuestionnaireData` interface is hardcoded

**Current:**
```typescript
export interface QuestionnaireData {
  avatar_definition: { q1_ideal_customer: string; ... };
  dream_outcome: { q6_dream_outcome: string; ... };
  problems_obstacles: { ... };
  // ... 8 hardcoded sections
}
```

**Should Be:**
```typescript
export type QuestionnaireData = Record<string, Record<string, any>>;

// OR more type-safe:
export interface QuestionnaireData {
  [sectionKey: string]: {
    [questionId: string]: string | string[] | UploadedFile[];
  };
}
```

**Impact:**
- Prevents adding/removing sections via database
- Forces all code to know exact section structure
- Makes system NOT truly database-driven

---

#### 2. `lib/questionnaire/use-questionnaire-form.ts` (DEPENDS ON #1)
**Priority:** 🔥 **CRITICAL - FIX AFTER TYPES**  
**Lines:** 714  
**Issue:** Hardcoded switch statements for section mapping

**Current (Lines 485-534):**
```typescript
switch (sectionId) {
  case 1:
    updated.avatar_definition = { ...updated.avatar_definition, [fullKey]: value };
    break;
  case 2:
    updated.dream_outcome = { ...updated.dream_outcome, [fullKey]: value };
    break;
  // ... cases 3-8
}
```

**Should Be:**
```typescript
const section = config.getSectionById(sectionId);
if (!section) return prev;

updated[section.key] = {
  ...updated[section.key],
  [fullKey]: value
};
```

**Files to Update:**
- `updateQuestion()` function (lines 470-538)
- `checkSection()` helper (lines 290-300)
- `getQuestionValue()` helper (lines 690-714)

---

### ⚠️ HIGH PRIORITY - BLOCKS DYNAMIC SECTIONS

#### 3. `components/questionnaire/review/questionnaire-review.tsx`
**Priority:** ⚠️ **HIGH - FIX AFTER USE-QUESTIONNAIRE-FORM**  
**Lines:** 262  
**Issue:** Hardcoded 8 ReviewSectionCard components

**Current (Lines 148-226):**
```tsx
<ReviewSectionCard
  sectionNumber={1}
  title="Avatar Definition"
  questions={formData.avatar_definition}
  questionKeys={['q1', 'q2', 'q3', 'q4', 'q5']}
  requiredQuestions={REQUIRED_QUESTIONS}
  completedQuestions={completedQuestions}
  onEdit={() => handleEditSection(1)}
/>
// ... 7 more hardcoded cards
```

**Should Be:**
```tsx
{config.getEnabledSections().map(section => {
  const sectionQuestions = config.getQuestionsForSection(section.id);
  const sectionData = formData[section.key];
  
  return (
    <ReviewSectionCard
      key={section.id}
      section={section}
      questions={sectionData}
      config={config}
      completedQuestions={completedQuestions}
      onEdit={() => handleEditSection(section.id)}
    />
  );
})}
```

**Dependency:**
- ReviewSectionCard component will need to be updated to accept `section` and `config` props instead of hardcoded data

---

### 📊 MEDIUM PRIORITY - CLEANUP

#### 4. Remove `REQUIRED_QUESTIONS` array from `types.ts`
**Priority:** 📊 **MEDIUM**  
**Issue:** Hardcoded list of required questions

**Should Be:**
- Use `config.questions.filter(q => q.required)` instead
- Delete `REQUIRED_QUESTIONS` array (lines 65-73)
- Delete `OPTIONAL_QUESTIONS` array (lines 75-77)

---

#### 5. Remove `EMPTY_QUESTIONNAIRE_DATA` from `types.ts`
**Priority:** 📊 **MEDIUM**  
**Issue:** Hardcoded empty object structure

**Should Be:**
```typescript
export const createEmptyQuestionnaireData = (sections: SectionConfig[]): QuestionnaireData => {
  const data: QuestionnaireData = {};
  sections.forEach(section => {
    data[section.key] = {};
  });
  return data;
};
```

---

## PART 8: REFACTOR ROADMAP

### Phase 1: Fix Type System (1-2 hours)
**Goal:** Make QuestionnaireData dynamic

**Steps:**
1. ✅ Backup current `lib/questionnaire/types.ts`
2. 🔧 Change `QuestionnaireData` to dynamic type:
   ```typescript
   export type QuestionnaireData = Record<string, Record<string, any>>;
   ```
3. 🔧 Delete `REQUIRED_QUESTIONS` array
4. 🔧 Delete `OPTIONAL_QUESTIONS` array
5. 🔧 Replace `EMPTY_QUESTIONNAIRE_DATA` with function:
   ```typescript
   export const createEmptyData = (sections: SectionConfig[]) => 
     sections.reduce((acc, s) => ({ ...acc, [s.key]: {} }), {});
   ```
6. 🧪 Fix TypeScript errors across codebase
7. ✅ Test that forms still work

**Files Impacted:**
- `lib/questionnaire/types.ts` (source of change)
- `lib/questionnaire/use-questionnaire-form.ts` (major changes needed)
- `components/questionnaire/public-questionnaire-form.tsx` (minor)
- `components/questionnaire/review/questionnaire-review.tsx` (major)
- `app/actions/questionnaire.ts` (minor)

---

### Phase 2: Fix use-questionnaire-form Hook (2-3 hours)
**Goal:** Remove all hardcoded switch statements

**Steps:**
1. 🔧 Refactor `updateQuestion()` to use dynamic section lookup:
   ```typescript
   const section = config.getSectionById(question.sectionId);
   updated[section.key] = { ...updated[section.key], [fullKey]: value };
   ```

2. 🔧 Refactor `checkSection()` to work with any section:
   ```typescript
   const checkSection = (sectionKey: string, sectionData: Record<string, unknown>) => {
     Object.entries(sectionData).forEach(([key, value]) => {
       if (hasValue(value)) {
         const question = config.getQuestionById(key);
         if (question) completed.add(question.key);
       }
     });
   };
   
   // Then iterate all sections:
   Object.entries(formData).forEach(([sectionKey, sectionData]) => {
     checkSection(sectionKey, sectionData as Record<string, unknown>);
   });
   ```

3. 🔧 Refactor `getQuestionValue()` to use dynamic lookup:
   ```typescript
   const section = config.getSectionById(question.sectionId);
   return formData[section.key]?.[fullKey] || '';
   ```

4. 🧪 Test all form operations:
   - Updating questions
   - Mark as completed
   - Validation
   - Auto-save/restore

---

### Phase 3: Fix Review Component (1-2 hours)
**Goal:** Make review page database-driven

**Steps:**
1. 🔧 Update `ReviewSectionCard` to accept config:
   ```typescript
   interface ReviewSectionCardProps {
     section: SectionConfig;
     questions: Record<string, any>;
     config: QuestionnaireConfigLike;
     completedQuestions: Set<string>;
     onEdit: () => void;
   }
   ```

2. 🔧 Update `QuestionnaireReview` to map over sections:
   ```tsx
   {config.getEnabledSections().map(section => (
     <ReviewSectionCard
       key={section.id}
       section={section}
       questions={formData[section.key]}
       config={config}
       completedQuestions={completedQuestions}
       onEdit={() => handleEditSection(section.id)}
     />
   ))}
   ```

3. 🔧 Update progress calculation to use config:
   ```typescript
   const totalRequired = config.questions.filter(q => q.required && q.enabled).length;
   const answered = Array.from(completedQuestions).filter(key => {
     const q = config.getQuestionByKey(key);
     return q?.required && q?.enabled;
   }).length;
   const progress = Math.round((answered / totalRequired) * 100);
   ```

4. 🧪 Test review page with different section configurations

---

### Phase 4: Cleanup & Testing (1-2 hours)
**Goal:** Remove unused files, test everything

**Steps:**
1. 🔍 Verify unused files:
   - Search for imports of suspected legacy files
   - Delete if truly unused

2. 🧪 **FULL TESTING SUITE:**

   **Test 1: Public Form**
   - Open `/form/[token]`
   - Fill out sections
   - Verify auto-save
   - Submit form
   - Check database

   **Test 2: Internal Form (Create Mode)**
   - Open `/dashboard/clients/onboarding/[id]`
   - Fill out sections
   - Test auto-save
   - Navigate between sections
   - Submit via review page
   - Check database

   **Test 3: Internal Form (Edit Mode)**
   - Open form with `?mode=edit`
   - Verify existing answers load
   - Edit answers
   - Submit changes
   - Verify database update

   **Test 4: Response Viewer**
   - Open `/dashboard/clients/[id]/questionnaire-responses`
   - Verify all sections display
   - Check answer formatting

   **Test 5: Database Config Changes**
   - Disable a section in settings
   - Verify it disappears from forms
   - Enable it again
   - Add a new question via settings
   - Verify it appears in forms

3. 📝 Update documentation:
   - Update architecture docs
   - Note that system is now 100% database-driven
   - Remove references to hardcoded sections

---

## PART 9: THE VISION - ONE UNIFIED FORM

### Current State: 
✅ **MOSTLY THERE!** - You already have one unified form system.

**What Exists:**
- ✅ ONE core renderer: `SectionRenderer` + `QuestionRenderer`
- ✅ TWO contexts: Public (standalone) and Internal (with dashboard)
- ✅ SAME components used in both contexts
- ✅ Database-driven configuration
- ✅ Auto-save functionality
- ✅ Responsive design
- ✅ Help system

**What's Broken:**
- ⚠️ Hardcoded type definitions (prevents true flexibility)
- ⚠️ Hardcoded section mappings in hooks (switch statements)
- ⚠️ Hardcoded review component (assumes 8 sections)

---

### Target State:
✨ **100% DATABASE-DRIVEN** - Zero hardcoded section/question references

**After Refactor:**
- ✅ Add/remove sections from database → instant update in ALL forms
- ✅ Reorder sections → instant reorder everywhere
- ✅ Add/remove questions → instant update in ALL forms
- ✅ Change question types → instant update in renderers
- ✅ Modify help content → instant update in help panels
- ✅ No code changes needed for questionnaire modifications

---

### How Many Implementations?
**Answer:** 1 implementation, 2 entry points

**The ONE Implementation:**
```
SectionRenderer + QuestionRenderer + Question Type Components
```

**The TWO Entry Points:**
1. **Public Form** (`/form/[token]`) - For clients
   - Props-based (receives config as props)
   - Standalone theme
   - Simple navigation

2. **Internal Form** (`/dashboard/clients/onboarding/[id]`) - For staff
   - Context-based (live config from provider)
   - Dashboard integration
   - Rich navigation + review page
   - Edit mode support

**Both Use:**
- Same `SectionRenderer`
- Same `QuestionRenderer`
- Same question type components
- Same validation logic
- Same conditional logic
- Same help system

---

### What Files Need Changing?

#### Files to DELETE:
```
❌ components/questionnaire/navigation/section-nav.tsx (if unused)
❌ components/questionnaire/navigation/progress-indicator.tsx (if unused)
❌ components/questionnaire/navigation/step-footer.tsx (if unused)
❌ lib/questionnaire/validation-schemas.ts (if unused)
```

#### Files to REFACTOR:
```
⚠️ lib/questionnaire/types.ts (CRITICAL - Dynamic type system)
⚠️ lib/questionnaire/use-questionnaire-form.ts (CRITICAL - Remove switch cases)
⚠️ components/questionnaire/review/questionnaire-review.tsx (HIGH - Dynamic sections)
⚠️ components/questionnaire/review/review-section-card.tsx (MEDIUM - Accept config)
```

#### Files to KEEP (Already Perfect):
```
✅ All 2 route files (already database-driven)
✅ All 3 core components (section/question renderers)
✅ All 5 question type components
✅ All 3 help system components
✅ All 3 section wrapper components
✅ lib/questionnaire/questions-config.ts
✅ lib/questionnaire/questionnaire-config-context.tsx
✅ lib/questionnaire/dynamic-validation.ts
✅ lib/questionnaire/conditional-logic.ts
```

---

## PART 10: RECOMMENDED APPROACH

### Step-by-Step Refactor Plan

#### ✅ PREPARATION (5 minutes)
```bash
# 1. Create a feature branch
git checkout -b refactor/remove-hardcoded-questionnaire-types

# 2. Backup current working files
cp lib/questionnaire/types.ts lib/questionnaire/types.ts.backup
cp lib/questionnaire/use-questionnaire-form.ts lib/questionnaire/use-questionnaire-form.ts.backup
cp components/questionnaire/review/questionnaire-review.tsx components/questionnaire/review/questionnaire-review.tsx.backup
```

---

#### 🔥 STEP 1: Fix Type System (30 min)
**File:** `lib/questionnaire/types.ts`

**Changes:**
1. Replace hardcoded interface with dynamic type
2. Delete REQUIRED_QUESTIONS array
3. Delete OPTIONAL_QUESTIONS array
4. Replace EMPTY_QUESTIONNAIRE_DATA with function

**Testing:**
- Run TypeScript compiler
- Fix type errors in importing files

---

#### 🔥 STEP 2: Fix Form Hook (1-2 hours)
**File:** `lib/questionnaire/use-questionnaire-form.ts`

**Changes:**
1. Replace switch statement in `updateQuestion()` (lines 485-534)
2. Replace hardcoded checks in `checkSection()` (lines 290-300)
3. Replace switch statement in `getQuestionValue()` (lines 690-714)

**Testing:**
- Test creating new questionnaire
- Test editing existing questionnaire
- Test auto-save/restore
- Test validation

---

#### ⚠️ STEP 3: Fix Review Component (1 hour)
**File:** `components/questionnaire/review/questionnaire-review.tsx`

**Changes:**
1. Replace 8 hardcoded ReviewSectionCard with .map()
2. Update progress calculation to use config
3. Remove REQUIRED_QUESTIONS references

**File:** `components/questionnaire/review/review-section-card.tsx`

**Changes:**
1. Update props to accept `section: SectionConfig` and `config`
2. Derive title, question keys, and required status from config

**Testing:**
- Test review page with all sections
- Test with some sections disabled
- Test progress calculation

---

#### 📊 STEP 4: Cleanup & Final Testing (1 hour)

**A. Search for unused files:**
```bash
grep -r "section-nav" --include="*.tsx" --include="*.ts" savant-marketing-studio/
grep -r "progress-indicator" --include="*.tsx" --include="*.ts" savant-marketing-studio/
grep -r "step-footer" --include="*.tsx" --include="*.ts" savant-marketing-studio/
grep -r "validation-schemas" --include="*.tsx" --include="*.ts" savant-marketing-studio/
```

**B. Delete if unused:**
```bash
rm components/questionnaire/navigation/section-nav.tsx
rm components/questionnaire/navigation/progress-indicator.tsx
rm components/questionnaire/navigation/step-footer.tsx
rm lib/questionnaire/validation-schemas.ts
```

**C. Full test suite:**
1. Public form - fill out and submit
2. Internal form - create mode
3. Internal form - edit mode
4. Response viewer
5. Settings - disable section, verify it disappears
6. Settings - enable section, verify it appears
7. Settings - add question, verify it appears

**D. Verify database flexibility:**
```sql
-- Try disabling section 3
UPDATE questionnaire_sections SET enabled = false WHERE id = 3;
-- Check that form now skips section 3

-- Try reordering sections
UPDATE questionnaire_sections SET sort_order = 100 WHERE id = 5;
-- Check that section 5 now appears last

-- Re-enable everything
UPDATE questionnaire_sections SET enabled = true WHERE enabled = false;
```

---

### Total Time Estimate: **6-8 hours**

| Phase | Time | Difficulty |
|-------|------|------------|
| Phase 1: Fix types | 30 min | Medium |
| Phase 2: Fix hook | 2 hours | Hard |
| Phase 3: Fix review | 1.5 hours | Medium |
| Phase 4: Cleanup/test | 2 hours | Easy |
| **TOTAL** | **6-8 hours** | **Medium-Hard** |

---

## SUMMARY

### What We Found ✅
- **2 form entry points** (public + internal) ✅
- **1 unified form system** (SectionRenderer + QuestionRenderer) ✅
- **Database-driven architecture** (mostly) ✅
- **Clean component structure** ✅
- **NO duplicate implementations** ✅ 🎉

### What Needs Fixing ⚠️
- **3 files with hardcoded legacy code** ⚠️
  1. `types.ts` - Hardcoded interface
  2. `use-questionnaire-form.ts` - Switch statements
  3. `questionnaire-review.tsx` - Hardcoded sections

### The Good News 🎉
You're 90% there! The architecture is sound. You have ONE form system that's used everywhere. You just need to remove the hardcoded remnants to make it 100% database-driven.

### The Path Forward 🚀
Follow the 4-phase refactor plan above. Each phase builds on the previous. After completion, you'll have a **TRULY database-driven questionnaire system** where you can add/remove/reorder sections and questions without touching code.

---

**END OF AUDIT**

No changes were made to any files during this audit. This is purely an analysis and recommendation document.











