# Questionnaire System - Migration Documentation Index

## 📚 Documentation Guide

This folder contains complete documentation for migrating the questionnaire system from a fragmented dual-system to a unified database-driven architecture.

---

## 🎯 START HERE

### If you want to understand the problem quickly:
👉 **Read:** `QUESTIONNAIRE_MIGRATION_SUMMARY.md`
- One-page overview
- Problem in one sentence
- Solution in one sentence
- Quick reference checklist

### If you want to see visual diagrams:
👉 **Read:** `QUESTIONNAIRE_ARCHITECTURE_DIAGRAM.md`
- Current vs desired architecture
- Data flow diagrams
- Component relationships
- File organization charts

### If you're ready to start coding:
👉 **Read:** `QUESTIONNAIRE_MIGRATION_PLAN.md`
- Complete step-by-step implementation guide
- Code examples for every change
- Testing procedures
- Risk assessment

---

## 📖 Document Descriptions

### 1. QUESTIONNAIRE_MIGRATION_SUMMARY.md
**Type:** Quick Reference  
**Length:** ~600 lines  
**Purpose:** Fast overview of the problem and solution

**Best for:**
- Getting up to speed quickly
- Explaining the issue to others
- Checking migration progress with checklist
- Quick wins and testing

**Contains:**
- The problem in one sentence
- The fix in one sentence
- Current state overview
- Migration checklist
- Success criteria
- Effort vs impact analysis

---

### 2. QUESTIONNAIRE_ARCHITECTURE_DIAGRAM.md
**Type:** Visual Guide  
**Length:** ~400 lines  
**Purpose:** Understanding system architecture

**Best for:**
- Visual learners
- Understanding data flow
- Seeing component relationships
- Comparing before/after states

**Contains:**
- ASCII diagrams of current architecture
- ASCII diagrams of desired architecture
- Data flow comparisons
- Component hierarchy charts
- File organization structure
- Benefits visualization

---

### 3. QUESTIONNAIRE_MIGRATION_PLAN.md
**Type:** Implementation Guide  
**Length:** ~900 lines  
**Purpose:** Complete migration instructions

**Best for:**
- Implementing the migration
- Code-level details
- Step-by-step instructions
- Testing procedures

**Contains:**
- Route inventory (all questionnaire routes)
- Token systems analysis
- Config wiring status
- Keep vs discard file lists
- Missing pieces identification
- 5-phase migration plan with code examples
- Success criteria
- Risk assessment
- Timeline estimates

---

## 🚀 Recommended Reading Order

### For Project Managers / Stakeholders:
1. Read **SUMMARY** - Problem & solution overview
2. Skim **ARCHITECTURE** - Visual understanding
3. Check effort estimates in **PLAN** - Timeline section

### For Developers (New to Codebase):
1. Read **SUMMARY** - Quick context
2. Study **ARCHITECTURE** - System understanding
3. Read **PLAN** - Full implementation details
4. Review **WIRING_SUMMARY** - Technical details

### For Developers (Familiar with Codebase):
1. Skim **SUMMARY** - Refresh memory
2. Jump to **PLAN** Phase A - Start implementing
3. Reference **ARCHITECTURE** as needed

---

## 📋 The Problem (TL;DR)

**Current State:**
- Settings UI saves config to database ✅
- Forms read from hardcoded static file ❌
- Changes in Settings have ZERO effect on forms ❌

**Root Cause:**
- Config layer (`lib/questionnaire/questions-config.ts`) exports static arrays
- Should query database instead

**Solution:**
- Make config functions async
- Query database instead of returning static arrays
- Connect Settings → Database → Forms

**Effort:** 7-10 hours total

**Risk:** Low (all infrastructure ready)

---

## 🎯 The Migration in 5 Phases

### Phase A: Database Connection (2 hours) ⚡ CRITICAL
**Make config layer read from database**
- Update `lib/questionnaire/questions-config.ts`
- Make functions async, query DB
- Update admin onboarding route to await config
- **Test:** Toggle section in Settings → Verify disappears from form

### Phase B: Public Form Migration (3 hours)
**Migrate public form to config-driven system**
- Update `app/form/[token]/page.tsx` to fetch config
- Replace switch statement with `SectionRenderer`
- Remove imports of deprecated section components
- **Test:** Public form works with database config

### Phase C: Dynamic Sections (3 hours)
**Remove hardcoded section arrays everywhere**
- Update review page
- Update responses view page
- Make all section lists dynamic from database
- **Test:** All pages show correct sections

### Phase D: Cleanup (1 hour)
**Delete deprecated files**
- Delete 8 individual section components
- Delete 4 hardcoded data files
- Remove broken helper components
- **Test:** No TypeScript errors, all imports work

### Phase E: Polish (1 hour)
**Performance and documentation**
- Add caching to config functions
- Update documentation
- Final end-to-end testing
- **Test:** Complete flow works perfectly

---

## ✅ Success Criteria

Migration is complete when:

1. ✅ Admin toggles section OFF in Settings → Section disappears from ALL forms
2. ✅ Admin edits question text in Settings → New text shows in ALL forms
3. ✅ Admin modifies validation rules → Rules enforced in ALL forms
4. ✅ Public form uses config-driven components
5. ✅ Admin form reads from database
6. ✅ Review page shows dynamic sections
7. ✅ Responses page shows dynamic sections
8. ✅ All deprecated files deleted
9. ✅ No TypeScript errors
10. ✅ All tests pass

---

## 🧪 Quick Test

**Want to verify if migration is done?**

Run this test:

1. Go to Settings → Questionnaire
2. Toggle "Faith Integration" section OFF
3. Save changes
4. Open any questionnaire form (admin or public)
5. **Check:** Faith Integration section should NOT appear

**Result:**
- ✅ **Section hidden:** Migration successful!
- ❌ **Section still shows:** Config still reading from static file

---

## 📊 Files Summary

### Files to Modify (6 files)
1. `lib/questionnaire/questions-config.ts` - **CRITICAL** - Make async, query DB
2. `app/dashboard/clients/onboarding/[id]/page.tsx` - Await config
3. `components/questionnaire/public-questionnaire-form.tsx` - Use SectionRenderer
4. `components/questionnaire/review/questionnaire-review.tsx` - Dynamic sections
5. `app/dashboard/clients/[id]/questionnaire-responses/page.tsx` - Dynamic sections
6. `app/actions/questionnaire.ts` - Dynamic validation

### Files to Delete (15 files)
- 8 individual section components
- 4 hardcoded data files
- 3 deprecated helper components

### Files Already Working (No Changes)
- `app/actions/questionnaire-config.ts` ✅
- `app/dashboard/settings/questionnaire/page.tsx` ✅
- `components/questionnaire/section-renderer.tsx` ✅
- `components/questionnaire/question-renderer.tsx` ✅
- All shared components (question types, navigation, etc.) ✅

---

## 🔗 Related Documentation

### Already Existing Docs (Background Reading)
- `QUESTIONNAIRE_WIRING_SUMMARY.md` - Technical wiring details
- `DATABASE_BACKED_QUESTIONNAIRE_GUIDE.md` - Database schema info
- `CONFIG_DRIVEN_QUESTIONNAIRE_GUIDE.md` - Config system usage
- `QUESTIONNAIRE_FLOW_AUDIT.md` - Flow analysis
- `QUESTIONNAIRE_SETTINGS_QUICKSTART.md` - Settings UI guide

### Migration Docs (New - This Set)
- `QUESTIONNAIRE_MIGRATION_INDEX.md` ← You are here
- `QUESTIONNAIRE_MIGRATION_SUMMARY.md` - Quick reference
- `QUESTIONNAIRE_ARCHITECTURE_DIAGRAM.md` - Visual diagrams
- `QUESTIONNAIRE_MIGRATION_PLAN.md` - Implementation guide

---

## 💬 Common Questions

### Q: How long will this take?
**A:** 7-10 hours total, can be done incrementally over multiple days.

### Q: What's the risk?
**A:** Low. All infrastructure exists. Can test each phase before proceeding. Can rollback with git.

### Q: Can I do this incrementally?
**A:** Yes! Start with Phase A (2 hours, highest impact). Test thoroughly. Continue if successful.

### Q: What if I just want to fix the Settings UI?
**A:** Do Phase A only. This connects Settings to admin forms. Public form will still use old system.

### Q: Will this break anything?
**A:** No. You're replacing hardcoded data with database queries. The API surface stays the same.

### Q: Do I need to update the database schema?
**A:** No. Tables already exist and are populated. Just need to connect the code layer.

### Q: What about styling with v0 theme?
**A:** Good news! All shared components already use v0 theme. Once migrated to config-driven system, styling is done.

### Q: Can I test on staging first?
**A:** Yes! Test each phase on staging before production. Migration is git-committable at each phase.

---

## 🎯 Next Steps

### If you're new to this:
1. Read `QUESTIONNAIRE_MIGRATION_SUMMARY.md` (10 min)
2. Review `QUESTIONNAIRE_ARCHITECTURE_DIAGRAM.md` (10 min)
3. Decide if you want to proceed

### If you're ready to start:
1. Ensure you have:
   - Database tables exist (`questionnaire_sections`, etc.)
   - Seed data loaded (8 sections, 34 questions)
   - Git repo in clean state
2. Read Phase A in `QUESTIONNAIRE_MIGRATION_PLAN.md`
3. Start coding!

### If you need help:
1. Check existing docs in `_docs/` folder
2. Review server actions in `app/actions/questionnaire-config.ts`
3. Look at working Settings UI in `components/settings/questionnaire-settings.tsx`

---

## 📝 Change Log

### 2025-12-27 - Initial Documentation
- Created comprehensive migration documentation
- Mapped all routes and systems
- Identified missing links
- Created 5-phase migration plan
- Added visual diagrams
- Documented all files to modify/delete

---

## ✨ Credits

**Analysis Date:** December 27, 2025  
**Status:** Ready to Execute  
**Confidence:** High - All infrastructure ready

---

**Ready to start?** → Open `QUESTIONNAIRE_MIGRATION_PLAN.md` and begin with Phase A!

