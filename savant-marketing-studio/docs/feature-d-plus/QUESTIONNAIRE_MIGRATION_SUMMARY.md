# Questionnaire System Migration - Quick Reference

## 🔴 THE PROBLEM IN ONE SENTENCE

**Settings UI saves to database, but forms read from hardcoded files = changes have zero effect.**

---

## 🎯 THE FIX IN ONE SENTENCE

**Make `lib/questionnaire/questions-config.ts` read from database instead of exporting static arrays.**

---

## 📊 CURRENT STATE

### Two Parallel Systems (NOT Integrated)

```
PUBLIC FORM                     ADMIN FORM
/form/[token]                   /dashboard/clients/onboarding/[id]
     |                                   |
     v                                   v
OLD SYSTEM                      NEW SYSTEM
├─ PublicQuestionnaireForm      ├─ SectionRenderer ✅
├─ Switch statement             ├─ QuestionRenderer ✅
├─ 8 hardcoded sections ❌      ├─ Config-driven ✅
├─ AvatarDefinitionSection      └─ Reads from... questions-config.ts
├─ DreamOutcomeSection               |
├─ ProblemsObstaclesSection          v
├─ SolutionMethodologySection   STATIC FILE ❌
├─ BrandVoiceSection            Hardcoded arrays
├─ ProofTransformationSection   NOT reading from DB
├─ FaithIntegrationSection           |
└─ BusinessMetricsSection            |
                                     |
     ┌───────────────────────────────┘
     v
BOTH READ FROM STATIC CONFIG ❌
(changes in Settings have no effect)
```

### What Works Today

✅ **Database Tables Exist**
- `questionnaire_sections` (8 rows)
- `questionnaire_questions` (34 rows)
- `questionnaire_help` (34 rows)

✅ **Settings UI Works**
- Can edit sections/questions
- Changes save to database
- No errors

✅ **Server Actions Work**
- `getSections()` reads from DB
- `updateSection()` writes to DB
- All CRUD operations functional

✅ **Config Components Exist**
- `SectionRenderer` renders dynamically
- `QuestionRenderer` renders any question type
- Help system supports database content

### What's Broken

❌ **Forms Don't Read Database**
- Read from static `questions-config.ts` file
- Changes in Settings have ZERO effect
- Two sets of question definitions (database + file)

❌ **Public Form Uses Old System**
- 8 individual section component files
- Hardcoded in switch statement
- NOT config-driven

❌ **Link Component Broken**
- `CopyQuestionnaireLink` generates `/questionnaire/${id}`
- Route doesn't exist
- Should be `/form/${token}`

---

## 🔧 THE FIX (Detailed)

### Phase A: Connect Config to Database (2 hours) ⚡ CRITICAL

**Change 1:** Make config functions async and query DB

```typescript
// lib/questionnaire/questions-config.ts

// ❌ BEFORE (broken)
export const sections: SectionConfig[] = [hardcoded array]
export function getEnabledSections() { 
  return sections.filter(s => s.enabled) 
}

// ✅ AFTER (working)
import { getEnabledSections as dbGet } from '@/app/actions/questionnaire-config'
export async function getEnabledSections() {
  return await dbGet()
}
```

**Change 2:** Update onboarding page to await config

```typescript
// app/dashboard/clients/onboarding/[id]/page.tsx

// ❌ BEFORE
export default function QuestionnairePage() {
  const enabledSections = getEnabledSections()
  
// ✅ AFTER  
export default async function QuestionnairePage() {
  const enabledSections = await getEnabledSections()
```

**Test:** Toggle section in Settings → Verify disappears from form

### Phase B: Migrate Public Form (3 hours)

**Change 1:** Pass config to PublicQuestionnaireForm

```typescript
// app/form/[token]/page.tsx

// Add before return
const sections = await getEnabledSections()
const questions = await getQuestions()

return (
  <PublicQuestionnaireForm 
    client={client}
    token={token}
    sections={sections}      // ← Add
    questions={questions}    // ← Add
  />
)
```

**Change 2:** Replace switch with SectionRenderer

```typescript
// components/questionnaire/public-questionnaire-form.tsx

// ❌ BEFORE (lines 239-251)
const renderCurrentSection = () => {
  switch (currentSection) {
    case 1: return <AvatarDefinitionSection ... />
    case 2: return <DreamOutcomeSection ... />
    // ... 8 cases
  }
}

// ✅ AFTER
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

**Change 3:** Remove deprecated imports

```typescript
// ❌ DELETE lines 10-17
import AvatarDefinitionSection from '@/components/questionnaire/sections/avatar-definition-section'
import DreamOutcomeSection from '@/components/questionnaire/sections/dream-outcome-section'
// ... 6 more imports
```

### Phase C: Dynamic Sections (3 hours)

**Update 3 files to use dynamic sections instead of hardcoded arrays:**

1. `components/questionnaire/review/questionnaire-review.tsx`
2. `app/dashboard/clients/[id]/questionnaire-responses/page.tsx`
3. Any other files with `const sections = [...]` hardcoded

### Phase D: Cleanup (1 hour)

**Delete 15 files:**
- 8 individual section components
- 4 hardcoded data files
- 3 deprecated helper files

---

## 📋 MIGRATION CHECKLIST

### Before You Start

- [ ] Verify database tables exist (`questionnaire_sections`, etc.)
- [ ] Verify seed data loaded (8 sections, 34 questions)
- [ ] Backup current code (git commit)
- [ ] Read full migration plan

### Phase A (2 hours)

- [ ] Update `lib/questionnaire/questions-config.ts` (make async)
- [ ] Update all exported functions to query database
- [ ] Update `app/dashboard/clients/onboarding/[id]/page.tsx` (await config)
- [ ] Test: Toggle section in Settings
- [ ] Verify: Section disappears from admin form
- [ ] Test: Edit question text in Settings
- [ ] Verify: New text shows in admin form

### Phase B (3 hours)

- [ ] Update `app/form/[token]/page.tsx` (fetch config)
- [ ] Pass config to PublicQuestionnaireForm as props
- [ ] Replace switch statement with SectionRenderer
- [ ] Remove imports of individual section components
- [ ] Test: Open public form with token
- [ ] Verify: Form renders correctly
- [ ] Test: Complete and submit questionnaire
- [ ] Verify: Saves to database

### Phase C (3 hours)

- [ ] Update review page to use dynamic sections
- [ ] Update responses view page to use dynamic sections
- [ ] Test: View completed questionnaire responses
- [ ] Verify: All sections show correctly

### Phase D (1 hour)

- [ ] Delete 8 individual section component files
- [ ] Delete 4 hardcoded data files
- [ ] Delete/fix broken helper components
- [ ] Update index.ts exports
- [ ] Run TypeScript check (no errors)
- [ ] Test entire flow end-to-end

### Phase E (1 hour)

- [ ] Add caching to config functions
- [ ] Update documentation
- [ ] Final end-to-end testing
- [ ] Mark migration complete

---

## ✅ SUCCESS CRITERIA

**Migration is complete when:**

1. Admin toggles section OFF in Settings → Section disappears from ALL forms
2. Admin edits question text in Settings → New text shows in ALL forms
3. Public form uses config-driven system (no hardcoded sections)
4. Review page shows dynamic sections
5. All deprecated files deleted
6. No TypeScript errors
7. No broken imports

---

## 🎯 QUICK WIN TEST

**Want to verify everything is ready?**

Run this test:

1. Go to Settings → Questionnaire
2. Find "Faith Integration" section
3. Toggle it OFF (disabled)
4. Save changes
5. Go to any questionnaire form
6. **Expected:** Faith Integration section should NOT appear

**If this works after Phase A:** Migration is on track ✅

**If this doesn't work:** Config still reading from static file ❌

---

## 💡 KEY INSIGHTS

### Why Two Systems Exist

**History:**
1. Original system built with hardcoded components (8 separate files)
2. Someone built a better config-driven system with database backend
3. New system was wired to Settings UI
4. New system was wired to admin forms
5. **BUT:** Config layer still reads from static file, not database
6. **Result:** Two parallel systems, neither fully working

### The One Critical Fix

**Everything hinges on this:**
```typescript
// lib/questionnaire/questions-config.ts needs ONE change:
// Change from static exports → async database queries
```

Once this is fixed, everything else falls into place.

### Why Public Form Uses Old System

- Public form was built first (older code)
- Uses hardcoded section components
- Never migrated to config-driven approach
- Still works (reads from static file)
- **Needs migration** to benefit from database config

### Why Settings Changes Don't Work

```
Settings UI → Database ✅ (writes successfully)
Database → Config Layer ❌ (not connected)
Config Layer → Forms ✅ (reads successfully)

Missing link: Database → Config Layer
```

---

## 🚀 NEXT STEPS

### If You're Ready to Start

1. Read full plan: `QUESTIONNAIRE_MIGRATION_PLAN.md`
2. Start with Phase A (highest impact, lowest risk)
3. Test thoroughly after Phase A
4. Continue to Phase B if A works
5. Complete remaining phases

### If You Need More Info

- See `QUESTIONNAIRE_WIRING_SUMMARY.md` for technical details
- See `DATABASE_BACKED_QUESTIONNAIRE_GUIDE.md` for database info
- See `CONFIG_DRIVEN_QUESTIONNAIRE_GUIDE.md` for config usage

### If You Want to Pause

- Phase A is the critical fix (2 hours)
- You can stop after Phase A and still have a working system
- Public form will still use old system (acceptable temporarily)
- Complete Phase B when ready to fully unify

---

## 📊 EFFORT vs IMPACT

```
Phase A: Database Connection
├─ Effort: ⚡⚡ (2 hours)
├─ Impact: 🎯🎯🎯🎯🎯 (critical - enables everything)
├─ Risk: 🟢 Low
└─ Recommendation: START HERE

Phase B: Public Form Migration  
├─ Effort: ⚡⚡⚡ (3 hours)
├─ Impact: 🎯🎯🎯🎯 (high - unifies systems)
├─ Risk: 🟡 Medium
└─ Recommendation: Do after A

Phase C: Dynamic Sections
├─ Effort: ⚡⚡⚡ (3 hours)
├─ Impact: 🎯🎯🎯 (medium - removes hardcoding)
├─ Risk: 🟢 Low
└─ Recommendation: Do after B

Phase D: Cleanup
├─ Effort: ⚡ (1 hour)
├─ Impact: 🎯🎯 (low - code cleanliness)
├─ Risk: 🟢 Low
└─ Recommendation: Do after C

Phase E: Polish
├─ Effort: ⚡ (1 hour)
├─ Impact: 🎯 (nice to have)
├─ Risk: 🟢 Low
└─ Recommendation: Do last
```

---

## 🎯 BOTTOM LINE

**Problem:** Settings UI changes database, but forms read static file

**Solution:** Make config layer read database

**Effort:** 7-10 hours total (can do incrementally)

**Payoff:** Fully dynamic questionnaire system where Settings changes instantly affect all forms

**Risk:** Low (all infrastructure exists, just needs wiring)

**Confidence:** High (everything is ready, just needs connection)

**Recommendation:** Start with Phase A (2 hours, highest impact)

---

*See `QUESTIONNAIRE_MIGRATION_PLAN.md` for detailed implementation guide*

