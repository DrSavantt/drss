# Cascade Delete Migration

## Quick Start

### Run this migration in Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `20251221_cascade_delete_constraints.sql`
4. Click "Run" or press Ctrl/Cmd + Enter

## What This Does

Updates foreign key constraints to support cascade deletion:

```
clients → projects → content_assets
   ↓         ↓            ↓
CASCADE   CASCADE      CASCADE
```

When a client is deleted:
- All projects for that client are deleted (CASCADE)
- All content for that client is deleted (CASCADE)
- All content for deleted projects is also deleted (CASCADE)

## Verification

After running the migration, verify the constraints:

```sql
-- Check projects constraint
SELECT
  con.conname AS constraint_name,
  con.confdeltype AS delete_action
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'projects'
  AND con.conname LIKE '%client_id%';

-- Check content_assets constraints
SELECT
  con.conname AS constraint_name,
  con.confdeltype AS delete_action
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'content_assets'
  AND (con.conname LIKE '%client_id%' OR con.conname LIKE '%project_id%');
```

Expected `delete_action` value: `c` (CASCADE)

## Rollback

If you need to revert to NO ACTION (default):

```sql
-- Revert projects constraint
ALTER TABLE projects 
  DROP CONSTRAINT IF EXISTS projects_client_id_fkey,
  ADD CONSTRAINT projects_client_id_fkey 
    FOREIGN KEY (client_id) 
    REFERENCES clients(id) 
    ON DELETE NO ACTION;

-- Revert content_assets client constraint
ALTER TABLE content_assets 
  DROP CONSTRAINT IF EXISTS content_assets_client_id_fkey,
  ADD CONSTRAINT content_assets_client_id_fkey 
    FOREIGN KEY (client_id) 
    REFERENCES clients(id) 
    ON DELETE NO ACTION;

-- Revert content_assets project constraint
ALTER TABLE content_assets 
  DROP CONSTRAINT IF EXISTS content_assets_project_id_fkey,
  ADD CONSTRAINT content_assets_project_id_fkey 
    FOREIGN KEY (project_id) 
    REFERENCES projects(id) 
    ON DELETE NO ACTION;
```

## Important Notes

- **Journal entries** are handled in the application layer, not by database constraints
- The `mentioned_clients`, `mentioned_projects`, and `mentioned_content` fields in `journal_entries` are UUID arrays
- The application provides options to either:
  - Remove mentions from journal entries (preserve entries)
  - Delete journal entries entirely (cascade delete)
- This gives users full control over what happens to their journal data

