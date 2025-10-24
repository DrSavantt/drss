# Database Setup Instructions

## Feature 0.3 - Complete Database Schema

This document guides you through setting up the complete DRSS database schema in Supabase.

---

## 📋 Prerequisites

- ✅ Supabase project created
- ✅ Supabase connection working (verified at `/test`)
- ✅ Access to Supabase dashboard

---

## 🚀 Step 1: Enable pgvector Extension

**This MUST be done before running the schema SQL.**

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Database** → **Extensions** (left sidebar)
4. Search for "**vector**"
5. Find "**vector**" in the list
6. Click the **Enable** button
7. Wait for confirmation (green checkmark)

**Why?** The pgvector extension enables AI embedding storage needed for Phase 3 RAG features.

---

## 🗄️ Step 2: Run the Database Schema

### Method 1: Via Supabase SQL Editor (Recommended)

1. Open your Supabase dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **"+ New Query"**
4. Open the file: `supabase/schema.sql` from this project
5. Copy the ENTIRE contents (all ~400 lines)
6. Paste into the SQL Editor
7. Click **"Run"** (or press Cmd+Enter / Ctrl+Enter)
8. Wait for success message: "Success. No rows returned"

**Note**: The schema is idempotent - you can run it multiple times safely.

### Method 2: Via Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
cd savant-marketing-studio
supabase db reset  # Only if starting fresh
supabase db push
```

---

## ✅ Step 3: Verify the Schema

After running the SQL, verify everything was created:

### Check Tables

1. Go to **Table Editor** in Supabase dashboard
2. You should see **10 tables**:
   - ✅ clients
   - ✅ projects
   - ✅ frameworks
   - ✅ framework_embeddings
   - ✅ content_assets
   - ✅ component_templates
   - ✅ pages
   - ✅ component_instances
   - ✅ ai_generations

### Check RLS (Row Level Security)

Each table should have a **green shield icon** 🛡️ indicating RLS is enabled.

### Check Policies

Click on any table → **Policies** tab → You should see policy names like:
- "Users can access their own clients"
- "Users can access projects for their clients"
- etc.

---

## 🔧 Step 4: Generate TypeScript Types

After the schema is applied, generate TypeScript types:

### Get Your Project ID

1. Go to Supabase dashboard → **Settings** → **General**
2. Copy your **Project ID** (looks like: `wiplhwpnpirduknbymvz`)

### Run Type Generation

```bash
cd savant-marketing-studio

# Replace YOUR_PROJECT_ID with your actual project ID
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
```

This will replace the placeholder types with actual generated types from your schema.

---

## 🧪 Step 5: Test the Database

### Quick Test via SQL Editor

Run this test query in the SQL Editor:

```sql
-- This should return empty (no clients yet)
SELECT * FROM clients;

-- This should work without errors
SELECT COUNT(*) FROM projects;
```

### Test via Application

Visit your test page to ensure Supabase connection still works:

```
http://localhost:3000/test
```

Should still show "✅ Supabase Connected!"

---

## 📊 Database Schema Overview

### Tables by Phase

**Phase 1 (MVP):**
- `clients` - Client information and brand data
- `projects` - Project management and kanban
- `content_assets` - Generated content storage

**Phase 2 (Multi-Client):**
- All Phase 1 tables (enhanced with filters)

**Phase 3 (AI/RAG):**
- `frameworks` - Marketing frameworks library
- `framework_embeddings` - Vector embeddings for RAG
- `ai_generations` - AI generation history and tracking

**Phase 4 (Page Builder):**
- `component_templates` - Reusable component definitions
- `pages` - Landing page management
- `component_instances` - Page content instances

### Key Features

**Row Level Security (RLS):**
- All tables filtered by authenticated user
- Clients can only see their own data
- Projects filtered by client ownership
- AI generations tracked per user

**Automatic Timestamps:**
- `updated_at` automatically updated on every row change
- Triggers handle this transparently

**Vector Search:**
- `match_framework_chunks()` function for similarity search
- Enables AI-powered framework recommendations

---

## 🐛 Troubleshooting

### Error: "extension vector does not exist"

**Solution**: Enable the vector extension first (Step 1)

### Error: Policy already exists

**Solution**: The schema handles this - it drops existing policies before creating new ones

### Error: Function already exists

**Solution**: The schema uses `CREATE OR REPLACE` - safe to rerun

### Tables not showing in Table Editor

**Solution**: 
1. Refresh the page
2. Check SQL Editor for error messages
3. Verify you ran the complete schema

### RLS not working

**Solution**:
1. Verify green shield icons on tables
2. Check policies exist in Policies tab
3. Ensure you're authenticated when testing

---

## 📁 Step 6: Setup Storage for File Uploads (Feature 1.9)

**Required for file upload functionality.**

### Create Storage Bucket

1. Go to Supabase Dashboard → **Storage** (left sidebar)
2. Click **"New bucket"**
3. Enter bucket name: `client-files` (exactly this, case-sensitive)
4. Check **"Public bucket"** (allows public download URLs)
5. Click **"Create bucket"**

### Add Storage RLS Policies

Storage buckets also use RLS policies. Run these in the SQL Editor:

1. Navigate to **SQL Editor**
2. Click **"+ New Query"**
3. Open the file: `supabase/storage-policies.sql` from this project
4. Copy and paste the contents
5. Click **"Run"**

This creates three policies:
- ✅ Allow authenticated users to upload files
- ✅ Allow public downloads
- ✅ Allow authenticated users to delete their files

### Verify Storage Setup

1. Go to **Storage** → **Policies**
2. You should see the three policies listed
3. Try uploading a test file to verify

**Common Error**: If you see "new row violates row-level security policy" when uploading, the storage policies are missing or incorrect.

---

## 📝 Next Steps

After completing these steps:

1. ✅ All 10 tables created
2. ✅ RLS policies active
3. ✅ Helper functions deployed
4. ✅ TypeScript types generated
5. ✅ Storage bucket created (for file uploads)

You're ready for:
- **Feature 0.4**: Authentication UI
- **Feature 1.1**: Client management
- **Feature 1.2**: Project kanban
- **Feature 1.9**: File uploads

---

## 🆘 Need Help?

If you encounter issues:

1. Check Supabase dashboard **Logs** tab for errors
2. Verify your Supabase project is not paused
3. Ensure you have database write permissions
4. Try running schema.sql again (it's safe to rerun)

---

**Status**: Ready for Feature 0.4 - Authentication Setup 🚀

