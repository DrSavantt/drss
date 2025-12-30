# QUESTIONNAIRE SYSTEM - VISUAL DIAGRAM

**Date:** December 28, 2025

---

## CURRENT STATE (After Deletion)

```
┌─────────────────────────────────────────────────────────────────┐
│                    QUESTIONNAIRE SYSTEM                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         ROUTES                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ /form/[token]                                               │
│     └─ Public client form (email link)                         │
│     └─ Uses: PublicQuestionnaireForm component                 │
│     └─ Status: WORKS                                            │
│                                                                 │
│  ✅ /form/[token]/complete                                      │
│     └─ Thank you page                                           │
│     └─ Status: WORKS                                            │
│                                                                 │
│  ✅ /dashboard/clients/[id]/questionnaire-responses             │
│     └─ View submitted responses                                 │
│     └─ Uses: ResponseViewer component                           │
│     └─ Status: WORKS                                            │
│                                                                 │
│  ✅ /dashboard/settings/questionnaire                           │
│     └─ Admin config (add/remove sections/questions)            │
│     └─ Status: WORKS                                            │
│                                                                 │
│  ❌ /dashboard/clients/onboarding/[id]                          │
│     └─ OLD internal form                                        │
│     └─ Status: DELETED ❌                                       │
│     └─ Problem: 5 files still link here! 🚨                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    BROKEN LINKS (5 files)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ⚠️ reset-button.tsx (line 40)                                  │
│     └─ router.push(`/dashboard/clients/onboarding/${id}`)      │
│     └─ Clicked when: User clicks "Reset" button                │
│                                                                 │
│  ⚠️ page.tsx (line 233)                                         │
│     └─ href={`/dashboard/clients/onboarding/${id}?mode=edit`}  │
│     └─ Clicked when: User clicks "Edit Responses"              │
│                                                                 │
│  ⚠️ questionnaire-status-card.tsx (line 115)                    │
│     └─ <Link href={`/dashboard/clients/onboarding/${id}`}>     │
│     └─ Clicked when: User clicks "Start Questionnaire"         │
│                                                                 │
│  ⚠️ client-questionnaire.tsx (lines 117, 122)                   │
│     └─ router.push(`/dashboard/clients/onboarding/${id}`)      │
│     └─ Clicked when: User clicks "Fill Out Now" or "Edit"      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENTS (25 files)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ CLEAN (22 files):                                           │
│     ├─ public-questionnaire-form.tsx                           │
│     ├─ section-renderer.tsx                                    │
│     ├─ question-renderer.tsx                                   │
│     ├─ question-types/ (5 files)                               │
│     ├─ navigation/ (2 active + 3 unused?)                      │
│     ├─ help-system/ (3 files)                                  │
│     ├─ sections/ (3 files)                                     │
│     ├─ review/ (1 file)                                        │
│     └─ viewers/ (2 files)                                      │
│                                                                 │
│  ⚠️ HARDCODED (3 files):                                        │
│     ├─ lib/questionnaire/types.ts                              │
│     │   └─ Hardcoded QuestionnaireData interface               │
│     ├─ lib/questionnaire/use-questionnaire-form.ts             │
│     │   └─ Hardcoded switch statements                         │
│     └─ components/questionnaire/review/questionnaire-review.tsx│
│         └─ Hardcoded 8 ReviewSectionCard components            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  V0 DESIGN SYSTEM (57 components)               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📦 ui-design-system/components/ui/                             │
│     ├─ card.tsx           ⭐ Use for sections                   │
│     ├─ form.tsx           ⭐ Use for form wrapper               │
│     ├─ textarea.tsx       ⭐ Use for long-text questions        │
│     ├─ input.tsx          ⭐ Use for short-text questions       │
│     ├─ radio-group.tsx    ⭐ Use for multiple choice (single)   │
│     ├─ checkbox.tsx       ⭐ Use for multiple choice (multi)    │
│     ├─ progress.tsx       ⭐ Use for progress indicator         │
│     ├─ sheet.tsx          ⭐ Use for help panel                 │
│     ├─ button.tsx         ⭐ Use for navigation                 │
│     ├─ label.tsx          ⭐ Use for question labels            │
│     ├─ tabs.tsx           ⭐ Use for section navigation         │
│     └─ ... 46 more components                                  │
│                                                                 │
│  📦 ui-design-system/components/clients/                        │
│     └─ client-questionnaire.tsx                                │
│         ├─ ✅ Uses v0 components (pretty design!)              │
│         ├─ ❌ Hardcoded 8 sections                             │
│         └─ ❌ No database integration                          │
│         └─ 💡 This is the design aesthetic user wants!         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## COMPONENT FLOW (Current)

### Public Form Flow:
```
User clicks email link
  ↓
/form/[token]
  ↓
PublicQuestionnaireForm
  ├─ Fetches config from database
  ├─ State: formData, currentSection, completedQuestions
  │
  ├─► SectionRenderer (for current section)
  │     ├─ Gets questions from config
  │     ├─ Filters visible questions
  │     │
  │     └─► QuestionRenderer (for each question)
  │           ├─ LongTextQuestion
  │           ├─ ShortTextQuestion
  │           ├─ MultipleChoiceQuestion
  │           └─ FileUploadQuestion
  │
  ├─► HelpPanel (slide-out)
  │     └─ ConfigHelpContent (from database)
  │
  └─► Footer Navigation
        ├─ Previous button
        ├─ Next button
        └─ Submit button (last section)
```

### Internal Form Flow (BROKEN):
```
User clicks "Start Questionnaire" from client profile
  ↓
/dashboard/clients/onboarding/[id]  ❌ 404 ERROR!
  ↓
(Route doesn't exist anymore)
```

### Response Viewer Flow:
```
User clicks "View Responses"
  ↓
/dashboard/clients/[id]/questionnaire-responses
  ↓
ResponseViewer
  ├─ Fetches response data
  ├─ Fetches config from database
  │
  └─► Collapsible section cards
        └─ Question/answer pairs
```

---

## TARGET STATE (After Refactor)

```
┌─────────────────────────────────────────────────────────────────┐
│                    ONE UNIFIED COMPONENT                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  UnifiedQuestionnaireForm                                       │
│    ├─ Props: mode ('public' | 'internal' | 'readonly')         │
│    ├─ Uses: v0 shadcn/ui components                            │
│    ├─ Database-driven: sections + questions from config        │
│    │                                                            │
│    ├─ if mode === 'public':                                    │
│    │   └─ Simple nav, theme toggle, auto-save                  │
│    │                                                            │
│    ├─ if mode === 'internal':                                  │
│    │   └─ Sidebar nav, rich footer, save draft                 │
│    │                                                            │
│    └─ if mode === 'readonly':                                  │
│        └─ Collapsible sections, no editing                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    ROUTES (After Refactor)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ /form/[token]                                               │
│     └─ <UnifiedQuestionnaireForm mode="public" />              │
│                                                                 │
│  ✅ /dashboard/clients/[id]/questionnaire                       │
│     └─ <UnifiedQuestionnaireForm mode="internal" />            │
│                                                                 │
│  ✅ /dashboard/clients/[id]/questionnaire-responses             │
│     └─ <UnifiedQuestionnaireForm mode="readonly" />            │
│                                                                 │
│  ✅ Client Profile Tab                                          │
│     └─ <UnifiedQuestionnaireForm mode="internal" embedded />   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## DATA FLOW

### Current (Database-Driven):
```
Database (Supabase)
  ├─ questionnaire_sections table
  │   └─ id, key, title, description, enabled, sort_order
  │
  ├─ questionnaire_questions table
  │   └─ id, section_id, text, type, required, enabled, ...
  │
  └─ questionnaire_help table
      └─ question_id, title, where_to_find, how_to_extract, ...

  ↓ Fetched via API

QuestionnaireConfigContext
  ├─ sections: SectionConfig[]
  ├─ questions: QuestionConfig[]
  ├─ getEnabledSections()
  ├─ getQuestionsForSection(id)
  └─ shouldShowQuestion(id, formData)

  ↓ Consumed by

Components
  ├─ SectionRenderer (gets questions from config)
  ├─ QuestionRenderer (renders based on type)
  └─ HelpPanel (shows help from config)
```

### Problem (Hardcoded Types):
```
⚠️ lib/questionnaire/types.ts
  └─ QuestionnaireData interface
      ├─ avatar_definition: { q1_..., q2_..., ... }
      ├─ dream_outcome: { q6_..., q7_..., ... }
      └─ ... 8 hardcoded sections

This prevents:
  ❌ Adding new sections without code changes
  ❌ Removing sections without code changes
  ❌ Reordering sections dynamically
```

---

## THE FIX - 3 PHASES

### Phase 1: Fix Types (2 hours)
```
lib/questionnaire/types.ts
  FROM: interface QuestionnaireData { avatar_definition: {...}, ... }
  TO:   type QuestionnaireData = Record<string, Record<string, any>>

lib/questionnaire/use-questionnaire-form.ts
  FROM: switch (sectionId) { case 1: ..., case 2: ..., ... }
  TO:   const section = config.getSectionById(sectionId)
        updated[section.key] = { ...updated[section.key], [key]: value }

components/questionnaire/review/questionnaire-review.tsx
  FROM: <ReviewSectionCard sectionNumber={1} ... />
        <ReviewSectionCard sectionNumber={2} ... />
        ... (8 hardcoded cards)
  TO:   {config.getEnabledSections().map(section => (
          <ReviewSectionCard section={section} config={config} ... />
        ))}
```

### Phase 2: Migrate to v0 (4 hours)
```
Replace Custom Components → v0 Components

question-types/long-text-question.tsx
  FROM: Custom styled textarea
  TO:   import { Textarea } from '@/components/ui/textarea'

section-renderer.tsx
  FROM: Custom SectionContainer
  TO:   import { Card, CardHeader, CardContent } from '@/components/ui/card'

navigation/progress-stepper.tsx
  FROM: Custom progress bar
  TO:   import { Progress } from '@/components/ui/progress'

help-system/help-panel.tsx
  FROM: Custom slide-out panel
  TO:   import { Sheet, SheetContent } from '@/components/ui/sheet'
```

### Phase 3: Unify (2 hours)
```
Create: UnifiedQuestionnaireForm component
  ├─ Accepts mode prop ('public' | 'internal' | 'readonly')
  ├─ Uses v0 components
  ├─ Database-driven from config
  └─ Conditional rendering based on mode

Update Routes:
  ├─ /form/[token] → mode="public"
  ├─ /dashboard/clients/[id]/questionnaire → mode="internal"
  └─ /dashboard/clients/[id]/questionnaire-responses → mode="readonly"

Delete Old:
  ├─ public-questionnaire-form.tsx (replaced)
  ├─ ui-design-system/.../client-questionnaire.tsx (replaced)
  └─ Unused navigation components
```

---

## TIME BREAKDOWN

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE                          │ TIME    │ PRIORITY         │
├────────────────────────────────┼─────────┼──────────────────┤
│ Fix broken links               │ 30 min  │ 🔥 URGENT        │
│ Fix hardcoded types            │ 2 hours │ ⚠️ HIGH          │
│ Migrate to v0 design           │ 4 hours │ 📊 MEDIUM        │
│ Create unified component       │ 2 hours │ 📊 MEDIUM        │
│ Testing & bug fixes            │ 2 hours │ 📊 MEDIUM        │
├────────────────────────────────┼─────────┼──────────────────┤
│ TOTAL                          │ 10.5 hr │                  │
└─────────────────────────────────────────────────────────────┘
```

---

## CHECKLIST

### Immediate (Today):
- [ ] Read `FIX_BROKEN_LINKS_CHECKLIST.md`
- [ ] Create: `app/dashboard/clients/[id]/questionnaire/page.tsx`
- [ ] Update 5 files with broken links
- [ ] Test all navigation works

### Phase 1 (This Week):
- [ ] Fix `lib/questionnaire/types.ts`
- [ ] Fix `lib/questionnaire/use-questionnaire-form.ts`
- [ ] Fix `components/questionnaire/review/questionnaire-review.tsx`
- [ ] Test database flexibility (add/remove sections)

### Phase 2 (This Week):
- [ ] Migrate question types to v0 components
- [ ] Migrate section renderer to v0 Card
- [ ] Migrate navigation to v0 Progress/Tabs
- [ ] Migrate help system to v0 Sheet
- [ ] Test visual appearance matches v0 demo

### Phase 3 (Next Week):
- [ ] Create `UnifiedQuestionnaireForm` component
- [ ] Update all routes to use unified component
- [ ] Delete old separate implementations
- [ ] Full integration testing

---

**Status:** ⚠️ **BROKEN LINKS** - Fix immediately!

**Next:** See `FIX_BROKEN_LINKS_CHECKLIST.md`



