# QUESTIONNAIRE AUDIT - QUICK REFERENCE

**Date:** December 28, 2025  
**Full Report:** See `QUESTIONNAIRE_FORMS_COMPLETE_AUDIT.md`

---

## TL;DR - WHAT YOU NEED TO KNOW

### ✅ THE GOOD NEWS
- You have **ONE unified form system** (not multiple competing implementations)
- **2 entry points** (public + internal) that share the same components
- **Database-driven architecture** is already implemented
- **No duplicate form implementations** found
- **Clean component structure** with good separation of concerns

### ⚠️ THE BAD NEWS
- **3 files have hardcoded legacy code** that prevents true database flexibility
- These files block your ability to add/remove sections without code changes

---

## WHAT EXISTS - FORM IMPLEMENTATIONS

| Entry Point | Path | Status | Purpose |
|-------------|------|--------|---------|
| **Public Form** | `/form/[token]` | ✅ NEW | Client-facing questionnaire (email link) |
| **Internal Form** | `/dashboard/clients/onboarding/[id]` | ✅ NEW | Staff-facing questionnaire (dashboard) |
| **Completion Page** | `/form/[token]/complete` | ✅ NEW | Thank you page |

**Both forms use the SAME components:**
- `SectionRenderer` → `QuestionRenderer` → Question Type Components

---

## PROBLEM FILES - WHAT'S BROKEN

| File | Issue | Priority | Impact |
|------|-------|----------|--------|
| **`lib/questionnaire/types.ts`** | Hardcoded `QuestionnaireData` interface with 8 fixed sections | 🔥 CRITICAL | Prevents adding/removing sections |
| **`lib/questionnaire/use-questionnaire-form.ts`** | Hardcoded switch statements (lines 485-534, 690-714) | 🔥 CRITICAL | Forces section structure |
| **`components/questionnaire/review/questionnaire-review.tsx`** | 8 hardcoded `ReviewSectionCard` components | ⚠️ HIGH | Breaks if sections change |

---

## THE FIX - 4 PHASES

### Phase 1: Fix Type System (30 min)
**File:** `lib/questionnaire/types.ts`

**Change:**
```typescript
// FROM:
export interface QuestionnaireData {
  avatar_definition: { q1_ideal_customer: string; ... };
  dream_outcome: { q6_dream_outcome: string; ... };
  // ... 8 hardcoded sections
}

// TO:
export type QuestionnaireData = Record<string, Record<string, any>>;
```

---

### Phase 2: Fix Form Hook (2 hours)
**File:** `lib/questionnaire/use-questionnaire-form.ts`

**Replace hardcoded switch:**
```typescript
// FROM:
switch (sectionId) {
  case 1: updated.avatar_definition = {...}; break;
  case 2: updated.dream_outcome = {...}; break;
  // ...
}

// TO:
const section = config.getSectionById(sectionId);
updated[section.key] = { ...updated[section.key], [fullKey]: value };
```

---

### Phase 3: Fix Review Component (1 hour)
**File:** `components/questionnaire/review/questionnaire-review.tsx`

**Replace hardcoded cards:**
```tsx
// FROM:
<ReviewSectionCard sectionNumber={1} title="Avatar Definition" ... />
<ReviewSectionCard sectionNumber={2} title="Dream Outcome" ... />
// ... 8 hardcoded cards

// TO:
{config.getEnabledSections().map(section => (
  <ReviewSectionCard
    key={section.id}
    section={section}
    config={config}
    ...
  />
))}
```

---

### Phase 4: Cleanup & Test (1 hour)
- Remove unused files (if any)
- Full testing suite (public form, internal form, edit mode, viewer)
- Test database flexibility (disable sections, reorder, add questions)

---

## FILES TO DELETE (After Verification)

Check if these are actually used:
```
❌ components/questionnaire/navigation/section-nav.tsx
❌ components/questionnaire/navigation/progress-indicator.tsx
❌ components/questionnaire/navigation/step-footer.tsx
❌ lib/questionnaire/validation-schemas.ts
```

**Verify first:**
```bash
grep -r "section-nav" --include="*.tsx" savant-marketing-studio/
grep -r "progress-indicator" --include="*.tsx" savant-marketing-studio/
grep -r "step-footer" --include="*.tsx" savant-marketing-studio/
grep -r "validation-schemas" --include="*.tsx" savant-marketing-studio/
```

---

## FILES TO KEEP (Already Perfect)

All of these are clean, database-driven, and should NOT be changed:

**Routes (3 files):**
- ✅ `app/form/[token]/page.tsx`
- ✅ `app/form/[token]/complete/page.tsx`
- ✅ `app/dashboard/clients/onboarding/[id]/page.tsx`

**Core Components (3 files):**
- ✅ `components/questionnaire/public-questionnaire-form.tsx` (521 lines)
- ✅ `components/questionnaire/section-renderer.tsx` (82 lines)
- ✅ `components/questionnaire/question-renderer.tsx` (134 lines)

**Question Types (5 files):**
- ✅ `components/questionnaire/question-types/long-text-question.tsx`
- ✅ `components/questionnaire/question-types/short-text-question.tsx`
- ✅ `components/questionnaire/question-types/multiple-choice-question.tsx`
- ✅ `components/questionnaire/question-types/file-upload-question.tsx`
- ✅ `components/questionnaire/question-types/question-wrapper.tsx`

**Navigation (2 active files):**
- ✅ `components/questionnaire/navigation/progress-stepper.tsx`
- ✅ `components/questionnaire/navigation/rich-footer.tsx`

**Help System (3 files):**
- ✅ `components/questionnaire/help-system/help-panel.tsx`
- ✅ `components/questionnaire/help-system/help-trigger.tsx`
- ✅ `components/questionnaire/help-system/config-help-content.tsx`

**Sections (3 files):**
- ✅ `components/questionnaire/sections/section-container.tsx`
- ✅ `components/questionnaire/sections/section-header.tsx`
- ✅ `components/questionnaire/sections/section-header-card.tsx`

**Viewers (2 files):**
- ✅ `components/questionnaire/response-viewer.tsx`
- ✅ `components/questionnaire/response-history.tsx`

**Lib Files (4 files):**
- ✅ `lib/questionnaire/questions-config.ts`
- ✅ `lib/questionnaire/questionnaire-config-context.tsx`
- ✅ `lib/questionnaire/dynamic-validation.ts`
- ✅ `lib/questionnaire/conditional-logic.ts`

**Total:** 25 components (25 files in `components/questionnaire/`) + 7 lib files

---

## TIME ESTIMATE

| Phase | Time | Difficulty |
|-------|------|------------|
| Phase 1: types.ts | 30 min | Medium |
| Phase 2: use-questionnaire-form.ts | 2 hours | Hard |
| Phase 3: questionnaire-review.tsx | 1.5 hours | Medium |
| Phase 4: Cleanup & testing | 2 hours | Easy |
| **TOTAL** | **6-8 hours** | **Medium-Hard** |

---

## SUCCESS CRITERIA

After the refactor is complete, you should be able to:

✅ Add a new section in the database → appears in all forms immediately  
✅ Remove a section → disappears from all forms immediately  
✅ Reorder sections → order updates everywhere immediately  
✅ Add/remove questions → updates everywhere immediately  
✅ Change question types → renderer updates automatically  
✅ **ZERO code changes needed for questionnaire modifications**

---

## TESTING CHECKLIST

After refactor, test these scenarios:

**Form Functionality:**
- [ ] Public form loads and works
- [ ] Internal form (create mode) works
- [ ] Internal form (edit mode) works
- [ ] Auto-save works (localStorage + server)
- [ ] Form submission works
- [ ] Response viewer displays correctly

**Database Flexibility:**
- [ ] Disable section 3 → forms skip it
- [ ] Re-enable section 3 → forms show it again
- [ ] Reorder sections → forms show new order
- [ ] Add new question → appears in forms
- [ ] Change question type → updates in forms
- [ ] Mark question as optional → validation updates

---

## KEY INSIGHT

You already have a **unified, database-driven form system**. You just need to remove the **hardcoded type definitions and switch statements** that prevent it from being truly flexible.

The architecture is solid. The components are clean. You're 90% there.

---

**For full details, see:** `QUESTIONNAIRE_FORMS_COMPLETE_AUDIT.md`


