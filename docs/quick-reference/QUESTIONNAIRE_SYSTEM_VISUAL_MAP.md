# QUESTIONNAIRE SYSTEM - VISUAL MAP
**Companion to Complete Audit**

---

## SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  questionnaire_sections          questionnaire_questions        │
│  ├─ id, key, title               ├─ id, section_id, text        │
│  ├─ enabled, sort_order          ├─ type, required, enabled     │
│  └─ estimated_minutes            └─ options, conditional_on     │
│                                                                  │
│  questionnaire_help              client_questionnaire_overrides │
│  ├─ question_id                  ├─ client_id, question_id     │
│  ├─ title, quick_tip             ├─ custom_text, is_enabled    │
│  └─ good_example, weak_example   └─ override_type              │
│                                                                  │
│  questionnaire_responses                                        │
│  ├─ client_id, version                                         │
│  ├─ response_data (JSONB)                                      │
│  └─ is_latest, submitted_at                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                          API LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  SERVER ACTIONS                  API ROUTES                     │
│  ├─ getSections()                ├─ /api/questionnaire-config  │
│  ├─ getQuestionsWithHelp()       ├─ /api/client-questionnaire  │
│  ├─ toggleSection()              └─ /api/questionnaire-response │
│  ├─ toggleQuestion()                                           │
│  ├─ updateSection()              🔍 KEY DIFFERENCE:            │
│  ├─ updateQuestion()             - Server actions: ALL data    │
│  └─ updateHelp()                 - API routes: Filtered data   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      CONTEXT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  <QuestionnaireConfigProvider>                                 │
│  └─ Provides: useQuestionnaireConfig()                        │
│     ├─ getEnabledSections()                                   │
│     ├─ getQuestionsForSection()                               │
│     ├─ shouldShowQuestion()                                   │
│     └─ Navigation helpers                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        UI LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  Forms                  Settings               Views            │
│  ├─ PublicForm          ├─ QuestionnaireSettings ├─ ResponseViewer │
│  ├─ AdminForm           └─ SharePopup           └─ ResponseHistory │
│  └─ SectionRenderer                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## DATA FLOW COMPARISON

### SETTINGS UI (Shows Everything)
```
Settings Page
    ↓
Server Actions (direct call)
    ├─ getSections()
    └─ getQuestionsWithHelp()
    ↓
Returns: ALL sections + ALL questions (enabled + disabled)
    ↓
UI displays with toggle switches
```

### CUSTOMIZE POPUP (Shows Only Enabled)
```
Client Profile
    ↓
ShareQuestionnairePopup opens
    ↓
API call: /api/client-questionnaire/[clientId]
    ↓
Database query with .eq('enabled', true)
    ↓
Returns: ONLY enabled sections + ONLY enabled questions
    ↓
UI displays only active items
```

### ADMIN FORM (Uses Context)
```
Onboarding Page
    ↓
<QuestionnaireConfigProvider> wrapper
    ↓
Context fetches: /api/questionnaire-config
    ↓
Returns: ALL sections + ALL questions
    ↓
Component filters: config.getEnabledSections()
    ↓
Renders: <SectionRenderer> with filtered data
```

### PUBLIC FORM (Server-side fetch)
```
/form/[token] page.tsx
    ↓
Server Actions (in page component)
    ├─ getSections()
    └─ getQuestionsWithHelp()
    ↓
Filter in page: .filter(s => s.enabled)
    ↓
Pass to: <PublicQuestionnaireForm>
    ↓
Client-side rendering
```

---

## COMPONENT HIERARCHY

### Public Form
```
/form/[token]/page.tsx
└─ <PublicQuestionnaireForm>
    ├─ Header (client name, theme toggle)
    ├─ Progress bar
    ├─ Section pills
    ├─ <SectionRenderer>
    │   ├─ <SectionContainer>
    │   ├─ <QuestionRenderer> (multiple)
    │   │   └─ Question type component
    │   └─ <HelpPanel>
    └─ Footer navigation
```

### Admin Form
```
/dashboard/clients/onboarding/[id]/layout.tsx
└─ <QuestionnaireConfigProvider>
    └─ /dashboard/clients/onboarding/[id]/page.tsx
        ├─ <ProgressStepper>
        ├─ Edit mode banner (if editing)
        ├─ Auto-save status
        ├─ <SectionRenderer>
        │   └─ Questions from context
        ├─ <QuestionnaireReview> (if review step)
        └─ <RichFooter>
```

### Settings UI
```
/dashboard/settings/questionnaire/page.tsx
└─ <QuestionnaireSettings>
    ├─ Stats cards (enabled counts, time)
    ├─ <DndContext> (drag-drop for reordering)
    │   └─ <SectionItem> (multiple, sortable)
    │       ├─ Section header with toggle
    │       ├─ Expand/collapse button
    │       └─ <QuestionItem> (multiple, sortable)
    │           ├─ Question text
    │           ├─ Enable toggle
    │           └─ Edit button
    ├─ <EditSectionDialog>
    └─ <EditQuestionDialog>
        ├─ Question tab
        └─ Help content tab
```

### Customize Popup
```
<ClientQuestionnaire> (in client profile)
└─ "Customize Form" button clicked
    └─ <ShareQuestionnairePopup>
        ├─ Section list (collapsible)
        │   ├─ Section checkbox
        │   └─ Questions list
        │       ├─ Question checkbox
        │       └─ Edit button → <QuestionEditorModal>
        └─ "Save & Copy Link" button
```

---

## CONDITIONAL LOGIC FLOW

```
Question has conditionalOn?
    ├─ YES → Check dependency
    │   ├─ Get dependent question value from formData
    │   ├─ Check: equals condition?
    │   │   └─ Show if value === equals
    │   ├─ Check: notEquals condition?
    │   │   └─ Show if value !== notEquals (and not empty)
    │   └─ No conditions match → Hide
    └─ NO → Always show (if enabled)
```

Example:
```typescript
{
  id: "q15_logo_notes",
  conditionalOn: {
    questionId: "q14_has_logo",
    equals: "yes"
  }
}
// Shows only if q14_has_logo === "yes"
```

---

## FILE ORGANIZATION

```
savant-marketing-studio/
├─ app/
│  ├─ form/[token]/                    # Public form routes
│  │  ├─ page.tsx                      # Public form page
│  │  ├─ complete/page.tsx             # Thank you page
│  │  └─ layout.tsx                    # Public layout
│  │
│  ├─ dashboard/
│  │  ├─ clients/
│  │  │  ├─ [id]/page.tsx              # Client detail (has questionnaire tab)
│  │  │  ├─ [id]/questionnaire-responses/page.tsx
│  │  │  └─ onboarding/[id]/
│  │  │     ├─ page.tsx                # Admin form
│  │  │     └─ layout.tsx              # Provides context
│  │  │
│  │  └─ settings/
│  │     └─ questionnaire/page.tsx     # Settings UI
│  │
│  ├─ actions/
│  │  ├─ questionnaire.ts              # Response actions
│  │  └─ questionnaire-config.ts       # Config CRUD
│  │
│  └─ api/
│     ├─ questionnaire-config/route.ts # Get all config
│     ├─ client-questionnaire/[clientId]/
│     │  ├─ route.ts                   # Get merged config
│     │  ├─ override/route.ts          # Save override
│     │  └─ overrides/route.ts         # List overrides
│     └─ questionnaire-response/[clientId]/
│        ├─ route.ts                   # Get versions
│        ├─ latest/route.ts            # Get latest
│        └─ submit/route.ts            # Submit response
│
├─ components/
│  ├─ questionnaire/
│  │  ├─ public-questionnaire-form.tsx # Public form component
│  │  ├─ section-renderer.tsx          # Section rendering
│  │  ├─ question-renderer.tsx         # Question routing
│  │  ├─ share-questionnaire-popup.tsx # Customize popup
│  │  ├─ question-editor-modal.tsx     # Edit custom text
│  │  ├─ response-viewer.tsx           # View responses
│  │  ├─ response-history.tsx          # Version sidebar
│  │  ├─ question-types/               # Question components
│  │  ├─ navigation/                   # Nav components
│  │  ├─ sections/                     # Section components
│  │  ├─ help-system/                  # Help components
│  │  └─ review/                       # Review step
│  │
│  ├─ clients/
│  │  ├─ client-questionnaire.tsx      # Main questionnaire tab
│  │  └─ questionnaire-status-card.tsx # Status display
│  │
│  └─ settings/
│     └─ questionnaire-settings.tsx    # Settings management
│
├─ lib/questionnaire/
│  ├─ questions-config.ts              # Type definitions
│  ├─ questionnaire-config-context.tsx # React Context
│  ├─ use-questionnaire-form.ts        # Form hook
│  ├─ types.ts                         # Shared types
│  ├─ validation-schemas.ts            # Validation
│  ├─ dynamic-validation.ts            # Runtime validation
│  └─ conditional-logic.ts             # Conditional logic
│
└─ supabase/migrations/
   ├─ 20251224000000_questionnaire_config_tables.sql
   └─ 20251228000001_questionnaire_responses.sql
```

---

## ENABLE/DISABLE FLOW

### In Settings UI
```
User toggles section/question
    ↓
Local state updates immediately (optimistic)
    ↓
Call: toggleSection(id, enabled) or toggleQuestion(id, enabled)
    ↓
Server action updates database
    ↓
Success: Toast notification
Error: Revert local state, show error
```

### In Customize Popup
```
User toggles section/question
    ↓
Track in pendingChanges Map
    ↓
User clicks "Save & Copy Link"
    ↓
Loop through pendingChanges
    ↓
For each: PUT /api/client-questionnaire/[clientId]/override
    ↓
Save to client_questionnaire_overrides table
    ↓
Success: Copy link, close popup
```

---

## RESPONSE VERSIONING

```
Client submits questionnaire
    ↓
Check existing responses for client
    ↓
Calculate: version = MAX(version) + 1
    ↓
Set all existing is_latest = false
    ↓
Insert new response with:
    ├─ version (new number)
    ├─ is_latest = true
    ├─ response_data (JSONB)
    └─ submitted_at (timestamp)
    ↓
Trigger: set_response_as_latest()
    └─ Ensures only one is_latest per client
```

---

## OVERRIDE SYSTEM

```
Global Config                    Client Override
├─ Section: Avatar               ├─ Section: Avatar
│  enabled: true                 │  override: is_enabled = false
│  questions: 20                 │  (hides entire section)
│                                │
└─ Question: "Company name"      └─ Question: "Company name"
   text: "What's your company?"      override: custom_text = "Business name?"
   enabled: true                     override: is_enabled = true
                                     (shows with custom text)

Merge Logic:
    FOR each section:
        IF has override → use override.is_enabled
        ELSE → use global.enabled
    
    FOR each question:
        IF has override → use override values
        ELSE → use global values
```

---

## ROUTE ACCESS PATTERNS

| Route | Access | Data Source | Shows |
|-------|--------|-------------|-------|
| `/form/[token]` | Public (no auth) | Server actions (page) | Enabled only |
| `/dashboard/clients/onboarding/[id]` | Authenticated (RLS) | Context → API → DB | Enabled only |
| `/dashboard/settings/questionnaire` | Authenticated (admin) | Server actions | ALL (enabled + disabled) |
| `/dashboard/clients/[id]` | Authenticated (RLS) | Multiple sources | Response + status |

---

## KEY TAKEAWAYS

1. **Two forms, different purposes:**
   - Public: External clients
   - Admin: Internal fill-out

2. **Two data fetch patterns:**
   - Server actions: For server components, returns ALL
   - API routes: For client components, may filter

3. **Customize popup behavior is intentional:**
   - Shows only enabled items
   - By design, not a bug
   - To customize more, enable in Settings first

4. **Settings UI is the source of truth:**
   - Shows everything
   - Can enable/disable
   - Can reorder
   - Can edit content

5. **Context vs Direct calls:**
   - Context: Used in forms for reactive updates
   - Direct: Used in pages for initial data

---

## DEBUGGING CHECKLIST

### "Why doesn't X show up in the popup?"
1. Check database: `SELECT * FROM questionnaire_questions WHERE id = 'X';`
2. Is `enabled = true`? If no, that's why
3. Check section: Is parent section enabled?
4. Check overrides: `SELECT * FROM client_questionnaire_overrides WHERE question_id = 'X';`

### "Why does the form crash?"
1. Check context: Is page wrapped in `<QuestionnaireConfigProvider>`?
2. Check API: Does `/api/questionnaire-config` return data?
3. Check database: Are sections/questions seeded?

### "Why don't changes show up?"
1. Check RLS: Does user own this client?
2. Check cache: Try hard refresh (Cmd+Shift+R)
3. Check database: Did the mutation succeed?

---

## END OF VISUAL MAP

This document provides a visual companion to the detailed audit.  
Refer to `QUESTIONNAIRE_SYSTEM_COMPLETE_AUDIT.md` for line-by-line details.

