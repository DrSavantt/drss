# Deployment Checklist - Questionnaire Tracking Migration

**Migration:** Add Questionnaire Tracking to Clients Table  
**Date:** December 9, 2025  
**Commit:** `d05d608`  
**Status:** ✅ Ready to Deploy

---

## 📋 Pre-Deployment Checklist

- [x] Migration SQL file created
- [x] Verification queries created
- [x] Documentation written
- [x] Rollback script included
- [x] Changes committed to git
- [ ] Migration tested on local/staging database
- [ ] TypeScript types regenerated
- [ ] Team notified of schema changes

---

## 🚀 Deployment Steps

### Step 1: Backup Current Database (Recommended)

```sql
-- Create a backup of the clients table before migration
CREATE TABLE clients_backup_20251209 AS SELECT * FROM clients;
```

### Step 2: Run the Migration

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Click **"+ New Query"**
4. Open file: `savant-marketing-studio/supabase/migrations/add_questionnaire_tracking.sql`
5. Copy entire contents
6. Paste into SQL Editor
7. Click **"Run"** or press Cmd+Enter
8. Wait for success message

**Expected Output:**
```
Success. No rows returned
```

### Step 3: Verify Migration Success

Run verification query:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'clients' 
AND column_name IN ('questionnaire_status', 'questionnaire_progress', 'questionnaire_completed_at')
ORDER BY column_name;
```

**Expected Result:**
| column_name | data_type | is_nullable | column_default |
|------------|-----------|-------------|----------------|
| questionnaire_completed_at | timestamp with time zone | YES | NULL |
| questionnaire_progress | jsonb | YES | '{}'::jsonb |
| questionnaire_status | text | YES | 'not_started'::text |

### Step 4: Verify Indexes

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'clients'
AND indexname IN ('idx_clients_questionnaire_status', 'idx_clients_questionnaire_progress')
ORDER BY indexname;
```

**Expected Result:** 2 rows showing both indexes

### Step 5: Check Existing Data

```sql
SELECT 
    COUNT(*) as total_clients,
    COUNT(CASE WHEN questionnaire_status = 'not_started' THEN 1 END) as not_started_count,
    COUNT(CASE WHEN questionnaire_progress = '{}' THEN 1 END) as empty_progress_count,
    COUNT(CASE WHEN questionnaire_completed_at IS NULL THEN 1 END) as null_completion_count
FROM clients;
```

**Expected:** All existing clients should have default values

### Step 6: Regenerate TypeScript Types

```bash
cd savant-marketing-studio

# Get your Supabase Project ID from: Dashboard → Settings → General
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
```

**Verify:** Check that `types/database.ts` includes the new columns

### Step 7: Update Application Code

1. Restart dev server: `npm run dev`
2. Test TypeScript compilation: `npm run build`
3. Verify no type errors

### Step 8: Test in Application

```typescript
// Test 1: Create client with questionnaire data
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

// Test 2: Query by status
const { data: inProgressClients } = await supabase
  .from('clients')
  .select('*')
  .eq('questionnaire_status', 'in_progress');

// Test 3: Update progress
const { data: updated } = await supabase
  .from('clients')
  .update({
    questionnaire_status: 'completed',
    questionnaire_completed_at: new Date().toISOString()
  })
  .eq('id', clientId);
```

---

## ✅ Post-Deployment Verification

- [ ] All 3 columns exist in database
- [ ] Both indexes created successfully
- [ ] Existing clients have default values
- [ ] TypeScript types regenerated
- [ ] No TypeScript compilation errors
- [ ] Application builds successfully
- [ ] Can create clients with questionnaire data
- [ ] Can query clients by status
- [ ] Can update questionnaire progress
- [ ] No console errors in browser
- [ ] No server errors in logs

---

## 🐛 Troubleshooting

### Issue: "column already exists"

**Cause:** Migration was already run  
**Solution:** This is safe - the migration uses `IF NOT EXISTS`. Verify columns exist.

### Issue: TypeScript errors after regenerating types

**Cause:** TypeScript server not restarted  
**Solution:**
1. In VS Code: Cmd+Shift+P → "Restart TS Server"
2. Restart dev server: `npm run dev`

### Issue: Indexes not created

**Cause:** Insufficient permissions or syntax error  
**Solution:** Check Supabase logs and re-run index creation:

```sql
CREATE INDEX IF NOT EXISTS idx_clients_questionnaire_status 
ON clients(questionnaire_status);

CREATE INDEX IF NOT EXISTS idx_clients_questionnaire_progress 
ON clients USING GIN (questionnaire_progress);
```

### Issue: Existing clients don't have default values

**Cause:** Migration didn't apply defaults to existing rows  
**Solution:** Manually set defaults:

```sql
UPDATE clients 
SET 
  questionnaire_status = 'not_started',
  questionnaire_progress = '{}'
WHERE questionnaire_status IS NULL;
```

---

## 🔄 Rollback Procedure

If you need to rollback the migration:

### Step 1: Run Rollback SQL

```sql
DROP INDEX IF EXISTS idx_clients_questionnaire_status;
DROP INDEX IF EXISTS idx_clients_questionnaire_progress;
ALTER TABLE clients DROP COLUMN IF EXISTS questionnaire_status;
ALTER TABLE clients DROP COLUMN IF EXISTS questionnaire_progress;
ALTER TABLE clients DROP COLUMN IF EXISTS questionnaire_completed_at;
```

### Step 2: Verify Rollback

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'clients' 
AND column_name IN ('questionnaire_status', 'questionnaire_progress', 'questionnaire_completed_at');
```

**Expected:** 0 rows (columns removed)

### Step 3: Regenerate Types Again

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
```

### Step 4: Update Application Code

Remove any code that references the questionnaire columns.

---

## 📊 Performance Impact

**Expected Impact:** Minimal

- **Migration Time:** < 1 second (adds 3 columns + 2 indexes)
- **Storage Impact:** ~50 bytes per row (3 columns with defaults)
- **Query Performance:** Improved (indexes added for common queries)
- **Downtime:** None (non-blocking DDL operations)

---

## 📝 Documentation Updated

- [x] `MIGRATION_SUMMARY.md` - Overview and usage examples
- [x] `migrations/README.md` - Full migration documentation
- [x] `migrations/MIGRATION_INSTRUCTIONS.md` - Quick start guide
- [x] `migrations/verify_questionnaire_tracking.sql` - Verification queries
- [x] `DEPLOYMENT_CHECKLIST.md` - This file

---

## 🔗 Related Files

**Migration Files:**
- `savant-marketing-studio/supabase/migrations/add_questionnaire_tracking.sql`
- `savant-marketing-studio/supabase/migrations/verify_questionnaire_tracking.sql`

**Documentation:**
- `MIGRATION_SUMMARY.md`
- `savant-marketing-studio/supabase/migrations/README.md`
- `savant-marketing-studio/supabase/migrations/MIGRATION_INSTRUCTIONS.md`

**Schema Reference:**
- `savant-marketing-studio/supabase/schema.sql` (lines 27-37 - clients table)

---

## 📞 Support

If you encounter issues during deployment:

1. Check Supabase Dashboard → **Logs** for errors
2. Review verification queries in `verify_questionnaire_tracking.sql`
3. Check TypeScript compilation: `npm run build`
4. Review this checklist for missed steps

---

## ✨ Success Criteria

Migration is successful when:

- ✅ All 3 columns exist in clients table
- ✅ Both indexes created
- ✅ Existing clients have default values
- ✅ TypeScript types include new columns
- ✅ Application compiles without errors
- ✅ Can perform CRUD operations on new columns
- ✅ No performance degradation
- ✅ No data loss or corruption

---

**Deployment Status:** 🟢 Ready  
**Risk Level:** 🟢 Low (non-breaking, safe defaults)  
**Estimated Time:** 5-10 minutes  

---

**End of Checklist**
