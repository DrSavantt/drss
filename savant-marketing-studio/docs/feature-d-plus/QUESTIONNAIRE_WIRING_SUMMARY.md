# Questionnaire System - Wiring Summary

## 🎯 EXECUTIVE SUMMARY

**What Works:**
- ✅ Settings admin UI (can edit sections/questions in database)
- ✅ Database schema (stores all config)
- ✅ Config-driven components (SectionRenderer, QuestionRenderer)

**What's Broken:**
- ❌ Forms read from STATIC FILE, not database
- ❌ Settings changes have ZERO effect on live questionnaires
- ❌ Public form still uses deprecated hardcoded components

**The Fix:**
Make `/lib/questionnaire/questions-config.ts` read from database instead of exporting static arrays.

---

## CURRENT ARCHITECTURE (BROKEN)

```
┌─────────────────────────────────────────────────────────────┐
│                     SETTINGS ADMIN UI                        │
│  /dashboard/settings (Questionnaire tab)                    │
│  - Edit sections/questions                                  │
│  - Toggle enabled/disabled                                  │
│  - Drag to reorder                                          │
└────────────────┬────────────────────────────────────────────┘
                 │ ✅ Writes to...
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   SUPABASE DATABASE                          │
│  Tables:                                                     │
│  - questionnaire_sections (8 rows)                          │
│  - questionnaire_questions (34 rows)                        │
│  - questionnaire_help (34 rows)                             │
└─────────────────────────────────────────────────────────────┘
                 │
                 │ ❌ NOT READ BY FORMS
                 │
                 
┌─────────────────────────────────────────────────────────────┐
│              STATIC CONFIG FILE (ORPHANED)                   │
│  /lib/questionnaire/questions-config.ts                     │
│  - Hardcoded 34 questions                                   │
│  - Hardcoded 8 sections                                     │
│  - Never updated when Settings change                       │
└────────────────┬────────────────────────────────────────────┘
                 │ ✅ Read by...
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  QUESTIONNAIRE FORMS                         │
│                                                              │
│  INTERNAL (Dashboard):                                       │
│  /dashboard/clients/onboarding/[id]                         │
│  - Uses SectionRenderer ✅                                   │
│  - Reads from static config ❌                              │
│                                                              │
│  PUBLIC (Token Link):                                        │
│  /form/[token]                                              │
│  - Uses deprecated components ❌                            │
│  - Hardcoded sections ❌                                    │
└─────────────────────────────────────────────────────────────┘
```

**PROBLEM:** Database is populated but never read. Forms read from static file.

---

## DESIRED ARCHITECTURE (WORKING)

```
┌─────────────────────────────────────────────────────────────┐
│                     SETTINGS ADMIN UI                        │
│  /dashboard/settings (Questionnaire tab)                    │
└────────────────┬────────────────────────────────────────────┘
                 │ ✅ Writes to...
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   SUPABASE DATABASE                          │
│  questionnaire_sections + questionnaire_questions            │
└────────────────┬────────────────────────────────────────────┘
                 │ ✅ Read by...
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    CONFIG API LAYER                          │
│  /lib/questionnaire/questions-config.ts                     │
│  - getEnabledSections() → SELECT FROM questionnaire_sections│
│  - getQuestions() → SELECT FROM questionnaire_questions     │
│  - All helpers fetch from DB                                │
└────────────────┬────────────────────────────────────────────┘
                 │ ✅ Used by...
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  QUESTIONNAIRE FORMS                         │
│  - Internal form (dashboard)                                │
│  - Public form (token link)                                 │
│  - Review page                                              │
│  - All use database config via API layer                    │
└─────────────────────────────────────────────────────────────┘
```

**SOLUTION:** Make config API layer read from database. Everything else already works.

---

## THE ONE CRITICAL CHANGE

### Before (Current - Broken)
```typescript
// /lib/questionnaire/questions-config.ts
export const sections: SectionConfig[] = [
  { id: 1, key: "avatar", title: "Avatar Definition", ... },
  { id: 2, key: "dream", title: "Dream Outcome", ... },
  // ... hardcoded array
]

export function getEnabledSections(): SectionConfig[] {
  return sections.filter(s => s.enabled)  // ❌ Static array
}
```

### After (Fixed - Working)
```typescript
// /lib/questionnaire/questions-config.ts
import { createClient } from '@/lib/supabase/server'

export async function getEnabledSections(): Promise<SectionConfig[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('questionnaire_sections')
    .select('*')
    .eq('enabled', true)
    .order('sort_order')
  return data || []  // ✅ Database query
}
```

**Impact:** Settings changes immediately affect all questionnaires.

---

## WHAT THIS FIXES

Once wired, changing Settings will affect:

### ✅ Section Level
- Toggle section OFF → Section disappears from all forms
- Edit section title → New title shows in all forms
- Reorder sections → New order reflects in all forms
- Edit time estimate → Updated in progress indicators

### ✅ Question Level
- Toggle question OFF → Question disappears from all forms
- Edit question text → New text shows in all forms
- Edit placeholder → New placeholder shows in input fields
- Change min/max length → New validation rules apply
- Toggle required → Required status updates
- Edit help content → New help shows in help panel

### ✅ User Experience
- Admin disables "Faith Integration" → Users never see it
- Admin changes Q1 to "Who's your customer?" → Forms update instantly
- Admin adds Q35 → Appears in forms without deploy
- Admin reorders Q2 before Q1 → New order in forms

---

## STEPS TO WIRE (QUICK VERSION)

### Step 1: Make Config Read from Database
Update `/lib/questionnaire/questions-config.ts`:
- Change all `export const` arrays to `export async function` that query DB
- Keep same API surface (function names)
- Add caching for performance

### Step 2: Update Form Pages to Async
- `/app/dashboard/clients/onboarding/[id]/page.tsx` - Make server component
- `/app/form/[token]/page.tsx` - Already server component, add config fetch

### Step 3: Update Public Form
- Replace deprecated components with `<SectionRenderer />`
- Pass database config as props

### Step 4: Update Review Page
- Loop through config sections instead of hardcoding 8
- Get question keys from config

### Step 5: Update Validation
- Replace `validation-schemas.ts` with `dynamic-validation.ts` in saveQuestionnaire

---

## TESTING PLAN

After wiring, test this flow:

1. **Go to Settings → Questionnaire**
2. **Disable "Faith Integration" section** (toggle OFF)
3. **Go to a client → Start Questionnaire**
4. **Verify:** Only 7 sections appear (no Faith Integration)
5. **Go back to Settings**
6. **Edit Q1 text** to "Who is your ideal customer avatar?"
7. **Go back to questionnaire**
8. **Verify:** Q1 now shows new text
9. **Test public form** at `/form/[token]`
10. **Verify:** Same changes reflected

If all 10 steps pass, wiring is complete.

---

## FILES SUMMARY

**Need Database Connection:**
- `/lib/questionnaire/questions-config.ts` ⚡ CRITICAL
- `/components/questionnaire/public-questionnaire-form.tsx`
- `/components/questionnaire/review/questionnaire-review.tsx`
- `/app/actions/questionnaire.ts` (validation part)

**Already Database-Connected:**
- `/components/settings/questionnaire-settings.tsx` ✅
- `/app/actions/questionnaire-config.ts` ✅

**Deprecated (Can Delete After Wiring):**
- `/components/questionnaire/sections/avatar-definition-section.tsx`
- `/components/questionnaire/sections/dream-outcome-section.tsx`
- (+ 6 more section components)
- `/lib/questionnaire/validation-schemas.ts`
- `/lib/questionnaire/help-guide-data.ts`
- `/lib/questionnaire/section-data.ts`
- `/lib/questionnaire/conditional-logic.ts`

---

## BLOCKERS

**None.** 

All infrastructure is ready:
- ✅ Database tables exist
- ✅ Data is seeded  
- ✅ Server actions work
- ✅ Admin UI works
- ✅ Config-driven components exist

Just need to connect Layer 2 (config) to Layer 1 (database).

---

## QUICK WIN

**Want to see it work RIGHT NOW?**

Manually verify the database has data:
```sql
SELECT * FROM questionnaire_sections WHERE enabled = true;
SELECT * FROM questionnaire_questions WHERE enabled = true LIMIT 5;
```

If data exists, you're one function change away from a fully dynamic questionnaire system.

