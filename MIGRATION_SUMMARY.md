# Database Migration Summary

**Migration:** Add Questionnaire Tracking to Clients Table  
**Date:** December 9, 2025  
**Status:** ✅ Ready to Deploy

---

## 📋 Overview

This migration extends the `clients` table with three new columns to track questionnaire progress for client onboarding and brand data collection workflows.

---

## 🎯 What's New

### New Columns Added

| Column Name | Type | Default | Nullable | Purpose |
|------------|------|---------|----------|---------|
| `questionnaire_status` | TEXT | `'not_started'` | YES | Tracks overall completion state |
| `questionnaire_progress` | JSONB | `'{}'` | YES | Stores detailed progress data |
| `questionnaire_completed_at` | TIMESTAMPTZ | NULL | YES | Timestamp of completion |

### New Indexes

| Index Name | Type | Purpose |
|-----------|------|---------|
| `idx_clients_questionnaire_status` | BTREE | Fast filtering by status |
| `idx_clients_questionnaire_progress` | GIN | JSONB query optimization |

---

## 📊 Status Values

The `questionnaire_status` column supports three states:

- **`not_started`** - Client hasn't begun the questionnaire (default)
- **`in_progress`** - Client is actively filling out the questionnaire
- **`completed`** - Client has submitted the questionnaire

---

## 📦 Progress Data Structure

The `questionnaire_progress` JSONB column stores:

```json
{
  "current_section": 1,
  "completed_questions": [1, 2, 3, 4],
  "last_updated": "2025-12-09T12:00:00Z"
}
```

**Fields:**
- `current_section` - Which section the client is currently on
- `completed_questions` - Array of question IDs that have been answered
- `last_updated` - ISO timestamp of last progress update

---

## 📁 Files Created

All files are located in `savant-marketing-studio/supabase/migrations/`:

1. **`add_questionnaire_tracking.sql`** - Main migration file with UP and DOWN migrations
2. **`verify_questionnaire_tracking.sql`** - 7 verification queries to test the migration
3. **`README.md`** - Comprehensive migration documentation
4. **`MIGRATION_INSTRUCTIONS.md`** - Quick start guide for running the migration

---

## 🚀 Quick Start

### Step 1: Run Migration

1. Open Supabase Dashboard → **SQL Editor**
2. Click **"+ New Query"**
3. Copy contents of `add_questionnaire_tracking.sql`
4. Click **"Run"**
5. Verify success message

### Step 2: Verify

Run this query:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'clients' 
AND column_name IN ('questionnaire_status', 'questionnaire_progress', 'questionnaire_completed_at');
```

Expected: 3 rows returned with correct types and defaults.

### Step 3: Regenerate Types

```bash
cd savant-marketing-studio
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
```

### Step 4: Restart Dev Server

```bash
npm run dev
```

---

## 💻 Usage Examples

### Update Progress

```typescript
await supabase
  .from('clients')
  .update({
    questionnaire_status: 'in_progress',
    questionnaire_progress: {
      current_section: 2,
      completed_questions: [1, 2, 3, 4],
      last_updated: new Date().toISOString()
    }
  })
  .eq('id', clientId);
```

### Mark as Completed

```typescript
await supabase
  .from('clients')
  .update({
    questionnaire_status: 'completed',
    questionnaire_completed_at: new Date().toISOString()
  })
  .eq('id', clientId);
```

### Query by Status

```typescript
const { data } = await supabase
  .from('clients')
  .select('*')
  .eq('questionnaire_status', 'in_progress');
```

### Query Progress Data

```typescript
const { data } = await supabase
  .from('clients')
  .select('id, name, questionnaire_progress')
  .filter('questionnaire_progress->current_section', 'gte', 2);
```

---

## ✅ Safety Features

- **Idempotent:** Uses `IF NOT EXISTS` - safe to run multiple times
- **Non-Breaking:** Existing clients get safe default values
- **Backward Compatible:** Doesn't affect existing queries or data
- **Rollback Ready:** DOWN migration included for easy rollback
- **Indexed:** Performance optimized with appropriate indexes

---

## 🧪 Test Criteria

- [ ] Run migration on Supabase
- [ ] Verify columns exist in Table Editor
- [ ] Check existing clients have default values
- [ ] Regenerate TypeScript types
- [ ] Test querying by status
- [ ] Test updating progress data
- [ ] Test marking as completed
- [ ] Verify indexes were created

---

## 🔄 Rollback

If needed, run these commands to rollback:

```sql
DROP INDEX IF EXISTS idx_clients_questionnaire_status;
DROP INDEX IF EXISTS idx_clients_questionnaire_progress;
ALTER TABLE clients DROP COLUMN IF EXISTS questionnaire_status;
ALTER TABLE clients DROP COLUMN IF EXISTS questionnaire_progress;
ALTER TABLE clients DROP COLUMN IF EXISTS questionnaire_completed_at;
```

---

## 📚 Documentation

For detailed instructions, see:

- **Quick Start:** `migrations/MIGRATION_INSTRUCTIONS.md`
- **Full Documentation:** `migrations/README.md`
- **Verification Queries:** `migrations/verify_questionnaire_tracking.sql`

---

## 🎯 Next Steps

After running this migration:

1. Update TypeScript types
2. Build questionnaire UI components
3. Implement progress tracking logic
4. Add status filtering to client list
5. Create completion analytics

---

## 📝 Commit Message

```
feat: add questionnaire tracking columns to clients table

- Add questionnaire_status column (not_started, in_progress, completed)
- Add questionnaire_progress JSONB column for detailed tracking
- Add questionnaire_completed_at timestamp column
- Create indexes for performance optimization
- Include verification queries and rollback script
```

---

**Status:** ✅ Ready for Production  
**Breaking Changes:** None  
**Affects Existing Data:** No (safe defaults applied)  
**Estimated Run Time:** < 1 second

---

**End of Summary**
