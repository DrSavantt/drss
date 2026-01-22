# TipTap AI Bar & Capture System Audit

**Date:** January 22, 2026  
**Auditor:** AI Assistant  

---

## EXECUTIVE SUMMARY

### Key Findings:
1. **🔴 CRITICAL BUG:** TipTap AI Bar context queries for `clients` and `projects` are **MISSING `deleted_at` filters** - deleted items appear in @mention dropdowns
2. **✅ RLS Policies:** Properly configured - users can only see their own data (not a security issue)
3. **✅ Capture System:** The original capture system **IS WORKING** - captures are properly linked to clients/projects via `mentioned_clients`, `mentioned_projects`, `mentioned_content` arrays
4. **✅ Database Schema:** All necessary columns exist for the capture linking system

### Likely Root Cause of "@ascendedbody" Bug:
The client "@ascendedbody" was likely **deleted** but still appeared in the AI bar dropdown because the clients query lacks a `deleted_at` filter.

---

## PART 1: TIPTAP EDITORS FOUND

| File | Line | Context Props Passed | AI Bar Enabled | Status |
|------|------|---------------------|----------------|--------|
| `components/tiptap-editor.tsx` | 33-46 | clients, projects, contentAssets, journalEntries, writingFrameworks | Yes (showAIBar prop) | ⚠️ Props received but not validated |
| `components/journal/page-view.tsx` | 463-474 | All context props | Yes | ❌ **BROKEN** - No user_id filter |
| `app/dashboard/content/[id]/content-detail-client.tsx` | 343-357 | All context props | Yes (implicit, no showAIBar=false) | ❌ **BROKEN** - No user_id filter |
| `app/components/note-editor-modal.tsx` | 308-319 | All context props | Yes (implicit) | ❌ **BROKEN** - No user_id filter |
| `app/dashboard/clients/[id]/content/new/page.tsx` | 213-224 | All context props | Yes (implicit) | ❌ **BROKEN** - No user_id filter |
| `app/test-tiptap-ai/page.tsx` | 70-77 | models only | Yes | ⚠️ Test page - no context passed |

---

## PART 2: CONTEXT DATA FLOW ANALYSIS

### 2.1 TiptapEditor Props Interface

```typescript:10:31:savant-marketing-studio/components/tiptap-editor.tsx
export interface TiptapEditorProps {
  content?: string | object
  onChange?: (html: string) => void
  editable?: boolean
  showAIBar?: boolean
  clientId?: string
  models?: AIModel[]
  // Context injection - entity data for AI mentions
  clients?: Array<{ id: string; name: string }>
  projects?: Array<{ id: string; name: string; clientName?: string | null }>
  contentAssets?: Array<{ id: string; title: string; contentType?: string | null; clientName?: string | null }>
  journalEntries?: Array<{...}>
  writingFrameworks?: Array<{ id: string; name: string; category?: string }>
}
```

### 2.2 Context Fetch in page-view.tsx (ISSUES FOUND)

```typescript:108:166:savant-marketing-studio/components/journal/page-view.tsx
// Fetch AI models and context data on mount
useEffect(() => {
  async function fetchData() {
    const supabase = createClient()
    
    // Fetch all data in parallel
    const [modelsRes, clientsRes, projectsRes, contentRes, journalRes, frameworksRes] = await Promise.all([
      supabase
        .from('ai_models')
        .select('id, model_name, display_name, max_tokens')
        .eq('is_active', true)
        .order('display_name'),
      supabase
        .from('clients')
        .select('id, name')
        .order('name'),  // ❌ MISSING .is('deleted_at', null) - shows deleted clients!
      supabase
        .from('projects')
        .select('id, name, clients(name)')
        .order('name'),  // ❌ MISSING .is('deleted_at', null) - shows deleted projects!
      supabase
        .from('content_assets')
        .select('id, title, asset_type')
        .is('deleted_at', null)  // ✅ Has filter
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('journal_entries')
        .select('id, title, content')
        .is('deleted_at', null)  // ✅ Has filter
        .order('updated_at', { ascending: false })
        .limit(100),
      supabase
        .from('marketing_frameworks')
        .select('id, name, category')
        .order('name'),  // ⚠️ Has deleted_at column but no filter
    ])
    // ...
  }
  fetchData()
}, [])
```

**CRITICAL BUG FOUND:** The `clients` and `projects` queries are **missing `deleted_at` filters**, which means:
- Deleted clients appear in the AI bar @mention dropdown
- This could explain why "@ascendedbody" appeared - it may have been a deleted client!

### 2.3 Same Problem in content-detail-client.tsx

```typescript:91:142:savant-marketing-studio/app/dashboard/content/[id]/content-detail-client.tsx
// Same pattern - NO user_id filtering on any queries
const [modelsRes, clientsRes, projectsRes, contentRes, journalRes, frameworksRes] = await Promise.all([
  // ... all queries missing user_id filter
])
```

### 2.4 ROOT CAUSE ANALYSIS

**Why @ascendedbody (or other clients) showed wrong data:**

1. **RLS Dependency:** The app relies on Supabase Row Level Security (RLS) to filter by user
2. **Client-Side Fetch:** Context is fetched client-side using `createClient()` from `@/lib/supabase/client`
3. **RLS Works But...:** RLS should work with client-side fetches IF the user is authenticated
4. **Potential Issues:**
   - RLS policy might be misconfigured on some tables
   - The `clients` table might be showing ALL clients, not just the current user's
   - Session token might not be properly passed in client-side fetches

**Evidence from Database Schema:**
- `clients` table has `user_id` column with FK to `auth.users`
- `projects` table does NOT have direct `user_id` - relies on `client_id` join
- `content_assets` table has `user_id` column
- `journal_entries` table has `user_id` column
- `marketing_frameworks` table has `user_id` column

---

## PART 3: OLD CAPTURE SYSTEM ANALYSIS

### 3.1 Database Schema for journal_entries

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner of the entry |
| `content` | text | The capture text |
| `chat_id` | uuid | Links to journal_chats |
| `mentioned_clients` | uuid[] | Array of client IDs mentioned |
| `mentioned_projects` | uuid[] | Array of project IDs mentioned |
| `mentioned_content` | uuid[] | Array of content IDs mentioned |
| `tags` | text[] | Tags like #AIDA, #research |
| `is_pinned` | boolean | Pin status |
| `is_converted` | boolean | Whether converted to content |
| `converted_to_content_id` | uuid | FK to content_assets |

### 3.2 createJournalEntry Function

```typescript:67:114:savant-marketing-studio/app/actions/journal.ts
export async function createJournalEntry(
  content: string,
  chatId: string,
  mentionedClients: string[],
  mentionedProjects: string[],
  mentionedContent: string[],
  tags: string[]
) {
  // ... validates user, inserts with:
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: user.id,
      content: content.trim(),
      chat_id: chatId,
      mentioned_clients: mentionedClients || [],
      mentioned_projects: mentionedProjects || [],
      mentioned_content: mentionedContent || [],
      tags: tags || []
    })
    .select()
  // ...
}
```

### 3.3 ClientCaptures Component - WORKING

```typescript:73:98:savant-marketing-studio/components/clients/client-captures.tsx
const handleAddCapture = async () => {
  if (!newCapture.trim() || submitting) return
  
  setSubmitting(true)
  try {
    // Get or create inbox for quick captures
    const inboxId = await getOrCreateInbox()
    
    // Create entry with client mention
    await createJournalEntry(
      newCapture.trim(),
      inboxId,
      [clientId], // ✅ mentioned_clients - links to current client
      [], // mentioned_projects
      [], // mentioned_content
      [] // tags
    )
    
    setNewCapture('')
    await fetchCaptures() // Refresh list
  } catch (err) {
    console.error('Failed to add capture:', err)
  } finally {
    setSubmitting(false)
  }
}
```

### 3.4 getJournalEntriesByClient - WORKING

```typescript:469:497:savant-marketing-studio/app/actions/journal.ts
export async function getJournalEntriesByClient(clientId: string) {
  // ... validates user
  
  // Get entries where mentioned_clients contains this clientId
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)  // ✅ Properly scoped to user
    .is('deleted_at', null)
    .contains('mentioned_clients', [clientId])  // ✅ Filters by client
    .order('created_at', { ascending: false })
    .limit(10)
  // ...
}
```

### 3.5 OLD CAPTURE SYSTEM STATUS: ✅ WORKING

| Feature | Status | Evidence |
|---------|--------|----------|
| @mention clients in capture | ✅ Working | `journal.tsx` lines 254-284 - insertMention function |
| Link capture to client | ✅ Working | `client-captures.tsx` line 82-88 |
| Link capture to project | ✅ Working | `createJournalEntry` accepts mentionedProjects |
| Capture appears in client detail | ✅ Working | `ClientCaptures` component uses `getJournalEntriesByClient` |
| Convert capture to content | ✅ Working | `convertEntryToContent` function in journal.ts |

---

## PART 4: GAPS IDENTIFIED

### 4.1 TipTap AI Bar Context Issues

| Issue | Location | Root Cause | Severity |
|-------|----------|------------|----------|
| **Deleted clients appear** | page-view.tsx:119-122 | Missing `.is('deleted_at', null)` | 🔴 **CRITICAL** |
| **Deleted projects appear** | page-view.tsx:123-126 | Missing `.is('deleted_at', null)` | 🔴 **CRITICAL** |
| Deleted frameworks may appear | page-view.tsx:139-142 | Missing `.is('deleted_at', null)` | 🟡 MEDIUM |
| Duplicated fetch code | 4 files | Same pattern copy-pasted | 🟡 MEDIUM |
| No explicit user_id filter | all context queries | Relies solely on RLS | 🟢 LOW (RLS works) |

### 4.2 Affected Files (Same Bug)

1. `components/journal/page-view.tsx` - lines 108-166
2. `app/dashboard/content/[id]/content-detail-client.tsx` - lines 91-142
3. `app/components/note-editor-modal.tsx` - lines 77-151
4. `app/dashboard/clients/[id]/content/new/page.tsx` - lines 46-123

---

## PART 5: RECOMMENDED FIXES

### Priority 1: CRITICAL - Add Missing `deleted_at` Filters

**Quick Fix - Add to each file:**

```typescript
// In page-view.tsx, content-detail-client.tsx, note-editor-modal.tsx, and clients/[id]/content/new/page.tsx

// CHANGE THIS:
supabase.from('clients').select('id, name').order('name')

// TO THIS:
supabase.from('clients').select('id, name').is('deleted_at', null).order('name')

// CHANGE THIS:
supabase.from('projects').select('id, name, clients(name)').order('name')

// TO THIS:
supabase.from('projects').select('id, name, clients(name)').is('deleted_at', null).order('name')

// ALSO ADD to frameworks:
supabase.from('marketing_frameworks').select('id, name, category').is('deleted_at', null).order('name')
```

### Priority 2: RECOMMENDED - Create Centralized Server Action

**Create `app/actions/context.ts`:**

```typescript
// app/actions/context.ts
'use server'

import { createClient } from '@/lib/supabase/server'

export async function getAIBarContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const [clients, projects, content, journal, frameworks, models] = await Promise.all([
    supabase.from('clients').select('id, name').is('deleted_at', null).order('name'),
    supabase.from('projects').select('id, name, clients(name)').is('deleted_at', null).order('name'),
    supabase.from('content_assets').select('id, title, asset_type').is('deleted_at', null).order('created_at', { ascending: false }).limit(100),
    supabase.from('journal_entries').select('id, title, content').is('deleted_at', null).order('updated_at', { ascending: false }).limit(100),
    supabase.from('marketing_frameworks').select('id, name, category').is('deleted_at', null).order('name'),
    supabase.from('ai_models').select('id, model_name, display_name, max_tokens').eq('is_active', true).order('display_name'),
  ])

  return {
    clients: clients.data || [],
    projects: projects.data?.map(p => ({ id: p.id, name: p.name, clientName: (p.clients as any)?.name })) || [],
    content: content.data?.map(c => ({ id: c.id, title: c.title, contentType: c.asset_type })) || [],
    journal: journal.data || [],
    frameworks: frameworks.data || [],
    models: models.data || [],
  }
}
```

**Then replace all fetch logic in TipTap components:**

```typescript
// In each component, replace the useEffect with:
import { getAIBarContext } from '@/app/actions/context'

useEffect(() => {
  getAIBarContext().then(data => {
    setAiModels(data.models)
    setContextClients(data.clients)
    setContextProjects(data.projects)
    setContextContent(data.content)
    setContextJournal(data.journal)
    setContextFrameworks(data.frameworks)
  })
}, [])
```

### Priority 3: OPTIONAL - Create Reusable Hook

```typescript
// hooks/useAIBarContext.ts
import { useState, useEffect } from 'react'
import { getAIBarContext } from '@/app/actions/context'

export function useAIBarContext() {
  const [context, setContext] = useState<Awaited<ReturnType<typeof getAIBarContext>> | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    getAIBarContext()
      .then(setContext)
      .finally(() => setLoading(false))
  }, [])
  
  return { ...context, loading }
}
```

### Priority 2: Code Deduplication

Create a shared hook or context provider:

```typescript
// hooks/useAIBarContext.ts
export function useAIBarContext() {
  const [context, setContext] = useState<AIBarContextData | null>(null)
  
  useEffect(() => {
    getAIBarContext().then(setContext)
  }, [])
  
  return context
}
```

### Priority 3: RLS Policy Audit - COMPLETED ✅

**RLS policies are properly configured:**

| Table | Policy Name | Policy Condition | Status |
|-------|-------------|------------------|--------|
| `clients` | Users can access their own clients | `auth.uid() = user_id` | ✅ OK |
| `projects` | Users can access projects for their clients | EXISTS check via clients join | ✅ OK |
| `content_assets` | Users can access their content | `user_id = auth.uid() OR client_id IN user's clients` | ✅ OK |
| `journal_entries` | Users can view their own journal entries | `auth.uid() = user_id` | ✅ OK |
| `marketing_frameworks` | Users can manage their own frameworks | `auth.uid() = user_id` | ✅ OK |

**⚠️ IMPORTANT FINDING:**
Since RLS policies ARE correctly configured, the client-side queries SHOULD be properly filtered when the user is authenticated. This means:

1. **The bug may be intermittent** - possibly related to session state or caching
2. **The explicit user_id filters are redundant** but provide defense-in-depth
3. **Still recommended** to add explicit filters for:
   - Better performance (avoids RLS subquery overhead)
   - Clearer code intent
   - Works even if RLS is accidentally disabled

**Potential Real Cause of Wrong Data:**
- Stale React state after user switch
- Browser caching of API responses  
- Missing `deleted_at` filter showing deleted clients
- Race condition in data fetching

---

## SUMMARY

### What's Broken:
1. **❌ Missing `deleted_at` filters** - Deleted clients/projects appear in AI bar context dropdowns
2. **⚠️ Inconsistent filtering** - Some queries filter deleted items, others don't
3. **⚠️ Code duplication** - Same fetch logic copy-pasted across 4+ files

### What's Working:
1. ✅ **RLS Policies** - Properly configured, users can only see their own data
2. ✅ **Capture System** - Fully functional, captures link to clients/projects via mention arrays
3. ✅ **ClientCaptures Component** - Properly creates and displays client-linked captures
4. ✅ **Journal @mentions** - Working with autocomplete for clients, projects, content
5. ✅ **Convert to Content** - Working, creates content_assets from captures

### ROOT CAUSE OF "@ascendedbody" BUG:
**Most likely:** The client was deleted but still appearing in the AI bar dropdown because the `clients` query is **missing `.is('deleted_at', null)`** filter.

### Immediate Action Required:
1. **CRITICAL:** Add `.is('deleted_at', null)` to clients and projects queries in all TipTap context fetches
2. **RECOMMENDED:** Create centralized server action for context fetch to prevent duplication
3. **NICE-TO-HAVE:** Add explicit user_id filters for defense-in-depth

---

## FILES TO MODIFY

### CRITICAL (Fix Now):

| File | Line | Change Needed |
|------|------|---------------|
| `components/journal/page-view.tsx` | ~119 | Add `.is('deleted_at', null)` to clients query |
| `components/journal/page-view.tsx` | ~123 | Add `.is('deleted_at', null)` to projects query |
| `components/journal/page-view.tsx` | ~139 | Add `.is('deleted_at', null)` to frameworks query |
| `app/dashboard/content/[id]/content-detail-client.tsx` | ~109 | Add `.is('deleted_at', null)` to clients query |
| `app/dashboard/content/[id]/content-detail-client.tsx` | ~112 | Add `.is('deleted_at', null)` to projects query |
| `app/dashboard/content/[id]/content-detail-client.tsx` | ~129 | Add `.is('deleted_at', null)` to frameworks query |
| `app/components/note-editor-modal.tsx` | ~97 | Add `.is('deleted_at', null)` to clients query |
| `app/components/note-editor-modal.tsx` | ~101 | Add `.is('deleted_at', null)` to projects query |
| `app/components/note-editor-modal.tsx` | ~119 | Add `.is('deleted_at', null)` to frameworks query |
| `app/dashboard/clients/[id]/content/new/page.tsx` | ~68 | Add `.is('deleted_at', null)` to clients query |
| `app/dashboard/clients/[id]/content/new/page.tsx` | ~72 | Add `.is('deleted_at', null)` to projects query |
| `app/dashboard/clients/[id]/content/new/page.tsx` | ~89 | Add `.is('deleted_at', null)` to frameworks query |

### RECOMMENDED (Refactor):

| File | Action |
|------|--------|
| NEW: `app/actions/context.ts` | Create centralized context fetch action |
| NEW: `hooks/useAIBarContext.ts` | Create reusable hook |
| All 4 files above | Replace inline fetch with `getAIBarContext()` call |

---

## QUICK FIX COMMANDS

To quickly add the missing filters, search and replace in each file:

```
Find:    .from('clients').select('id, name').order('name')
Replace: .from('clients').select('id, name').is('deleted_at', null).order('name')

Find:    .from('projects').select('id, name, clients(name)').order('name')
Replace: .from('projects').select('id, name, clients(name)').is('deleted_at', null).order('name')

Find:    .from('marketing_frameworks').select('id, name, category').order('name')
Replace: .from('marketing_frameworks').select('id, name, category').is('deleted_at', null).order('name')
```
