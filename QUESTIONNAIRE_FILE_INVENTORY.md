# QUESTIONNAIRE FILE INVENTORY

**Complete list of all questionnaire-related files with status classification**

---

## ROUTES (3 files)

| File | Lines | Status | Action | Notes |
|------|-------|--------|--------|-------|
| `app/form/[token]/page.tsx` | 94 | ✅ NEW | ❌ KEEP | Public form entry, database-driven |
| `app/form/[token]/complete/page.tsx` | 31 | ✅ NEW | ❌ KEEP | Simple thank you page |
| `app/dashboard/clients/onboarding/[id]/page.tsx` | 400 | ✅ NEW | ❌ KEEP | Internal form entry, database-driven |

---

## COMPONENTS - CORE (3 files)

| File | Lines | Status | Action | Notes |
|------|-------|--------|--------|-------|
| `public-questionnaire-form.tsx` | 521 | ✅ NEW | ❌ KEEP | Client-facing form with theme toggle |
| `section-renderer.tsx` | 82 | ✅ NEW | ❌ KEEP | Database-driven section renderer |
| `question-renderer.tsx` | 134 | ✅ NEW | ❌ KEEP | Type-based question renderer |

---

## COMPONENTS - QUESTION TYPES (5 files)

| File | Lines | Status | Action | Notes |
|------|-------|--------|--------|-------|
| `question-types/long-text-question.tsx` | ~80 | ✅ NEW | ❌ KEEP | Textarea input |
| `question-types/short-text-question.tsx` | ~50 | ✅ NEW | ❌ KEEP | Text input |
| `question-types/multiple-choice-question.tsx` | ~150 | ✅ NEW | ❌ KEEP | Radio/checkbox inputs |
| `question-types/file-upload-question.tsx` | ~200 | ✅ NEW | ❌ KEEP | File upload with preview |
| `question-types/question-wrapper.tsx` | ~50 | ✅ NEW | ❌ KEEP | Question label/number wrapper |

---

## COMPONENTS - NAVIGATION (5 files)

| File | Lines | Status | Action | Notes |
|------|-------|--------|--------|-------|
| `navigation/progress-stepper.tsx` | ~191 | ✅ NEW | ❌ KEEP | Top progress bar, config-driven |
| `navigation/rich-footer.tsx` | ~150 | ✅ NEW | ❌ KEEP | Bottom sticky nav, auto-save indicator |
| `navigation/section-nav.tsx` | ~76 | ⚠️ LEGACY? | ⚠️ VERIFY | Sidebar nav (may be unused) |
| `navigation/progress-indicator.tsx` | ~80 | ⚠️ LEGACY? | ⚠️ VERIFY | Old progress component (may be unused) |
| `navigation/step-footer.tsx` | ~100 | ⚠️ LEGACY? | ⚠️ VERIFY | Old footer component (may be unused) |

---

## COMPONENTS - SECTIONS (3 files)

| File | Lines | Status | Action | Notes |
|------|-------|--------|--------|-------|
| `sections/section-container.tsx` | ~50 | ✅ NEW | ❌ KEEP | Section wrapper with header |
| `sections/section-header.tsx` | ~40 | ✅ NEW | ❌ KEEP | Section title/description |
| `sections/section-header-card.tsx` | ~60 | ✅ NEW | ❌ KEEP | Alternative header style |

---

## COMPONENTS - HELP SYSTEM (3 files)

| File | Lines | Status | Action | Notes |
|------|-------|--------|--------|-------|
| `help-system/help-panel.tsx` | ~60 | ✅ NEW | ❌ KEEP | Sliding help drawer |
| `help-system/help-trigger.tsx` | ~30 | ✅ NEW | ❌ KEEP | Help icon button |
| `help-system/config-help-content.tsx` | ~100 | ✅ NEW | ❌ KEEP | Database-driven help content |

---

## COMPONENTS - REVIEW (2 files)

| File | Lines | Status | Action | Notes |
|------|-------|--------|--------|-------|
| `review/questionnaire-review.tsx` | 262 | ⚠️ **HYBRID** | 🔧 **REFACTOR** | Hardcoded 8 sections (lines 148-226) |
| `review/review-section-card.tsx` | ~127 | ✅ NEW | ✏️ MODIFY | Needs to accept config prop |

---

## COMPONENTS - VIEWERS (2 files)

| File | Lines | Status | Action | Notes |
|------|-------|--------|--------|-------|
| `response-viewer.tsx` | 181 | ✅ NEW | ❌ KEEP | Collapsible response viewer |
| `response-history.tsx` | ~150 | ✅ NEW | ❌ KEEP | Version history viewer |

---

## COMPONENTS - OTHER (2 files)

| File | Lines | Status | Action | Notes |
|------|-------|--------|--------|-------|
| `share-questionnaire-popup.tsx` | 448 | ✅ NEW | ❌ KEEP | Share link generator modal |
| `question-editor-modal.tsx` | ~300 | ✅ NEW | ❌ KEEP | Admin question editor |

---

## LIB FILES (7 files)

| File | Lines | Status | Action | Notes |
|------|-------|--------|--------|-------|
| `types.ts` | 130 | ⚠️ **LEGACY** | 🔧 **REFACTOR** | Hardcoded QuestionnaireData interface |
| `use-questionnaire-form.ts` | 714 | ⚠️ **HYBRID** | 🔧 **REFACTOR** | Hardcoded switch cases (lines 485-534, 690-714) |
| `questions-config.ts` | ~200 | ✅ NEW | ❌ KEEP | Database types for config |
| `questionnaire-config-context.tsx` | ~250 | ✅ NEW | ❌ KEEP | Database config provider |
| `dynamic-validation.ts` | ~150 | ✅ NEW | ❌ KEEP | Config-based validation |
| `conditional-logic.ts` | ~100 | ✅ NEW | ❌ KEEP | Config-based conditional logic |
| `validation-schemas.ts` | ~80 | ⚠️ LEGACY? | ⚠️ VERIFY | May be replaced by dynamic-validation |

---

## SUMMARY COUNTS

### By Status:
- ✅ **KEEP (Clean):** 25 files
- ⚠️ **REFACTOR (Hardcoded):** 3 files
- ⚠️ **VERIFY (May be unused):** 4 files

### By Category:
- **Routes:** 3 files
- **Core Components:** 3 files
- **Question Types:** 5 files
- **Navigation:** 5 files
- **Sections:** 3 files
- **Help System:** 3 files
- **Review:** 2 files
- **Viewers:** 2 files
- **Other Components:** 2 files
- **Lib Files:** 7 files

**TOTAL:** 35 files

---

## ACTION ITEMS

### 🔧 MUST REFACTOR (3 files)
1. `lib/questionnaire/types.ts` - Remove hardcoded interface
2. `lib/questionnaire/use-questionnaire-form.ts` - Remove switch cases
3. `components/questionnaire/review/questionnaire-review.tsx` - Make dynamic

### ✏️ MINOR MODIFICATIONS (1 file)
4. `components/questionnaire/review/review-section-card.tsx` - Accept config prop

### ⚠️ VERIFY & POSSIBLY DELETE (4 files)
5. `components/questionnaire/navigation/section-nav.tsx`
6. `components/questionnaire/navigation/progress-indicator.tsx`
7. `components/questionnaire/navigation/step-footer.tsx`
8. `lib/questionnaire/validation-schemas.ts`

### ❌ KEEP AS-IS (28 files)
All other files are clean and database-driven

---

## FILE DEPENDENCIES

### Critical Files (Core System)
```
section-renderer.tsx
  └─ question-renderer.tsx
      ├─ long-text-question.tsx
      ├─ short-text-question.tsx
      ├─ multiple-choice-question.tsx
      └─ file-upload-question.tsx
```

### Form Implementations
```
PUBLIC FORM:
  form/[token]/page.tsx
    └─ public-questionnaire-form.tsx
        └─ section-renderer.tsx (core)

INTERNAL FORM:
  dashboard/clients/onboarding/[id]/page.tsx
    ├─ progress-stepper.tsx
    ├─ section-renderer.tsx (core)
    ├─ questionnaire-review.tsx (⚠️ needs refactor)
    └─ rich-footer.tsx
```

### Shared Dependencies
```
All forms depend on:
  ├─ lib/questionnaire/types.ts (⚠️ needs refactor)
  ├─ lib/questionnaire/use-questionnaire-form.ts (⚠️ needs refactor)
  ├─ lib/questionnaire/questionnaire-config-context.tsx (✅ clean)
  └─ lib/questionnaire/dynamic-validation.ts (✅ clean)
```

---

## LEGEND

| Symbol | Meaning |
|--------|---------|
| ✅ NEW | Modern, database-driven code |
| ⚠️ HYBRID | Mix of new and old (hardcoded parts) |
| ⚠️ LEGACY | Completely hardcoded |
| ⚠️ LEGACY? | May be unused legacy code |
| ❌ KEEP | No changes needed |
| 🔧 REFACTOR | Major refactoring needed |
| ✏️ MODIFY | Minor modifications needed |
| ⚠️ VERIFY | Verify if used, then delete if not |

---

**Last Updated:** December 28, 2025  
**See Also:**
- `QUESTIONNAIRE_FORMS_COMPLETE_AUDIT.md` (full report)
- `QUESTIONNAIRE_AUDIT_QUICK_REFERENCE.md` (quick summary)









