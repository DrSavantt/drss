# Soft Delete & Archive System Implementation

## Overview
This document describes the implementation of a comprehensive soft delete/archive system and fixes for journal mention handling.

## Problems Solved

### 1. No Soft Delete
**Before:** Deleting a client permanently removed all data with no recovery option.
**After:** Clients are soft-deleted (archived) and can be restored from the Archive page.

### 2. Captures Not Deleted with Client
**Before:** Journal entries mentioning a client weren't deleted when the client was removed.
**After:** Journal entries are properly soft-deleted or unlinked based on user's choice.

### 3. Mention Highlighting Broken
**Before:** Only part of multi-word client names were highlighted (e.g., "@Test" instead of "@Test Client").
**After:** Full multi-word names are now properly matched and highlighted.

## Implementation Details

### 1. Database Migration
**File:** `supabase/migrations/20251223000003_add_soft_delete.sql`

Added `deleted_at` and `deleted_by` columns to:
- `clients` table
- `projects` table
- `content_assets` table
- `journal_entries` table
- `journal_chats` table

Also created indexes on `deleted_at` columns for performance.

**Action Required:** Run this migration in Supabase SQL Editor.

### 2. Updated deleteClient Function
**File:** `app/actions/clients.ts`

The `deleteClient` function now:
- Accepts `'preserve' | 'delete_all'` as delete options
- Soft deletes the client (sets `deleted_at` timestamp)
- Based on option:
  - **preserve**: Unlinks projects/content from client, removes client from journal mentions
  - **delete_all**: Soft deletes all related projects, content, and journal entries
- Returns `{ success: true }` or `{ error: string }` instead of redirecting

### 3. New Archive Functions
**File:** `app/actions/clients.ts`

Added three new functions:

#### `restoreClient(id: string)`
- Restores a soft-deleted client
- Also restores related projects, content, and journal entries
- Clears `deleted_at` and `deleted_by` fields

#### `getArchivedClients()`
- Returns all soft-deleted clients for the current user
- Ordered by deletion date (most recent first)

#### `permanentlyDeleteClient(id: string)`
- Hard deletes a client and all related data permanently
- Only available from the Archive page
- Cannot be undone

### 4. Updated All Queries
Added `.is('deleted_at', null)` filter to all query functions:

**Files Modified:**
- `app/actions/clients.ts`: `getClients()`, `getClient()`, `getRelatedCounts()`
- `app/actions/projects.ts`: `getProjects()`, `getProject()`
- `app/actions/content.ts`: `getContentAssets()`, `getContentAsset()`, `getAllContentAssets()`, `getClientProjects()`, `getAllProjects()`, `getContentRelatedCounts()`
- `app/actions/journal.ts`: `getJournalEntries()`, `getJournalChats()`, `getJournalEntriesByProject()`, `getJournalEntriesByContent()`, `getJournalEntriesByClient()`

This ensures soft-deleted items don't appear in normal queries.

### 5. Archive Page
**Files Created:**
- `app/dashboard/archive/page.tsx` - Archive page route
- `components/archive/archive-list.tsx` - Archive UI component

Features:
- Lists all archived clients with deletion timestamps
- **Restore** button - recovers client and related data
- **Delete Forever** button - permanently removes client (with confirmation dialog)
- Empty state when no archived items exist

### 6. Sidebar Navigation
**File:** `components/layout/sidebar.tsx`

Added Archive link to main navigation with Archive icon.

### 7. Journal Mention Regex Fix
**File:** `components/journal/journal.tsx`

**Old Regex:** `/@(\w+)/g` - Only matched single words
**New Regex:** `/@([^\s#@]+(?:\s+[^\s#@]+)*)/g` - Matches multi-word names

Changes:
- Updated `handleSubmit()` to use improved regex
- Updated entry display split regex to match multi-word mentions
- Updated `extractMentions()` helper function

Now properly handles mentions like "@Test Company Inc" instead of just "@Test".

### 8. Delete Client Dialog
**File:** `components/clients/delete-client-dialog.tsx`

Updated to reflect soft delete behavior:
- Changed title from "Delete" to "Archive"
- Updated messaging to indicate items can be restored
- Changed option from "Delete everything" to "Archive everything"
- Updated button text from "Delete Client" to "Archive Client"
- Fixed delete option type to match new function signature

## Testing Checklist

### Basic Soft Delete
- [ ] Run migration in Supabase SQL Editor
- [ ] Create a test client "Test Company Inc"
- [ ] Delete the client with "preserve" option
- [ ] Verify client appears in Archive page
- [ ] Verify client doesn't appear in Clients list
- [ ] Restore client from Archive
- [ ] Verify client reappears in Clients list

### Delete with Related Data
- [ ] Create a client with:
  - 2 projects
  - 3 content assets
  - 2 journal entries mentioning the client
- [ ] Delete client with "delete_all" option
- [ ] Verify all related items are archived
- [ ] Restore client from Archive
- [ ] Verify all related items are restored

### Journal Mentions
- [ ] Create a client "Multi Word Company"
- [ ] Create journal entry with "@Multi Word Company"
- [ ] Verify entire name is highlighted (not just "@Multi")
- [ ] Delete client with "delete_all"
- [ ] Verify journal entry is archived
- [ ] Restore client
- [ ] Verify journal entry is restored with mention intact

### Permanent Delete
- [ ] Archive a client
- [ ] From Archive page, click "Delete Forever"
- [ ] Confirm deletion in dialog
- [ ] Verify client is permanently removed
- [ ] Verify client cannot be restored

### Edge Cases
- [ ] Archive client with no related data
- [ ] Archive client, then try to access by direct URL
- [ ] Archive multiple clients, verify all appear in Archive
- [ ] Test with client names containing special characters
- [ ] Test mention highlighting with multiple mentions in one entry

## Database Schema Changes

```sql
-- Clients table
ALTER TABLE clients 
ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN deleted_by UUID REFERENCES auth.users(id) DEFAULT NULL;

-- Projects table
ALTER TABLE projects 
ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Content Assets table
ALTER TABLE content_assets 
ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Journal Entries table
ALTER TABLE journal_entries
ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Journal Chats table
ALTER TABLE journal_chats
ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Indexes for performance
CREATE INDEX idx_clients_deleted_at ON clients(deleted_at);
CREATE INDEX idx_projects_deleted_at ON projects(deleted_at);
CREATE INDEX idx_content_assets_deleted_at ON content_assets(deleted_at);
CREATE INDEX idx_journal_entries_deleted_at ON journal_entries(deleted_at);
CREATE INDEX idx_journal_chats_deleted_at ON journal_chats(deleted_at);
```

## API Changes

### deleteClient
```typescript
// Before
deleteClient(id: string, deleteOption: 'all' | 'preserve', clientName?: string): void

// After
deleteClient(id: string, deleteOption: 'preserve' | 'delete_all', clientName?: string): Promise<{ success: true } | { error: string }>
```

### New Functions
```typescript
restoreClient(id: string): Promise<{ success: true } | { error: string }>
getArchivedClients(): Promise<ArchivedClient[]>
permanentlyDeleteClient(id: string): Promise<{ success: true } | { error: string }>
```

## User-Facing Changes

1. **Delete Dialog**: Now says "Archive" instead of "Delete"
2. **New Archive Page**: Accessible from sidebar navigation
3. **Restore Capability**: Archived items can be recovered
4. **Permanent Delete**: Only available from Archive page with confirmation
5. **Better Mentions**: Multi-word client names now fully highlighted in journal

## Future Enhancements

1. **Auto-purge**: Automatically permanently delete items after 30 days in archive
2. **Bulk Operations**: Archive/restore multiple clients at once
3. **Search in Archive**: Filter archived items by name or date
4. **Mention Autocomplete**: Add client name autocomplete when typing @ in journal
5. **Activity Log**: Track who archived/restored items and when
6. **Archive Statistics**: Show total archived items count in sidebar badge

## Notes

- Soft delete is transparent to users - archived items simply don't appear in normal views
- All queries automatically exclude soft-deleted items via `.is('deleted_at', null)`
- The system is designed to be extended to other entities (projects, content, etc.)
- Journal mention matching is now more robust but still doesn't link to client IDs (future enhancement)

