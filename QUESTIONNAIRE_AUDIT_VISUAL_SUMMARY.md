# QUESTIONNAIRE SYSTEM AUDIT - VISUAL SUMMARY
## Quick Reference Guide

---

## 🎯 THE PROBLEM IN ONE IMAGE

```
┌─────────────────────────────────────────────────────────────┐
│                    WHAT YOU DO IN SETTINGS                   │
│                                                              │
│  Admin opens Settings → Questionnaire                        │
│  Disables "Faith Integration" section                        │
│  Clicks Save                                                 │
│                                                              │
│  ✅ Saves to database successfully                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │    DATABASE      │
                    │                  │
                    │  Faith section   │
                    │  enabled = false │
                    └──────────────────┘
                              │
                              │ ❌ NOT READ BY FORMS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     WHAT FORMS SEE                           │
│                                                              │
│  Forms read from: lib/questionnaire/questions-config.ts      │
│  File contains:  STATIC HARDCODED ARRAYS                     │
│  Result: Faith section still shows (enabled = true)          │
│                                                              │
│  ❌ Your settings change had ZERO effect                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 SYSTEM HEALTH DASHBOARD

### Database Infrastructure: ✅ 100%

| Component | Status | Details |
|-----------|--------|---------|
| Tables Created | ✅ | 5 tables (sections, questions, help, responses, overrides) |
| Migrations Applied | ✅ | 3 migration files, all successful |
| Seed Data | ✅ | 8 sections, 34 questions, 34 help items |
| Constraints | ✅ | Foreign keys, triggers, RLS policies |
| Functions | ✅ | Version tracking, timestamp updates |

### Backend APIs: ✅ 95%

| Component | Status | Details |
|-----------|--------|---------|
| Config API | ✅ | GET /api/questionnaire-config (working) |
| Override API | ✅ | Full CRUD on client overrides (working) |
| Response API | ✅ | Version history, submit, latest (working) |
| Server Actions | ✅ | All CRUD operations (working) |
| Test Coverage | ⚠️ | No automated tests |

### Frontend Components: ⚠️ 70%

| Component | Status | Details |
|-----------|--------|---------|
| Settings UI | ✅ | Full CRUD, drag-drop, all working |
| Admin Form | ⚠️ | Renders correctly BUT reads static file |
| Public Form | ❌ | Uses 8 hardcoded section components |
| Customize Popup | ❌ | Questions list not displaying |
| Response Viewer | ✅ | Shows submissions correctly |

### Data Flow: ❌ CRITICAL GAP

```
Settings UI → Database: ✅ CONNECTED
Database → Forms: ❌ NOT CONNECTED ← THE PROBLEM
```

---

## 🗺️ FILE MAP

### What Works ✅

```
app/actions/questionnaire-config.ts
├─ getSections() ✅
├─ getQuestions() ✅
├─ updateSection() ✅
├─ updateQuestion() ✅
└─ All CRUD operations work perfectly

app/api/questionnaire-config/route.ts
└─ Returns data from database ✅

components/settings/questionnaire-settings.tsx
└─ Complete admin UI for managing config ✅

components/questionnaire/section-renderer.tsx
components/questionnaire/question-renderer.tsx
└─ Dynamic rendering system (works perfectly) ✅
```

### What's Broken ❌

```
lib/questionnaire/questions-config.ts
├─ export const sections = [...] ❌ STATIC ARRAY
├─ export const questions = [...] ❌ STATIC ARRAY
└─ export function getEnabledSections() ❌ Returns static data

↓ (used by)

lib/questionnaire/questionnaire-config-context.tsx
└─ Wraps static config in React context ❌

↓ (used by)

app/dashboard/clients/onboarding/[id]/page.tsx
components/questionnaire/public-questionnaire-form.tsx
└─ All forms read from static config ❌

RESULT: Settings changes ignored ❌
```

### What Needs Migration ⚠️

```
components/questionnaire/sections/
├─ avatar-definition-section.tsx ⚠️ Delete after migration
├─ dream-outcome-section.tsx ⚠️ Delete after migration
├─ problems-obstacles-section.tsx ⚠️ Delete after migration
├─ solution-methodology-section.tsx ⚠️ Delete after migration
├─ brand-voice-section.tsx ⚠️ Delete after migration
├─ proof-transformation-section.tsx ⚠️ Delete after migration
├─ faith-integration-section.tsx ⚠️ Delete after migration
└─ business-metrics-section.tsx ⚠️ Delete after migration

(8 files = ~1,200 lines of duplicate logic)
```

---

## 📋 MIGRATION CHECKLIST

### Phase A: Fix Config Layer (2 hours) 🔥 START HERE

- [ ] Open `lib/questionnaire/questions-config.ts`
- [ ] Replace static exports with database queries
- [ ] Import functions from `app/actions/questionnaire-config.ts`
- [ ] Make all exported functions async
- [ ] Update context to handle async loading
- [ ] Test: Toggle section in Settings → should disappear from forms

**Files to Edit:** 2 files  
**Risk:** Low  
**Impact:** Critical - enables everything else  

### Phase B: Migrate Public Form (3 hours)

- [ ] Update `app/form/[token]/page.tsx` to fetch config
- [ ] Pass sections/questions as props to PublicQuestionnaireForm
- [ ] Replace switch statement with SectionRenderer
- [ ] Delete imports of 8 hardcoded section components
- [ ] Test: Fill out public form, verify saves correctly
- [ ] Test: Disabled sections don't appear

**Files to Edit:** 2 files  
**Files to Delete:** 0 (wait for Phase D)  
**Risk:** Medium  
**Impact:** High - unifies both forms  

### Phase C: Fix Customize Popup (2 hours)

- [ ] Debug why questions aren't displaying
- [ ] Add logging to narrow down issue
- [ ] Fix rendering logic
- [ ] Test: Open popup, see questions, customize, save
- [ ] Verify overrides work end-to-end

**Files to Edit:** 1 file  
**Risk:** Low  
**Impact:** High - enables per-client customization  

### Phase D: Cleanup (1 hour)

- [ ] Delete 8 hardcoded section component files
- [ ] Delete `lib/questionnaire/section-data.ts`
- [ ] Delete `lib/questionnaire/help-guide-data.ts`
- [ ] Remove static arrays from `questions-config.ts`
- [ ] Run TypeScript check
- [ ] Fix any broken imports

**Files to Delete:** 10 files  
**Risk:** Low  
**Impact:** Code cleanliness  

### Phase E: Polish (1 hour)

- [ ] Add caching to config queries
- [ ] Add loading states
- [ ] Improve error messages
- [ ] Performance testing
- [ ] Documentation

**Files to Edit:** 3-5 files  
**Risk:** Low  
**Impact:** Performance & UX  

---

## 🎯 QUICK WINS

### Test A: The Faith Section Test (2 min)

```
1. Go to Settings → Questionnaire
2. Find "Faith Integration" section
3. Toggle OFF
4. Open admin form (/dashboard/clients/onboarding/[id])
   Expected: ❌ Faith section missing (currently ✅ still shows)
5. Open public form (/form/[token])
   Expected: ❌ Faith section missing (currently ✅ still shows)
```

**When this test passes:** Config is connected to database ✅

### Test B: Question Text Change (2 min)

```
1. Go to Settings → Questionnaire
2. Expand "Avatar Definition" section
3. Find "Q1: Who is your ideal customer?"
4. Edit text to "Who is your dream client?"
5. Save
6. Refresh any form
   Expected: New text shows (currently: old text still shows)
```

**When this test passes:** Forms reading from database ✅

### Test C: Section Reorder (2 min)

```
1. Go to Settings → Questionnaire
2. Drag "Business Metrics" to position 1 (first)
3. Save
4. Open any form
   Expected: Business Metrics is first section (currently: Avatar Definition still first)
```

**When this test passes:** Sort order connected ✅

---

## 🏗️ ARCHITECTURE DIAGRAMS

### Current Architecture (Disconnected)

```
┌─────────────────────────────────────────────────────────┐
│                    ADMIN CREATES/EDITS                   │
├─────────────────────────────────────────────────────────┤
│  Settings UI Component                                   │
│  └─ questionnaire-settings.tsx                           │
│     └─ Calls server actions                              │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              SERVER ACTIONS (Working)                    │
├─────────────────────────────────────────────────────────┤
│  app/actions/questionnaire-config.ts                     │
│  ├─ getSections() → SELECT * FROM questionnaire_sections│
│  ├─ updateSection() → UPDATE questionnaire_sections     │
│  └─ All CRUD operations                                  │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                   DATABASE (Working)                     │
├─────────────────────────────────────────────────────────┤
│  PostgreSQL (Supabase)                                   │
│  ├─ questionnaire_sections (8 rows)                     │
│  ├─ questionnaire_questions (34 rows)                   │
│  ├─ questionnaire_help (34 rows)                        │
│  ├─ questionnaire_responses (version history)           │
│  └─ client_questionnaire_overrides (per-client)         │
└─────────────────────────────────────────────────────────┘

                  ⚠️ GAP HERE ⚠️
                  NOT CONNECTED

┌─────────────────────────────────────────────────────────┐
│              CONFIG LAYER (Static File)                  │
├─────────────────────────────────────────────────────────┤
│  lib/questionnaire/questions-config.ts                   │
│  ├─ export const sections = [8 hardcoded items]         │
│  ├─ export const questions = [34 hardcoded items]       │
│  └─ DOES NOT READ DATABASE ❌                            │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                    FORMS (Read Static)                   │
├─────────────────────────────────────────────────────────┤
│  Admin Form: /dashboard/clients/onboarding/[id]         │
│  Public Form: /form/[token]                              │
│  └─ Both read from static config file                    │
│  └─ Ignore database completely                           │
└─────────────────────────────────────────────────────────┘
```

### Target Architecture (Connected)

```
┌─────────────────────────────────────────────────────────┐
│                    ADMIN CREATES/EDITS                   │
├─────────────────────────────────────────────────────────┤
│  Settings UI Component                                   │
│  └─ questionnaire-settings.tsx                           │
│     └─ Calls server actions                              │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              SERVER ACTIONS (Working)                    │
├─────────────────────────────────────────────────────────┤
│  app/actions/questionnaire-config.ts                     │
│  ├─ getSections() → SELECT * FROM questionnaire_sections│
│  ├─ updateSection() → UPDATE questionnaire_sections     │
│  └─ All CRUD operations                                  │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                   DATABASE (Working)                     │
├─────────────────────────────────────────────────────────┤
│  PostgreSQL (Supabase)                                   │
│  ├─ questionnaire_sections (8 rows)                     │
│  ├─ questionnaire_questions (34 rows)                   │
│  ├─ questionnaire_help (34 rows)                        │
│  ├─ questionnaire_responses (version history)           │
│  └─ client_questionnaire_overrides (per-client)         │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼ ✅ CONNECTED
┌─────────────────────────────────────────────────────────┐
│              CONFIG LAYER (Database Queries)             │
├─────────────────────────────────────────────────────────┤
│  lib/questionnaire/questions-config.ts                   │
│  ├─ export async function getEnabledSections()          │
│  │   return await getSections().filter(...)             │
│  └─ READS FROM DATABASE ✅                               │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              FORMS (Read Database)                       │
├─────────────────────────────────────────────────────────┤
│  Admin Form: /dashboard/clients/onboarding/[id]         │
│  Public Form: /form/[token]                              │
│  └─ Both use SectionRenderer (config-driven)             │
│  └─ Instantly reflect Settings changes ✅                │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 EFFORT vs IMPACT MATRIX

```
                    HIGH IMPACT
                        │
                        │
      Phase A           │           Phase C
   Fix Config Layer     │      Fix Customize Popup
   ⚡⚡ (2h)             │           ⚡⚡ (2h)
   🎯🎯🎯🎯🎯            │           🎯🎯🎯🎯
   🟢 Low Risk          │           🟢 Low Risk
                        │
────────────────────────┼────────────────────────────
                        │
      Phase B           │           Phase D
   Migrate Public Form  │           Cleanup
   ⚡⚡⚡ (3h)            │           ⚡ (1h)
   🎯🎯🎯🎯              │           🎯🎯
   🟡 Medium Risk       │           🟢 Low Risk
                        │
                    LOW IMPACT
                        │
                        │
                     Phase E
                      Polish
                    ⚡ (1h)
                      🎯
                   🟢 Low Risk
```

**Legend:**
- ⚡ = Hours of work
- 🎯 = Business value
- 🟢 = Low risk, 🟡 = Medium risk, 🔴 = High risk

**Recommendation:** Phase A first (highest impact, lowest risk, shortest time)

---

## 🚀 GETTING STARTED

### Option 1: Quick Fix (2 hours)

**Just do Phase A**
- Fix the config layer
- Settings will affect admin forms
- Public form still uses old system (acceptable)
- 80% of value for 20% of effort

### Option 2: Complete Migration (10 hours)

**Do all 5 phases**
- Fully unified system
- Both forms config-driven
- All deprecated code removed
- 100% of value

### Option 3: Critical Path (4 hours)

**Do Phase A + Phase C**
- Fix config layer
- Fix customize popup
- Covers most important use cases
- Can do Phase B later

---

## 📞 DECISION TREE

```
Do you need Settings changes to affect forms immediately?
│
├─ YES → Start with Phase A (2h)
│        Settings will control admin forms
│        
│        Do you need public forms to be config-driven too?
│        │
│        ├─ YES → Continue with Phase B (3h)
│        │        Both forms unified
│        │
│        └─ NO → Stop here (acceptable)
│                 Public form still works
│
└─ NO → Do you need per-client customization?
         │
         ├─ YES → Do Phase C only (2h)
         │        Customize popup will work
         │
         └─ NO → You're probably fine as-is
                  (but losing out on dynamic config)
```

---

## 🔍 VERIFICATION STEPS

After completing migration phases, verify with these tests:

### ✅ Config Connected Test

```bash
# 1. Disable section in Settings
# 2. Run this check:

curl http://localhost:3000/api/questionnaire-config | jq '.sections[] | select(.enabled == false)'

# Should show disabled sections

# 3. Open any form
# Expected: Disabled sections do NOT appear
```

### ✅ Public Form Test

```bash
# 1. Get a client's questionnaire token
# 2. Open: http://localhost:3000/form/[token]
# 3. Fill out form
# 4. Check database:

SELECT * FROM questionnaire_responses WHERE client_id = '...' ORDER BY version DESC LIMIT 1;

# Should show latest submission
```

### ✅ Override Test

```bash
# 1. Open customize popup for client
# 2. Disable a question
# 3. Check database:

SELECT * FROM client_questionnaire_overrides WHERE client_id = '...'

# Should show override record

# 4. Open public form for that client
# Expected: Disabled question does NOT appear
```

---

## 📚 REFERENCE LINKS

**Database Schema:**
- See Section: "APPENDIX B: DATABASE SCHEMA" in main audit report

**API Documentation:**
- See Section: "APPENDIX C: API DOCUMENTATION" in main audit report

**Complete File List:**
- See Section: "APPENDIX A: FILE REFERENCE" in main audit report

**Detailed Analysis:**
- Full audit report: `QUESTIONNAIRE_SYSTEM_COMPLETE_AUDIT.md`

---

## 🎯 SUCCESS CRITERIA

Migration is complete when:

✅ Admin toggles section OFF in Settings → Section disappears from all forms  
✅ Admin edits question text in Settings → New text shows in all forms  
✅ Admin reorders sections in Settings → New order shows in all forms  
✅ Public form is config-driven (no hardcoded components)  
✅ Customize popup shows all questions and allows editing  
✅ Per-client overrides work correctly  
✅ No TypeScript errors  
✅ All deprecated files removed  

**Test in 30 seconds:**
1. Settings → Toggle "Faith Integration" OFF
2. Open any form
3. Faith section should be gone ✅

If this works, migration is successful!

---

**Generated:** December 28, 2025  
**Next Action:** Read `QUESTIONNAIRE_SYSTEM_COMPLETE_AUDIT.md` for detailed implementation guide

