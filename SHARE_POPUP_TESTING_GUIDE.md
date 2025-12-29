# ShareQuestionnairePopup Testing Guide

## Quick Test (5 Minutes)

Follow these steps to verify the rebuild is working correctly:

---

## 1. Open the Popup

1. Navigate to: `http://localhost:3000/dashboard/clients`
2. Click on any client card
3. Client drawer opens on the right
4. Click **"Customize Form"** button
5. ShareQuestionnairePopup opens

**Expected:**
```
✅ Dialog opens (max-w-3xl, centered)
✅ Title: "Customize Questionnaire"
✅ Description: "for [Client Name]"
✅ Stats visible: "8/8 sections • 34/34 questions • 40 min"
```

---

## 2. Verify All Sections Show

**Expected: 8 sections visible**

Scroll through and count:
1. Business Basics
2. Your Audience
3. Current Marketing
4. Goals & Vision
5. Value Proposition
6. Brand Voice
7. Competitors
8. Timeline & Budget

**Before (broken):** Only 2-3 sections visible
**After (fixed):** All 8 sections visible ✅

---

## 3. Expand a Section

1. Click the **chevron (▶)** on "Business Basics"
2. Section expands
3. Count the questions

**Expected:**
```
✅ Section expands smoothly
✅ Shows 5 questions (not just 2)
✅ Each question has:
   - Q{number} label (Q1, Q2, Q3, Q4, Q5)
   - Type badge ([text], [textarea])
   - Required badge (on some)
   - Toggle switch (enabled by default)
   - Edit button (pencil icon)
```

---

## 4. Test Section Toggle

1. Click the **toggle switch** on "Business Basics" section
2. Watch what happens

**Expected:**
```
✅ Section gets reduced opacity (60%)
✅ Section title gets strikethrough
✅ Stats update: "7/8 sections • 29/34 questions • 35 min"
✅ Toggle changes to OFF position (white circle on left)
✅ No API call yet (pending)
```

3. Toggle it back ON

**Expected:**
```
✅ Section returns to full opacity
✅ Strikethrough removed
✅ Stats update back: "8/8 sections • 34/34 questions • 40 min"
```

---

## 5. Test Question Toggle

1. Expand "Your Audience" section
2. Count questions (should be 4)
3. Click the **toggle switch** on the first question
4. Watch what happens

**Expected:**
```
✅ Question gets reduced opacity (60%)
✅ Question text gets strikethrough
✅ Stats update: "8/8 sections • 33/34 questions • 40 min"
✅ Toggle changes to OFF position
✅ No API call yet (pending)
```

---

## 6. Test Question Edit

1. Expand "Business Basics" section
2. Click the **pencil icon (✏)** on the first question
3. Question editor modal opens

**Expected Modal:**
```
┌──────────────────────────────────────────┐
│ Edit Question                            │
│ for [Client Name]                        │
│                                          │
│ [Using Global] [Custom]                  │
│                                          │
│ Question Text:                           │
│ ┌────────────────────────────────────┐   │
│ │ What is your business name?        │   │
│ │ (grayed out in Global mode)        │   │
│ └────────────────────────────────────┘   │
│                                          │
│ [🔄 Reset to Global]  [✓ Save Changes]  │
└──────────────────────────────────────────┘
```

4. Click **"Custom"** button
5. Edit the text: "What is YOUR company name?"
6. Click **"Save Changes"**

**Expected:**
```
✅ Modal closes
✅ Question now shows edited text
✅ Question has yellow [Custom] badge
✅ No API call yet (pending)
```

---

## 7. Test Save & Copy Link

1. Make 3 changes:
   - Toggle "Business Basics" section OFF
   - Toggle first question in "Your Audience" OFF
   - Edit text of second question in "Goals & Vision"

2. Click **"Save & Copy Link"** button

**Expected:**
```
✅ Button shows loading spinner
✅ 3 API calls:
   - PUT /api/client-questionnaire/{clientId}/override (section)
   - PUT /api/client-questionnaire/{clientId}/override (question toggle)
   - PUT /api/client-questionnaire/{clientId}/override (question edit)
✅ Success toast: "Customizations saved! Link copied to clipboard."
✅ Popup closes
✅ Link is in clipboard: http://localhost:3000/form/{token}
```

---

## 8. Verify Persistence

1. Click "Customize Form" again on the same client
2. Popup opens

**Expected:**
```
✅ "Business Basics" section is toggled OFF
✅ First question in "Your Audience" is toggled OFF
✅ Second question in "Goals & Vision" shows edited text
✅ Stats reflect the saved changes: "7/8 sections • 32/34 questions"
✅ Edited question has yellow [Custom] badge
```

---

## 9. Test Different Client

1. Close popup
2. Click on a DIFFERENT client
3. Click "Customize Form"

**Expected:**
```
✅ Popup shows ALL sections enabled (8/8)
✅ ALL questions enabled (34/34)
✅ No [Custom] badges (no overrides)
✅ Shows default global config
```

**This confirms:** Overrides are client-specific, not global ✅

---

## 10. Test Reset to Global

1. Open popup for client with customizations
2. Find a question with [Custom] badge
3. Click pencil icon to edit
4. Modal opens (in "Custom" mode)
5. Click **"Reset to Global"** button

**Expected:**
```
✅ Mode switches to "Using Global"
✅ Text reverts to original
✅ Click "Save Changes"
✅ [Custom] badge disappears
✅ Original question text restored
```

---

## Common Issues & Solutions

### Issue: Popup only shows 2 questions
**Solution:** Make sure you've rebuilt the component and restarted the dev server.

### Issue: No stats in header
**Solution:** Check that `getSections()` and `getQuestionsWithHelp()` are returning data.

### Issue: Toggles don't work
**Solution:** Check browser console for errors. Verify API endpoints exist.

### Issue: "Custom" badges don't show
**Solution:** Check that `/api/client-questionnaire/{clientId}/overrides` returns data.

### Issue: Changes don't persist
**Solution:** Check that `/api/client-questionnaire/{clientId}/override` PUT endpoint works.

---

## Expected API Calls (Network Tab)

When opening popup:
```
1. GET /api/client-questionnaire/{clientId}/overrides
   → Returns: { data: [Override, ...] }
```

When saving changes:
```
2. PUT /api/client-questionnaire/{clientId}/override
   → Body: { section_id: "1", override_type: "section", is_enabled: false }
   → Returns: { data: Override }

3. PUT /api/client-questionnaire/{clientId}/override
   → Body: { question_id: "q1", override_type: "question", is_enabled: false }
   → Returns: { data: Override }

4. PUT /api/client-questionnaire/{clientId}/override
   → Body: { question_id: "q2", override_type: "question", custom_text: "..." }
   → Returns: { data: Override }
```

---

## Database Verification

Check `client_questionnaire_overrides` table:

```sql
SELECT 
  id,
  client_id,
  section_id,
  question_id,
  override_type,
  is_enabled,
  custom_text,
  created_at
FROM client_questionnaire_overrides
WHERE client_id = 'your-client-id'
ORDER BY created_at DESC;
```

**Expected:**
- One row per override
- `section_id` populated for section overrides
- `question_id` populated for question overrides
- `custom_text` populated for text edits
- `is_enabled` reflects toggle state

---

## Visual Checklist

Print this and check off as you verify:

### Popup Header
- [ ] Shows "Customize Questionnaire"
- [ ] Shows client name
- [ ] Shows section count (X/8)
- [ ] Shows question count (X/34)
- [ ] Shows time estimate (X min)

### Sections (All 8)
- [ ] Business Basics (5 questions)
- [ ] Your Audience (4 questions)
- [ ] Current Marketing (4 questions)
- [ ] Goals & Vision (5 questions)
- [ ] Value Proposition (4 questions)
- [ ] Brand Voice (4 questions)
- [ ] Competitors (4 questions)
- [ ] Timeline & Budget (4 questions)

### Each Section Has
- [ ] Chevron button (▶ / ▼)
- [ ] Time badge ([Xm])
- [ ] Question count badge ([X/X questions])
- [ ] Toggle switch

### Each Question Has
- [ ] Q{number} label
- [ ] Type badge ([text], [textarea], etc.)
- [ ] Required badge (if applicable)
- [ ] Toggle switch
- [ ] Edit button (pencil icon)

### Interactions Work
- [ ] Chevron expands/collapses section
- [ ] Section toggle updates state & stats
- [ ] Question toggle updates state & stats
- [ ] Edit button opens modal
- [ ] Modal allows text editing
- [ ] Custom mode enables editing
- [ ] Save creates [Custom] badge
- [ ] Reset to Global removes customization
- [ ] Save & Copy Link saves to database
- [ ] Link copied to clipboard
- [ ] Reopening shows persisted changes

### Visual Feedback
- [ ] Disabled items have reduced opacity
- [ ] Disabled items have strikethrough
- [ ] Custom items have yellow badge
- [ ] Smooth expand/collapse animations
- [ ] Loading spinner on save
- [ ] Success toast on save

---

## Pass/Fail Criteria

✅ **PASS** if:
- All 8 sections visible
- All 34 questions visible (when expanded)
- Toggles work and persist
- Edits work and persist
- Stats update in real-time
- Visual matches Settings UI
- [Custom] badges appear correctly
- Changes are client-specific

❌ **FAIL** if:
- Only 2-3 sections visible
- Only 2 questions visible per section
- Toggles don't persist
- No [Custom] badges
- Stats don't update
- Changes affect all clients (not client-specific)

---

## Quick Smoke Test (30 seconds)

**Fastest way to verify it works:**

1. Open popup → Should see "8/8 sections • 34/34 questions"
2. Expand first section → Should see 5 questions (not 2)
3. Toggle first question OFF → Stats should update to "33/34"
4. Edit second question → Should see [Custom] badge
5. Save & Copy Link → Success toast appears
6. Reopen popup → Changes still there

**If all 6 steps pass → Rebuild successful ✅**

---

## Success! 🎉

If you've completed this testing guide and everything works, the ShareQuestionnairePopup rebuild is complete and functional.

You now have:
- ✅ Full visibility of all sections and questions
- ✅ Client-specific customization capabilities
- ✅ Visual parity with Settings UI
- ✅ Persistent override management
- ✅ Clear indicators for customized content

The popup is ready for production use!

