# QUESTIONNAIRE SYSTEM MIGRATION PLAN
**Complete Analysis & Consolidation Strategy**

---

## 🎯 EXECUTIVE SUMMARY

**Problem:** The codebase has TWO parallel questionnaire systems that are not properly connected:
1. **OLD SYSTEM** - Hardcoded section components used by public form (`/form/[token]`)
2. **NEW SYSTEM** - Config-driven components used by admin onboarding (`/dashboard/clients/onboarding/[id]`)

**Root Cause:** The config layer (`lib/questionnaire/questions-config.ts`) reads from a STATIC FILE instead of the database, despite database tables existing and being populated.

**Solution:** Connect the config layer to the database, migrate public form to use config-driven components, and delete deprecated files.

---

## 📊 STEP 1: ROUTE INVENTORY

### Active Questionnaire Routes

| Route | Type | Component System | Auth | Status |
|-------|------|------------------|------|--------|
| `/form/[token]` | PUBLIC | OLD (hardcoded sections) | Token-based | ✅ ACTIVE |
| `/dashboard/clients/onboarding/[id]` | ADMIN | NEW (config-driven) | Session + RLS | ✅ ACTIVE |
| `/dashboard/clients/[id]/questionnaire-responses` | ADMIN | View-only | Session + RLS | ✅ ACTIVE |
| `/dashboard/settings/questionnaire` | ADMIN | Settings UI | Session + RLS | ✅ ACTIVE |
| `/questionnaire/[id]` | NONE | **DOES NOT EXIST** | N/A | ❌ BROKEN LINK |

### Route Details

#### A. `/form/[token]` - Public Form (OLD SYSTEM)
**File:** `app/form/[token]/page.tsx`
- **Component:** `PublicQuestionnaireForm`
- **Data Fetch:** Validates `questionnaire_token` from clients table
- **Renders:** Individual section components (8 separate files)
- **Auth:** Token-based, no login required
- **Used By:** Client links shared via email/copy button
- **Problem:** Uses deprecated hardcoded components, not config-driven

#### B. `/dashboard/clients/onboarding/[id]` - Admin Onboarding (NEW SYSTEM)
**File:** `app/dashboard/clients/onboarding/[id]/page.tsx`
- **Component:** `SectionRenderer` (config-driven)
- **Data Fetch:** Gets client by ID, loads sections from `questions-config.ts`
- **Renders:** Dynamic sections from config
- **Auth:** Requires admin session + RLS
- **Used By:** Internal team for data entry
- **Problem:** Reads from STATIC config file, not database

#### C. `/dashboard/clients/[id]/questionnaire-responses` - View Responses
**File:** `app/dashboard/clients/[id]/questionnaire-responses/page.tsx`
- **Shows:** Completed questionnaire answers
- **Data:** Reads `intake_responses` field from clients table
- **Problem:** Hardcodes 8 sections, not dynamic

#### D. `/dashboard/settings/questionnaire` - Config Admin UI
**File:** `app/dashboard/settings/questionnaire/page.tsx`
- **Component:** `QuestionnaireSettingsClient`
- **Actions:** `app/actions/questionnaire-config.ts`
- **Database:** ✅ Properly writes to `questionnaire_sections`, `questionnaire_questions`, `questionnaire_help`
- **Problem:** Changes have NO EFFECT on live forms (disconnected)

#### E. `/questionnaire/[id]` - MISSING ROUTE
**Expected:** Public or semi-public questionnaire by client ID
- **Status:** DOES NOT EXIST
- **Referenced By:** `components/copy-questionnaire-link.tsx` (line 14)
- **Problem:** Component generates broken links

---

## 🔑 STEP 2: TOKEN SYSTEMS ANALYSIS

### System A: `questionnaire_token` (Token-Based Access)

**Purpose:** Allow clients to fill out forms without creating an account

**Generation:**
```typescript
// app/actions/clients.ts, line 83
questionnaire_token: crypto.randomUUID()
```
- Auto-generated when creating a new client
- Stored in `clients.questionnaire_token` column
- Unique, random UUID string

**Validation:**
```typescript
// app/form/[token]/page.tsx, lines 30-34
const { data: client } = await supabase
  .from('clients')
  .select('id, name, questionnaire_status, intake_responses, user_id')
  .eq('questionnaire_token', token)
  .single()
```

**Routes Using Token:**
- ✅ `/form/[token]` - Public questionnaire form
- ❌ No other routes use token

**Link Generation:**
- ✅ `components/clients/questionnaire-status-card.tsx` (line 54): `/form/${questionnaireToken}`
- ❌ `components/copy-questionnaire-link.tsx` (line 14): `/questionnaire/${clientId}` ← **BROKEN**

### System B: Client ID (Session-Based Access)

**Purpose:** Internal admin access to questionnaires

**Auth:** Requires Supabase session + RLS policies

**Routes Using Client ID:**
- ✅ `/dashboard/clients/onboarding/[id]` - Admin onboarding form
- ✅ `/dashboard/clients/[id]/questionnaire-responses` - View responses
- ✅ All other client management routes

**Link Generation:**
- ✅ Direct navigation from client detail page
- ✅ "Edit Responses" button links to onboarding route

### Token System Verdict

✅ **KEEP:** `questionnaire_token` system for public forms
✅ **KEEP:** Client ID system for admin access
❌ **FIX:** `CopyQuestionnaireLink` component (generates wrong URL)
❌ **DELETE:** Any references to `/questionnaire/[id]`

---

## 🗄️ STEP 3: CONFIG SYSTEM WIRING STATUS

### Database Schema ✅ EXISTS

**Tables:**
```sql
questionnaire_sections (8 rows)
questionnaire_questions (34 rows)  
questionnaire_help (34 rows)
```

**Migrations:**
- ✅ `supabase/migrations/20251224000000_questionnaire_config_tables.sql`
- ✅ Schema complete with indexes, triggers, and comments

**Seed Data:**
- ✅ `supabase/seed_questionnaire_config.sql`
- Contains all 34 questions with help content

### Server Actions ✅ WORK

**File:** `app/actions/questionnaire-config.ts`

**Functions Available:**
- `getSections()` - Fetch all sections
- `getEnabledSections()` - Fetch enabled sections only
- `getQuestions()` - Fetch all questions
- `getQuestionsWithHelp()` - Fetch questions + help content
- `getQuestionsBySection(sectionId)` - Fetch section's questions
- `updateSection()`, `toggleSection()`, `deleteSection()` - Section CRUD
- `updateQuestion()`, `toggleQuestion()`, `deleteQuestion()` - Question CRUD
- `updateHelp()`, `deleteHelp()` - Help content CRUD

**Status:** ✅ All functions work, properly query database

### Settings UI ✅ CONNECTED TO DATABASE

**File:** `app/dashboard/settings/questionnaire/page.tsx`

**Behavior:**
```typescript
const [sections, questions] = await Promise.all([
  getSections(),
  getQuestionsWithHelp()
])
```

- ✅ Reads from database
- ✅ Writes to database
- ✅ Changes persist
- ❌ Changes have NO EFFECT on forms

### Config Layer ❌ READS FROM STATIC FILE

**File:** `lib/questionnaire/questions-config.ts`

**Current Implementation:**
```typescript
export const sections: SectionConfig[] = [
  { id: 1, key: "avatar_definition", title: "Avatar Definition", ... },
  // ... hardcoded array of 8 sections
]

export function getEnabledSections(): SectionConfig[] {
  return sections.filter(s => s.enabled)  // ❌ Static array
}
```

**Problem:** 
- Exports STATIC arrays
- Functions do NOT query database
- Changes in Settings UI have zero effect

**Who Uses This File:**
- `app/dashboard/clients/onboarding/[id]/page.tsx` (line 35)
- `components/questionnaire/section-renderer.tsx` (line 6)
- `components/questionnaire/navigation/progress-stepper.tsx` (line 5)
- `components/questionnaire/navigation/rich-footer.tsx`

### Wiring Gap Summary

```
┌─────────────────────────────────┐
│   SETTINGS UI                    │
│   Writes to DB ✅                │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   DATABASE                       │
│   Stores config ✅               │
└────────────┬────────────────────┘
             │
             │ ❌ NOT READ BY FORMS
             │
┌─────────────────────────────────┐
│   STATIC CONFIG FILE             │
│   questions-config.ts            │
│   Hardcoded data ❌              │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   QUESTIONNAIRE FORMS            │
│   Read static config ❌          │
└─────────────────────────────────┘
```

---

## 📁 STEP 4: KEEP vs DISCARD

### ✅ FILES TO KEEP (New System - Config-Driven)

**Core Config:**
- `lib/questionnaire/questions-config.ts` - **NEEDS REWRITE** to read from DB
- `app/actions/questionnaire-config.ts` - Already reads from DB ✅

**Config-Driven Components:**
- `components/questionnaire/section-renderer.tsx` ✅
- `components/questionnaire/question-renderer.tsx` ✅
- `components/questionnaire/help-system/config-help-content.tsx` ✅

**Shared Components (used by both systems):**
- `components/questionnaire/question-types/` (all files) ✅
  - `question-wrapper.tsx`
  - `long-text-question.tsx`
  - `short-text-question.tsx`
  - `multiple-choice-question.tsx`
  - `file-upload-question.tsx`
- `components/questionnaire/sections/section-container.tsx` ✅
- `components/questionnaire/navigation/` (all files) ✅
  - `progress-stepper.tsx`
  - `progress-indicator.tsx`
  - `rich-footer.tsx`
  - `section-nav.tsx`
  - `step-footer.tsx`
- `components/questionnaire/review/` (all files) ✅
  - `questionnaire-review.tsx` - **NEEDS UPDATE** to use dynamic sections
  - `review-section-card.tsx` ✅

**Routes:**
- `app/form/[token]/page.tsx` - **NEEDS MIGRATION** to config system
- `app/dashboard/clients/onboarding/[id]/page.tsx` - **NEEDS UPDATE** to read from DB
- `app/dashboard/clients/[id]/questionnaire-responses/page.tsx` - **NEEDS UPDATE** to use dynamic sections
- `app/dashboard/settings/questionnaire/page.tsx` ✅

**Actions:**
- `app/actions/questionnaire.ts` - **NEEDS UPDATE** for dynamic validation
- `app/actions/questionnaire-config.ts` ✅

**UI Components:**
- `components/settings/questionnaire-settings.tsx` ✅
- `components/clients/questionnaire-status-card.tsx` ✅

### ❌ FILES TO DISCARD (Old System - Hardcoded)

**Individual Section Components (8 files):**
- `components/questionnaire/sections/avatar-definition-section.tsx`
- `components/questionnaire/sections/dream-outcome-section.tsx`
- `components/questionnaire/sections/problems-obstacles-section.tsx`
- `components/questionnaire/sections/solution-methodology-section.tsx`
- `components/questionnaire/sections/brand-voice-section.tsx`
- `components/questionnaire/sections/proof-transformation-section.tsx`
- `components/questionnaire/sections/faith-integration-section.tsx`
- `components/questionnaire/sections/business-metrics-section.tsx`

**Note:** All have `@deprecated` tags but are ACTIVELY USED by `PublicQuestionnaireForm`

**Hardcoded Data Files:**
- `lib/questionnaire/validation-schemas.ts` - Replace with dynamic validation
- `lib/questionnaire/help-guide-data.ts` - Data now in database
- `lib/questionnaire/section-data.ts` - Data now in database  
- `lib/questionnaire/conditional-logic.ts` - Logic now in question config

**Old Helper Components:**
- `components/questionnaire/help-system/help-content.tsx` - Uses hardcoded data
- `components/questionnaire/public-questionnaire-form.tsx` - **REWRITE** to use SectionRenderer

**Deprecated UI:**
- `components/clients/client-questionnaire.tsx` - Demo component with wrong questions

**Broken Components:**
- `components/copy-questionnaire-link.tsx` - Generates wrong URL (fix or delete)

### 🔧 FILES THAT NEED UPDATES (Not Delete)

**Critical Updates:**
1. `lib/questionnaire/questions-config.ts` - Make functions async, read from DB
2. `components/questionnaire/public-questionnaire-form.tsx` - Use SectionRenderer instead of switch
3. `components/questionnaire/review/questionnaire-review.tsx` - Dynamic sections, not hardcoded
4. `app/dashboard/clients/[id]/questionnaire-responses/page.tsx` - Dynamic sections
5. `app/actions/questionnaire.ts` - Dynamic validation from DB config

**Minor Updates:**
6. `components/copy-questionnaire-link.tsx` - Fix URL from `/questionnaire/${id}` to `/form/${token}`

---

## 🔍 STEP 5: MISSING PIECES

### A. Config Layer → Database Connection ❌ CRITICAL

**What's Missing:**
```typescript
// lib/questionnaire/questions-config.ts needs to be rewritten:

// FROM (current):
export const sections: SectionConfig[] = [...]
export function getEnabledSections() { return sections.filter(...) }

// TO (needed):
import { getEnabledSections as getEnabledSectionsFromDB } from '@/app/actions/questionnaire-config'
export async function getEnabledSections() { 
  return await getEnabledSectionsFromDB() 
}
```

**Impact:** This single change connects Settings → Database → Forms

### B. Public Form Migration ❌ REQUIRED

**Current State:**
- `app/form/[token]/page.tsx` uses `PublicQuestionnaireForm`
- `PublicQuestionnaireForm` has switch statement rendering 8 hardcoded sections
- Each section is a separate component file

**What's Needed:**
1. Pass config data from page.tsx to PublicQuestionnaireForm
2. Replace switch statement with `<SectionRenderer />`
3. Delete 8 individual section component files

### C. Dynamic Validation ⚠️ IMPORTANT

**Current State:**
- `app/actions/questionnaire.ts` imports from `lib/questionnaire/validation-schemas.ts`
- Validation rules are hardcoded Zod schemas

**What's Needed:**
- Build dynamic Zod schemas from database config
- Use `question.required`, `question.min_length`, `question.max_length` from DB
- Generate schemas on-the-fly during validation

### D. Review Page Dynamic Sections ⚠️ IMPORTANT

**Current State:**
```typescript
// questionnaire-review.tsx, lines 58-148
const sections = [
  { number: 1, title: 'Avatar Definition', data: responses.sections.avatar_definition, questions: [...] },
  // ... hardcoded 8 sections
]
```

**What's Needed:**
- Fetch sections from database
- Loop through dynamic section list
- Build questions array from config

### E. Link Generation Fix ✅ EASY

**Current State:**
- `components/copy-questionnaire-link.tsx` generates `/questionnaire/${clientId}`
- Route does not exist

**Fix Options:**
1. **Option A:** Change to `/form/${token}` (requires fetching token)
2. **Option B:** Delete component, use QuestionnaireStatusCard copy button instead
3. **Option C:** Create `/questionnaire/[id]` route (not recommended - duplicates /form/[token])

**Recommendation:** Option A or B

### F. Responses Page Dynamic Sections ⚠️ IMPORTANT

**Current State:**
```typescript
// app/dashboard/clients/[id]/questionnaire-responses/page.tsx, lines 58-148
const sections = [
  { number: 1, title: 'Avatar Definition', ... },
  // ... hardcoded 8 sections
]
```

**What's Needed:**
- Fetch sections from database
- Build section structure dynamically

---

## 📋 STEP 6: MIGRATION PLAN

### PHASE A: Database Connection (1-2 hours)

**Goal:** Make config layer read from database

#### Task A.1: Rewrite Config Layer
**File:** `lib/questionnaire/questions-config.ts`

**Change:** Convert all exports to async functions that query database

```typescript
// Before
export const sections: SectionConfig[] = [...]
export function getEnabledSections(): SectionConfig[] {
  return sections.filter(s => s.enabled)
}

// After
import { 
  getEnabledSections as dbGetEnabledSections,
  getQuestions as dbGetQuestions 
} from '@/app/actions/questionnaire-config'

export async function getEnabledSections(): Promise<SectionConfig[]> {
  return await dbGetEnabledSections()
}

export async function getQuestionsForSection(sectionId: number): Promise<QuestionConfig[]> {
  const questions = await dbGetQuestions()
  return questions.filter(q => q.section_id === sectionId && q.enabled)
}
```

**Keep Same API:** Function names stay the same, just add `async`

**Add Caching:** Consider adding React cache() for performance

#### Task A.2: Update Admin Onboarding Route
**File:** `app/dashboard/clients/onboarding/[id]/page.tsx`

**Change:** Make server component, await config

```typescript
// Line 35 - Before
const enabledSections = getEnabledSections();

// After
const enabledSections = await getEnabledSections();
```

**Change:** Page component to async

```typescript
// Line 21 - Before
export default function QuestionnairePage() {

// After
export default async function QuestionnairePage() {
```

**Impact:** Pass async data to client components

#### Task A.3: Test Settings → Form Flow
1. Go to Settings → Questionnaire
2. Disable "Faith Integration" section
3. Go to client → Start Questionnaire
4. **Verify:** Only 7 sections appear

**If pass:** Config is now database-driven ✅

---

### PHASE B: Public Form Migration (2-3 hours)

**Goal:** Migrate public form to use config-driven system

#### Task B.1: Update Public Form Page
**File:** `app/form/[token]/page.tsx`

**Add:** Fetch config before rendering

```typescript
// After line 41
const enabledSections = await getEnabledSections()
const allQuestions = await getQuestions()

return (
  <PublicQuestionnaireForm 
    client={{ ... }}
    token={token}
    sections={enabledSections}
    questions={allQuestions}
  />
)
```

#### Task B.2: Rewrite PublicQuestionnaireForm
**File:** `components/questionnaire/public-questionnaire-form.tsx`

**Replace:** Lines 239-251 (renderCurrentSection switch)

```typescript
// Before
const renderCurrentSection = () => {
  switch (currentSection) {
    case 1: return <AvatarDefinitionSection ... />
    case 2: return <DreamOutcomeSection ... />
    // ... 8 cases
  }
}

// After
const currentSectionConfig = sections.find(s => s.id === currentSection)
if (!currentSectionConfig) return null

return (
  <SectionRenderer
    section={currentSectionConfig}
    formData={flatFormDataTyped}
    updateQuestion={updateQuestion}
    markQuestionCompleted={markQuestionCompleted}
    completedQuestions={completedQuestions}
  />
)
```

**Remove:** Lines 10-17 (imports of individual section components)

#### Task B.3: Test Public Form
1. Get questionnaire token from database
2. Navigate to `/form/[token]`
3. **Verify:** Form renders correctly with config-driven sections
4. **Verify:** Help panels work
5. **Verify:** Submission works

---

### PHASE C: Dynamic Sections Everywhere (2-3 hours)

**Goal:** Remove all hardcoded section arrays

#### Task C.1: Update Review Page
**File:** `components/questionnaire/review/questionnaire-review.tsx`

**Replace:** Lines 58-148 (hardcoded sections array)

```typescript
// Fetch config
const enabledSections = await getEnabledSections()
const questions = await getQuestions()

// Build sections dynamically
const sections = enabledSections.map(section => {
  const sectionQuestions = questions.filter(q => 
    q.section_id === section.id && q.enabled
  )
  
  return {
    number: section.id,
    title: section.title,
    data: responses.sections[section.key],
    questions: sectionQuestions.map(q => ({
      key: q.id,
      label: `Q${q.sort_order}: ${q.text}`
    }))
  }
})
```

**Note:** May need to make this a server component

#### Task C.2: Update Responses View Page
**File:** `app/dashboard/clients/[id]/questionnaire-responses/page.tsx`

**Same change:** Replace lines 58-148 with dynamic section loading

#### Task C.3: Update Progress Stepper
**File:** `components/questionnaire/navigation/progress-stepper.tsx`

**Current:** Already uses `getEnabledSections()` on line 33 ✅

**Verify:** Works with async version

---

### PHASE D: Validation & Cleanup (1-2 hours)

**Goal:** Dynamic validation and remove deprecated files

#### Task D.1: Dynamic Validation
**File:** `app/actions/questionnaire.ts`

**Create new file:** `lib/questionnaire/dynamic-validation.ts`

```typescript
import { z } from 'zod'
import { getQuestions } from './questions-config'

export async function buildValidationSchema() {
  const questions = await getQuestions()
  
  const schema: Record<string, z.ZodTypeAny> = {}
  
  for (const q of questions) {
    if (!q.enabled) continue
    
    switch (q.type) {
      case 'long-text':
      case 'short-text':
        let stringSchema = z.string()
        if (q.required) stringSchema = stringSchema.min(q.min_length || 1)
        if (q.max_length) stringSchema = stringSchema.max(q.max_length)
        schema[q.id] = stringSchema
        break
        
      case 'multiple-choice':
        schema[q.id] = q.required 
          ? z.string().min(1)
          : z.string().optional()
        break
        
      case 'checkbox':
        schema[q.id] = q.required
          ? z.array(z.string()).min(1)
          : z.array(z.string()).optional()
        break
        
      case 'file-upload':
        schema[q.id] = q.required
          ? z.array(z.any()).min(1)
          : z.array(z.any()).optional()
        break
    }
  }
  
  return z.object(schema)
}
```

**Update:** `app/actions/questionnaire.ts` to use dynamic validation

#### Task D.2: Delete Deprecated Files

**Delete these 8 files:**
```
components/questionnaire/sections/avatar-definition-section.tsx
components/questionnaire/sections/dream-outcome-section.tsx
components/questionnaire/sections/problems-obstacles-section.tsx
components/questionnaire/sections/solution-methodology-section.tsx
components/questionnaire/sections/brand-voice-section.tsx
components/questionnaire/sections/proof-transformation-section.tsx
components/questionnaire/sections/faith-integration-section.tsx
components/questionnaire/sections/business-metrics-section.tsx
```

**Delete these data files:**
```
lib/questionnaire/validation-schemas.ts
lib/questionnaire/help-guide-data.ts
lib/questionnaire/section-data.ts
lib/questionnaire/conditional-logic.ts
```

**Delete/Fix helpers:**
```
components/questionnaire/help-system/help-content.tsx (delete - uses hardcoded data)
components/clients/client-questionnaire.tsx (delete - demo component)
components/copy-questionnaire-link.tsx (fix or delete)
```

#### Task D.3: Update Index Exports
**File:** `components/questionnaire/sections/index.ts`

**Remove:** Exports of individual section components

**Keep:** Only SectionContainer export

---

### PHASE E: Polish & Testing (1-2 hours)

**Goal:** Comprehensive testing and documentation

#### Task E.1: End-to-End Testing

**Test Flow:**
1. ✅ Settings: Toggle section off → Verify disappears from forms
2. ✅ Settings: Edit question text → Verify updates in forms
3. ✅ Settings: Change validation rules → Verify enforced in forms
4. ✅ Settings: Edit help content → Verify shows in help panel
5. ✅ Admin form: Complete questionnaire → Verify saves
6. ✅ Public form: Complete questionnaire → Verify saves
7. ✅ Review page: View responses → Verify shows all sections
8. ✅ Responses page: View completed → Verify shows all sections

#### Task E.2: Documentation Updates

**Update these docs:**
- `DATABASE_BACKED_QUESTIONNAIRE_GUIDE.md` - Mark as complete
- `QUESTIONNAIRE_WIRING_SUMMARY.md` - Update with "FIXED" status
- `CONFIG_DRIVEN_QUESTIONNAIRE_GUIDE.md` - Add usage examples

**Create new doc:** `QUESTIONNAIRE_SYSTEM_COMPLETE.md`
- Architecture diagram
- How to add new questions
- How to modify sections
- Troubleshooting guide

#### Task E.3: Performance Optimization

**Add caching:**
```typescript
// lib/questionnaire/questions-config.ts
import { cache } from 'react'

export const getEnabledSections = cache(async () => {
  return await dbGetEnabledSections()
})
```

**Add revalidation:**
- Settings changes already call `revalidatePath()` ✅
- Verify Next.js cache is cleared on updates

---

## 💡 RECOMMENDED APPROACH

### Option A: Full Migration (Recommended) ⭐

**Timeline:** 7-10 hours total

**Phases:** A → B → C → D → E (complete in order)

**Pros:**
- ✅ One unified system
- ✅ Settings changes work immediately
- ✅ No deprecated code
- ✅ Fully maintainable
- ✅ Database-backed flexibility

**Cons:**
- ⚠️ More upfront work
- ⚠️ Requires thorough testing

**When to use:** You want a production-ready, maintainable system

---

### Option B: Minimal Fix (Quick Win)

**Timeline:** 2-3 hours

**Phases:** A only (just connect config to database)

**What you get:**
- ✅ Admin onboarding reads from database
- ✅ Settings changes affect admin forms
- ⚠️ Public form still uses old system

**What remains:**
- ❌ Public form still hardcoded
- ❌ Deprecated files still exist
- ❌ Two parallel systems

**When to use:** You need a quick proof-of-concept

---

### Option C: Incremental Migration

**Timeline:** Spread over multiple days

**Week 1:** Phase A (database connection)
**Week 2:** Phase B (public form)
**Week 3:** Phases C+D (cleanup)
**Week 4:** Phase E (polish)

**Pros:**
- ✅ Less risky
- ✅ Can test between phases
- ✅ Can rollback easily

**Cons:**
- ⚠️ Longer total time
- ⚠️ System inconsistent during migration

**When to use:** You prefer careful, incremental progress

---

## 🎯 FINAL RECOMMENDATION

**Start with Option A - Full Migration**

**Why:**
- Infrastructure is ready (database, actions, components all exist)
- No technical blockers
- One-time investment for long-term maintainability
- Settings UI is useless until connected

**Estimated Effort:**
- Phase A: 1-2 hours ⚡ (highest impact)
- Phase B: 2-3 hours
- Phase C: 2-3 hours
- Phase D: 1-2 hours
- Phase E: 1-2 hours
- **Total: 7-12 hours**

**Next Steps:**
1. Start with Phase A (config → database)
2. Test thoroughly (Settings → Form flow)
3. If works, continue to Phase B
4. If issues, pause and debug

**Blocker Check:**
- ✅ Database tables exist
- ✅ Data is seeded
- ✅ Server actions work
- ✅ Config-driven components exist
- ✅ All infrastructure ready

**Confidence Level:** 🟢 HIGH - Everything needed is in place

---

## 📚 REFERENCE: FILE CHANGES SUMMARY

### Files to Modify (Priority Order)

1. **HIGH PRIORITY** (Breaks system if not updated)
   - `lib/questionnaire/questions-config.ts` - Make async, read DB
   - `app/dashboard/clients/onboarding/[id]/page.tsx` - Await config
   - `components/questionnaire/public-questionnaire-form.tsx` - Use SectionRenderer

2. **MEDIUM PRIORITY** (Features incomplete without)
   - `components/questionnaire/review/questionnaire-review.tsx` - Dynamic sections
   - `app/dashboard/clients/[id]/questionnaire-responses/page.tsx` - Dynamic sections
   - `app/actions/questionnaire.ts` - Dynamic validation

3. **LOW PRIORITY** (Nice to have)
   - `components/copy-questionnaire-link.tsx` - Fix URL
   - Documentation files

### Files to Delete (After Migration)

**Section Components (8 files):**
- All files in `components/questionnaire/sections/` except `section-container.tsx`

**Data Files (4 files):**
- `lib/questionnaire/validation-schemas.ts`
- `lib/questionnaire/help-guide-data.ts`
- `lib/questionnaire/section-data.ts`
- `lib/questionnaire/conditional-logic.ts`

**Helper Components (3 files):**
- `components/questionnaire/help-system/help-content.tsx`
- `components/clients/client-questionnaire.tsx`
- `components/copy-questionnaire-link.tsx` (or fix it)

**Total to delete:** ~15 files (~3,000 lines of deprecated code)

---

## ✅ SUCCESS CRITERIA

Migration is complete when:

1. ✅ Admin can toggle section in Settings → Section disappears from all forms
2. ✅ Admin can edit question text in Settings → New text shows in all forms
3. ✅ Admin can modify validation rules → Rules enforced in all forms
4. ✅ Public form (`/form/[token]`) uses config-driven system
5. ✅ Admin form (`/dashboard/clients/onboarding/[id]`) reads from database
6. ✅ Review page shows dynamic sections based on config
7. ✅ Responses page shows dynamic sections based on config
8. ✅ All deprecated files deleted
9. ✅ No broken imports or TypeScript errors
10. ✅ All tests pass (if tests exist)

---

## 🚨 RISK ASSESSMENT

**High Risk:**
- ❌ None - All infrastructure exists

**Medium Risk:**
- ⚠️ Performance impact of database queries (mitigated by caching)
- ⚠️ Breaking public forms during migration (test thoroughly)

**Low Risk:**
- ⚠️ TypeScript errors from async changes (easy to fix)
- ⚠️ Missing edge cases in dynamic validation (add incrementally)

**Mitigation Strategy:**
- Phase A is safest (only affects admin forms)
- Test each phase before proceeding
- Keep deprecated files until Phase E
- Can rollback by reverting git commits

---

**END OF MIGRATION PLAN**

*Generated: December 27, 2025*
*Status: Ready to Execute*

