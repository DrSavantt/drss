# ShareQuestionnairePopup Visual Comparison

## Before vs After: What Changed Visually

---

## Header Section

### BEFORE
```
┌──────────────────────────────────────────┐
│ Customize Questionnaire                  │
│ for John Doe                             │
└──────────────────────────────────────────┘
```

### AFTER ✅
```
┌──────────────────────────────────────────┐
│ Customize Questionnaire                  │
│ for John Doe                             │
│ 8/8 sections • 34/34 questions • 40 min  │
└──────────────────────────────────────────┘
```

**Added:** Live stats showing enabled counts and total time estimate

---

## Section Card Structure

### BEFORE
```
┌──────────────────────────────────────────┐
│ ☑ Business Basics           ▼            │
│   ├─ ☑ Question 1                        │
│   └─ ☑ Question 2                        │
└──────────────────────────────────────────┘

Issues:
❌ Only showed enabled questions (2 total)
❌ Used checkboxes instead of switches
❌ No time estimates or question counts
❌ No visual indicators for customizations
```

### AFTER ✅
```
┌──────────────────────────────────────────────────┐
│  ▼  Business Basics                              │
│     [5m] [5/5 questions]              ⚫━━━━○     │
│                                                  │
│     ├─ Q1 [text] [Required]           ⚫━━━━○  ✏ │
│     │  What is your business name?               │
│     ├─ Q2 [text] [Required]           ⚫━━━━○  ✏ │
│     │  What industry are you in?                 │
│     ├─ Q3 [textarea]                  ⚫━━━━○  ✏ │
│     │  Describe your business in 1-2 sentences   │
│     ├─ Q4 [text]                      ⚫━━━━○  ✏ │
│     │  What products/services do you offer?      │
│     └─ Q5 [text]                      ⚫━━━━○  ✏ │
│        How long have you been in business?       │
└──────────────────────────────────────────────────┘

Improvements:
✅ Shows ALL 5 questions in this section
✅ Time badge: [5m]
✅ Question count badge: [5/5 questions]
✅ Toggle switches instead of checkboxes
✅ Question number (Q1, Q2, etc.)
✅ Type badges ([text], [textarea], etc.)
✅ Required badges
✅ Edit button (✏) for each question
```

---

## Custom Override Indicator

### When a question has been customized:

```
┌──────────────────────────────────────────────────┐
│ Q1 [text] [Required] [Custom]         ⚫━━━━○  ✏ │
│ What is YOUR company name?                       │
└──────────────────────────────────────────────────┘
                      ↑
            Yellow "Custom" badge
```

**The [Custom] badge:**
- Yellow background (#fef3c7 / yellow-500/10)
- Yellow text (#ca8a04 / yellow-600)
- Yellow border
- Indicates this question has client-specific customization

---

## Disabled States

### Section Disabled:
```
┌──────────────────────────────────────────────────┐
│  ▶  Business Basics (faded opacity)              │
│     [5m] [0/5 questions]              ━━━━━⚪     │
└──────────────────────────────────────────────────┘
```

### Question Disabled:
```
┌──────────────────────────────────────────────────┐
│ Q1 [text] [Required]   (faded)        ━━━━━⚪  ✏ │
│ What is your business name?                      │
│ (with strikethrough effect)                      │
└──────────────────────────────────────────────────┘
```

---

## Complete Section Comparison

### ALL 8 SECTIONS (Now Visible)

```
1. ▼ Business Basics          [5m] [5/5]  ⚫━━━━○
   Shows ALL 5 questions when expanded

2. ▶ Your Audience            [4m] [4/4]  ⚫━━━━○
   Shows ALL 4 questions when expanded

3. ▶ Current Marketing        [4m] [4/4]  ⚫━━━━○
   Shows ALL 4 questions when expanded

4. ▶ Goals & Vision           [5m] [5/5]  ⚫━━━━○
   Shows ALL 5 questions when expanded

5. ▶ Value Proposition        [5m] [4/4]  ⚫━━━━○
   Shows ALL 4 questions when expanded

6. ▶ Brand Voice              [5m] [4/4]  ⚫━━━━○
   Shows ALL 4 questions when expanded

7. ▶ Competitors              [4m] [4/4]  ⚫━━━━○
   Shows ALL 4 questions when expanded

8. ▶ Timeline & Budget        [4m] [4/4]  ⚫━━━━○
   Shows ALL 4 questions when expanded
```

**Total: 8 sections, 34 questions**

---

## Footer Actions

### BEFORE
```
┌──────────────────────────────────────────┐
│  [Cancel]          [Save & Copy Link]    │
│  (disabled if no changes)                │
└──────────────────────────────────────────┘
```

### AFTER ✅
```
┌──────────────────────────────────────────┐
│  [Cancel]          [💾 Save & Copy Link] │
│  (always enabled - copies link)          │
└──────────────────────────────────────────┘
```

**Changed:** Save button always enabled (even with no changes, still copies link)

---

## Question Editor Modal

### When clicking ✏ on a question:

```
┌──────────────────────────────────────────────────┐
│ Edit Question                                    │
│ for John Doe                                     │
│                                                  │
│ [Using Global] [Custom]                          │
│                                                  │
│ Question Text:                                   │
│ ┌──────────────────────────────────────────────┐ │
│ │ What is your business name?                  │ │
│ │                                              │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ [🔄 Reset to Global]      [✓ Save Changes]      │
└──────────────────────────────────────────────────┘
```

**Modes:**
- **Using Global:** Shows default question text (read-only)
- **Custom:** Allows editing for this specific client

---

## Data Flow Visualization

```
SETTINGS UI (Global Config)
    ↓
    getSections()          → ALL 8 sections
    getQuestionsWithHelp() → ALL 34 questions
    ↓
    ┌─────────────────────────────────────┐
    │   ShareQuestionnairePopup           │
    │   (Client-Specific View)            │
    ├─────────────────────────────────────┤
    │   Loads:                            │
    │   • Global sections (8)             │
    │   • Global questions (34)           │
    │   • Client overrides                │
    │                                     │
    │   Displays:                         │
    │   • ALL sections & questions        │
    │   • Applied with client overrides   │
    │   • "Custom" badges where modified  │
    │                                     │
    │   Saves To:                         │
    │   • client_questionnaire_overrides  │
    │   • Does NOT modify global config   │
    └─────────────────────────────────────┘
```

---

## Stats Calculation

### Dynamic Stats (Updates in Real-Time):

```typescript
// Before toggle:
8/8 sections • 34/34 questions • 40 min

// After disabling "Business Basics" section:
7/8 sections • 29/34 questions • 35 min
                ↑↑↑ Live updates

// After disabling 2 more questions:
7/8 sections • 27/34 questions • 35 min
```

**Formula:**
```typescript
enabledSections = sections.filter(s => getSectionEnabled(s)).length
enabledQuestions = questions.filter(q => getQuestionEnabled(q)).length
totalTime = sections
  .filter(s => getSectionEnabled(s))
  .reduce((sum, s) => sum + s.estimated_minutes, 0)
```

---

## Toggle Behavior

### Section Toggle:
```
User clicks toggle on "Business Basics" section
    ↓
Local state updates (immediate visual feedback)
    ↓
Added to pendingChanges Map
    ↓
User clicks "Save & Copy Link"
    ↓
PUT /api/client-questionnaire/{clientId}/override
    {
      section_id: "1",
      override_type: "section",
      is_enabled: false
    }
    ↓
Override saved to database
    ↓
Link copied to clipboard
```

### Question Toggle:
```
User clicks toggle on question Q1
    ↓
Local state updates (immediate visual feedback)
    ↓
Added to pendingChanges Map
    ↓
User clicks "Save & Copy Link"
    ↓
PUT /api/client-questionnaire/{clientId}/override
    {
      question_id: "q1-business-name",
      override_type: "question",
      is_enabled: false
    }
    ↓
Override saved to database
```

### Question Edit:
```
User clicks ✏ on question Q1
    ↓
Question editor modal opens
    ↓
User switches to "Custom" mode
    ↓
User edits text: "What is YOUR company name?"
    ↓
User clicks "Save Changes"
    ↓
Added to pendingChanges Map
    ↓
User clicks "Save & Copy Link"
    ↓
PUT /api/client-questionnaire/{clientId}/override
    {
      question_id: "q1-business-name",
      override_type: "question",
      is_enabled: true,
      custom_text: "What is YOUR company name?"
    }
    ↓
Override saved to database
    ↓
Question shows [Custom] badge
```

---

## Complete UI Hierarchy

```
ShareQuestionnairePopup
│
├─ Dialog
│  ├─ DialogHeader
│  │  ├─ DialogTitle: "Customize Questionnaire"
│  │  └─ DialogDescription: "for {clientName}" + stats
│  │
│  ├─ Scrollable Content Area
│  │  └─ For each section:
│  │     ├─ Section Card
│  │     │  ├─ Chevron button (expand/collapse)
│  │     │  ├─ Section title
│  │     │  ├─ Time badge
│  │     │  ├─ Question count badge
│  │     │  └─ Toggle switch
│  │     │
│  │     └─ (If expanded) Questions List
│  │        └─ For each question:
│  │           ├─ Q{number} label
│  │           ├─ Type badge
│  │           ├─ Required badge (if applicable)
│  │           ├─ Custom badge (if overridden)
│  │           ├─ Question text
│  │           ├─ Toggle switch
│  │           └─ Edit button
│  │
│  └─ DialogFooter
│     ├─ Cancel button
│     └─ Save & Copy Link button
│
└─ QuestionEditorModal (conditional)
   ├─ Mode selector (Using Global / Custom)
   ├─ Question text textarea
   └─ Footer (Reset to Global / Save Changes)
```

---

## Success Indicators

After successful rebuild, you should see:

✅ **All 8 sections visible** (not just enabled ones)
✅ **All 34 questions visible** (not just 2)
✅ **Time badges** on every section
✅ **Question count badges** on every section
✅ **Toggle switches** instead of checkboxes
✅ **Edit buttons** (pencil icons) on every question
✅ **Q{number}** labels on every question
✅ **Type badges** ([text], [textarea], etc.)
✅ **Required badges** where applicable
✅ **Custom badges** (yellow) on overridden questions
✅ **Strikethrough effect** on disabled items
✅ **Live stats** in header that update on toggle
✅ **Smooth expand/collapse** animations

---

## Testing Checklist

Visual elements to verify:

### Header
- [ ] Shows client name
- [ ] Shows section count (X/8)
- [ ] Shows question count (X/34)
- [ ] Shows time estimate
- [ ] Stats update when toggling

### Sections
- [ ] 8 sections visible
- [ ] Chevron changes (▶ / ▼) on expand
- [ ] Time badge visible
- [ ] Question count badge visible
- [ ] Toggle switch functional
- [ ] Disabled sections have reduced opacity
- [ ] Disabled sections have strikethrough on title

### Questions
- [ ] ALL questions visible when section expanded
- [ ] Q{number} label present
- [ ] Type badge present
- [ ] Required badge if applicable
- [ ] Custom badge if overridden (yellow)
- [ ] Toggle switch functional
- [ ] Edit button present (pencil icon)
- [ ] Disabled questions have reduced opacity
- [ ] Disabled questions have strikethrough on text

### Interactions
- [ ] Clicking chevron expands/collapses section
- [ ] Clicking section toggle updates state
- [ ] Clicking question toggle updates state
- [ ] Clicking edit button opens modal
- [ ] Editing question adds "Custom" badge
- [ ] "Save & Copy Link" saves all changes
- [ ] Success toast appears
- [ ] Link copied to clipboard
- [ ] Reopening shows saved changes

---

## Perfect Visual Match with Settings UI

The popup now has **visual parity** with Settings UI:

| Element | Settings UI | Share Popup | Match? |
|---------|-------------|-------------|--------|
| Section cards | ✓ | ✓ | ✅ |
| Chevron expand | ✓ | ✓ | ✅ |
| Time badges | ✓ | ✓ | ✅ |
| Question count | ✓ | ✓ | ✅ |
| Toggle switches | ✓ | ✓ | ✅ |
| Q{number} labels | ✓ | ✓ | ✅ |
| Type badges | ✓ | ✓ | ✅ |
| Required badges | ✓ | ✓ | ✅ |
| Edit buttons | ✓ | ✓ | ✅ |
| Strikethrough | ✓ | ✓ | ✅ |
| Opacity on disabled | ✓ | ✓ | ✅ |

**Only difference:** Share Popup has "Custom" badges and saves to client overrides instead of global config.

---

## Summary

The rebuilt ShareQuestionnairePopup is now a **pixel-perfect, client-scoped version** of the Settings UI, showing ALL sections and questions with the ability to customize them for individual clients. 🎉









