# Questionnaire System Architecture

## 🔴 CURRENT STATE (BROKEN)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ADMIN SETTINGS UI                            │
│                   /dashboard/settings/questionnaire                  │
│                                                                       │
│  [Toggle Section ON/OFF]  [Edit Questions]  [Reorder]               │
│                                                                       │
│  Uses: app/actions/questionnaire-config.ts                          │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ ✅ Writes successfully
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SUPABASE DATABASE                               │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ questionnaire_sections (8 rows)                              │   │
│  │ - id, key, title, description, enabled, sort_order          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ questionnaire_questions (34 rows)                            │   │
│  │ - id, text, type, required, validation rules, conditional    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ questionnaire_help (34 rows)                                 │   │
│  │ - question_id, title, where_to_find, how_to_extract, tips   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ ❌ NOT READ!
                               │ (THE BROKEN LINK)
                               │
                               ▼
                          (Nothing reads this)
                               
                               
                               
┌─────────────────────────────────────────────────────────────────────┐
│                       STATIC CONFIG FILE                             │
│                lib/questionnaire/questions-config.ts                 │
│                                                                       │
│  export const sections = [                                           │
│    { id: 1, title: "Avatar Definition", ... },  // ❌ Hardcoded     │
│    { id: 2, title: "Dream Outcome", ... },                          │
│    // ... 8 sections                                                 │
│  ]                                                                   │
│                                                                       │
│  export function getEnabledSections() {                              │
│    return sections.filter(s => s.enabled)  // ❌ Static array       │
│  }                                                                   │
│                                                                       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ ✅ Read by all forms
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        QUESTIONNAIRE FORMS                           │
│                                                                       │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐   │
│  │   ADMIN FORM             │  │   PUBLIC FORM                 │   │
│  │   /dashboard/clients/    │  │   /form/[token]               │   │
│  │   onboarding/[id]        │  │                               │   │
│  │                          │  │                               │   │
│  │  Uses:                   │  │  Uses:                        │   │
│  │  ✅ SectionRenderer      │  │  ❌ Switch statement          │   │
│  │  ✅ QuestionRenderer     │  │  ❌ 8 hardcoded sections:     │   │
│  │  ✅ Config-driven        │  │     - AvatarDefinition        │   │
│  │                          │  │     - DreamOutcome            │   │
│  │  ❌ Reads static config  │  │     - ProblemsObstacles       │   │
│  │                          │  │     - Solution                │   │
│  │                          │  │     - BrandVoice              │   │
│  │                          │  │     - Proof                   │   │
│  │                          │  │     - FaithIntegration        │   │
│  │                          │  │     - BusinessMetrics         │   │
│  └──────────────────────────┘  └──────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

RESULT: Changes in Settings have ZERO effect on forms!
```

---

## 🟢 DESIRED STATE (WORKING)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ADMIN SETTINGS UI                            │
│                   /dashboard/settings/questionnaire                  │
│                                                                       │
│  [Toggle Section ON/OFF]  [Edit Questions]  [Reorder]               │
│                                                                       │
│  Uses: app/actions/questionnaire-config.ts                          │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ ✅ Writes
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SUPABASE DATABASE                               │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ questionnaire_sections (8 rows)                              │   │
│  │ - id, key, title, description, enabled, sort_order          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ questionnaire_questions (34 rows)                            │   │
│  │ - id, text, type, required, validation rules, conditional    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ questionnaire_help (34 rows)                                 │   │
│  │ - question_id, title, where_to_find, how_to_extract, tips   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ ✅ Reads (FIXED!)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CONFIG API LAYER                                │
│                lib/questionnaire/questions-config.ts                 │
│                                                                       │
│  import { getEnabledSections as dbGet }                              │
│    from '@/app/actions/questionnaire-config'                        │
│                                                                       │
│  export async function getEnabledSections() {                        │
│    return await dbGet()  // ✅ Queries database                     │
│  }                                                                   │
│                                                                       │
│  export async function getQuestions() {                              │
│    return await dbGetQuestions()  // ✅ Queries database            │
│  }                                                                   │
│                                                                       │
│  (All helpers read from database, cached for performance)            │
│                                                                       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ ✅ Used by all forms
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        QUESTIONNAIRE FORMS                           │
│                                                                       │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐   │
│  │   ADMIN FORM             │  │   PUBLIC FORM                 │   │
│  │   /dashboard/clients/    │  │   /form/[token]               │   │
│  │   onboarding/[id]        │  │                               │   │
│  │                          │  │                               │   │
│  │  Uses:                   │  │  Uses:                        │   │
│  │  ✅ SectionRenderer      │  │  ✅ SectionRenderer (FIXED!)  │   │
│  │  ✅ QuestionRenderer     │  │  ✅ QuestionRenderer          │   │
│  │  ✅ Dynamic config       │  │  ✅ Dynamic config            │   │
│  │  ✅ Reads from DB        │  │  ✅ Reads from DB             │   │
│  └──────────────────────────┘  └──────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              ALL FORMS USE SAME SYSTEM                        │  │
│  │  - Config-driven components                                   │  │
│  │  - Dynamic sections from database                             │  │
│  │  - Settings changes take effect immediately                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

RESULT: Settings changes instantly affect ALL forms!
```

---

## 🔄 DATA FLOW COMPARISON

### BEFORE (Broken)

```
User Action                    Database                Forms
────────────                  ──────────              ──────

1. Toggle section OFF
      │                           
      ▼                           
   Settings UI                    
      │                           
      ▼                           
   Save to DB ──────────────► ✅ Section.enabled = false
                                  │
                                  │
                                  ▼
                              (Saved but ignored)
                                  
                                  
Static config file ──────────────────────────────────► Forms
const sections = [                                      │
  { enabled: true },  ❌ Hardcoded                      ▼
]                                                   Section still shows
                                                    (uses old config)
```

### AFTER (Working)

```
User Action                    Database                Forms
────────────                  ──────────              ──────

1. Toggle section OFF
      │                           
      ▼                           
   Settings UI                    
      │                           
      ▼                           
   Save to DB ──────────────► ✅ Section.enabled = false
                                  │
                                  │
                                  ▼
                              Config API reads DB ─────► Forms
                                  │                      │
async getEnabledSections() {      │                      ▼
  return await dbQuery() ✅       │                  Section hidden
}                                 │                  (reads from DB)
                                  │
                                  └──────────────────────┘
                                     Instant update!
```

---

## 🎯 THE ONE CRITICAL CHANGE

```diff
File: lib/questionnaire/questions-config.ts

- // OLD (Broken)
- export const sections: SectionConfig[] = [
-   { id: 1, key: "avatar_definition", ... },
-   // ... hardcoded
- ]
- 
- export function getEnabledSections(): SectionConfig[] {
-   return sections.filter(s => s.enabled)
- }

+ // NEW (Working)
+ import { 
+   getEnabledSections as dbGetEnabledSections 
+ } from '@/app/actions/questionnaire-config'
+ 
+ export async function getEnabledSections(): Promise<SectionConfig[]> {
+   return await dbGetEnabledSections()
+ }
```

**Impact:** This one change connects Settings → Database → Forms

---

## 📁 FILE ORGANIZATION

### Current Structure (Mixed)

```
app/
├── dashboard/
│   ├── settings/
│   │   └── questionnaire/
│   │       └── page.tsx          ✅ Connected to DB
│   └── clients/
│       ├── onboarding/[id]/
│       │   └── page.tsx          ❌ Reads static config
│       └── [id]/
│           └── questionnaire-responses/
│               └── page.tsx      ❌ Hardcoded sections
├── form/[token]/
│   └── page.tsx                  ❌ Uses old system
└── actions/
    ├── questionnaire.ts          ❌ Hardcoded validation
    └── questionnaire-config.ts   ✅ Reads from DB

components/
├── questionnaire/
│   ├── sections/
│   │   ├── section-container.tsx           ✅ Shared
│   │   ├── avatar-definition-section.tsx   ❌ Deprecated
│   │   ├── dream-outcome-section.tsx       ❌ Deprecated
│   │   ├── problems-obstacles-section.tsx  ❌ Deprecated
│   │   ├── solution-methodology-section.tsx❌ Deprecated
│   │   ├── brand-voice-section.tsx         ❌ Deprecated
│   │   ├── proof-transformation-section.tsx❌ Deprecated
│   │   ├── faith-integration-section.tsx   ❌ Deprecated
│   │   └── business-metrics-section.tsx    ❌ Deprecated
│   ├── question-types/                     ✅ Shared
│   ├── navigation/                         ✅ Shared
│   ├── help-system/
│   │   ├── help-panel.tsx                  ✅ Shared
│   │   ├── help-content.tsx                ❌ Deprecated
│   │   └── config-help-content.tsx         ✅ Config-driven
│   ├── review/                             ❌ Needs update
│   ├── section-renderer.tsx                ✅ Config-driven
│   ├── question-renderer.tsx               ✅ Config-driven
│   └── public-questionnaire-form.tsx       ❌ Needs migration
└── settings/
    └── questionnaire-settings.tsx          ✅ Connected to DB

lib/
├── questionnaire/
│   ├── questions-config.ts         ❌ CRITICAL - Needs DB connection
│   ├── validation-schemas.ts       ❌ Deprecated (delete)
│   ├── help-guide-data.ts          ❌ Deprecated (delete)
│   ├── section-data.ts             ❌ Deprecated (delete)
│   └── conditional-logic.ts        ❌ Deprecated (delete)
```

### After Migration (Clean)

```
app/
├── dashboard/
│   ├── settings/
│   │   └── questionnaire/
│   │       └── page.tsx          ✅ Connected to DB
│   └── clients/
│       ├── onboarding/[id]/
│       │   └── page.tsx          ✅ Reads from DB
│       └── [id]/
│           └── questionnaire-responses/
│               └── page.tsx      ✅ Dynamic sections
├── form/[token]/
│   └── page.tsx                  ✅ Config-driven
└── actions/
    ├── questionnaire.ts          ✅ Dynamic validation
    └── questionnaire-config.ts   ✅ Reads from DB

components/
├── questionnaire/
│   ├── sections/
│   │   └── section-container.tsx           ✅ Shared
│   ├── question-types/                     ✅ Shared
│   ├── navigation/                         ✅ Shared
│   ├── help-system/
│   │   ├── help-panel.tsx                  ✅ Shared
│   │   └── config-help-content.tsx         ✅ Config-driven
│   ├── review/                             ✅ Dynamic
│   ├── section-renderer.tsx                ✅ Config-driven
│   ├── question-renderer.tsx               ✅ Config-driven
│   └── public-questionnaire-form.tsx       ✅ Migrated
└── settings/
    └── questionnaire-settings.tsx          ✅ Connected to DB

lib/
└── questionnaire/
    └── questions-config.ts         ✅ FIXED - Reads from DB

(8 section files deleted)
(4 data files deleted)
```

---

## 🔀 COMPONENT RELATIONSHIPS

### Current (Fragmented)

```
Settings UI ──► Database ──► (not connected) ──X

Static Config File
    │
    ├──► Admin Form (new components)
    │       └──► SectionRenderer ✅
    │              └──► QuestionRenderer ✅
    │
    └──► Public Form (old components)
            └──► Switch Statement
                    ├──► AvatarDefinitionSection ❌
                    ├──► DreamOutcomeSection ❌
                    ├──► ProblemsObstaclesSection ❌
                    ├──► SolutionMethodologySection ❌
                    ├──► BrandVoiceSection ❌
                    ├──► ProofTransformationSection ❌
                    ├──► FaithIntegrationSection ❌
                    └──► BusinessMetricsSection ❌
```

### After Migration (Unified)

```
Settings UI ──► Database ──► Config API
                                │
                                ├──► Admin Form
                                │       └──► SectionRenderer ✅
                                │              └──► QuestionRenderer ✅
                                │
                                └──► Public Form
                                        └──► SectionRenderer ✅
                                               └──► QuestionRenderer ✅

Both forms use identical config-driven components!
```

---

## 🎯 SHARED COMPONENTS (Used by Both Systems)

```
┌─────────────────────────────────────────────────────────────┐
│                    SHARED COMPONENT LIBRARY                  │
│                  (No changes needed - already work)          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Question Types:                                             │
│  ├─ QuestionWrapper     (layout)                            │
│  ├─ LongTextQuestion    (textarea with validation)          │
│  ├─ ShortTextQuestion   (input with validation)             │
│  ├─ MultipleChoiceQuestion (radio/checkbox options)         │
│  └─ FileUploadQuestion  (file picker with preview)          │
│                                                               │
│  Navigation:                                                 │
│  ├─ ProgressStepper     (section navigation pills)          │
│  ├─ RichFooter          (prev/next buttons + save status)   │
│  └─ ProgressIndicator   (completion percentage)             │
│                                                               │
│  Layout:                                                     │
│  ├─ SectionContainer    (section wrapper with header)       │
│  └─ HelpPanel           (sliding help sidebar)              │
│                                                               │
│  Review:                                                     │
│  ├─ QuestionnaireReview (summary view)                      │
│  └─ ReviewSectionCard   (collapsible section in review)     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         ▲                                    ▲
         │                                    │
    ┌────┴────┐                          ┌───┴────┐
    │ Admin   │                          │ Public │
    │ Form    │                          │ Form   │
    └─────────┘                          └────────┘
    
All shared components use v0 theme already ✅
No styling updates needed!
```

---

## 🧩 THE MISSING LINK

```
                    WHAT EXISTS TODAY
                    
┌─────────────┐        ┌──────────┐        ┌────────────┐
│  Settings   │ ────► │ Database │        │   Forms    │
│     UI      │  ✅   │          │        │            │
└─────────────┘       └──────────┘        └────────────┘
                           │                      ▲
                           │                      │
                           │                      │
                           ▼                      │
                      (Data stored              │
                       but not read)             │
                                                  │
                      ┌──────────────┐          │
                      │ Static Config│ ─────────┘
                      │     File     │     ✅
                      └──────────────┘
                      
                      
                    WHAT WE NEED
                    
┌─────────────┐        ┌──────────┐        ┌────────────┐
│  Settings   │ ────► │ Database │ ────► │   Forms    │
│     UI      │  ✅   │          │  ✅   │            │
└─────────────┘       └──────────┘       └────────────┘
                           │
                           │ Connect this!
                           │ (1 file change)
                           │
                      ┌────▼─────────┐
                      │ Config API   │
                      │   Layer      │
                      └──────────────┘
```

---

## 📊 BENEFITS AFTER MIGRATION

### Admin Experience

```
BEFORE                          AFTER
──────                          ─────

1. Edit question in Settings    1. Edit question in Settings
2. Save changes                 2. Save changes
3. Changes saved to DB ✅       3. Changes saved to DB ✅
4. Go to form                   4. Go to form
5. ❌ OLD text still shows      5. ✅ NEW text appears instantly
6. Must update code file        6. No code changes needed
7. Must redeploy                7. Works immediately
8. Wait for deployment          8. Update live in <1 second
```

### Developer Experience

```
BEFORE                          AFTER
──────                          ─────

To add new question:            To add new question:
1. Edit questions-config.ts     1. Go to Settings UI
2. Edit section component       2. Click "Add Question"
3. Edit validation schemas      3. Fill form
4. Edit help-guide-data.ts      4. Save
5. Commit code                  5. ✅ Done! (live immediately)
6. Deploy                       
7. Wait for CI/CD              Time: 30 seconds
8. ✅ Done                      No code changes!
                               No deployment!
Time: 30+ minutes              
4 files changed                 
```

### Content Team Experience

```
BEFORE                          AFTER
──────                          ─────

"Can we disable the Faith       "Can we disable the Faith
Integration section?"           Integration section?"

Response:                       Response:
"Sure, I'll need to:           "Sure!" [toggles switch]
1. Update code                  ✅ Done in 5 seconds
2. Test locally                 
3. Commit changes              No developer needed!
4. Deploy to staging           
5. Test staging                
6. Deploy to production        
7. Should be live in 2 hours"  
```

---

## 🎉 SUMMARY

### The Problem
- Settings UI saves to database ✅
- Forms read from static file ❌
- **Missing link:** Database → Config API

### The Solution
- Make config API read from database ✅
- One file needs updating ✅
- Everything else already exists ✅

### The Impact
- Settings changes affect forms instantly ✅
- No code deployments for config changes ✅
- Unified system across all forms ✅
- Delete 15 deprecated files ✅

### The Effort
- Phase A (critical fix): 2 hours
- Phase B (public form): 3 hours
- Phases C-E (polish): 4 hours
- **Total: 7-10 hours**

### The Risk
- 🟢 LOW - All infrastructure ready
- 🟢 LOW - Can test incrementally
- 🟢 LOW - Can rollback easily

---

**Next:** See `QUESTIONNAIRE_MIGRATION_PLAN.md` for implementation details

