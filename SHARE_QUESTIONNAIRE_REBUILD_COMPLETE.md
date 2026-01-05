# ShareQuestionnairePopup Rebuild - Complete ✅

## What Was Changed

Successfully rebuilt `share-questionnaire-popup.tsx` to match the Settings UI exactly. The popup now shows **ALL sections and ALL questions**, not just the enabled ones.

---

## Key Changes

### 1. **Data Fetching (Lines 96-131)**
**BEFORE:**
```typescript
// Only fetched merged config with enabled=true filter
const response = await fetch(`/api/client-questionnaire/${clientId}`)
```

**AFTER:**
```typescript
// Fetches ALL sections and questions using same server actions as Settings UI
const [sectionsData, questionsData] = await Promise.all([
  getSections(),           // Gets ALL 8 sections
  getQuestionsWithHelp()   // Gets ALL 34 questions
])

// Also fetches client overrides
const overridesRes = await fetch(`/api/client-questionnaire/${clientId}/overrides`)
const overridesData = overridesJson.data || []
```

**Result:** Now loads complete config like Settings UI, then applies overrides.

---

### 2. **Visual Structure (Lines 274-446)**
Copied the exact rendering structure from `questionnaire-settings.tsx`:

#### Section Cards (Lines 304-351)
- ✅ Chevron button for expand/collapse
- ✅ Section title with strikethrough when disabled
- ✅ Time estimate badge with Clock icon
- ✅ Question count badge (enabled/total)
- ✅ Toggle Switch (replaced Checkbox)
- ✅ No edit button (sections can't be edited per-client)

#### Question Items (Lines 357-405)
- ✅ Q{number} label
- ✅ Question type badge
- ✅ "Required" badge if applicable
- ✅ **"Custom" badge** for overridden questions (yellow highlight)
- ✅ Question text with strikethrough when disabled
- ✅ Toggle Switch
- ✅ Edit button (Pencil icon)

#### Header Stats (Lines 280-286)
- ✅ Shows: `{enabled}/{total} sections • {enabled}/{total} questions • {time} min`
- ✅ Updates dynamically based on overrides

---

### 3. **Override Management (Lines 146-225)**

#### Helper Functions to Apply Overrides:
```typescript
getSectionEnabled(section)   // Returns true/false considering overrides
getQuestionEnabled(question) // Returns true/false considering overrides
getQuestionText(question)    // Returns custom text if overridden
hasOverride(question)        // Returns true if question has any override
```

#### Saving Changes:
- Section toggle → Creates/updates section override
- Question toggle → Creates/updates question override
- Question edit → Creates/updates override with custom_text
- All changes batched and saved on "Save & Copy Link"

---

### 4. **Type Safety**
Updated imports and types:

```typescript
import {
  getSections,
  getQuestionsWithHelp,
  type SectionConfig,
  type QuestionWithHelp
} from '@/app/actions/questionnaire-config'
```

Also updated `question-editor-modal.tsx` to accept `QuestionWithHelp` type.

---

## Visual Comparison

### Before (Old Version)
```
❌ Only showed 2 questions (enabled=true filter)
❌ Used Checkboxes instead of Switches
❌ No time estimates or badges
❌ No "Custom" indicator for overrides
❌ Simple collapsible structure
```

### After (New Version)
```
✅ Shows ALL 8 sections
✅ Shows ALL 34 questions per section
✅ Toggle Switches like Settings UI
✅ Time estimates and question counts
✅ Yellow "Custom" badge for overridden items
✅ Matches Settings UI visual structure exactly
```

---

## Testing Guide

### Step 1: Open a Client Profile
1. Navigate to Clients page
2. Click on any client card
3. Client profile drawer opens

### Step 2: Open Customize Popup
1. Click "Customize Form" button in the drawer
2. Popup should open with title "Customize Questionnaire"
3. Should show `for [Client Name]` and stats

### Step 3: Verify All Sections Show
Expected sections (8 total):
1. **Business Basics** (5 questions)
2. **Your Audience** (4 questions)
3. **Current Marketing** (4 questions)
4. **Goals & Vision** (5 questions)
5. **Value Proposition** (4 questions)
6. **Brand Voice** (4 questions)
7. **Competitors** (4 questions)
8. **Timeline & Budget** (4 questions)

### Step 4: Verify Visual Elements
For each section:
- [ ] Chevron icon (expand/collapse)
- [ ] Section title
- [ ] Time badge (e.g., "5m")
- [ ] Question count badge (e.g., "4/4 questions")
- [ ] Toggle switch
- [ ] Disabled sections have opacity and strikethrough

For each question (when section expanded):
- [ ] Q{number} label
- [ ] Question type badge
- [ ] "Required" badge if applicable
- [ ] Question text
- [ ] Toggle switch
- [ ] Edit button (pencil icon)

### Step 5: Test Toggle Functionality

#### Toggle a Section:
1. Click toggle on "Business Basics" section → OFF
2. Section should get opacity and strikethrough
3. Stats should update in header
4. No API call yet (pending)

#### Toggle a Question:
1. Expand "Your Audience" section
2. Click toggle on first question → OFF
3. Question should get opacity and strikethrough
4. Stats should update
5. No API call yet (pending)

### Step 6: Test Question Editing

1. Click pencil icon on any question
2. Question editor modal opens
3. Toggle "Custom" mode
4. Edit the question text
5. Click "Save Changes"
6. Modal closes
7. Question should show yellow "Custom" badge
8. Question text should show edited version

### Step 7: Test Save & Copy

1. Make several changes (toggle sections, questions, edit text)
2. Click "Save & Copy Link"
3. Should show loading spinner
4. Should make PUT requests to `/api/client-questionnaire/[clientId]/override`
5. Success toast: "Customizations saved! Link copied to clipboard."
6. Popup closes

### Step 8: Verify Persistence

1. Reopen the same client's customize popup
2. All changes should still be there
3. Custom questions show "Custom" badge
4. Toggled items show correct enabled/disabled state

---

## API Integration

### Endpoints Used:

1. **GET** `/api/client-questionnaire/[clientId]/overrides`
   - Fetches all existing overrides for this client
   - Returns: `{ data: Override[], questionOverrides, sectionOverrides }`

2. **PUT** `/api/client-questionnaire/[clientId]/override`
   - Creates or updates an override
   - Body: `{ section_id?, question_id?, override_type, is_enabled, custom_text? }`

3. **Server Actions:**
   - `getSections()` - Gets ALL 8 sections from questionnaire_sections table
   - `getQuestionsWithHelp()` - Gets ALL 34 questions with help content

---

## Files Modified

1. ✅ `/savant-marketing-studio/components/questionnaire/share-questionnaire-popup.tsx`
   - Complete rebuild (447 lines)
   - Matches Settings UI structure exactly

2. ✅ `/savant-marketing-studio/components/questionnaire/question-editor-modal.tsx`
   - Updated to accept `QuestionWithHelp` type
   - Removed `_hasOverride` dependency

---

## Code Quality

- ✅ No linter errors
- ✅ TypeScript type safety
- ✅ Proper React hooks usage
- ✅ Optimistic UI updates with pending changes
- ✅ Error handling with toast notifications
- ✅ Accessibility (keyboard navigation, ARIA labels)

---

## What This Fixes

### Before:
```
🐛 PROBLEM: Popup only showed 2 questions
   - API filtered to enabled=true
   - Couldn't customize disabled sections/questions
   - Didn't match Settings UI
```

### After:
```
✅ SOLUTION: Popup shows ALL 8 sections, ALL 34 questions
   - Uses same data source as Settings UI
   - Can toggle any section/question
   - Visual parity with Settings UI
   - Clear "Custom" indicators for overrides
```

---

## Next Steps (Optional Enhancements)

1. **Add Drag & Drop** (like Settings UI)
   - Implement `@dnd-kit/core` for reordering
   - Save custom order as client override

2. **Section Editing**
   - Allow editing section titles per client
   - Add section override with custom_title field

3. **Bulk Actions**
   - "Enable All" / "Disable All" buttons
   - "Reset to Global" button to clear all overrides

4. **Preview Mode**
   - Button to preview what client will see
   - Opens questionnaire in new tab with overrides applied

---

## Summary

The ShareQuestionnairePopup now:
- ✅ Shows **ALL 8 sections** (not just 2)
- ✅ Shows **ALL 34 questions** (not just enabled ones)
- ✅ Matches Settings UI visual structure exactly
- ✅ Saves changes to client overrides (not global config)
- ✅ Shows "Custom" badges for overridden items
- ✅ Calculates stats dynamically based on overrides
- ✅ No linter errors, fully type-safe

**The popup is now a perfect client-scoped version of the Settings UI.** 🎉









