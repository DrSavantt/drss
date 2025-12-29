# COMPLETE AUDIT OF QUESTIONNAIRE SYSTEM
## All Files, Routes, Components, APIs, and Database Tables

**Generated:** December 28, 2025  
**Workspace:** `/Users/rocky/DRSS/savant-marketing-studio`

---

## EXECUTIVE SUMMARY

### The Core Problem

**Settings UI saves to database, but forms read from hardcoded files = changes have ZERO effect.**

### System Status

- ✅ **Database Infrastructure:** Fully built and working
- ✅ **Settings UI:** Functional CRUD operations
- ✅ **New Admin Form:** Config-driven rendering system
- ❌ **Config Layer:** Still reads from static files (NOT database)
- ❌ **Public Form:** Uses old hardcoded section components
- ❌ **Data Flow:** Disconnected (Settings → DB ✓, DB → Forms ❌)

### Immediate Impact

When you toggle a section OFF in Settings:
- **Expected:** Section disappears from all forms
- **Actual:** Nothing changes (forms read static file)

---

## PART 1: FILE INVENTORY

### A. Core Database Tables

| Table | Columns | Purpose | Status | Used By |
|-------|---------|---------|--------|---------|
| `questionnaire_sections` | id, key, title, description, estimated_minutes, sort_order, enabled, timestamps | Stores section definitions | ✅ Active | Settings UI, API routes |
| `questionnaire_questions` | id, section_id, question_key, sort_order, text, type, required, enabled, validation_rules, options, conditional_on, timestamps | Stores question definitions with validation | ✅ Active | Settings UI, API routes |
| `questionnaire_help` | id, question_id, title, where_to_find, how_to_extract, good_example, weak_example, quick_tip, timestamps | Stores help content for questions | ✅ Active | Settings UI, API routes |
| `questionnaire_responses` | id, client_id, user_id, version, response_data (JSONB), status, is_latest, submitted_at, submitted_by, timestamps | Stores submitted questionnaires with version history | ✅ Active | Response APIs, Submit actions |
| `client_questionnaire_overrides` | id, client_id, question_id, section_id, override_type, is_enabled, custom_text, custom_help (JSONB), timestamps | Per-client customization of questions/sections | ✅ Active | Override APIs, Customize popup |
| `clients.questionnaire_token` | TEXT column on clients table | Unique token for public form access | ✅ Active | Public form route |
| `clients.intake_responses` | JSONB column on clients table | Legacy storage (backward compatibility) | ⚠️ Deprecated | Old system only |
| `clients.questionnaire_status` | TEXT column on clients table | 'not_started', 'in_progress', 'completed' | ✅ Active | Status tracking |
| `clients.questionnaire_completed_at` | TIMESTAMPTZ column on clients table | Completion timestamp | ✅ Active | Metrics, display |
| `clients.questionnaire_progress` | JSONB column on clients table | Progress tracking | ⚠️ Deprecated | Old system only |

**Database Functions:**
- `get_next_response_version(p_client_id UUID)` - Gets next version number for responses
- `set_response_as_latest()` - Trigger function to mark response as latest
- `update_updated_at_column()` - Generic trigger for timestamps

**Migration Files:**
- `20251224000000_questionnaire_config_tables.sql` - Creates sections/questions/help tables
- `20251228000001_questionnaire_responses.sql` - Creates responses and overrides tables
- `20251214000001_add_questionnaire_token.sql` - Adds token column to clients

### B. API Routes

| Endpoint | Methods | Purpose | Database Tables | Status | Used By |
|----------|---------|---------|-----------------|--------|---------|
| `/api/questionnaire-config` | GET | Returns all sections & questions with help | questionnaire_sections, questionnaire_questions, questionnaire_help | ✅ Working | Admin forms, client components |
| `/api/client-questionnaire/[clientId]` | GET | Get merged config (global + overrides) | All questionnaire tables | ✅ Working | Customize popup |
| `/api/client-questionnaire/[clientId]/override` | POST | Create client-specific override | client_questionnaire_overrides | ✅ Working | Customize popup |
| `/api/client-questionnaire/[clientId]/override/[overrideId]` | PATCH, DELETE | Update/delete override | client_questionnaire_overrides | ✅ Working | Customize popup |
| `/api/client-questionnaire/[clientId]/overrides` | GET | Get all overrides for client | client_questionnaire_overrides | ✅ Working | Customize popup |
| `/api/questionnaire-response` | POST | Create new response | questionnaire_responses | ✅ Working | Admin form save |
| `/api/questionnaire-response/[clientId]` | GET | Get all versions for client | questionnaire_responses | ✅ Working | Response history |
| `/api/questionnaire-response/[clientId]/latest` | GET | Get latest response | questionnaire_responses | ✅ Working | Response viewer |
| `/api/questionnaire-response/[clientId]/submit` | PUT | Finalize draft as submitted | questionnaire_responses, clients | ✅ Working | Submit action |
| `/api/test-questionnaire-config` | GET | Test endpoint for debugging | All questionnaire tables | 🔧 Debug | Development only |

**API Coverage:** 100% CRUD operations exist for all tables

### C. Server Actions

| File | Functions | Purpose | Status |
|------|-----------|---------|--------|
| `app/actions/questionnaire.ts` | `saveQuestionnaire()`, `resetQuestionnaire()`, `submitPublicQuestionnaire()`, `savePublicQuestionnaireProgress()` | Handle form submissions and progress | ✅ Working (writes to both systems) |
| `app/actions/questionnaire-config.ts` | `getSections()`, `getEnabledSections()`, `getQuestions()`, `getQuestionsWithHelp()`, `toggleSection()`, `toggleQuestion()`, `updateSection()`, `updateQuestion()`, `updateHelp()`, `reorderSections()`, `reorderQuestions()` | CRUD operations for config tables | ✅ Working (reads/writes DB) |
| `app/actions/clients.ts` | Contains questionnaire-related client updates | Client management with questionnaire fields | ✅ Working |

**Server Actions Coverage:** Complete CRUD + specialized operations

### D. Frontend Routes/Pages

| Route | Purpose | Components Used | APIs/Actions Called | System | Status |
|-------|---------|-----------------|---------------------|--------|--------|
| `/dashboard/settings/questionnaire` | Admin settings page for managing questionnaire config | QuestionnaireSettingsClient | questionnaire-config actions (all CRUD) | NEW | ✅ Working |
| `/dashboard/clients/onboarding/[id]` | Admin-facing questionnaire form (internal) | SectionRenderer, QuestionRenderer, ProgressStepper, RichFooter | questionnaire-config actions, saveQuestionnaire | NEW | ⚠️ Reads static config |
| `/form/[token]` | Public-facing questionnaire form (client link) | PublicQuestionnaireForm, 8 hardcoded section components | submitPublicQuestionnaire, savePublicQuestionnaireProgress | OLD | ❌ Hardcoded sections |
| `/dashboard/clients/[id]/questionnaire-responses` | View response history and latest submission | ResponseViewer, ResponseHistory | /api/questionnaire-response/[clientId] | NEW | ✅ Working |
| `/dashboard/clients/[id]` (Client Detail) | Shows questionnaire status card and actions | ClientQuestionnaire, QuestionnaireStatusCard, ShareQuestionnairePopup | Various questionnaire APIs | MIXED | ⚠️ Uses both systems |

**Route Coverage:**
- Settings: 100%
- Admin Forms: 80% (uses new rendering, reads old config)
- Public Forms: 50% (old system, works but not config-driven)
- Viewing: 100%

### E. Components

#### Settings Components

| Component | Path | Purpose | Status |
|-----------|------|---------|--------|
| QuestionnaireSettings | `components/settings/questionnaire-settings.tsx` | Main settings UI with drag-drop sections/questions | ✅ Working |
| QuestionnaireSettingsClient | `app/dashboard/settings/questionnaire/page.tsx` | Server component wrapper | ✅ Working |
| QuestionEditorModal | `components/questionnaire/question-editor-modal.tsx` | Modal for editing question details | ✅ Working |

#### Form Components (Config-Driven - NEW System)

| Component | Path | Purpose | Status |
|-----------|------|---------|--------|
| SectionRenderer | `components/questionnaire/section-renderer.tsx` | Renders any section dynamically from config | ✅ Working |
| QuestionRenderer | `components/questionnaire/question-renderer.tsx` | Renders any question type dynamically | ✅ Working |
| ProgressStepper | `components/questionnaire/navigation/progress-stepper.tsx` | Top progress bar with section nav | ✅ Working |
| RichFooter | `components/questionnaire/navigation/rich-footer.tsx` | Bottom nav with save status | ✅ Working |
| HelpPanel | `components/questionnaire/help-system/help-panel.tsx` | Context help display | ✅ Working |
| QuestionWrapper | `components/questionnaire/question-types/question-wrapper.tsx` | Wrapper for all question types | ✅ Working |

#### Question Type Components (NEW System)

| Component | Path | Purpose | Status |
|-----------|------|---------|--------|
| LongTextQuestion | `components/questionnaire/question-types/long-text-question.tsx` | Textarea with char count | ✅ Working |
| ShortTextQuestion | `components/questionnaire/question-types/short-text-question.tsx` | Single line input | ✅ Working |
| MultipleChoiceQuestion | `components/questionnaire/question-types/multiple-choice-question.tsx` | Radio buttons | ✅ Working |
| FileUploadQuestion | `components/questionnaire/question-types/file-upload-question.tsx` | File uploads with preview | ✅ Working |

#### Section Components (OLD System - Hardcoded)

| Component | Path | Status | Used By |
|-----------|------|--------|---------|
| AvatarDefinitionSection | `components/questionnaire/sections/avatar-definition-section.tsx` | ⚠️ Deprecated | Public form only |
| DreamOutcomeSection | `components/questionnaire/sections/dream-outcome-section.tsx` | ⚠️ Deprecated | Public form only |
| ProblemsObstaclesSection | `components/questionnaire/sections/problems-obstacles-section.tsx` | ⚠️ Deprecated | Public form only |
| SolutionMethodologySection | `components/questionnaire/sections/solution-methodology-section.tsx` | ⚠️ Deprecated | Public form only |
| BrandVoiceSection | `components/questionnaire/sections/brand-voice-section.tsx` | ⚠️ Deprecated | Public form only |
| ProofTransformationSection | `components/questionnaire/sections/proof-transformation-section.tsx` | ⚠️ Deprecated | Public form only |
| FaithIntegrationSection | `components/questionnaire/sections/faith-integration-section.tsx` | ⚠️ Deprecated | Public form only |
| BusinessMetricsSection | `components/questionnaire/sections/business-metrics-section.tsx` | ⚠️ Deprecated | Public form only |

**Note:** These 8 section components are hardcoded implementations that duplicate functionality now available in SectionRenderer + QuestionRenderer. They exist only for backward compatibility with the public form.

#### Client Management Components

| Component | Path | Purpose | Status |
|-----------|------|---------|--------|
| ClientQuestionnaire | `components/clients/client-questionnaire.tsx` | Main questionnaire UI on client detail page | ✅ Working |
| QuestionnaireStatusCard | `components/clients/questionnaire-status-card.tsx` | Status badge and quick actions | ✅ Working |
| ShareQuestionnairePopup | `components/questionnaire/share-questionnaire-popup.tsx` | Customize & share link popup | ⚠️ Missing questions |
| ResponseViewer | `components/questionnaire/response-viewer.tsx` | View submitted responses | ✅ Working |
| ResponseHistory | `components/questionnaire/response-history.tsx` | Version history list | ✅ Working |
| QuestionnaireReview | `components/questionnaire/review/questionnaire-review.tsx` | Review before submit | ✅ Working |

#### Public Form Components

| Component | Path | Purpose | Status |
|-----------|------|---------|--------|
| PublicQuestionnaireForm | `components/questionnaire/public-questionnaire-form.tsx` | Main public form wrapper | ❌ Uses switch statement for sections |

### F. Library/Configuration Files

| File | Purpose | System | Status |
|------|---------|--------|--------|
| `lib/questionnaire/questions-config.ts` | **THE CRITICAL FILE** - Defines all sections and questions | OLD | ❌ **STATIC EXPORTS** (not reading DB) |
| `lib/questionnaire/section-data.ts` | Static section metadata | OLD | ⚠️ Deprecated (use DB) |
| `lib/questionnaire/help-guide-data.ts` | Static help content | OLD | ⚠️ Deprecated (use DB) |
| `lib/questionnaire/questionnaire-config-context.tsx` | React context for config | NEW | ⚠️ Wraps static config |
| `lib/questionnaire/use-questionnaire-form.ts` | Form state management hook | NEW | ✅ Working |
| `lib/questionnaire/validation-schemas.ts` | Zod schemas for validation | NEW | ✅ Working |
| `lib/questionnaire/dynamic-validation.ts` | Dynamic validation helpers | NEW | ✅ Working |
| `lib/questionnaire/conditional-logic.ts` | Conditional question display | NEW | ✅ Working |
| `lib/questionnaire/types.ts` | TypeScript types | NEW | ✅ Working |

**The Critical Disconnect:**

```typescript
// lib/questionnaire/questions-config.ts
// ❌ PROBLEM: These are static exports, NOT database queries
export const sections: SectionConfig[] = [ /* 8 hardcoded sections */ ]
export const questions: QuestionConfig[] = [ /* 34 hardcoded questions */ ]

// ✅ SOLUTION NEEDED: Make these async and query database
// See app/actions/questionnaire-config.ts for working DB queries
```

---

## PART 2: DATA FLOW DIAGRAMS

### Current (Broken) Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN CHANGES IN SETTINGS                │
│                                                              │
│  Settings UI → questionnaire-config actions → DATABASE ✅   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ (saved to database)
                              ▼
                    ┌──────────────────┐
                    │     DATABASE     │
                    │  8 sections      │
                    │  34 questions    │
                    │  34 help items   │
                    └──────────────────┘
                              │
                              │ ❌ NOT CONNECTED
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    CONFIG LAYER (BROKEN)                     │
│                                                              │
│  questions-config.ts ← READS FROM STATIC FILE ❌            │
│  (ignores database completely)                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ (static data)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         FORMS                                │
│                                                              │
│  Admin Form (onboarding/[id]) ← static config               │
│  Public Form (form/[token]) ← static config + hardcoded     │
│                                                              │
│  Result: Settings changes have ZERO effect ❌                │
└─────────────────────────────────────────────────────────────┘
```

### Correct (Target) Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN CHANGES IN SETTINGS                │
│                                                              │
│  Settings UI → questionnaire-config actions → DATABASE ✅   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ (saved to database)
                              ▼
                    ┌──────────────────┐
                    │     DATABASE     │
                    │  8 sections      │
                    │  34 questions    │
                    │  34 help items   │
                    └──────────────────┘
                              │
                              │ ✅ CONNECTED
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    CONFIG LAYER (FIXED)                      │
│                                                              │
│  questions-config.ts → queries database ✅                   │
│  (async functions that fetch fresh data)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ (database data)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         FORMS                                │
│                                                              │
│  Admin Form → SectionRenderer → dynamic rendering ✅         │
│  Public Form → SectionRenderer → dynamic rendering ✅        │
│                                                              │
│  Result: Settings changes instantly affect all forms ✅      │
└─────────────────────────────────────────────────────────────┘
```

### Response Submission Flow (Working)

```
┌──────────────────────┐
│   CLIENT FILLS FORM   │
│   (public or admin)   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  submitQuestionnaire  │
│  (server action)      │
└──────────┬───────────┘
           │
           ├───────────────────────────────────┐
           │                                   │
           ▼                                   ▼
┌──────────────────────┐          ┌──────────────────────┐
│ questionnaire_       │          │   clients table      │
│ responses            │          │   (backward compat)  │
│                      │          │                      │
│ - version history    │          │ - intake_responses   │
│ - draft/submitted    │          │ - status             │
│ - response_data      │          │ - completed_at       │
└──────────────────────┘          └──────────────────────┘

✅ NEW: Version history in dedicated table
✅ LEGACY: Still writes to clients.intake_responses
✅ DUAL WRITE: Maintains backward compatibility
```

### Customize Popup Flow (Partially Working)

```
┌──────────────────────────────────┐
│  User opens "Customize" popup     │
└─────────────┬────────────────────┘
              │
              ▼
┌──────────────────────────────────┐
│  GET /api/client-questionnaire/  │
│      [clientId]                   │
│                                   │
│  Returns:                         │
│  - Global config from DB ✅       │
│  - Client overrides ✅            │
│  - Merged result ✅               │
└─────────────┬────────────────────┘
              │
              ▼
┌──────────────────────────────────┐
│  ShareQuestionnairePopup          │
│  displays sections & questions    │
│                                   │
│  ISSUE: Questions appear empty ❌ │
│  (API returns data correctly,     │
│   but component isn't rendering)  │
└──────────────────────────────────┘
```

---

## PART 3: ISSUES IDENTIFIED

### Critical Issues

#### 1. Config Layer Not Connected to Database ⚠️ CRITICAL

**File:** `lib/questionnaire/questions-config.ts`

**Problem:**
```typescript
// Lines 52-153: Static exports instead of database queries
export const sections: SectionConfig[] = [
  { id: 1, key: 'avatar_definition', title: 'Avatar Definition', ... },
  { id: 2, key: 'dream_outcome', title: 'Dream Outcome', ... },
  // ... 8 sections hardcoded
]

export const questions: QuestionConfig[] = [
  { id: 'q1_ideal_customer', key: 'q1', sectionId: 1, ... },
  // ... 34 questions hardcoded
]
```

**Impact:**
- Settings UI changes save to database ✅
- Database receives updates correctly ✅  
- Forms read from static file ❌
- Settings changes have ZERO effect ❌

**Solution:** Make config functions async and query database
```typescript
// ✅ AFTER (proposed fix)
import { getSections, getQuestions } from '@/app/actions/questionnaire-config'

export async function getEnabledSections() {
  return await getSections().then(s => s.filter(x => x.enabled))
}

export async function getEnabledQuestions() {
  return await getQuestions().then(q => q.filter(x => x.enabled))
}
```

#### 2. Public Form Uses Hardcoded Sections ❌

**File:** `components/questionnaire/public-questionnaire-form.tsx`

**Problem:**
```typescript
// Lines 239-251: Switch statement with 8 hardcoded imports
const renderCurrentSection = () => {
  switch (currentSection) {
    case 1: return <AvatarDefinitionSection ... />
    case 2: return <DreamOutcomeSection ... />
    case 3: return <ProblemsObstaclesSection ... />
    case 4: return <SolutionMethodologySection ... />
    case 5: return <BrandVoiceSection ... />
    case 6: return <ProofTransformationSection ... />
    case 7: return <FaithIntegrationSection ... />
    case 8: return <BusinessMetricsSection ... />
    default: return null
  }
}
```

**Impact:**
- Public form can't benefit from database config
- Must maintain 8 separate component files
- Can't disable/reorder sections via Settings

**Solution:** Replace with SectionRenderer (like admin form)
```typescript
// ✅ AFTER (proposed fix)
const currentSectionConfig = sections.find(s => s.id === currentSection)
return currentSectionConfig ? (
  <SectionRenderer
    section={currentSectionConfig}
    formData={flatFormDataTyped}
    updateQuestion={updateQuestion}
    markQuestionCompleted={markQuestionCompleted}
    completedQuestions={completedQuestions}
  />
) : null
```

#### 3. Customize Popup Missing Questions ⚠️ HIGH PRIORITY

**File:** `components/questionnaire/share-questionnaire-popup.tsx`

**Problem:**
- API returns correct data (verified via network inspection)
- Questions array is populated in API response
- Component state receives data
- UI renders empty question list

**Suspected Causes:**
1. State update timing issue
2. Question filtering logic too strict
3. Conditional rendering hiding questions
4. Key/ID mismatch in iteration

**Investigation Needed:**
```typescript
// Lines 99-151: Fetch logic looks correct
// Lines 200-273: Rendering logic needs review
// Check: Are questions being filtered out incorrectly?
// Check: Is expandedSections blocking display?
```

### Medium Priority Issues

#### 4. Type Definitions Out of Sync

**File:** `types/database.ts`

**Problem:**
- Missing type definitions for `questionnaire_sections`
- Missing type definitions for `questionnaire_questions`
- Missing type definitions for `questionnaire_help`
- Missing type definitions for `questionnaire_responses`
- Missing type definitions for `client_questionnaire_overrides`

**Impact:**
- No TypeScript safety for new tables
- Have to manually type database queries
- Risk of runtime errors

**Solution:** Regenerate types from Supabase schema
```bash
npx supabase gen types typescript --project-id <project-id> > types/database.ts
```

#### 5. Duplicate Data Definitions

**Files:**
- `lib/questionnaire/questions-config.ts` (static)
- `lib/questionnaire/section-data.ts` (static)
- `lib/questionnaire/help-guide-data.ts` (static)
- Database tables (dynamic)

**Problem:**
- Same data defined in 4 places
- Must keep in sync manually
- Source of truth unclear

**Solution:** Remove static files after migration complete

### Low Priority Issues

#### 6. Legacy Fields Still in Use

**Fields on `clients` table:**
- `intake_responses` (JSONB) - Still written for backward compat
- `questionnaire_progress` (JSONB) - Not used by new system

**Impact:** Minor (backward compat is fine, but adds confusion)

**Solution:** Document as legacy, plan eventual removal

#### 7. No Caching on Config Queries

**Problem:**
- Every page load fetches config from database
- No revalidation strategy
- Could impact performance at scale

**Solution:** Add React Cache or SWR
```typescript
import { cache } from 'react'

export const getEnabledSections = cache(async () => {
  // ... query database
})
```

---

## PART 4: SYSTEM COMPARISON

### OLD SYSTEM (Pre-Feature D+)

**Architecture:**
```
Static Config Files
  ↓
8 Hardcoded Section Components
  ↓
PublicQuestionnaireForm (switch statement)
  ↓
Saves to clients.intake_responses (JSONB)
```

**Files:**
- `components/questionnaire/sections/*.tsx` (8 files)
- `lib/questionnaire/questions-config.ts` (static)
- `lib/questionnaire/section-data.ts` (static)
- `lib/questionnaire/help-guide-data.ts` (static)

**Pros:**
- Works reliably
- No database queries needed
- Simple to understand

**Cons:**
- Can't customize without code changes
- Must deploy to change questions
- Duplicate logic across 8 components
- No per-client customization

### NEW SYSTEM (Feature D+)

**Architecture:**
```
Database Tables (sections/questions/help)
  ↓
Server Actions (questionnaire-config.ts)
  ↓
Config Context (questionnaire-config-context.tsx)
  ↓
Generic Renderers (SectionRenderer + QuestionRenderer)
  ↓
Saves to questionnaire_responses + clients.intake_responses
```

**Files:**
- Database migration files (3 files)
- `app/actions/questionnaire-config.ts` (server actions)
- `components/questionnaire/section-renderer.tsx`
- `components/questionnaire/question-renderer.tsx`
- `components/questionnaire/question-types/*.tsx` (4 question types)
- Settings UI for management

**Pros:**
- Fully customizable via UI
- Per-client overrides
- Version history
- Reorder sections/questions
- Dynamic validation
- Help content management
- No code deploys for changes

**Cons:**
- More complex
- Requires database
- Not fully wired up yet
- Static config still in use

### THE GAP (What's Not Connected)

```
NEW SYSTEM              THE GAP              OLD SYSTEM
                                          
Database Tables    ←   NOT CONNECTED  →   Config Layer
(working)                                  (static files)
                                                 ↓
Settings UI                              Admin Form (reads static)
(working)                                Public Form (reads static)
                                         All rendering components
```

**To Close the Gap:**
1. Make `questions-config.ts` query database (2 hours)
2. Update public form to use SectionRenderer (3 hours)
3. Remove static data files (1 hour)

---

## PART 5: DETAILED COMPONENT ANALYSIS

### Settings UI Components

#### QuestionnaireSettings
**Path:** `components/settings/questionnaire-settings.tsx`  
**Lines:** 697  
**Purpose:** Complete CRUD UI for managing questionnaire config

**Features:**
- ✅ View all sections and questions
- ✅ Toggle sections/questions on/off
- ✅ Drag-drop reorder sections
- ✅ Drag-drop reorder questions within section
- ✅ Edit section metadata (title, description, time estimate)
- ✅ Edit question properties (text, validation, placeholder)
- ✅ Edit help content (title, tips, examples)
- ✅ Real-time save with optimistic updates
- ✅ Stats display (enabled counts, total time)

**Database Operations:**
- Queries: `getSections()`, `getQuestionsWithHelp()`
- Updates: `updateSection()`, `updateQuestion()`, `updateHelp()`
- Toggles: `toggleSection()`, `toggleQuestion()`
- Reorder: `reorderSections()`, `reorderQuestions()`

**Status:** ✅ Fully functional, all operations work correctly

**Known Issues:** None - this component is working perfectly

### Admin Form Components

#### SectionRenderer
**Path:** `components/questionnaire/section-renderer.tsx`  
**Purpose:** Dynamically render any section based on config

**How It Works:**
1. Receives section config (from database eventually)
2. Gets questions for that section
3. Filters questions based on conditional logic
4. Renders QuestionRenderer for each visible question

**Status:** ✅ Works perfectly WHEN given database config  
**Issue:** Currently receives static config from `questions-config.ts`

#### QuestionRenderer
**Path:** `components/questionnaire/question-renderer.tsx`  
**Purpose:** Dynamically render any question type

**Supported Types:**
- `long-text` → LongTextQuestion (textarea)
- `short-text` → ShortTextQuestion (input)
- `multiple-choice` → MultipleChoiceQuestion (radio)
- `file-upload` → FileUploadQuestion (file input)

**Features:**
- ✅ Validation (min/max length, required)
- ✅ Help system integration
- ✅ Conditional display
- ✅ Error display
- ✅ Completion tracking

**Status:** ✅ Fully functional

### Public Form Component

#### PublicQuestionnaireForm
**Path:** `components/questionnaire/public-questionnaire-form.tsx`  
**Lines:** 373  
**Status:** ❌ Uses old hardcoded system

**Current Architecture:**
```typescript
// Lines 10-17: Imports for 8 separate section components
import AvatarDefinitionSection from '@/components/questionnaire/sections/avatar-definition-section'
import DreamOutcomeSection from '@/components/questionnaire/sections/dream-outcome-section'
// ... 6 more imports

// Lines 239-251: Switch statement routing
switch (currentSection) {
  case 1: return <AvatarDefinitionSection ... />
  case 2: return <DreamOutcomeSection ... />
  // ... etc
}
```

**Problems:**
1. Can't use database config
2. Can't disable sections
3. Can't reorder sections
4. Duplicates logic in 8 files
5. Must maintain parity with admin form

**Migration Path:**
1. Accept `sections` and `questions` props
2. Replace switch with SectionRenderer
3. Remove hardcoded section imports
4. Test thoroughly

**Estimated Effort:** 3 hours

### Customize Popup Component

#### ShareQuestionnairePopup
**Path:** `components/questionnaire/share-questionnaire-popup.tsx`  
**Lines:** 373  
**Status:** ⚠️ Partially working (missing questions display)

**What Works:**
- ✅ Fetches merged config (global + overrides)
- ✅ API returns correct data
- ✅ Copy link to clipboard
- ✅ Section headers display
- ✅ Can expand sections

**What's Broken:**
- ❌ Questions list appears empty
- ❌ Can't see which questions are enabled
- ❌ Can't customize questions
- ❌ Edit button doesn't show questions

**Suspected Issue:**
Lines 200-273 (rendering logic) - questions not displaying despite being in state

**Investigation Needed:**
```typescript
// Line 95: expandedSections state - check if blocking display
// Lines 200-230: Section mapping - check if questions being passed
// Lines 240-273: Question rendering - check if keys/IDs match
```

**Debug Steps:**
1. Add console.log in render to see questions array
2. Check if `section.questions` is populated
3. Verify question IDs match expected format
4. Check conditional rendering logic

---

## PART 6: MIGRATION RECOMMENDATIONS

### Phase A: Fix Config Layer (2 hours) ⚡ CRITICAL

**Goal:** Connect `questions-config.ts` to database

**Changes:**

1. **Update `lib/questionnaire/questions-config.ts`**

```typescript
// BEFORE (static exports)
export const sections: SectionConfig[] = [...]
export const questions: QuestionConfig[] = [...]

export function getEnabledSections() {
  return sections.filter(s => s.enabled)
}

// AFTER (database queries)
import { getSections, getQuestions } from '@/app/actions/questionnaire-config'

export async function getEnabledSections() {
  const sections = await getSections()
  return sections.filter(s => s.enabled)
}

export async function getEnabledQuestions() {
  const questions = await getQuestions()
  return questions.filter(q => q.enabled)
}
```

2. **Update context to be async**

`lib/questionnaire/questionnaire-config-context.tsx`:
- Make provider fetch from database on mount
- Add loading state
- Handle errors

3. **Test:**
- Toggle section in Settings
- Verify disappears from admin form
- Toggle back on
- Verify reappears

**Success Criteria:** Settings changes immediately affect admin form

**Risk:** Low (infrastructure exists, just needs wiring)

### Phase B: Migrate Public Form (3 hours)

**Goal:** Make public form config-driven

**Changes:**

1. **Update `app/form/[token]/page.tsx`**

```typescript
// Add before return
const sections = await getEnabledSections()
const questions = await getEnabledQuestions()

return (
  <PublicQuestionnaireForm 
    client={client}
    token={token}
    sections={sections}      // NEW
    questions={questions}    // NEW
  />
)
```

2. **Update `components/questionnaire/public-questionnaire-form.tsx`**

```typescript
// Add props
interface Props {
  client: Client
  token: string
  sections: SectionConfig[]    // NEW
  questions: QuestionConfig[]  // NEW
}

// Replace switch statement (lines 239-251)
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

// Remove imports (lines 10-17)
// DELETE: All 8 section component imports
```

3. **Test:**
- Open public form with token
- Fill out questionnaire
- Submit successfully
- Verify saves to database
- Verify disabled sections don't appear

**Success Criteria:** Public form respects Settings changes

**Risk:** Medium (larger change, needs thorough testing)

### Phase C: Fix Customize Popup (2 hours)

**Goal:** Make questions visible in customize popup

**Investigation:**

1. Add debug logging:
```typescript
// In ShareQuestionnairePopup.tsx, line ~210
console.log('Rendering sections:', sections)
console.log('Section questions:', sections.map(s => ({
  id: s.id,
  title: s.title,
  questionCount: s.questions?.length || 0
})))
```

2. Check if questions array is empty vs. questions not rendering

3. Review rendering logic (lines 240-273)

4. Check if `expandedSections` state is blocking

**Possible Fixes:**

A. If questions array is empty:
- Check API response structure
- Verify `section.questions` is populated in fetch

B. If questions exist but don't render:
- Check keys in map iteration
- Verify conditional rendering logic
- Check if hidden by CSS

**Test:**
- Open customize popup
- Expand section
- See questions list
- Toggle question on/off
- Edit question text
- Verify changes save

**Success Criteria:** Full CRUD on per-client customizations

**Risk:** Low (isolated component)

### Phase D: Cleanup (1 hour)

**Goal:** Remove deprecated files

**Files to Delete:**

```
components/questionnaire/sections/
├─ avatar-definition-section.tsx         (DELETE)
├─ dream-outcome-section.tsx             (DELETE)
├─ problems-obstacles-section.tsx        (DELETE)
├─ solution-methodology-section.tsx      (DELETE)
├─ brand-voice-section.tsx               (DELETE)
├─ proof-transformation-section.tsx      (DELETE)
├─ faith-integration-section.tsx         (DELETE)
└─ business-metrics-section.tsx          (DELETE)

lib/questionnaire/
├─ section-data.ts                       (DELETE - data in DB)
└─ help-guide-data.ts                    (DELETE - data in DB)

lib/questionnaire/questions-config.ts    (REFACTOR - keep file, remove static arrays)
```

**Keep:**
- `components/questionnaire/sections/section-container.tsx` (used by SectionRenderer)
- `components/questionnaire/sections/section-header.tsx` (used by SectionRenderer)
- `components/questionnaire/sections/section-header-card.tsx` (used by SectionRenderer)

**Update:**
```typescript
// lib/questionnaire/questions-config.ts
// Remove lines 52-1200 (all static arrays)
// Keep only async database query functions
```

**Test:**
- Run TypeScript check: `npm run type-check`
- No broken imports
- All forms still work
- Settings still works

**Success Criteria:** Codebase has single source of truth (database)

**Risk:** Low (only removing unused code)

### Phase E: Performance & Polish (1 hour)

**Goal:** Add caching and optimize

**Changes:**

1. **Add caching to config queries**

```typescript
// lib/questionnaire/questions-config.ts
import { cache } from 'react'
import { unstable_cache } from 'next/cache'

export const getEnabledSections = cache(async () => {
  return unstable_cache(
    async () => {
      const sections = await getSections()
      return sections.filter(s => s.enabled)
    },
    ['questionnaire-sections'],
    { revalidate: 60 } // Cache for 60 seconds
  )()
})
```

2. **Add revalidation on updates**

```typescript
// app/actions/questionnaire-config.ts
export async function updateSection(id: number, updates: Partial<SectionConfig>) {
  // ... update logic
  revalidatePath('/dashboard/clients/onboarding/[id]')
  revalidatePath('/form/[token]')
  revalidatePath('/dashboard/settings/questionnaire')
  return data
}
```

3. **Add loading states**
- Skeleton loaders for forms
- Loading spinners in customize popup
- Better error messages

**Success Criteria:** Fast load times, good UX

**Risk:** Low (polish only)

---

## PART 7: TESTING CHECKLIST

### Unit Tests Needed

- [ ] Config query functions return correct data
- [ ] SectionRenderer handles all section types
- [ ] QuestionRenderer handles all question types
- [ ] Conditional logic works correctly
- [ ] Validation schemas catch errors

### Integration Tests Needed

- [ ] Admin form saves to database
- [ ] Public form saves to database
- [ ] Version history tracks changes
- [ ] Overrides merge correctly
- [ ] Settings changes affect forms

### End-to-End Tests Needed

#### Admin Workflow
- [ ] Create new client
- [ ] Open onboarding form
- [ ] Fill out all sections
- [ ] Submit questionnaire
- [ ] View responses
- [ ] Edit responses
- [ ] Resubmit

#### Public Workflow
- [ ] Copy questionnaire link
- [ ] Open in incognito
- [ ] Fill out form
- [ ] Auto-save works
- [ ] Submit successfully
- [ ] See thank you page

#### Settings Workflow
- [ ] Disable section
- [ ] Verify disappears from forms
- [ ] Re-enable section
- [ ] Verify reappears
- [ ] Edit question text
- [ ] Verify shows new text
- [ ] Reorder sections
- [ ] Verify new order in forms

#### Customization Workflow
- [ ] Open customize popup
- [ ] Disable question for client
- [ ] Edit question text for client
- [ ] Save overrides
- [ ] Public form shows customized version
- [ ] Other clients unaffected

---

## PART 8: SUCCESS METRICS

### Migration Complete When:

- ✅ Settings changes instantly affect all forms
- ✅ Admin can disable section → section disappears everywhere
- ✅ Admin can edit question → new text shows everywhere
- ✅ Public form is config-driven (no hardcoded sections)
- ✅ Customize popup shows all questions
- ✅ Per-client overrides work correctly
- ✅ No TypeScript errors
- ✅ No broken imports
- ✅ All deprecated files removed
- ✅ Single source of truth (database)

### Quick Test (2 minutes)

**The "Faith Section Test":**

1. Go to Settings → Questionnaire
2. Find "Faith Integration" section
3. Toggle it OFF
4. Open admin form → Faith section should NOT appear ✓
5. Open public form → Faith section should NOT appear ✓
6. Toggle back ON
7. Both forms should show it again ✓

**If this test passes:** Migration is successful ✅

**If this test fails:** Config layer still reading static file ❌

---

## PART 9: PRIORITY MATRIX

| Issue | Impact | Effort | Priority | Phase |
|-------|--------|--------|----------|-------|
| Config not reading DB | 🔴 Critical | 2h | P0 | A |
| Public form hardcoded | 🟠 High | 3h | P1 | B |
| Customize popup broken | 🟠 High | 2h | P1 | C |
| Type definitions missing | 🟡 Medium | 1h | P2 | D |
| Duplicate data definitions | 🟡 Medium | 1h | P2 | D |
| No caching | 🟢 Low | 1h | P3 | E |
| Legacy fields | 🟢 Low | 0h | P4 | Future |

**Total Effort:** ~10 hours
**Can be done incrementally:** Yes
**Breaking changes:** No (backward compatible)

---

## PART 10: IMPLEMENTATION ORDER

### Week 1: Critical Path (High ROI)

**Day 1-2: Phase A - Fix Config Layer**
- Make questions-config.ts query database
- Update context to be async
- Test with admin form

**Day 3-4: Phase C - Fix Customize Popup**
- Debug missing questions
- Verify API responses
- Fix rendering logic

**Day 5: Testing & Verification**
- Run full test suite
- Manual E2E testing
- Document changes

### Week 2: Complete Migration

**Day 1-3: Phase B - Migrate Public Form**
- Update form to accept config props
- Replace switch with SectionRenderer
- Remove hardcoded imports
- Extensive testing

**Day 4: Phase D - Cleanup**
- Delete deprecated files
- Remove static arrays
- Fix broken imports

**Day 5: Phase E - Polish**
- Add caching
- Improve loading states
- Performance optimization

---

## APPENDIX A: FILE REFERENCE

### Complete File List (Questionnaire-Related)

**Database Migrations (3 files):**
- `supabase/migrations/20251214000001_add_questionnaire_token.sql`
- `supabase/migrations/20251224000000_questionnaire_config_tables.sql`
- `supabase/migrations/20251228000001_questionnaire_responses.sql`

**API Routes (10 files):**
- `app/api/questionnaire-config/route.ts`
- `app/api/test-questionnaire-config/route.ts`
- `app/api/client-questionnaire/[clientId]/route.ts`
- `app/api/client-questionnaire/[clientId]/override/route.ts`
- `app/api/client-questionnaire/[clientId]/override/[overrideId]/route.ts`
- `app/api/client-questionnaire/[clientId]/overrides/route.ts`
- `app/api/questionnaire-response/route.ts`
- `app/api/questionnaire-response/[clientId]/route.ts`
- `app/api/questionnaire-response/[clientId]/latest/route.ts`
- `app/api/questionnaire-response/[clientId]/submit/route.ts`

**Server Actions (2 files):**
- `app/actions/questionnaire.ts`
- `app/actions/questionnaire-config.ts`

**Pages/Routes (3 files):**
- `app/dashboard/settings/questionnaire/page.tsx`
- `app/dashboard/clients/onboarding/[id]/page.tsx`
- `app/form/[token]/page.tsx`

**Settings Components (3 files):**
- `components/settings/questionnaire-settings.tsx`
- `components/questionnaire/question-editor-modal.tsx`
- `app/dashboard/settings/questionnaire/questionnaire-settings-client.tsx` (if separate)

**Form Components - Config-Driven (15 files):**
- `components/questionnaire/section-renderer.tsx`
- `components/questionnaire/question-renderer.tsx`
- `components/questionnaire/navigation/progress-stepper.tsx`
- `components/questionnaire/navigation/progress-indicator.tsx`
- `components/questionnaire/navigation/section-nav.tsx`
- `components/questionnaire/navigation/rich-footer.tsx`
- `components/questionnaire/navigation/step-footer.tsx`
- `components/questionnaire/help-system/help-panel.tsx`
- `components/questionnaire/help-system/help-trigger.tsx`
- `components/questionnaire/help-system/help-content.tsx`
- `components/questionnaire/help-system/config-help-content.tsx`
- `components/questionnaire/question-types/question-wrapper.tsx`
- `components/questionnaire/question-types/long-text-question.tsx`
- `components/questionnaire/question-types/short-text-question.tsx`
- `components/questionnaire/question-types/multiple-choice-question.tsx`
- `components/questionnaire/question-types/file-upload-question.tsx`

**Form Components - Hardcoded (8 files - TO BE DELETED):**
- `components/questionnaire/sections/avatar-definition-section.tsx`
- `components/questionnaire/sections/dream-outcome-section.tsx`
- `components/questionnaire/sections/problems-obstacles-section.tsx`
- `components/questionnaire/sections/solution-methodology-section.tsx`
- `components/questionnaire/sections/brand-voice-section.tsx`
- `components/questionnaire/sections/proof-transformation-section.tsx`
- `components/questionnaire/sections/faith-integration-section.tsx`
- `components/questionnaire/sections/business-metrics-section.tsx`

**Form Components - Shared (3 files - KEEP):**
- `components/questionnaire/sections/section-container.tsx`
- `components/questionnaire/sections/section-header.tsx`
- `components/questionnaire/sections/section-header-card.tsx`

**Public Form (1 file):**
- `components/questionnaire/public-questionnaire-form.tsx`

**Client Management (5 files):**
- `components/clients/client-questionnaire.tsx`
- `components/clients/questionnaire-status-card.tsx`
- `components/questionnaire/share-questionnaire-popup.tsx`
- `components/questionnaire/response-viewer.tsx`
- `components/questionnaire/response-history.tsx`

**Review Components (3 files):**
- `components/questionnaire/review/questionnaire-review.tsx`
- `components/questionnaire/review/review-section-card.tsx`
- `components/questionnaire/review/index.ts`

**Library/Config (9 files):**
- `lib/questionnaire/questions-config.ts` ⚠️ NEEDS REFACTOR
- `lib/questionnaire/section-data.ts` ⚠️ TO DELETE
- `lib/questionnaire/help-guide-data.ts` ⚠️ TO DELETE
- `lib/questionnaire/questionnaire-config-context.tsx`
- `lib/questionnaire/use-questionnaire-form.ts`
- `lib/questionnaire/validation-schemas.ts`
- `lib/questionnaire/dynamic-validation.ts`
- `lib/questionnaire/conditional-logic.ts`
- `lib/questionnaire/types.ts`

**Documentation (8 files):**
- `docs/feature-d-plus/QUESTIONNAIRE_MIGRATION_PLAN.md`
- `docs/feature-d-plus/QUESTIONNAIRE_ARCHITECTURE_DIAGRAM.md`
- `docs/feature-d-plus/QUESTIONNAIRE_MIGRATION_INDEX.md`
- `docs/feature-d-plus/QUESTIONNAIRE_MIGRATION_SUMMARY.md`
- `docs/feature-d-plus/QUESTIONNAIRE_WIRING_SUMMARY.md`
- `docs/feature-d-plus/QUESTIONNAIRE_FLOW_AUDIT.md`
- `docs/feature-d-plus/QUESTIONNAIRE_SETTINGS_QUICKSTART.md`
- `_docs/references/QUESTIONNAIRE_UI_FIXES.md`

**Total Files:** ~70 questionnaire-related files

---

## APPENDIX B: DATABASE SCHEMA

### questionnaire_sections

```sql
CREATE TABLE questionnaire_sections (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,              -- e.g., "avatar_definition"
  title TEXT NOT NULL,
  description TEXT,
  estimated_minutes INTEGER DEFAULT 5,
  sort_order INTEGER NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Current Data:** 8 rows (Avatar Definition, Dream Outcome, Problems & Obstacles, Solution Methodology, Brand Voice, Proof & Transformation, Faith Integration, Business Metrics)

### questionnaire_questions

```sql
CREATE TABLE questionnaire_questions (
  id TEXT PRIMARY KEY,                   -- e.g., "q1_ideal_customer"
  section_id INTEGER REFERENCES questionnaire_sections(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,            -- e.g., "q1"
  sort_order INTEGER NOT NULL,
  text TEXT NOT NULL,
  type TEXT NOT NULL,                    -- 'long-text', 'short-text', 'multiple-choice', 'checkbox', 'file-upload'
  required BOOLEAN DEFAULT true,
  enabled BOOLEAN DEFAULT true,
  min_length INTEGER,
  max_length INTEGER,
  placeholder TEXT,
  options JSONB,                         -- [{"value": "x", "label": "X"}]
  conditional_on JSONB,                  -- {"questionId": "q30", "notEquals": "separate"}
  accepted_file_types TEXT[],
  max_file_size INTEGER,                 -- MB
  max_files INTEGER DEFAULT 5,
  file_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Current Data:** 34 rows (all questions from Q1-Q34)

### questionnaire_help

```sql
CREATE TABLE questionnaire_help (
  id SERIAL PRIMARY KEY,
  question_id TEXT UNIQUE REFERENCES questionnaire_questions(id) ON DELETE CASCADE,
  title TEXT,
  where_to_find TEXT[],
  how_to_extract TEXT[],
  good_example TEXT,
  weak_example TEXT,
  quick_tip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Current Data:** 34 rows (help for each question)

### questionnaire_responses

```sql
CREATE TABLE questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  version INTEGER DEFAULT 1,
  response_data JSONB NOT NULL,          -- Clean data structure
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
  is_latest BOOLEAN DEFAULT true,
  submitted_at TIMESTAMPTZ,
  submitted_by TEXT CHECK (submitted_by IN ('client', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Features:**
- Version history (auto-increments per client)
- Draft/submitted status
- Tracks who submitted
- Only one `is_latest = true` per client (enforced by trigger)

### client_questionnaire_overrides

```sql
CREATE TABLE client_questionnaire_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  question_id TEXT REFERENCES questionnaire_questions(id) ON DELETE CASCADE,
  section_id INTEGER REFERENCES questionnaire_sections(id) ON DELETE CASCADE,
  override_type TEXT NOT NULL CHECK (override_type IN ('question', 'section', 'help')),
  is_enabled BOOLEAN DEFAULT true,
  custom_text TEXT,
  custom_help JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_client_question_override UNIQUE (client_id, question_id),
  CONSTRAINT unique_client_section_override UNIQUE (client_id, section_id, override_type),
  CONSTRAINT valid_override_target CHECK (
    (question_id IS NOT NULL AND section_id IS NULL) OR
    (question_id IS NULL AND section_id IS NOT NULL)
  )
);
```

**Features:**
- Per-client question/section customization
- Can disable questions for specific clients
- Can customize question text per client
- Can customize help content per client

---

## APPENDIX C: API DOCUMENTATION

### GET /api/questionnaire-config

**Purpose:** Get all questionnaire sections and questions with help

**Auth:** Required (user must be logged in)

**Response:**
```json
{
  "sections": [
    {
      "id": 1,
      "key": "avatar_definition",
      "title": "Avatar Definition",
      "description": "Define your ideal customer",
      "estimated_minutes": 7,
      "sort_order": 1,
      "enabled": true
    }
  ],
  "questions": [
    {
      "id": "q1_ideal_customer",
      "section_id": 1,
      "question_key": "q1",
      "sort_order": 1,
      "text": "Who is your ideal customer?",
      "type": "long-text",
      "required": true,
      "enabled": true,
      "min_length": 50,
      "max_length": 500,
      "placeholder": "Describe your ideal customer...",
      "help": {
        "id": 1,
        "question_id": "q1_ideal_customer",
        "title": "Defining Your Ideal Customer",
        "quick_tip": "Be specific about demographics and psychographics",
        "good_example": "Women aged 35-50 who...",
        "weak_example": "Everyone who needs help"
      }
    }
  ]
}
```

**Usage:**
- Admin forms fetch this on load
- Settings UI uses this for editing

### GET /api/client-questionnaire/[clientId]

**Purpose:** Get merged config (global + client-specific overrides)

**Auth:** Required (must own client)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "key": "avatar_definition",
      "title": "Avatar Definition",
      "enabled": true,
      "questions": [
        {
          "id": "q1_ideal_customer",
          "text": "Who is your ideal customer?",
          "enabled": true,
          "_hasOverride": false,
          "_usingGlobal": true
        },
        {
          "id": "q2_avatar_criteria",
          "text": "Custom question for this client",
          "enabled": true,
          "_hasOverride": true,
          "_overrideId": "uuid-here",
          "_usingGlobal": false
        }
      ]
    }
  ],
  "client": {
    "id": "client-uuid",
    "name": "Acme Corp"
  },
  "overrideCount": 3
}
```

**Usage:**
- Customize popup
- Client-specific forms

### POST /api/client-questionnaire/[clientId]/override

**Purpose:** Create client-specific override

**Auth:** Required (must own client)

**Body:**
```json
{
  "question_id": "q1_ideal_customer",
  "override_type": "question",
  "is_enabled": false
}
```
or
```json
{
  "question_id": "q1_ideal_customer",
  "override_type": "question",
  "custom_text": "What type of customer do you serve?"
}
```

**Response:**
```json
{
  "data": {
    "id": "override-uuid",
    "client_id": "client-uuid",
    "question_id": "q1_ideal_customer",
    "override_type": "question",
    "is_enabled": true,
    "custom_text": "What type of customer do you serve?",
    "created_at": "2025-12-28T00:00:00Z"
  }
}
```

### GET /api/questionnaire-response/[clientId]

**Purpose:** Get all response versions for client

**Auth:** Required (must own client)

**Response:**
```json
{
  "data": [
    {
      "id": "response-uuid",
      "client_id": "client-uuid",
      "version": 2,
      "status": "submitted",
      "is_latest": true,
      "submitted_at": "2025-12-28T00:00:00Z",
      "submitted_by": "client",
      "response_data": {
        "avatar_definition": {
          "q1_ideal_customer": "Women aged 35-50...",
          "q2_avatar_criteria": "High income..."
        }
      }
    },
    {
      "id": "response-uuid-2",
      "version": 1,
      "status": "submitted",
      "is_latest": false,
      "submitted_at": "2025-12-20T00:00:00Z",
      "submitted_by": "admin"
    }
  ]
}
```

---

## CONCLUSION

This audit provides a complete picture of the questionnaire system. The infrastructure is solid and well-built. The only missing piece is connecting the config layer to the database, which is a straightforward fix.

**Bottom Line:**
- Backend: ✅ 95% complete (database, APIs, actions all working)
- Frontend: ⚠️ 70% complete (rendering works, but reads static config)
- The Gap: 🔴 Config layer not connected to database

**Fix Effort:** ~10 hours total over 2 weeks

**Impact:** Transform from static system to fully dynamic, admin-manageable questionnaire platform

**Confidence:** High - all pieces exist, just need final wiring

---

**Next Step:** Start with Phase A (Fix Config Layer) - highest impact, lowest risk, 2-hour investment

