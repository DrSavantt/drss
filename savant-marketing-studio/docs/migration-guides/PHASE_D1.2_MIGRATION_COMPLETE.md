# Phase D1.2 - Database Migration Complete ✅

## Migration Files Created

### 1. Main Migration: `20251228000001_questionnaire_responses.sql`
**Status:** ✅ Applied to database

**Tables Created:**
- ✅ `questionnaire_responses` - Stores version history of all questionnaire submissions
- ✅ `client_questionnaire_overrides` - Per-client customization of questions/sections

**Features Implemented:**

#### questionnaire_responses Table
```sql
- id (UUID, primary key)
- client_id (UUID, foreign key to clients)
- user_id (UUID, foreign key to auth.users)
- version (INTEGER, auto-incrementing per client)
- response_data (JSONB, stores the actual responses)
- status ('draft' | 'submitted')
- is_latest (BOOLEAN, only one true per client)
- submitted_at (TIMESTAMPTZ)
- submitted_by ('client' | 'admin')
- created_at, updated_at
```

**Indexes:**
- `idx_questionnaire_responses_client_id` - Fast lookups by client
- `idx_questionnaire_responses_client_version` - Fast version sorting
- `idx_questionnaire_responses_latest` - Fast latest response queries
- `idx_questionnaire_responses_status` - Filter by draft/submitted

#### client_questionnaire_overrides Table
```sql
- id (UUID, primary key)
- client_id (UUID, foreign key to clients)
- question_id (TEXT, foreign key to questionnaire_questions)
- section_id (INTEGER, foreign key to questionnaire_sections)
- override_type ('question' | 'section' | 'help')
- is_enabled (BOOLEAN)
- custom_text (TEXT)
- custom_help (JSONB)
- created_at, updated_at
```

**Constraints:**
- Unique constraint: One override per client per question
- Check constraint: Either question_id OR section_id must be set, not both

**Helper Functions:**
1. `get_next_response_version(client_id)` - Returns next version number for a client
2. `set_response_as_latest()` - Trigger function that auto-manages is_latest flag

**Row Level Security:**
- ✅ RLS enabled on both tables
- ✅ Users can only access data for their own clients
- ✅ Policies enforce user_id matching via clients table

### 2. Verification Queries: `verify_questionnaire_responses.sql`
**Status:** ✅ Run to verify migration

Includes 10 comprehensive verification queries to check:
- Tables exist
- Indexes created
- RLS enabled
- Policies active
- Constraints working
- Triggers functioning
- Foreign keys correct

## What Changed

### Before Migration
❌ Responses stored in `clients.intake_responses` (JSONB column)
- Single response only (overwrites on edit)
- No version history
- No draft support
- No per-client customization

### After Migration
✅ Responses stored in `questionnaire_responses` table
- Multiple versions per client
- Full version history tracking
- Draft/submitted status
- Auto-incrementing version numbers
- Latest flag auto-managed

✅ Client customization supported via `client_questionnaire_overrides`
- Override questions per client
- Override sections per client
- Custom help content per client

## Next Steps

### Immediate (Required)
1. **Regenerate TypeScript Types**
   ```bash
   cd /Users/rocky/DRSS/savant-marketing-studio
   npx supabase gen types typescript --project-id [YOUR_PROJECT_ID] > types/database.ts
   ```
   
   Or if using linked project:
   ```bash
   npx supabase gen types typescript --linked > types/database.ts
   ```

2. **Verify New Types**
   - Check `types/database.ts` includes:
     - `questionnaire_responses` table
     - `client_questionnaire_overrides` table
   - Both should have Row, Insert, Update types

### Phase D1.3 (Next)
Create server actions to use the new tables:
- `saveQuestionnaireResponse()` - Save to new table with version
- `getResponseHistory()` - Fetch all versions for a client
- `getLatestResponse()` - Fetch current response
- `saveDraft()` - Auto-save drafts
- `getClientOverrides()` - Fetch per-client customizations

### Phase D1.4
Update components to use new system:
- Modify questionnaire form to auto-save to database
- Create response history viewer
- Create version comparison UI
- Add "Revert to version" functionality

## Migration Data Integrity

### Backward Compatibility
✅ `clients.intake_responses` column still exists
- Legacy data preserved
- Can migrate old responses to new table gradually
- No breaking changes to existing code

### Migration Strategy Options

**Option A: Keep Both (Recommended)**
- New responses → `questionnaire_responses` table
- Old responses → remain in `clients.intake_responses`
- Gradually migrate as clients re-submit

**Option B: One-time Migration**
- Write script to copy all `clients.intake_responses` to `questionnaire_responses`
- Set version = 1 for all
- Clear `clients.intake_responses` after verification

## Testing Checklist

```sql
-- 1. Test version incrementing
SELECT get_next_response_version('00000000-0000-0000-0000-000000000000'::uuid);
-- Expected: 1

-- 2. Test inserting a response (use real client_id)
INSERT INTO questionnaire_responses (
  client_id,
  version,
  response_data,
  status,
  submitted_by
) VALUES (
  'YOUR-CLIENT-ID'::uuid,
  1,
  '{"sections": {"avatar_definition": {"q1_ideal_customer": "Test"}}}'::jsonb,
  'draft',
  'admin'
);

-- 3. Verify latest flag
SELECT client_id, version, is_latest 
FROM questionnaire_responses 
WHERE client_id = 'YOUR-CLIENT-ID'::uuid;

-- 4. Test override insertion
INSERT INTO client_questionnaire_overrides (
  client_id,
  question_id,
  override_type,
  is_enabled,
  custom_text
) VALUES (
  'YOUR-CLIENT-ID'::uuid,
  'q1_ideal_customer',
  'question',
  true,
  'Custom question text for this specific client'
);
```

## Files Modified/Created

### New Files
- ✅ `supabase/migrations/20251228000001_questionnaire_responses.sql`
- ✅ `supabase/migrations/verify_questionnaire_responses.sql`
- ✅ `PHASE_D1.2_MIGRATION_COMPLETE.md` (this file)

### Files to Modify (Next Phase)
- `app/actions/questionnaire.ts` - Add new save functions
- `types/database.ts` - Will be regenerated with new tables
- `lib/questionnaire/use-questionnaire-form.ts` - Update to use new tables
- `app/dashboard/clients/[id]/questionnaire-responses/page.tsx` - Add version history UI

## Database Schema Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    QUESTIONNAIRE SYSTEM                      │
└─────────────────────────────────────────────────────────────┘

Config Tables (Already Existed):
├── questionnaire_sections      (sections config)
├── questionnaire_questions     (questions config)
└── questionnaire_help          (help content)

Response Tables (NEW - Just Created):
├── questionnaire_responses           (version history)
│   ├── Links to: clients
│   ├── Links to: auth.users
│   └── Triggers: auto version increment, latest flag management
│
└── client_questionnaire_overrides    (per-client customization)
    ├── Links to: clients
    ├── Links to: questionnaire_questions
    └── Links to: questionnaire_sections

Legacy (Still Exists):
└── clients.intake_responses    (JSONB - deprecated but kept for compatibility)
```

## Performance Considerations

### Indexes Created
All necessary indexes are in place for:
- Fast client lookups
- Fast version sorting
- Fast latest response queries
- Fast override lookups

### Query Patterns Supported
```sql
-- Get latest response (optimized with partial index)
SELECT * FROM questionnaire_responses 
WHERE client_id = ? AND is_latest = true;

-- Get all versions (optimized with composite index)
SELECT * FROM questionnaire_responses 
WHERE client_id = ? 
ORDER BY version DESC;

-- Get specific version
SELECT * FROM questionnaire_responses 
WHERE client_id = ? AND version = ?;

-- Get client overrides (optimized with indexes)
SELECT * FROM client_questionnaire_overrides 
WHERE client_id = ?;
```

## Security Notes

✅ **Row Level Security Active**
- Users can only access responses for their own clients
- Enforced via RLS policies checking `clients.user_id = auth.uid()`

✅ **Data Isolation**
- No cross-user data leakage possible
- Supabase RLS enforces at database level

✅ **Audit Trail**
- All responses tracked with timestamps
- submitted_by field tracks who made changes
- Version history provides complete audit trail

## Rollback Plan (If Needed)

If issues arise, rollback with:

```sql
-- Drop tables in reverse order (handles foreign keys)
DROP TABLE IF EXISTS client_questionnaire_overrides CASCADE;
DROP TABLE IF EXISTS questionnaire_responses CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_next_response_version(UUID);
DROP FUNCTION IF EXISTS set_response_as_latest();
```

Legacy system will continue working as nothing changed to `clients.intake_responses`.

---

**Migration completed on:** December 28, 2025
**Migration file:** `20251228000001_questionnaire_responses.sql`
**Status:** ✅ SUCCESSFUL

