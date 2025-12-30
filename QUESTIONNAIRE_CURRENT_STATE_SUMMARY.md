# QUESTIONNAIRE SYSTEM - CURRENT STATE SUMMARY

**Date:** December 28, 2025  
**Status:** ⚠️ **BROKEN LINKS** - Immediate action required

---

## 🚨 URGENT: WHAT JUST HAPPENED

### ✅ Completed:
- **DELETED:** `app/dashboard/clients/onboarding/[id]/` (old internal form route)
- **AUDITED:** Entire questionnaire system
- **IDENTIFIED:** v0 design system components available

### ⚠️ Problem:
- **5 files have broken links** to the deleted route
- Users will get 404 errors when clicking questionnaire buttons

### 🔧 Fix Required:
See: `FIX_BROKEN_LINKS_CHECKLIST.md` (15 minutes to fix)

---

## 📊 CURRENT STATE

### What Exists Now:

**Routes:**
- ✅ `/form/[token]` - Public client form (works)
- ✅ `/form/[token]/complete` - Thank you page (works)
- ✅ `/dashboard/clients/[id]/questionnaire-responses` - Response viewer (works)
- ✅ `/dashboard/settings/questionnaire` - Admin settings (works)
- ❌ `/dashboard/clients/onboarding/[id]` - **DELETED** (broken links!)

**Components:**
- ✅ 25 questionnaire components (mostly clean, database-driven)
- ⚠️ 3 files with hardcoded legacy code
- ⚠️ 4 files possibly unused (need verification)

**Design Systems:**
- ❌ Production uses **custom components** (not v0-styled)
- ✅ v0 has **57 shadcn/ui components** available
- ✅ v0 has **demo questionnaire** component (hardcoded but pretty)

---

## 🎯 THE GOAL

Create **ONE unified questionnaire form** that:

1. ✅ Uses **v0 design system** (shadcn/ui components)
2. ✅ Is **100% database-driven** (no hardcoded sections)
3. ✅ Works in **multiple contexts**:
   - Public (client-facing via email link)
   - Internal (staff-facing in client profile)
   - Readonly (response viewer)

---

## 📋 THE PLAN

### Phase 1: Fix Immediate Issues (30 min)
**Priority:** 🔥 **DO THIS FIRST**

1. Create new route: `app/dashboard/clients/[id]/questionnaire/page.tsx`
2. Update 5 files with broken links
3. Test navigation works

**See:** `FIX_BROKEN_LINKS_CHECKLIST.md`

---

### Phase 2: Fix Hardcoded Types (2 hours)
**Priority:** ⚠️ **HIGH**

Make production code truly database-driven:

1. Fix `lib/questionnaire/types.ts` - Dynamic type instead of hardcoded interface
2. Fix `lib/questionnaire/use-questionnaire-form.ts` - Remove switch statements
3. Fix `components/questionnaire/review/questionnaire-review.tsx` - Map over config

**Result:** Can add/remove sections via database without code changes

---

### Phase 3: Migrate to v0 Design (4 hours)
**Priority:** 📊 **MEDIUM**

Replace custom components with v0 shadcn/ui:

1. Update question type components (use v0 Textarea, Input, etc.)
2. Update section renderer (use v0 Card)
3. Update navigation (use v0 Progress, Tabs)
4. Update help system (use v0 Sheet)
5. Copy v0 layout structure (sidebar + main content)

**Result:** Production code looks like v0 demo

---

### Phase 4: Create Unified Component (2 hours)
**Priority:** 📊 **MEDIUM**

Create ONE component for all contexts:

1. Create `UnifiedQuestionnaireForm` component
2. Update routes to use unified component
3. Update client profile tab
4. Delete old separate implementations

**Result:** ONE component used everywhere

---

## 📁 KEY FILES

### Reports Created:
1. **`QUESTIONNAIRE_FORMS_COMPLETE_AUDIT.md`** - Full audit (1267 lines)
2. **`QUESTIONNAIRE_AUDIT_QUICK_REFERENCE.md`** - Quick summary
3. **`QUESTIONNAIRE_FILE_INVENTORY.md`** - File-by-file breakdown
4. **`DELETE_OLD_FORM_AUDIT_REPORT.md`** - Deletion audit + v0 analysis
5. **`FIX_BROKEN_LINKS_CHECKLIST.md`** - Immediate action items
6. **`QUESTIONNAIRE_CURRENT_STATE_SUMMARY.md`** - This file

### Files with Broken Links (5):
1. `app/dashboard/clients/[id]/questionnaire-responses/reset-button.tsx` (line 40)
2. `app/dashboard/clients/[id]/questionnaire-responses/page.tsx` (line 233)
3. `components/clients/questionnaire-status-card.tsx` (line 115)
4. `components/clients/client-questionnaire.tsx` (lines 117, 122)

### Files with Hardcoded Code (3):
1. `lib/questionnaire/types.ts` - Hardcoded QuestionnaireData interface
2. `lib/questionnaire/use-questionnaire-form.ts` - Hardcoded switch statements
3. `components/questionnaire/review/questionnaire-review.tsx` - Hardcoded 8 sections

---

## 🎨 V0 DESIGN SYSTEM

### Available Components (57 total):

**Perfect for Questionnaires:**
- ✅ `card.tsx` - Section containers
- ✅ `form.tsx` - Form wrapper
- ✅ `textarea.tsx` - Long-text questions
- ✅ `input.tsx` - Short-text questions
- ✅ `radio-group.tsx` - Multiple choice (single)
- ✅ `checkbox.tsx` - Multiple choice (multi)
- ✅ `progress.tsx` - Progress indicator
- ✅ `sheet.tsx` - Help panel
- ✅ `button.tsx` - Navigation
- ✅ `label.tsx` - Question labels
- ✅ `tabs.tsx` - Section navigation
- ✅ `badge.tsx` - Status badges
- ✅ `separator.tsx` - Dividers
- ✅ `skeleton.tsx` - Loading states

**Plus 43 more** for dialogs, menus, tables, charts, etc.

### V0 Demo Component:

**File:** `ui-design-system/components/clients/client-questionnaire.tsx`

**Features:**
- ✅ Clean v0 design aesthetic
- ✅ Sidebar navigation
- ✅ Progress indicator
- ✅ Help panel (Sheet)
- ✅ Save draft button
- ❌ Hardcoded 8 sections (needs database integration)

**This is the design the user wants!**

---

## ⏱️ TIME ESTIMATES

| Phase | Time | Priority |
|-------|------|----------|
| Fix broken links | 30 min | 🔥 URGENT |
| Fix hardcoded types | 2 hours | ⚠️ HIGH |
| Migrate to v0 design | 4 hours | 📊 MEDIUM |
| Create unified component | 2 hours | 📊 MEDIUM |
| Testing & bug fixes | 2 hours | 📊 MEDIUM |
| **TOTAL** | **10.5 hours** | |

---

## ✅ SUCCESS CRITERIA

After all phases complete:

- [ ] No broken links (all navigation works)
- [ ] ONE unified form component
- [ ] Uses v0 shadcn/ui design system
- [ ] 100% database-driven (no hardcoded sections)
- [ ] Works in public context (client-facing)
- [ ] Works in internal context (staff-facing)
- [ ] Works in readonly context (response viewer)
- [ ] Can add/remove sections via database without code changes
- [ ] Matches v0 aesthetic user wants
- [ ] All tests pass

---

## 🚀 NEXT ACTIONS

### Immediate (Today):
1. ✅ Read `FIX_BROKEN_LINKS_CHECKLIST.md`
2. ⚠️ Create new route: `app/dashboard/clients/[id]/questionnaire/page.tsx`
3. ⚠️ Update 5 files with broken links
4. ⚠️ Test all navigation paths work

### This Week:
1. Fix hardcoded types (Phase 2)
2. Migrate to v0 design (Phase 3)
3. Create unified component (Phase 4)

### Testing:
1. Public form works (client fills out via email link)
2. Internal form works (staff fills out in dashboard)
3. Response viewer works (view submitted responses)
4. Admin settings work (add/remove sections)
5. Database flexibility works (disable section → disappears from forms)

---

## 📚 DOCUMENTATION

All audit reports are in: `/Users/rocky/DRSS/`

- `QUESTIONNAIRE_FORMS_COMPLETE_AUDIT.md` - Read this for full details
- `DELETE_OLD_FORM_AUDIT_REPORT.md` - Read this for v0 analysis
- `FIX_BROKEN_LINKS_CHECKLIST.md` - **DO THIS FIRST**

---

## 🔑 KEY INSIGHTS

1. **You already have a unified form system** - Just needs v0 styling
2. **The architecture is solid** - Database-driven, clean components
3. **Only 3 files have hardcoded legacy code** - Easy to fix
4. **v0 has everything you need** - 57 components ready to use
5. **The v0 demo shows the design you want** - Just needs database integration
6. **Total time: ~10 hours** - Very doable

---

**Status:** ⚠️ **BROKEN LINKS** - Fix immediately, then proceed with refactor

**Last Updated:** December 28, 2025



