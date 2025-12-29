# Database-Backed Questionnaire System

## Overview

The questionnaire system has been upgraded to use **database-backed configuration** instead of static config files. This enables:

- ✅ Edit questions via admin UI without code changes
- ✅ Enable/disable sections and questions dynamically
- ✅ Reorder sections and questions with drag-and-drop
- ✅ Update validation rules, help content, and options
- ✅ Add new questions or sections on-the-fly
- ✅ Preview changes before they go live

---

## Database Schema

### Tables Created

1. **`questionnaire_sections`** - Section configuration
   - `id`, `key`, `title`, `description`
   - `estimated_minutes`, `sort_order`, `enabled`
   
2. **`questionnaire_questions`** - Question configuration
   - `id`, `section_id`, `question_key`, `sort_order`
   - `text`, `type`, `required`, `enabled`
   - `min_length`, `max_length`, `placeholder`
   - `options` (JSONB), `conditional_on` (JSONB)
   - File upload metadata

3. **`questionnaire_help`** - Help content
   - `question_id`, `title`
   - `where_to_find`, `how_to_extract`
   - `good_example`, `weak_example`, `quick_tip`

---

## Setup Instructions

### 1. Run Migration

```bash
cd savant-marketing-studio
npx supabase db reset  # Or run migration individually
```

The migration creates all 3 tables with proper indexes and triggers.

### 2. Seed Initial Data

```bash
psql $DATABASE_URL < supabase/seed_questionnaire_config.sql
```

This imports all 34 questions from the original config.

### 3. Verify Data

```sql
SELECT COUNT(*) FROM questionnaire_sections;  -- Should be 8
SELECT COUNT(*) FROM questionnaire_questions; -- Should be 34
SELECT COUNT(*) FROM questionnaire_help;      -- Should be ~34
```

---

## Files Created

### Database Layer
1. `/supabase/migrations/20251224000000_questionnaire_config_tables.sql` - Schema
2. `/supabase/seed_questionnaire_config.sql` - All 34 questions

### Server Actions
3. `/app/actions/questionnaire-config.ts` - CRUD operations (460 lines)
   - Read: `getSections()`, `getQuestions()`, `getQuestionsWithHelp()`
   - Update: `updateSection()`, `updateQuestion()`, `updateHelp()`
   - Toggle: `toggleSection()`, `toggleQuestion()`
   - Reorder: `reorderSections()`, `reorderQuestions()`
   - Add/Delete: `addSection()`, `deleteSection()`, `addQuestion()`, `deleteQuestion()`

### Settings UI (To Be Completed)
4. `/app/dashboard/settings/questionnaire/page.tsx` - Main settings page
5. `/app/dashboard/settings/questionnaire/questionnaire-settings-client.tsx` - Client component with tabs
6. `/app/dashboard/settings/questionnaire/sections-tab.tsx` - Sections management
7. `/app/dashboard/settings/questionnaire/questions-tab.tsx` - Questions management
8. `/app/dashboard/settings/questionnaire/preview-tab.tsx` - Live preview

---

## Server Actions API

### Read Operations

```typescript
// Get all sections (ordered by sort_order)
const sections = await getSections()

// Get only enabled sections
const enabledSections = await getEnabledSections()

// Get all questions
const questions = await getQuestions()

// Get questions with help content joined
const questionsWithHelp = await getQuestionsWithHelp()

// Get questions for specific section
const sectionQuestions = await getQuestionsBySection(sectionId)

// Get help for specific question
const help = await getHelp(questionId)
```

### Update Operations

```typescript
// Update section properties
await updateSection(1, {
  title: 'New Title',
  description: 'New description',
  estimated_minutes: 10
})

// Toggle section enabled/disabled
await toggleSection(1, false)

// Reorder sections
await reorderSections([2, 1, 3, 4, 5, 6, 7, 8])

// Update question
await updateQuestion('q1_ideal_customer', {
  text: 'New question text',
  min_length: 100,
  required: false
})

// Toggle question
await toggleQuestion('q1_ideal_customer', false)

// Update help content
await updateHelp('q1_ideal_customer', {
  title: 'New help title',
  quick_tip: 'Updated tip'
})
```

### Add/Delete Operations

```typescript
// Add new section
const newSectionId = await addSection({
  key: 'new_section',
  title: 'New Section',
  description: 'Description',
  estimated_minutes: 5,
  sort_order: 9,
  enabled: true
})

// Add new question
await addQuestion({
  id: 'q35_new_question',
  section_id: 1,
  question_key: 'q35',
  sort_order: 35,
  text: 'Your new question?',
  type: 'long-text',
  required: true,
  enabled: true,
  min_length: 20,
  max_length: 500,
  placeholder: 'Type here...'
})

// Delete section (cascades to questions)
await deleteSection(7)

// Delete question
await deleteQuestion('q35_new_question')

// Duplicate question
const newId = await duplicateQuestion('q1_ideal_customer')
```

---

## Settings UI Features

### Sections Tab
- **List View**: All sections with enabled status
- **Drag-to-Reorder**: Change section order
- **Toggle**: Enable/disable sections
- **Edit**: Inline edit title, description, time
- **Add**: Create new sections
- **Delete**: Remove sections (with confirmation)

### Questions Tab
- **Filter by Section**: Dropdown to select section
- **List View**: All questions in section
- **Drag-to-Reorder**: Change question order within section
- **Toggle**: Enable/disable questions
- **Edit**: Full question editor with:
  - Question text
  - Type (dropdown)
  - Required (switch)
  - Validation (min/max length)
  - Placeholder
  - Options (for multiple choice)
  - Help content (all fields)
- **Add**: Create new questions
- **Delete**: Remove questions
- **Duplicate**: Copy existing question

### Preview Tab
- **Live Preview**: See questionnaire as it would appear
- **Read-only**: No form submission
- **Filter**: Show only enabled sections/questions
- **Conditional Logic**: Respects question dependencies

---

## Next Steps to Complete

### 1. Create Settings UI Components

You need to create these React components:

```
/app/dashboard/settings/questionnaire/
├── page.tsx ✅ (Created)
├── questionnaire-settings-client.tsx
├── sections-tab.tsx
├── sortable-section-item.tsx
├── questions-tab.tsx
├── sortable-question-item.tsx
├── edit-question-dialog.tsx
└── preview-tab.tsx
```

### 2. Install Required Dependencies

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

For drag-and-drop functionality.

### 3. Update Questionnaire Page

Modify `/app/dashboard/clients/onboarding/[id]/page.tsx`:

```typescript
import { getEnabledSections, getQuestionsWithHelp } from '@/app/actions/questionnaire-config'

export default async function QuestionnairePage({ params }: Props) {
  // Load config from database instead of static file
  const [sections, questions] = await Promise.all([
    getEnabledSections(),
    getQuestionsWithHelp()
  ])
  
  // Convert to format expected by questionnaire components
  // Pass to client components
  
  return <QuestionnaireClient sections={sections} questions={questions} />
}
```

### 4. Add Navigation Link

Add to dashboard sidebar:

```typescript
{
  name: 'Settings',
  icon: Settings,
  children: [
    { name: 'Questionnaire', href: '/dashboard/settings/questionnaire' }
  ]
}
```

### 5. Update Config Helpers

The static `/lib/questionnaire/questions-config.ts` can be:
- Kept as a fallback
- Deprecated in favor of database
- Used for type definitions only

---

## Benefits

### Before (Static Config)
- ❌ Need code changes to edit questions
- ❌ Requires deployment to update
- ❌ No visual preview
- ❌ Hard to reorder questions
- ❌ No audit trail of changes

### After (Database-Backed)
- ✅ Edit via admin UI
- ✅ Changes take effect immediately
- ✅ Visual preview before saving
- ✅ Drag-and-drop reordering
- ✅ Database tracks all changes (created_at, updated_at)
- ✅ Can enable/disable per environment
- ✅ Easier A/B testing of question flows

---

## Testing Checklist

- [ ] Migration runs successfully
- [ ] Seed data imports all 34 questions
- [ ] Settings page loads
- [ ] Can view all sections
- [ ] Can toggle section enabled/disabled
- [ ] Can edit section properties
- [ ] Can reorder sections (drag-drop)
- [ ] Can delete section
- [ ] Can add new section
- [ ] Can view questions by section
- [ ] Can toggle question enabled/disabled
- [ ] Can edit question text
- [ ] Can edit validation rules
- [ ] Can edit help content
- [ ] Can reorder questions
- [ ] Can delete question
- [ ] Can add new question
- [ ] Preview shows current config
- [ ] Questionnaire page loads from database
- [ ] Changes in settings reflect in questionnaire
- [ ] Conditional logic still works
- [ ] File upload questions work
- [ ] Multiple choice options render correctly

---

## Troubleshooting

### Migration Fails
- Check if tables already exist: `DROP TABLE IF EXISTS questionnaire_*`
- Verify trigger function exists
- Check PostgreSQL version compatibility

### Seed Data Fails
- Check for syntax errors in SQL
- Verify foreign key references
- Ensure sections are inserted before questions

### Settings Page 404
- Create the route directory: `/app/dashboard/settings/questionnaire/`
- Check file naming (must be `page.tsx`)
- Verify server components vs client components

### Data Not Updating
- Check `revalidatePath()` calls in server actions
- Verify Supabase client has proper permissions
- Check browser console for errors

---

## Future Enhancements

1. **Version Control**: Track changes over time
2. **Branching**: Test changes before going live
3. **Templates**: Pre-built question sets
4. **Import/Export**: Share configs between environments
5. **Analytics**: Track which questions users struggle with
6. **Smart Ordering**: AI-suggested question order
7. **Multi-language**: Support for translations
8. **Conditional Builder**: Visual editor for dependencies
9. **Validation Preview**: Test validation rules
10. **Bulk Operations**: Edit multiple questions at once

---

## Database Query Examples

```sql
-- Get all enabled sections with question counts
SELECT 
  s.*,
  COUNT(q.id) as question_count
FROM questionnaire_sections s
LEFT JOIN questionnaire_questions q ON q.section_id = s.id AND q.enabled = true
WHERE s.enabled = true
GROUP BY s.id
ORDER BY s.sort_order;

-- Find questions without help content
SELECT q.id, q.text
FROM questionnaire_questions q
LEFT JOIN questionnaire_help h ON h.question_id = q.id
WHERE h.id IS NULL AND q.enabled = true;

-- Get questions with their options
SELECT id, text, options
FROM questionnaire_questions
WHERE options IS NOT NULL;

-- Find conditionally dependent questions
SELECT id, text, conditional_on
FROM questionnaire_questions
WHERE conditional_on IS NOT NULL;
```

---

## API Response Examples

### getSections()
```json
[
  {
    "id": 1,
    "key": "avatar_definition",
    "title": "Avatar Definition",
    "description": "Define your ideal customer",
    "estimated_minutes": 7,
    "sort_order": 1,
    "enabled": true
  }
]
```

### getQuestionsWithHelp()
```json
[
  {
    "id": "q1_ideal_customer",
    "section_id": 1,
    "question_key": "q1",
    "sort_order": 1,
    "text": "Who is your IDEAL customer?",
    "type": "long-text",
    "required": true,
    "enabled": true,
    "min_length": 50,
    "max_length": 1000,
    "placeholder": "Business owners...",
    "help": {
      "title": "Who is your IDEAL customer?",
      "where_to_find": ["Your CRM", "..."],
      "quick_tip": "Be specific..."
    }
  }
]
```

---

## Summary

You now have:
1. ✅ Database schema for questionnaire config
2. ✅ Migration with all 34 questions seeded
3. ✅ Comprehensive server actions for CRUD
4. ✅ Settings page structure
5. ⏳ UI components (to be completed)

The foundation is solid. Complete the UI components using the patterns shown in the server actions, and you'll have a fully functional admin interface for managing the questionnaire without code changes!

