# Regenerate TypeScript Types After Migration

## ✅ Migration Status
The database migration has been successfully applied:
- ✅ `questionnaire_responses` table created
- ✅ `client_questionnaire_overrides` table created
- ✅ All indexes, triggers, and RLS policies active

## Next Step: Update TypeScript Types

Your database schema has changed, so you need to regenerate the TypeScript types file.

### Option 1: Using Supabase Dashboard (Easiest)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Scroll down to **Project API keys**
5. Copy your **Project URL** and **anon/public key**
6. In the same Settings page, note your **Project ID** (in the URL or Settings → General)

7. Run this command (replace `YOUR_PROJECT_ID`):
```bash
cd /Users/rocky/DRSS/savant-marketing-studio
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
```

### Option 2: Using Connection String

If you have your database connection string:

```bash
cd /Users/rocky/DRSS/savant-marketing-studio
npx supabase gen types typescript --db-url "postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres" > types/database.ts
```

### Option 3: Using Supabase CLI (If Linked)

If your project is linked via Supabase CLI:

```bash
cd /Users/rocky/DRSS/savant-marketing-studio
npx supabase gen types typescript --linked > types/database.ts
```

To link your project (if not already):
```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_ID
```

## Verify the New Types

After regenerating, check that `types/database.ts` includes:

```typescript
// Should see these new tables:
questionnaire_responses: {
  Row: {
    id: string
    client_id: string
    user_id: string | null
    version: number
    response_data: Json
    status: string
    is_latest: boolean
    submitted_at: string | null
    submitted_by: string | null
    created_at: string | null
    updated_at: string | null
  }
  Insert: { ... }
  Update: { ... }
}

client_questionnaire_overrides: {
  Row: {
    id: string
    client_id: string
    question_id: string | null
    section_id: number | null
    override_type: string
    is_enabled: boolean | null
    custom_text: string | null
    custom_help: Json | null
    created_at: string | null
    updated_at: string | null
  }
  Insert: { ... }
  Update: { ... }
}
```

## Troubleshooting

### Error: "Unauthorized"
- Make sure you're logged in: `npx supabase login`
- Or use the `--db-url` option with your connection string

### Error: "Project not found"
- Verify your project ID is correct
- Try using the dashboard method instead

### Error: "Command not found"
- Install Supabase CLI: `npm install -g supabase`
- Or use npx: `npx supabase ...`

## After Types are Regenerated

You can then proceed to **Phase D1.3** to create the server actions that use these new tables.

The new types will enable TypeScript autocomplete and type safety when working with:
- `questionnaire_responses` table
- `client_questionnaire_overrides` table

---

**Current types file location:** `/Users/rocky/DRSS/savant-marketing-studio/types/database.ts`

