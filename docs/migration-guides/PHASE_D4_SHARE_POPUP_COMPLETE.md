# Phase D4: Share Popup with Per-Client Questionnaire Customization - COMPLETE ✅

**Date:** December 28, 2025  
**Status:** ✅ Implementation Complete - Ready for Testing

---

## Summary

Implemented a comprehensive questionnaire customization system that allows per-client customization of sections and questions through an intuitive popup interface.

---

## What Was Built

### 1. Share Questionnaire Popup Component
**File:** `components/questionnaire/share-questionnaire-popup.tsx`

**Features:**
- ✅ Fetches merged config (global + overrides) for the client
- ✅ Displays all sections with checkboxes to enable/disable
- ✅ Expandable sections show individual questions
- ✅ Question-level enable/disable toggles
- ✅ Visual indicators: strikethrough for disabled, "Custom" badge for overrides
- ✅ Pencil icon to edit individual question text
- ✅ Tracks pending changes in local state
- ✅ Batch saves all overrides to database
- ✅ Copies questionnaire link to clipboard after save
- ✅ Toast notifications for success/error states
- ✅ Loading states during fetch and save operations
- ✅ Responsive design (mobile-friendly)
- ✅ Dark theme matching app design system

**API Integration:**
- `GET /api/client-questionnaire/${clientId}` - Fetch merged config
- `PUT /api/client-questionnaire/${clientId}/override` - Save overrides

---

### 2. Question Editor Modal Component
**File:** `components/questionnaire/question-editor-modal.tsx`

**Features:**
- ✅ Modal within modal (z-index: 60 to appear above main popup)
- ✅ Toggle between "Using Global" and "Custom" modes
- ✅ Editable textarea for custom question text
- ✅ Disabled state when using global text
- ✅ "Reset to Global" button to remove customization
- ✅ "Save Changes" button to apply custom text
- ✅ Visual distinction for custom mode (red accent)
- ✅ Responsive layout
- ✅ Dark theme consistent with app

**Behavior:**
- Opens when user clicks pencil icon on any question
- Allows editing question text specifically for this client
- Can revert to global question text
- Saves changes back to parent component

---

### 3. ClientQuestionnaire Integration
**File:** `components/clients/client-questionnaire.tsx` (MODIFIED)

**Changes Made:**
1. **Import Added:** `ShareQuestionnairePopup` component
2. **State Added:** `showCustomizePopup` boolean state
3. **Function Updated:** `handleCustomize()` now opens the popup
4. **Component Added:** `<ShareQuestionnairePopup>` at end of component

**Wire-Up:**
```tsx
// State
const [showCustomizePopup, setShowCustomizePopup] = useState(false)

// Handler
const handleCustomize = () => {
  if (!questionnaireToken) {
    toast.error('No questionnaire link available')
    return
  }
  setShowCustomizePopup(true)
}

// Component
<ShareQuestionnairePopup
  isOpen={showCustomizePopup}
  onClose={() => setShowCustomizePopup(false)}
  clientId={clientId}
  clientName={clientName}
  questionnaireToken={questionnaireToken || ''}
/>
```

---

## User Flow

### 1. Open Customize Popup

```
User clicks "Customize Form" button
  ↓
Popup opens with loading spinner
  ↓
Fetches merged config from API
  ↓
Displays all sections & questions with current state
  ↓
First section expanded by default
```

### 2. Customize Sections

```
User sees all 8 sections with checkboxes
  ↓
Unchecking a section:
  - Section title shows strikethrough
  - Section becomes disabled
  - Questions inside hidden when collapsed
  ↓
Checking a section:
  - Re-enables section
  - Questions become accessible again
  ↓
Changes tracked in pendingChanges Map
```

### 3. Customize Questions

```
User expands a section (click anywhere on section header)
  ↓
Questions list appears with individual checkboxes
  ↓
Unchecking a question:
  - Question text shows strikethrough
  - Question marked as disabled
  ↓
Checking a question:
  - Re-enables question
  - Removes strikethrough
  ↓
Changes tracked in pendingChanges Map
```

### 4. Edit Question Text

```
User clicks pencil icon on a question
  ↓
Question Editor Modal opens (appears above main popup)
  ↓
Shows two mode buttons: "Using Global" | "Custom"
  ↓
USER SELECTS "Custom":
  - Textarea becomes editable
  - Can modify question text for this client only
  ↓
USER CLICKS "Save Changes":
  - Question text updates in main popup
  - "Custom" badge appears next to question
  - Change tracked in pendingChanges
  ↓
USER CLICKS "Reset to Global":
  - Reverts to global question text
  - Removes custom override
  - Modal switches to "Using Global" mode
```

### 5. Save & Copy Link

```
User clicks "Save & Copy Link" button
  ↓
Button shows loading spinner
  ↓
Iterates through all pendingChanges:
  - Calls PUT /api/client-questionnaire/${clientId}/override
  - Saves each override (section/question enable/disable + custom text)
  ↓
All saves successful:
  - Copies /form/${questionnaireToken} to clipboard
  - Shows success toast
  - Clears pendingChanges
  - Closes popup
  ↓
Any save fails:
  - Shows error toast
  - Keeps popup open
  - User can retry
```

---

## Data Flow

### Fetch Config
```
User opens popup
  ↓
GET /api/client-questionnaire/${clientId}
  ↓
Returns merged config:
  {
    data: [
      {
        id: "1",
        key: "avatar_definition",
        title: "Avatar Definition",
        enabled: true,
        _hasOverride: false,
        questions: [
          {
            id: "q1",
            question_key: "q1_ideal_customer",
            text: "Who is your ideal customer?",
            type: "textarea",
            enabled: true,
            _hasOverride: false
          },
          ...
        ]
      },
      ...
    ]
  }
  ↓
Sets sections state
Expands first section
```

### Save Overrides
```
User makes changes → tracked in pendingChanges Map
  ↓
pendingChanges structure:
  {
    "section-1": {
      client_id: "abc123",
      section_id: "1",
      override_type: "section",
      is_enabled: false
    },
    "question-q1": {
      client_id: "abc123",
      question_id: "q1",
      override_type: "question",
      is_enabled: true,
      custom_text: "Who is your ideal client?"
    }
  }
  ↓
User clicks "Save & Copy Link"
  ↓
For each entry in pendingChanges:
  PUT /api/client-questionnaire/${clientId}/override
  Body: override object
  ↓
All saves successful → copy link → close popup
```

---

## UI/UX Details

### Main Popup Design

```
┌────────────────────────────────────────────────────────┐
│  Customize Questionnaire                            [X]│
│  for Client Name                                       │
├────────────────────────────────────────────────────────┤
│  [Loading spinner] (if loading)                        │
│                                                         │
│  OR                                                     │
│                                                         │
│  ┌────────────────────────────────────────────────┐    │
│  │ [✓] Section 1: Avatar Definition          [▼]  │    │
│  │  ┌──────────────────────────────────────────┐  │    │
│  │  │ [✓] Q1: Who is your ideal customer? [✏]  │  │    │
│  │  │     Custom                                │  │    │
│  │  │ [✓] Q2: What criteria...?           [✏]  │  │    │
│  │  │ [ ] Q3: Demographics details        [✏]  │  │    │ ← Disabled
│  │  └──────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────┘    │
│                                                         │
│  ┌────────────────────────────────────────────────┐    │
│  │ [✓] Section 2: Dream Outcome           [▶]  │    │ ← Collapsed
│  └────────────────────────────────────────────────┘    │
│                                                         │
├────────────────────────────────────────────────────────┤
│  [Cancel]                         [Save & Copy Link]   │
└────────────────────────────────────────────────────────┘
```

### Question Editor Modal

```
                 ┌───────────────────────────────────────┐
                 │  Edit Question                     [X]│
                 │  for Client Name                      │
                 ├───────────────────────────────────────┤
                 │  [ Using Global ] [ Custom ]          │
                 │                                       │
                 │  Question Text:                       │
                 │  ┌─────────────────────────────────┐  │
                 │  │ Who is your ideal customer?     │  │
                 │  │                                 │  │
                 │  └─────────────────────────────────┘  │
                 │                                       │
                 │  Switch to "Custom" to edit...        │
                 │                                       │
                 ├───────────────────────────────────────┤
                 │  [Reset to Global]  [Save Changes]    │
                 └───────────────────────────────────────┘
```

---

## Visual Indicators

### Section States
| State | Visual | Description |
|-------|--------|-------------|
| Enabled | White text | Section is active |
| Disabled | Gray text + strikethrough | Section is disabled for this client |
| Has Override | N/A (shown on questions) | Section has custom settings |

### Question States
| State | Visual | Description |
|-------|--------|-------------|
| Enabled | Light gray text | Question is active |
| Disabled | Dark gray text + strikethrough | Question is disabled for this client |
| Has Custom Text | Yellow "Custom" badge | Question uses custom text for this client |

### Button States
| Button | State | Visual |
|--------|-------|--------|
| Save & Copy Link | Idle | Red background, Copy icon |
| Save & Copy Link | Saving | Red background, Spinner icon, Disabled |
| Save & Copy Link | No changes | Red background, Copy icon, Disabled, Low opacity |
| Cancel | - | Gray text, no background |

---

## API Endpoints Used

### 1. Get Merged Config
```http
GET /api/client-questionnaire/${clientId}
```

**Response:**
```json
{
  "data": [
    {
      "id": "1",
      "key": "avatar_definition",
      "title": "Avatar Definition",
      "enabled": true,
      "_hasOverride": false,
      "questions": [
        {
          "id": "q1",
          "question_key": "q1_ideal_customer",
          "text": "Who is your ideal customer?",
          "type": "textarea",
          "enabled": true,
          "_hasOverride": false,
          "_overrideId": null
        }
      ]
    }
  ]
}
```

### 2. Save Override
```http
PUT /api/client-questionnaire/${clientId}/override
Content-Type: application/json

{
  "client_id": "abc123",
  "section_id": "1",           // Optional (section override)
  "question_id": "q1",         // Optional (question override)
  "override_type": "question",  // "section" | "question"
  "is_enabled": true,
  "custom_text": "Custom question text"  // Optional
}
```

**Response:**
```json
{
  "data": {
    "id": "override-id-123",
    "client_id": "abc123",
    "question_id": "q1",
    "override_type": "question",
    "is_enabled": true,
    "custom_text": "Custom question text",
    "created_at": "2025-12-28T...",
    "updated_at": "2025-12-28T..."
  }
}
```

---

## Testing Checklist

### Basic Functionality
- [ ] Click "Customize Form" button → Popup opens
- [ ] Popup shows loading spinner initially
- [ ] After loading, sections appear with checkboxes
- [ ] First section is expanded by default
- [ ] All other sections are collapsed by default

### Section Interactions
- [ ] Click section header → Section expands/collapses
- [ ] Uncheck section checkbox → Section title shows strikethrough
- [ ] Check section checkbox → Section title normal (white)
- [ ] Disabled section → Questions hidden when collapsed
- [ ] Enabled section → Questions visible when expanded

### Question Interactions
- [ ] Questions appear when section is expanded
- [ ] Each question has checkbox and pencil icon
- [ ] Uncheck question → Text shows strikethrough
- [ ] Check question → Text normal (light gray)
- [ ] Click pencil icon → Question editor opens

### Question Editor
- [ ] Editor appears above main popup (higher z-index)
- [ ] Shows "Using Global" mode by default (if no override)
- [ ] Shows "Custom" mode by default (if has override)
- [ ] "Using Global" mode → Textarea disabled
- [ ] "Custom" mode → Textarea enabled
- [ ] Can edit text in Custom mode
- [ ] Click "Reset to Global" → Switches to global mode
- [ ] Click "Save Changes" → Updates question in main popup
- [ ] Close editor → Returns to main popup

### Save Functionality
- [ ] "Save & Copy Link" button disabled if no changes
- [ ] "Save & Copy Link" enabled after making changes
- [ ] Click save → Shows loading spinner
- [ ] Successful save → Success toast appears
- [ ] Successful save → Link copied to clipboard
- [ ] Successful save → Popup closes
- [ ] Failed save → Error toast appears
- [ ] Failed save → Popup stays open

### Edge Cases
- [ ] Client has no token → Shows error toast, popup doesn't open
- [ ] All sections disabled → Still can save
- [ ] Mix of section and question overrides → Saves correctly
- [ ] Click Cancel → Popup closes without saving
- [ ] Click backdrop → Popup closes without saving
- [ ] Custom question text → "Custom" badge appears
- [ ] Remove custom text → Badge disappears

### Responsive Design
- [ ] Popup displays correctly on mobile
- [ ] Popup displays correctly on tablet
- [ ] Popup displays correctly on desktop
- [ ] Question editor displays correctly on all sizes
- [ ] Scrolling works when content overflows

---

## Implementation Notes

### Pending Changes Tracking

The popup tracks changes locally in a `Map` before saving:

```typescript
const [pendingChanges, setPendingChanges] = useState<Map<string, Override>>(new Map())

// When user toggles a section:
setPendingChanges(prev => {
  const next = new Map(prev)
  next.set(`section-${section.id}`, {
    client_id: clientId,
    section_id: section.id,
    override_type: 'section',
    is_enabled: newEnabled
  })
  return next
})

// When user toggles a question:
setPendingChanges(prev => {
  const next = new Map(prev)
  next.set(`question-${question.id}`, {
    client_id: clientId,
    question_id: question.id,
    override_type: 'question',
    is_enabled: newEnabled
  })
  return next
})

// When user edits question text:
setPendingChanges(prev => {
  const next = new Map(prev)
  const existing = next.get(`question-${questionId}`)
  next.set(`question-${questionId}`, {
    ...existing,
    custom_text: customText
  })
  return next
})
```

This approach:
- ✅ Allows multiple changes before saving
- ✅ Prevents unnecessary API calls during editing
- ✅ Provides clear "Save & Copy Link" action
- ✅ Can be cancelled without side effects

### Z-Index Management

```
Main App:           z-0 to z-40
Popup Backdrop:     z-50
Popup Modal:        z-50
Editor Backdrop:    z-60
Editor Modal:       z-60
```

This ensures:
- Popup appears above main app
- Editor appears above popup
- Both have proper backdrop overlays

### Performance Considerations

- Config fetched only when popup opens (not on component mount)
- Sections collapsed by default (only first expanded)
- Changes batched and saved together (not individual saves)
- Local state updates instant (no waiting for API)
- Toast notifications provide feedback

---

## Files Created

1. **`components/questionnaire/share-questionnaire-popup.tsx`** (368 lines)
   - Main customization popup
   - Section/question toggle logic
   - Pending changes tracking
   - Save and copy functionality

2. **`components/questionnaire/question-editor-modal.tsx`** (124 lines)
   - Question text editor
   - Global/Custom mode toggle
   - Reset to global functionality

---

## Files Modified

1. **`components/clients/client-questionnaire.tsx`**
   - Added import for ShareQuestionnairePopup
   - Added showCustomizePopup state
   - Updated handleCustomize function
   - Added ShareQuestionnairePopup component

---

## Dependencies

All dependencies already exist in the project:
- ✅ `sonner` (toast notifications)
- ✅ `lucide-react` (icons)
- ✅ `@/lib/utils` (cn utility)
- ✅ API endpoints already implemented
- ✅ Database table `client_questionnaire_overrides` exists

---

## Future Enhancements (Optional)

### Phase D4.1: Bulk Operations
- [ ] "Disable All" button for sections
- [ ] "Enable All" button for sections
- [ ] "Reset to Global" button for entire form

### Phase D4.2: Preview
- [ ] "Preview Form" button to see what client will see
- [ ] Opens public form in new tab with current overrides

### Phase D4.3: Templates
- [ ] Save override sets as templates
- [ ] Apply templates to multiple clients
- [ ] "Industry-specific" preset templates

### Phase D4.4: Version History
- [ ] Track override changes over time
- [ ] See who made changes and when
- [ ] Revert to previous override configuration

---

## Status: ✅ COMPLETE

**Implementation:** 100% Complete  
**Testing:** Ready for QA  
**Documentation:** Complete  
**Linter Errors:** 0

---

## Next Steps

1. **Test the Implementation**
   - Follow testing checklist above
   - Verify all user flows work correctly
   - Test on different screen sizes
   - Test with different data states

2. **Database Verification**
   - Confirm overrides are saved correctly
   - Verify merged config API returns overrides
   - Test override deletion (if needed)

3. **Integration Testing**
   - Test public form with overrides applied
   - Verify disabled sections/questions don't appear
   - Verify custom question text appears in public form

4. **User Acceptance**
   - Demo to stakeholders
   - Gather feedback
   - Make adjustments if needed

---

**Implementation Complete! Ready for Testing. 🎉**

