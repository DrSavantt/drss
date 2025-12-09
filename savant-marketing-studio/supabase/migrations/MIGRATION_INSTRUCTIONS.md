# Quick Migration Instructions

## Add Questionnaire Tracking to Clients Table

### Step 1: Run the Migration

**Via Supabase Dashboard:**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **"+ New Query"**
5. Copy and paste the contents of `add_questionnaire_tracking.sql`
6. Click **"Run"** or press Cmd+Enter
7. Wait for: "Success. No rows returned"

### Step 2: Verify the Migration

**Quick Check:**

Run this query in SQL Editor:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'clients' 
AND column_name IN ('questionnaire_status', 'questionnaire_progress', 'questionnaire_completed_at');
```

**Expected Result:**
- 3 rows returned
- `questionnaire_status` with default `'not_started'::text`
- `questionnaire_progress` with default `'{}'::jsonb`
- `questionnaire_completed_at` with no default

**Visual Check:**

1. Go to **Table Editor** → **clients**
2. Scroll right to see the new columns
3. All existing clients should have:
   - `questionnaire_status` = "not_started"
   - `questionnaire_progress` = {}
   - `questionnaire_completed_at` = NULL

### Step 3: Regenerate TypeScript Types

```bash
cd savant-marketing-studio

# Get your project ID from: Dashboard → Settings → General
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
```

### Step 4: Restart Dev Server

```bash
npm run dev
```

---

## What Was Added

### New Columns

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `questionnaire_status` | TEXT | 'not_started' | Overall completion state |
| `questionnaire_progress` | JSONB | {} | Detailed progress tracking |
| `questionnaire_completed_at` | TIMESTAMPTZ | NULL | Completion timestamp |

### New Indexes

- `idx_clients_questionnaire_status` - For filtering by status
- `idx_clients_questionnaire_progress` - For JSONB queries

---

## Usage Examples

### Update Questionnaire Status

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

## Troubleshooting

### Error: "column already exists"

**Solution:** The migration is idempotent. This means it's safe to run multiple times. The error can be ignored if the columns already exist.

### Columns not showing in Table Editor

**Solution:**
1. Refresh the page
2. Check SQL Editor for error messages
3. Verify the migration ran successfully

### TypeScript errors after regenerating types

**Solution:**
1. Restart your TypeScript server (Cmd+Shift+P → "Restart TS Server")
2. Restart your dev server
3. Check that `types/database.ts` was updated

---

## Rollback (If Needed)

To remove the changes:

```sql
DROP INDEX IF EXISTS idx_clients_questionnaire_status;
DROP INDEX IF EXISTS idx_clients_questionnaire_progress;
ALTER TABLE clients DROP COLUMN IF EXISTS questionnaire_status;
ALTER TABLE clients DROP COLUMN IF EXISTS questionnaire_progress;
ALTER TABLE clients DROP COLUMN IF EXISTS questionnaire_completed_at;
```

---

**Status:** Ready to run ✅  
**Safe for Production:** Yes (non-breaking, safe defaults)  
**Affects Existing Data:** No (only adds new columns with defaults)
