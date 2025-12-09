# Quick Reference - Questionnaire Tracking

**Migration:** `add_questionnaire_tracking.sql`  
**Date:** 2025-12-09

---

## 🎯 Quick Deploy (3 Steps)

### 1️⃣ Run Migration
```
Supabase Dashboard → SQL Editor → Paste migration SQL → Run
```

### 2️⃣ Verify
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name LIKE 'questionnaire%';
```

### 3️⃣ Regenerate Types
```bash
npx supabase gen types typescript --project-id YOUR_ID > types/database.ts
```

---

## 📊 New Columns

| Column | Type | Default |
|--------|------|---------|
| `questionnaire_status` | TEXT | `'not_started'` |
| `questionnaire_progress` | JSONB | `{}` |
| `questionnaire_completed_at` | TIMESTAMPTZ | `NULL` |

---

## 🔄 Status Values

- `not_started` - Default for all existing clients
- `in_progress` - Client is filling out questionnaire
- `completed` - Client submitted questionnaire

---

## 💾 Progress Structure

```json
{
  "current_section": 1,
  "completed_questions": [1, 2, 3],
  "last_updated": "2025-12-09T12:00:00Z"
}
```

---

## 💻 Code Examples

### Update Progress
```typescript
await supabase.from('clients').update({
  questionnaire_status: 'in_progress',
  questionnaire_progress: {
    current_section: 2,
    completed_questions: [1, 2, 3, 4],
    last_updated: new Date().toISOString()
  }
}).eq('id', clientId);
```

### Mark Complete
```typescript
await supabase.from('clients').update({
  questionnaire_status: 'completed',
  questionnaire_completed_at: new Date().toISOString()
}).eq('id', clientId);
```

### Query by Status
```typescript
const { data } = await supabase
  .from('clients')
  .select('*')
  .eq('questionnaire_status', 'in_progress');
```

### Query Progress
```typescript
const { data } = await supabase
  .from('clients')
  .select('id, name, questionnaire_progress')
  .filter('questionnaire_progress->current_section', 'gte', 2);
```

---

## 🔙 Rollback

```sql
DROP INDEX IF EXISTS idx_clients_questionnaire_status;
DROP INDEX IF EXISTS idx_clients_questionnaire_progress;
ALTER TABLE clients DROP COLUMN IF EXISTS questionnaire_status;
ALTER TABLE clients DROP COLUMN IF EXISTS questionnaire_progress;
ALTER TABLE clients DROP COLUMN IF EXISTS questionnaire_completed_at;
```

---

## ✅ Verification Query

```sql
-- Should return 3 rows
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'clients' 
AND column_name IN ('questionnaire_status', 'questionnaire_progress', 'questionnaire_completed_at');
```

---

## 📁 Files

- **Migration:** `add_questionnaire_tracking.sql`
- **Verification:** `verify_questionnaire_tracking.sql`
- **Docs:** `README.md`, `MIGRATION_INSTRUCTIONS.md`

---

## 🚨 Important Notes

- ✅ Safe to run multiple times (idempotent)
- ✅ Non-breaking (doesn't affect existing data)
- ✅ Indexes added for performance
- ✅ Rollback script included
- ⚠️ Remember to regenerate TypeScript types!

---

**Status:** ✅ Ready to Deploy
