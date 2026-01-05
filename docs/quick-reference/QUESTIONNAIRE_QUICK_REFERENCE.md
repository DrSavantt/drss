# QUESTIONNAIRE SYSTEM - QUICK REFERENCE CARD

**Last Updated:** December 28, 2025  
**Status:** System is healthy, no broken imports

---

## 🎯 THE ANSWER YOU'RE LOOKING FOR

### "Why does the Customize popup only show 2 questions?"

**Short Answer:** The API filters to only enabled questions.

**File:** `app/api/client-questionnaire/[clientId]/route.ts`  
**Lines:** 43, 56

```typescript
.eq('enabled', true)  // ← This is why
```

**Fix Options:**
1. Enable more questions in Settings UI
2. Remove the filter to show all questions (recommended)

---

## 📁 MOST IMPORTANT FILES

| Purpose | File |
|---------|------|
| **Settings UI** (the working one) | `components/settings/questionnaire-settings.tsx` |
| **Customize Popup** (the mystery) | `components/questionnaire/share-questionnaire-popup.tsx` |
| **Config CRUD** | `app/actions/questionnaire-config.ts` |
| **Public Form** | `components/questionnaire/public-questionnaire-form.tsx` |
| **Admin Form** | `app/dashboard/clients/onboarding/[id]/page.tsx` |
| **Customize API** | `app/api/client-questionnaire/[clientId]/route.ts` |

---

## 🔀 TWO WAYS TO GET CONFIG

### Method 1: Server Actions (Shows ALL)
```typescript
import { getSections, getQuestionsWithHelp } from '@/app/actions/questionnaire-config'

const sections = await getSections()           // Returns ALL
const questions = await getQuestionsWithHelp() // Returns ALL
```

**Used by:** Settings UI, Public form page

### Method 2: API Route (May Filter)
```typescript
const res = await fetch('/api/questionnaire-config')
const { sections, questions } = await res.json()
```

**Used by:** Context provider, client components

### Method 3: Client-Specific API (Filters + Overrides)
```typescript
const res = await fetch(`/api/client-questionnaire/${clientId}`)
const { data } = await res.json()  // Only enabled items
```

**Used by:** Customize popup

---

## 🗺️ ROUTES CHEAT SHEET

| URL | Component | Purpose |
|-----|-----------|---------|
| `/form/[token]` | PublicQuestionnaireForm | Client fills out questionnaire |
| `/dashboard/clients/onboarding/[id]` | QuestionnairePage | Admin fills out for client |
| `/dashboard/settings/questionnaire` | QuestionnaireSettings | Manage questions/sections |
| `/dashboard/clients/[id]` | ClientDetail | Client profile (has Customize button) |

---

## 🔧 COMMON TASKS

### Enable a Question
```typescript
// In Settings UI or via code:
await toggleQuestion('q1_ideal_customer', true)
```

### Get Enabled Sections Only
```typescript
const config = useQuestionnaireConfig()
const enabledSections = config.getEnabledSections()
```

### Check Why Question is Hidden
```typescript
const config = useQuestionnaireConfig()
const shouldShow = config.shouldShowQuestion(questionId, formData)
// Returns false if:
// - Question is disabled
// - Section is disabled
// - Conditional logic fails
```

### Add Client Override
```typescript
await fetch(`/api/client-questionnaire/${clientId}/override`, {
  method: 'PUT',
  body: JSON.stringify({
    question_id: 'q1_ideal_customer',
    override_type: 'question',
    is_enabled: false,
    custom_text: 'Custom question text'
  })
})
```

---

## 🐛 DEBUGGING CHECKLIST

### Form Won't Load
- [ ] Check database: Are sections/questions seeded?
- [ ] Check context: Is page wrapped in `<QuestionnaireConfigProvider>`?
- [ ] Check API: Does `/api/questionnaire-config` return 200?
- [ ] Check console: Any JavaScript errors?

### Question Not Showing in Popup
- [ ] Check database: `SELECT * FROM questionnaire_questions WHERE id = '?';`
- [ ] Verify `enabled = true`
- [ ] Check parent section is enabled
- [ ] Check RLS: Does user have access?

### Changes Don't Save
- [ ] Check RLS policies
- [ ] Check user owns client
- [ ] Check browser console for errors
- [ ] Verify mutation returned success

---

## 💾 DATABASE QUICK QUERIES

```sql
-- Check all sections
SELECT id, key, title, enabled, sort_order 
FROM questionnaire_sections 
ORDER BY sort_order;

-- Check questions for section 1
SELECT id, text, enabled, required, type 
FROM questionnaire_questions 
WHERE section_id = 1 
ORDER BY sort_order;

-- Check client overrides
SELECT * 
FROM client_questionnaire_overrides 
WHERE client_id = 'YOUR_CLIENT_ID';

-- Enable all questions in Avatar section (ID = 1)
UPDATE questionnaire_questions 
SET enabled = true 
WHERE section_id = 1;

-- Disable a specific question
UPDATE questionnaire_questions 
SET enabled = false 
WHERE id = 'q15_logo_notes';
```

---

## 🔑 KEY CONCEPTS

### Section
- Container for questions
- Has: id, title, description, estimated_minutes
- Can be enabled/disabled
- Has sort_order for display sequence

### Question
- Individual form field
- Has: id, section_id, text, type, required, enabled
- Types: long-text, short-text, multiple-choice, checkbox, file-upload
- Can have conditional logic (show only if X = Y)

### Override
- Client-specific customization
- Can change: question text, enable/disable state
- Stored in: `client_questionnaire_overrides`
- Merged with global config at runtime

### Response
- Submitted questionnaire data
- Versioned (v1, v2, v3...)
- Only one `is_latest = true` per client
- Stored as JSONB in `questionnaire_responses`

---

## 📊 SYSTEM STATUS

| Component | Status | Issues |
|-----------|--------|--------|
| Public Form | ✅ WORKING | None |
| Admin Form | ✅ WORKING | Sidebar hidden (intentional) |
| Settings UI | ✅ WORKING | None |
| Customize Popup | ⚠️ PARTIAL | Only shows enabled (by design) |
| Database | ✅ WORKING | None |
| APIs | ✅ WORKING | None |
| Server Actions | ✅ WORKING | None |

---

## 🚀 RECOMMENDED FIX

To show all questions in Customize popup:

**File:** `app/api/client-questionnaire/[clientId]/route.ts`

**Change:**
```typescript
// BEFORE (line 43, 56)
.eq('enabled', true)

// AFTER (remove the filter)
// (no .eq filter - return everything)
```

**Also remove these filters:**
```typescript
// Line 91
.filter(s => s.enabled)  // REMOVE

// Line 113
.filter(q => q.enabled)  // REMOVE
```

This will make the popup show all questions (like Settings UI does).

---

## 📞 NEED MORE HELP?

1. **Full Audit:** See `QUESTIONNAIRE_SYSTEM_COMPLETE_AUDIT.md`
2. **Visual Guide:** See `QUESTIONNAIRE_SYSTEM_VISUAL_MAP.md`
3. **Code Comments:** Most files have inline comments explaining logic

---

## 🎓 LEARNING RESOURCES

### Understanding the Flow
1. Start with Settings UI code (simplest)
2. Then look at Public Form (medium complexity)
3. Finally Admin Form (most complex, uses Context)

### Key Design Patterns
- **Context Pattern:** Used in Admin Form for reactive state
- **Server Actions:** Used for mutations and server-side data
- **API Routes:** Used for client-side fetching with filtering
- **Optimistic Updates:** Used in Settings UI for instant feedback

---

## ⚡ PERFORMANCE NOTES

- Config is cached in Context (fetches once per session)
- Server actions run on server (no client bundle impact)
- API routes support client-side caching
- Response data stored as JSONB (fast queries)

---

## 🔒 SECURITY

- RLS enabled on all tables
- Users can only access their own clients
- Public form uses token auth (no user session)
- Overrides scoped to client (can't affect global config)

---

## END OF QUICK REFERENCE

Keep this card handy for day-to-day development.  
Last audit: Dec 28, 2025









