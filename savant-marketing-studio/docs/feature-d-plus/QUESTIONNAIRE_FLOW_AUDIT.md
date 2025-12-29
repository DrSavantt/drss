# Questionnaire Flow Audit Report

## QUESTIONNAIRE FILES FOUND

| File Path | Purpose | Uses Config? | Status |
|-----------|---------|--------------|--------|
| **ENTRY POINTS** |
| `/app/dashboard/clients/onboarding/[id]/page.tsx` | Internal questionnaire form (dashboard) | ✅ YES - Uses `getEnabledSections()` from questions-config.ts | **Config-driven** |
| `/app/form/[token]/page.tsx` | Public questionnaire form (no auth) | ❌ NO - Static | **Needs wiring** |
| `/components/questionnaire/public-questionnaire-form.tsx` | Public form client component | ❌ NO - Hardcoded sections | **Needs wiring** |
| **FORM COMPONENTS** |
| `/components/questionnaire/section-renderer.tsx` | NEW config-driven section renderer | ✅ YES | **Ready** |
| `/components/questionnaire/question-renderer.tsx` | NEW config-driven question renderer | ✅ YES | **Ready** |
| `/components/questionnaire/sections/avatar-definition-section.tsx` | OLD hardcoded section 1 | ❌ NO | **@deprecated** |
| `/components/questionnaire/sections/dream-outcome-section.tsx` | OLD hardcoded section 2 | ❌ NO | **@deprecated** |
| `/components/questionnaire/sections/problems-obstacles-section.tsx` | OLD hardcoded section 3 | ❌ NO | **@deprecated** |
| `/components/questionnaire/sections/solution-methodology-section.tsx` | OLD hardcoded section 4 | ❌ NO | **@deprecated** |
| `/components/questionnaire/sections/brand-voice-section.tsx` | OLD hardcoded section 5 | ❌ NO | **@deprecated** |
| `/components/questionnaire/sections/proof-transformation-section.tsx` | OLD hardcoded section 6 | ❌ NO | **@deprecated** |
| `/components/questionnaire/sections/faith-integration-section.tsx` | OLD hardcoded section 7 | ❌ NO | **@deprecated** |
| `/components/questionnaire/sections/business-metrics-section.tsx` | OLD hardcoded section 8 | ❌ NO | **@deprecated** |
| **QUESTION TYPES** |
| `/components/questionnaire/question-types/long-text-question.tsx` | Textarea input | N/A | **Reusable** |
| `/components/questionnaire/question-types/short-text-question.tsx` | Text input | N/A | **Reusable** |
| `/components/questionnaire/question-types/multiple-choice-question.tsx` | Radio/checkbox selector | N/A | **Reusable** |
| `/components/questionnaire/question-types/file-upload-question.tsx` | File uploader | N/A | **Reusable** |
| `/components/questionnaire/question-types/question-wrapper.tsx` | Question card wrapper | N/A | **Reusable** |
| **NAVIGATION** |
| `/components/questionnaire/navigation/progress-stepper.tsx` | Top section stepper | ✅ YES - Uses `getEnabledSections()` | **Config-driven** |
| `/components/questionnaire/navigation/rich-footer.tsx` | Bottom nav bar | ✅ YES - Uses config helpers | **Config-driven** |
| **REVIEW PAGE** |
| `/components/questionnaire/review/questionnaire-review.tsx` | Review before submit | ❌ NO - Hardcoded 8 sections | **Needs wiring** |
| `/components/questionnaire/review/review-section-card.tsx` | Section review card | ❌ NO | **Used by review** |
| **HELP SYSTEM** |
| `/components/questionnaire/help-system/config-help-content.tsx` | NEW config-based help | ✅ YES | **Ready** |
| `/components/questionnaire/help-system/help-content.tsx` | OLD hardcoded help | ❌ NO | **@deprecated** |
| `/components/questionnaire/help-system/help-panel.tsx` | Help sidebar panel | N/A | **Reusable** |
| **DATA & LOGIC** |
| `/lib/questionnaire/questions-config.ts` | STATIC config file (34 questions) | N/A | **To be replaced by DB** |
| `/lib/questionnaire/use-questionnaire-form.ts` | Form state management hook | ✅ YES - Uses config | **Config-driven** |
| `/lib/questionnaire/types.ts` | TypeScript types | N/A | **Shared** |
| `/lib/questionnaire/validation-schemas.ts` | OLD Zod schemas | ❌ NO | **@deprecated** |
| `/lib/questionnaire/dynamic-validation.ts` | NEW config-based validation | ✅ YES | **Ready** |
| `/lib/questionnaire/conditional-logic.ts` | OLD conditional logic | ❌ NO | **@deprecated** |
| `/lib/questionnaire/help-guide-data.ts` | OLD help content data | ❌ NO | **@deprecated** |
| `/lib/questionnaire/section-data.ts` | OLD section metadata | ❌ NO | **@deprecated** |
| **SERVER ACTIONS** |
| `/app/actions/questionnaire.ts` | Save/submit questionnaire | ❌ NO - Validates with old schemas | **Needs update** |
| `/app/actions/questionnaire-config.ts` | NEW admin CRUD for config | ✅ YES | **Admin only** |
| **CLIENT PAGES** |
| `/components/clients/questionnaire-status-card.tsx` | Status card on client detail | N/A | Links to onboarding |
| `/app/dashboard/clients/[id]/questionnaire-responses/page.tsx` | View submitted responses | ❌ NO - Hardcoded sections | **Needs wiring** |
| **SETTINGS** |
| `/components/settings/questionnaire-settings.tsx` | NEW admin UI for config | ✅ YES | **Admin only** |

---

## CURRENT DATA FLOW

### Path 1: Internal Questionnaire (Dashboard)
```
Dashboard Client Detail
  ↓ (Click "Start Questionnaire" button)
/dashboard/clients/onboarding/[id]
  ↓ (Loads from STATIC questions-config.ts)
getEnabledSections() → STATIC FILE
  ↓ (Renders with NEW components)
<SectionRenderer section={config} /> ✅ Config-driven
  ↓ (Auto-save to localStorage)
Auto-save every change
  ↓ (Final submit)
saveQuestionnaire() → Supabase clients.intake_responses
```

### Path 2: Public Questionnaire (Token-based)
```
Copy questionnaire link from client card
  ↓ (No auth required)
/form/[token]
  ↓ (Loads from HARDCODED sections)
public-questionnaire-form.tsx → HARDCODED 8 section components ❌
  ↓ (Old section components)
<AvatarDefinitionSection /> (deprecated)
<DreamOutcomeSection /> (deprecated)
etc...
  ↓ (Auto-save to Supabase + localStorage)
savePublicQuestionnaireProgress()
  ↓ (Final submit)
submitPublicQuestionnaire() → Supabase clients.intake_responses
```

### Path 3: Admin Settings
```
Dashboard → Settings → Questionnaire Tab
  ↓ (Loads from DATABASE)
getSections(), getQuestionsWithHelp() → Supabase questionnaire_* tables
  ↓ (Edit in UI)
<QuestionnaireSettings /> → Drag/toggle/edit
  ↓ (Save changes)
updateSection(), updateQuestion() → Supabase
  ↓ (Effect?)
❌ NO EFFECT on actual questionnaires yet!
```

---

## UI VERSION STATUS

### Current UI: **MIXED**

**Internal Questionnaire (`/dashboard/clients/onboarding/[id]`):**
- ✅ Uses NEW config-driven components
- ✅ `<SectionRenderer />` (config-based)
- ✅ `<QuestionRenderer />` (config-based)
- ✅ `<ProgressStepper />` (config-aware)
- ✅ `<RichFooter />` (config-aware)
- ✅ `<ConfigHelpContent />` (config-based)

**Public Questionnaire (`/form/[token]`):**
- ❌ Uses OLD hardcoded components
- ❌ `<AvatarDefinitionSection />` (deprecated)
- ❌ `<DreamOutcomeSection />` (deprecated)
- ❌ All 8 section components hardcoded
- ❌ No config awareness

**Review Page:**
- ❌ Hardcoded 8 sections with hardcoded titles
- ❌ Hardcoded question keys ['q1', 'q2', 'q3', 'q4', 'q5']
- ❌ No config awareness
- ❌ Won't reflect disabled sections/questions

**Responses View (`/dashboard/clients/[id]/questionnaire-responses`):**
- ❌ Hardcoded sections
- ❌ No config awareness

---

## CONNECTION GAPS

### ❌ Gap 1: Config Source (CRITICAL)
**Problem:** Two questionnaire pages use DIFFERENT data sources:
- Internal: Uses `/lib/questionnaire/questions-config.ts` (STATIC FILE)
- Admin Settings: Uses Supabase `questionnaire_*` tables (DATABASE)
- Public: Uses HARDCODED deprecated components

**Impact:** Changes in Settings admin UI have ZERO effect on actual questionnaires.

**Why It Matters:**
- Toggling sections in Settings doesn't hide them in forms
- Editing questions in Settings doesn't change form text
- Database is populated but not used

### ❌ Gap 2: Public Form Not Config-Driven
**Problem:** Public questionnaire still uses deprecated hardcoded section components.

**Impact:**
- Public form can't be customized via Settings
- Public form always shows all 8 sections
- Public form can't respect disabled questions

### ❌ Gap 3: Review Page Not Config-Driven
**Problem:** Review page hardcodes all 8 sections and their titles.

**Impact:**
- Shows disabled sections
- Shows hardcoded titles even if edited in Settings
- Question keys hardcoded

### ❌ Gap 4: Validation Mismatch
**Problem:** 
- `saveQuestionnaire()` uses `/lib/questionnaire/validation-schemas.ts` (OLD static schemas)
- Should use `/lib/questionnaire/dynamic-validation.ts` (NEW config-based)

**Impact:**
- Validation doesn't respect config changes
- Can't change min/max length via Settings

### ❌ Gap 5: Questionnaire Responses View Not Config-Driven
**Problem:** Response viewing page hardcodes section titles and question lists.

**Impact:**
- Shows hardcoded section names even if renamed in Settings
- Shows all sections even if disabled

---

## DUPLICATE CODE IDENTIFIED

### 1. Question/Section Data (TRIPLE DUPLICATION)
- ❌ `/lib/questionnaire/questions-config.ts` (STATIC - 34 questions hardcoded)
- ✅ `/supabase/seed_questionnaire_config.sql` (DATABASE - 34 questions)
- ❌ Each of 8 deprecated section components (INLINE - questions repeated)

### 2. Section Metadata
- ❌ `/lib/questionnaire/section-data.ts` (OLD)
- ❌ Hardcoded in progress-stepper.tsx (SHORT_NAMES)
- ❌ Hardcoded in review page (8 ReviewSectionCard instances)
- ✅ Database: `questionnaire_sections` table

### 3. Help Content
- ❌ `/lib/questionnaire/help-guide-data.ts` (OLD static)
- ✅ questions-config.ts (help fields in each question)
- ✅ Database: `questionnaire_help` table

### 4. Validation Rules
- ❌ `/lib/questionnaire/validation-schemas.ts` (OLD hardcoded Zod)
- ✅ questions-config.ts (min/max in each question)
- ✅ Database: min_length/max_length columns

---

## RECOMMENDED WIRING PLAN

### Phase 1: Connect Internal Questionnaire to Database (HIGH PRIORITY)
**Goal:** Make Settings changes take effect in `/dashboard/clients/onboarding/[id]`

1. **Update onboarding page** (`/app/dashboard/clients/onboarding/[id]/page.tsx`)
   - Change from: `getEnabledSections()` from static file
   - Change to: `getEnabledSections()` from `/app/actions/questionnaire-config.ts`
   - Fetch database config on page load
   - Pass to client components

2. **Update use-questionnaire-form hook** (`/lib/questionnaire/use-questionnaire-form.ts`)
   - Accept sections/questions as props instead of importing from static file
   - Make all config helpers accept config as parameter

3. **Update section-renderer** (`/components/questionnaire/section-renderer.tsx`)
   - Already config-driven, just needs DB config passed in

4. **Update validation in submit**
   - Change `saveQuestionnaire()` to use `dynamic-validation.ts` instead of static schemas
   - Pass config to validation functions

### Phase 2: Connect Public Form to Config (MEDIUM PRIORITY)
**Goal:** Make public form `/form/[token]` config-driven

5. **Replace deprecated components in public form**
   - Remove imports of 8 deprecated section components
   - Use `<SectionRenderer />` instead
   - Fetch database config
   - Pass config to components

6. **Update public form switch statement**
   - Remove `renderCurrentSection()` switch case
   - Use dynamic section rendering

### Phase 3: Connect Review Page to Config (MEDIUM PRIORITY)
**Goal:** Make review page respect disabled sections/questions

7. **Make review page dynamic** (`/components/questionnaire/review/questionnaire-review.tsx`)
   - Remove hardcoded 8 `<ReviewSectionCard />` instances
   - Loop through enabled sections from config
   - Get question keys from config instead of hardcoding

### Phase 4: Connect Responses View to Config (LOW PRIORITY)
**Goal:** Show correct section names in responses view

8. **Update responses page** (`/app/dashboard/clients/[id]/questionnaire-responses/page.tsx`)
   - Fetch section titles from config
   - Show only enabled sections

### Phase 5: Cleanup (OPTIONAL)
9. **Delete deprecated files:**
   - 8 deprecated section component files
   - `/lib/questionnaire/validation-schemas.ts`
   - `/lib/questionnaire/conditional-logic.ts` (logic moved to questions-config.ts)
   - `/lib/questionnaire/help-guide-data.ts` (moved to DB)
   - `/lib/questionnaire/section-data.ts` (moved to DB)

10. **Decide on questions-config.ts:**
    - Option A: Keep as fallback/types only
    - Option B: Remove entirely, use DB exclusively
    - Option C: Generate from DB on build (static generation)

---

## FILES TO MODIFY (Priority Order)

### CRITICAL (Phase 1 - Internal Form)
1. **`/app/dashboard/clients/onboarding/[id]/page.tsx`**
   - Add: `const [sections, questions] = await Promise.all([getEnabledSections(), getQuestionsWithHelp()])` from database actions
   - Pass config to child components instead of importing from static file
   - Make it a server component that fetches DB config

2. **`/lib/questionnaire/use-questionnaire-form.ts`**
   - Accept `sections` and `questions` as parameters
   - Remove static imports of config
   - Make all helpers work with passed config

3. **`/app/actions/questionnaire.ts`** (saveQuestionnaire function)
   - Replace `questionSchemas` from validation-schemas.ts
   - Use `generateQuestionSchema()` from dynamic-validation.ts
   - Fetch config from DB for validation

### HIGH PRIORITY (Phase 2 - Public Form)
4. **`/components/questionnaire/public-questionnaire-form.tsx`**
   - Remove hardcoded section component imports
   - Add config fetching (pass from page.tsx)
   - Use `<SectionRenderer />` instead of switch/case
   - Already has useQuestionnaireForm, just needs config props

5. **`/app/form/[token]/page.tsx`**
   - Fetch questionnaire config from database
   - Pass to PublicQuestionnaireForm component

### MEDIUM PRIORITY (Phase 3 - Review)
6. **`/components/questionnaire/review/questionnaire-review.tsx`**
   - Accept config as props
   - Loop through config sections instead of hardcoding 8
   - Get question keys from config

### LOW PRIORITY (Phase 4 - Responses View)
7. **`/app/dashboard/clients/[id]/questionnaire-responses/page.tsx`**
   - Fetch section config
   - Use dynamic section names

---

## DATA SOURCE COMPARISON

### Current State

| Component | Currently Uses | Should Use |
|-----------|---------------|------------|
| Internal Form (Dashboard) | `questions-config.ts` (STATIC) | ✅ Database |
| Public Form (Token Link) | Hardcoded components | ✅ Database |
| Review Page | Hardcoded sections | ✅ Database |
| Responses View | Hardcoded sections | ✅ Database |
| Settings Admin | Database ✅ | Database ✅ |
| ProgressStepper | `questions-config.ts` (STATIC) | ✅ Database |
| useQuestionnaireForm | `questions-config.ts` (STATIC) | ✅ Database |
| Validation | `validation-schemas.ts` (STATIC) | ✅ Database (dynamic) |

### After Wiring (Goal)

| Component | Will Use |
|-----------|----------|
| Internal Form | Database ✅ |
| Public Form | Database ✅ |
| Review Page | Database ✅ |
| Responses View | Database ✅ |
| Settings Admin | Database ✅ |
| All Components | Database ✅ |

---

## WHAT'S NOT CONNECTED (Checklist)

Based on Settings admin capabilities, here's what changes DON'T currently affect the live questionnaires:

- ❌ **Toggling section enabled/disabled** - Forms still show all sections
- ❌ **Toggling question enabled/disabled** - Forms still show all questions  
- ❌ **Editing section title** - Forms show hardcoded/config titles
- ❌ **Editing section description** - Not reflected in forms
- ❌ **Editing question text** - Forms show original text
- ❌ **Editing placeholder** - Forms show original placeholders
- ❌ **Changing validation (min/max)** - Old validation still applies
- ❌ **Changing required status** - Old required list still used
- ❌ **Editing help content** - Internal form uses config-help (✅), but public doesn't
- ❌ **Reordering sections** - Forms use static order
- ❌ **Reordering questions** - Forms use static order

---

## ROOT CAUSE ANALYSIS

### Why Settings Changes Don't Take Effect

1. **Static Config File Still in Use**
   - `/lib/questionnaire/questions-config.ts` has all 34 questions hardcoded
   - Internal form imports from this file: `import { getEnabledSections } from '@/lib/questionnaire/questions-config'`
   - File is NOT reading from database
   - Settings admin writes to database, but nobody reads from it

2. **Public Form Uses Deprecated Components**
   - Public form explicitly imports all 8 deprecated section components
   - Renders them in a switch/case statement
   - No config awareness at all

3. **Review Page Hardcoded**
   - 8 hardcoded `<ReviewSectionCard />` components
   - Hardcoded titles and question keys
   - No dynamic rendering

4. **Validation Not Connected**
   - `saveQuestionnaire()` uses old `validation-schemas.ts`
   - Should use `dynamic-validation.ts` with DB config

---

## ARCHITECTURE ISSUE

The system has **THREE layers** that should be ONE:

```
Layer 1: DATABASE (questionnaire_* tables)
  ↕️ ❌ NOT CONNECTED
Layer 2: STATIC CONFIG (questions-config.ts)  
  ↕️ ✅ CONNECTED
Layer 3: FORM COMPONENTS (questionnaire pages)
```

**Problem:** Settings admin edits Layer 1 (database), but forms read from Layer 2 (static file).

**Solution:** Make Layer 2 read from Layer 1, or skip Layer 2 entirely.

---

## MIGRATION PATH

### Option A: Database-First (RECOMMENDED)
1. Make `questions-config.ts` fetch from database instead of exporting static data
2. Keep same API (getEnabledSections, etc.) but read from DB
3. Cache in memory or use React Server Components to fetch
4. All existing code continues to work, just pulls from DB now

**Pros:**
- Minimal code changes
- Existing components work as-is
- Settings changes take effect immediately

**Cons:**
- Every page load fetches from DB (but can cache)

### Option B: Prop Drilling
1. Each page fetches config from DB
2. Pass config down as props to all components
3. Update all components to accept config props

**Pros:**
- More explicit data flow
- Easier to test

**Cons:**
- Lots of prop drilling
- Many component signatures change

### Option C: Context API
1. Create QuestionnaireConfigContext
2. Fetch config at layout/page level
3. Components use useContext() to access

**Pros:**
- No prop drilling
- Clean component APIs

**Cons:**
- Adds complexity
- Need context provider

---

## RECOMMENDED APPROACH

**Use Option A (Database-First)** with this implementation:

1. **Keep questions-config.ts interface** but make functions async:
   ```typescript
   // OLD
   export function getEnabledSections(): SectionConfig[] {
     return sections.filter(s => s.enabled)
   }
   
   // NEW
   export async function getEnabledSections(): Promise<SectionConfig[]> {
     const supabase = await createClient()
     const { data } = await supabase
       .from('questionnaire_sections')
       .select('*')
       .eq('enabled', true)
       .order('sort_order')
     return data || []
   }
   ```

2. **Update all callers** to await the function calls

3. **Add caching** for performance (React cache or memoization)

4. **Convert pages to server components** where possible to fetch at server-side

---

## ESTIMATED EFFORT

| Task | Effort | Impact |
|------|--------|--------|
| Wire internal form to DB | 2-3 hours | HIGH - Settings work for internal use |
| Wire public form to DB | 2-3 hours | HIGH - Settings work for public use |
| Wire review page to DB | 1-2 hours | MEDIUM - Dynamic review |
| Wire responses view to DB | 1 hour | LOW - Better display |
| Update validation | 1 hour | MEDIUM - Dynamic rules |
| Delete deprecated files | 30 min | LOW - Cleanup |
| **TOTAL** | **~10 hours** | Complete database-driven system |

---

## IMMEDIATE NEXT STEPS

1. ✅ **Migration & Seed** - Run migration and seed data (if not done)
2. ⏭️ **Wire Internal Form** - Make dashboard questionnaire use database
3. ⏭️ **Wire Public Form** - Make public form use database  
4. ⏭️ **Wire Review** - Make review page dynamic
5. ⏭️ **Test End-to-End** - Verify Settings changes take effect

---

## CONCLUSION

**Current Status:** 
- ✅ Settings admin UI is complete and functional
- ✅ Database schema is ready
- ✅ Config-driven components exist (SectionRenderer, QuestionRenderer)
- ❌ Forms still read from static file, NOT from database
- ❌ Settings changes have no effect yet

**What Needs to Happen:**
Change `/lib/questionnaire/questions-config.ts` from exporting static data to fetching from database. This single change will make everything work because all components already use the config API.

**Critical Path:**
```
1. Make questions-config.ts read from DB
2. Update callers to handle async
3. Test Settings → change section → see it in form
```

That's it. The infrastructure is ready, just needs the connection.

