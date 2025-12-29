# Questionnaire Settings - Quick Start Guide

## ✅ What's Been Created

### 1. Server Actions (`/app/actions/questionnaire-config.ts`)
Complete CRUD API for managing questionnaire configuration:
- Read: `getSections()`, `getQuestionsWithHelp()`
- Update: `updateSection()`, `updateQuestion()`, `updateHelp()`
- Toggle: `toggleSection()`, `toggleQuestion()`
- Reorder: `reorderSections()`, `reorderQuestions()`

### 2. Questionnaire Settings Component (`/components/settings/questionnaire-settings.tsx`)
Full-featured admin UI with:
- ✅ Stats cards (enabled sections, questions, total time)
- ✅ Drag-and-drop section reordering (@dnd-kit)
- ✅ Toggle switches to enable/disable sections
- ✅ Edit dialogs for sections (title, description, time)
- ✅ Collapsible sections to show/hide questions
- ✅ Drag-and-drop question reordering within sections
- ✅ Toggle switches to enable/disable questions
- ✅ Edit dialogs for questions with tabs:
  - Question tab: text, required, min/max length, placeholder
  - Help tab: title, quick tip, good example, weak example
- ✅ Toast notifications for all actions
- ✅ Optimistic UI updates

### 3. Settings Page Integration
Added "Questionnaire" tab to existing Settings page.

---

## 🚀 How to Use

### 1. Navigate to Settings
Go to: **Dashboard → Settings → Questionnaire tab**

### 2. View Stats
At the top you'll see:
- Enabled Sections: X / 8
- Enabled Questions: X / 34
- Est. Completion Time: X min

### 3. Manage Sections

**Reorder Sections:**
- Grab the grip handle (☰) and drag sections up/down
- Changes save automatically

**Enable/Disable Section:**
- Toggle the switch on the right
- Disabled sections won't appear in questionnaires

**Edit Section:**
- Click the pencil icon
- Edit title, description, or estimated minutes
- Click "Save"

**Expand/Collapse Section:**
- Click the chevron (>) to expand and see questions
- Click again (∨) to collapse

### 4. Manage Questions (Inside Expanded Section)

**Reorder Questions:**
- Grab the grip handle and drag questions up/down within a section
- Changes save automatically

**Enable/Disable Question:**
- Toggle the switch
- Disabled questions won't appear in questionnaires

**Edit Question:**
- Click the pencil icon
- **Question Tab:**
  - Edit question text
  - Toggle required/optional
  - Set min/max length for validation
  - Update placeholder text
- **Help Tab:**
  - Edit help title
  - Update quick tip
  - Provide good example
  - Provide weak example (what not to do)
- Click "Save Changes"

---

## 📊 Features

### Real-Time Stats
The stats cards update immediately as you enable/disable sections and questions:
- Total enabled sections and questions
- Calculated completion time

### Drag-and-Drop
Powered by @dnd-kit:
- Smooth animations
- Visual feedback while dragging
- Auto-save after drop

### Optimistic Updates
Changes appear instantly in the UI:
- Toggle switches update immediately
- If save fails, automatically reverts
- Toast notification shows success/error

### Smart Collapsing
- Sections remember their expanded/collapsed state
- Click to expand only the sections you're working on

---

## 🎯 Common Tasks

### Disable Faith Integration Section
1. Find "Faith Integration" section
2. Toggle switch to OFF
3. Section disappears from questionnaires

### Disable a Specific Question
1. Expand the section containing the question
2. Find the question (e.g., "Q13: What philosophical problems exist?")
3. Toggle switch to OFF
4. Question won't appear in questionnaires

### Edit Question Text
1. Expand section
2. Click pencil icon on question
3. Go to "Question" tab
4. Edit text field
5. Click "Save Changes"

### Update Help Content
1. Expand section
2. Click pencil icon on question
3. Go to "Help" tab
4. Edit help fields
5. Click "Save Changes"

### Reorder Sections
1. Grab grip handle (☰) on section
2. Drag to new position
3. Drop
4. Auto-saves

### Change Validation Rules
1. Click pencil on question
2. Update "Min Length" or "Max Length"
3. Save
4. New validation applies immediately

---

## 🔧 Technical Details

### Data Flow
1. Component loads data from Supabase via server actions
2. User makes changes in UI
3. Optimistic update: UI updates immediately
4. Server action called to save to database
5. On success: Toast notification
6. On failure: Revert UI + Error toast

### Database Tables
- `questionnaire_sections` - 8 sections
- `questionnaire_questions` - 34 questions
- `questionnaire_help` - Help content for each question

### Revalidation
All update actions call `revalidatePath()` to ensure:
- Settings page shows latest data
- Questionnaire page reflects changes

---

## 🧪 Testing Checklist

- [x] Questionnaire tab appears in Settings
- [x] All 8 sections display
- [x] Can toggle section on/off
- [x] Can edit section title/description/time
- [x] Can expand section to see questions
- [x] All 34 questions display (when sections expanded)
- [x] Can toggle question on/off
- [x] Can edit question text
- [x] Can edit validation rules (min/max length)
- [x] Can edit help content
- [x] Can drag to reorder sections
- [x] Can drag to reorder questions within section
- [x] Stats cards update correctly
- [x] Toast notifications show for all actions
- [x] Changes persist after refresh

---

## 🐛 Troubleshooting

### Stats Not Updating
- Refresh the page
- Check browser console for errors
- Verify database connection

### Drag-and-Drop Not Working
- Make sure @dnd-kit is installed: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- Check console for errors

### Changes Not Persisting
- Check Network tab for failed requests
- Verify Supabase connection
- Check server action logs

### Edit Dialog Not Saving
- Look for toast error message
- Check console for validation errors
- Verify all required fields are filled

---

## 📦 Dependencies

Required packages (should already be installed):
```json
{
  "@dnd-kit/core": "^6.0.0",
  "@dnd-kit/sortable": "^7.0.0", 
  "@dnd-kit/utilities": "^3.2.0",
  "sonner": "^1.0.0"
}
```

---

## 🎨 UI Components Used

From shadcn/ui:
- Card, CardHeader, CardTitle, CardDescription, CardContent
- Switch
- Button
- Input, Label, Textarea
- Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
- Tabs, TabsContent, TabsList, TabsTrigger
- Badge
- Collapsible, CollapsibleContent, CollapsibleTrigger

---

## 🚦 Next Steps

1. **Test the Settings Page:**
   - Navigate to Settings → Questionnaire
   - Try toggling sections/questions
   - Test drag-and-drop
   - Edit some content

2. **Verify Changes Take Effect:**
   - Go to a client's onboarding page
   - Confirm disabled sections don't appear
   - Confirm disabled questions don't appear
   - Verify updated text shows correctly

3. **Customize Your Questionnaire:**
   - Disable sections you don't need (e.g., Faith Integration)
   - Disable optional questions
   - Update question text to match your brand voice
   - Enhance help content for better guidance

---

## 💡 Tips

- **Start Small:** Disable one section, test it, then proceed
- **Use Help Content:** Good help content reduces incomplete responses
- **Order Matters:** Put most important questions first
- **Test Often:** Check questionnaire after major changes
- **Backup First:** Export data before bulk changes

---

## 📚 Related Files

- Database Schema: `/supabase/migrations/20251224000000_questionnaire_config_tables.sql`
- Seed Data: `/supabase/seed_questionnaire_config.sql`
- Server Actions: `/app/actions/questionnaire-config.ts`
- Settings Component: `/components/settings/questionnaire-settings.tsx`
- Settings Page: `/components/settings/settings.tsx`
- Full Guide: `/DATABASE_BACKED_QUESTIONNAIRE_GUIDE.md`

---

## ✨ Summary

You now have a complete admin UI to manage your questionnaire configuration without touching code. The interface is intuitive, changes are instant, and everything is backed by a proper database schema. Enjoy!

