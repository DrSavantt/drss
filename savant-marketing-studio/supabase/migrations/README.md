# Database Migrations

This directory contains database migration files for the DRSS application.

## Current Migrations

### `add_questionnaire_tracking.sql`

**Date:** 2025-12-09  
**Purpose:** Add questionnaire tracking columns to the `clients` table

**Changes:**
- Adds `questionnaire_status` TEXT column (default: 'not_started')
- Adds `questionnaire_progress` JSONB column (default: '{}')
- Adds `questionnaire_completed_at` TIMESTAMPTZ column
- Creates indexes for performance optimization

**Status Values:**
- `not_started` - Client hasn't begun the questionnaire
- `in_progress` - Client is actively filling out the questionnaire
- `completed` - Client has submitted the questionnaire

**Progress Data Structure:**
```json
{
  "current_section": 1,
  "completed_questions": [1, 2, 3],
  "last_updated": "2025-12-09T12:00:00Z"
}
```

---

## How to Run Migrations

### Method 1: Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **"+ New Query"**
4. Open the migration file: `supabase/migrations/add_questionnaire_tracking.sql`
5. Copy the entire contents
6. Paste into the SQL Editor
7. Click **"Run"** (or press Cmd+Enter / Ctrl+Enter)
8. Wait for success message: "Success. No rows returned"

### Method 2: Supabase CLI

If you have the Supabase CLI installed:

```bash
cd savant-marketing-studio
supabase db push
```

---

## Verification

After running the migration, verify it was successful:

### Quick Verification

Run this query in the SQL Editor:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'clients' 
AND column_name IN ('questionnaire_status', 'questionnaire_progress', 'questionnaire_completed_at');
```

### Comprehensive Verification

Use the verification script:

1. Open `supabase/migrations/verify_questionnaire_tracking.sql`
2. Run all queries in the SQL Editor
3. Check that all tests pass ✅

---

## Rollback

If you need to rollback this migration:

1. Open the migration file
2. Find the "DOWN MIGRATION" section at the bottom
3. Uncomment the rollback commands
4. Run them in the SQL Editor

**Rollback commands:**
```sql
DROP INDEX IF EXISTS idx_clients_questionnaire_status;
DROP INDEX IF EXISTS idx_clients_questionnaire_progress;
ALTER TABLE clients DROP COLUMN IF EXISTS questionnaire_status;
ALTER TABLE clients DROP COLUMN IF EXISTS questionnaire_progress;
ALTER TABLE clients DROP COLUMN IF EXISTS questionnaire_completed_at;
```

---

## Generate TypeScript Types

After running any migration that changes the database schema, regenerate TypeScript types:

```bash
cd savant-marketing-studio

# Replace YOUR_PROJECT_ID with your Supabase project ID
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
```

**Find your Project ID:**
1. Go to Supabase Dashboard → **Settings** → **General**
2. Copy the **Project ID**

---

## Testing in Application

After running the migration and regenerating types:

1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Test creating a client with questionnaire data:**
   ```typescript
   const { data, error } = await supabase
     .from('clients')
     .insert({
       name: 'Test Client',
       email: 'test@example.com',
       questionnaire_status: 'in_progress',
       questionnaire_progress: {
         current_section: 1,
         completed_questions: [1, 2],
         last_updated: new Date().toISOString()
       }
     });
   ```

3. **Test querying by status:**
   ```typescript
   const { data, error } = await supabase
     .from('clients')
     .select('*')
     .eq('questionnaire_status', 'in_progress');
   ```

---

## Migration Checklist

- [x] Migration file created
- [x] Verification queries created
- [ ] Run migration on Supabase
- [ ] Verify columns exist in Table Editor
- [ ] Check existing clients have default values
- [ ] Regenerate TypeScript types
- [ ] Test in application
- [ ] Commit changes

---

## Notes

- All migrations use `IF NOT EXISTS` / `IF EXISTS` for idempotency
- Existing client records are not affected (safe defaults applied)
- Indexes added for query performance on status and JSONB fields
- JSONB structure is flexible and can be extended as needed

---

**Last Updated:** 2025-12-09
