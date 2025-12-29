# Cascade Delete Implementation Guide

## Overview
This feature adds deletion options with cascade/preserve choices when deleting clients or content items. Users can choose to either delete all related items or preserve journal captures.

## What Was Implemented

### 1. Delete Confirmation Modal Component
**File:** `components/delete-confirmation-modal.tsx`

A reusable modal component that:
- Shows warning with item name and type
- Displays counts of related items (projects, content, captures)
- Provides two deletion options:
  - **Preserve Journal Captures**: Removes entity from journal mentions but keeps entries
  - **Delete Everything**: Cascades deletion to all related items
- Only shows options if there are related items
- Handles loading states during deletion

### 2. Client Deletion
**Files Modified:**
- `app/actions/clients.ts`
- `app/dashboard/clients/[id]/delete-button.tsx`

**New Functions:**
- `getRelatedCounts(clientId)`: Returns counts of related projects, content, and captures
- `deleteClient(id, deleteOption, clientName?)`: Updated to support cascade/preserve logic

**Behavior:**
- **Preserve mode**: Removes client ID from `mentioned_clients` array in journal entries
- **Delete All mode**: Deletes projects, content, and journal entries mentioning the client
- Always deletes the client itself after handling related items

### 3. Content Deletion
**Files Modified:**
- `app/actions/content.ts`
- `app/dashboard/content/[id]/content-detail-client.tsx`

**New Functions:**
- `getContentRelatedCounts(contentId)`: Returns count of journal captures mentioning the content
- `deleteContentAsset(id, clientId, deleteOption, contentTitle?)`: Updated to support cascade/preserve logic

**Behavior:**
- **Preserve mode**: Removes content ID from `mentioned_content` array in journal entries
- **Delete All mode**: Deletes journal entries mentioning the content
- Always deletes the content itself after handling related items

### 4. Database Migration
**File:** `supabase/migrations/20251221_cascade_delete_constraints.sql`

Updates foreign key constraints:
- Projects → Clients: `ON DELETE CASCADE`
- Content Assets → Clients: `ON DELETE CASCADE`
- Content Assets → Projects: `ON DELETE CASCADE`

**Note**: Journal entry mentions are handled in the application layer because they use UUID arrays, and we want fine-grained control over deletion behavior.

## Installation Steps

### Step 1: Run Database Migration
Open Supabase SQL Editor and run:

```sql
-- Run the migration file
\i supabase/migrations/20251221_cascade_delete_constraints.sql
```

Or copy and paste the contents directly into the SQL Editor and execute.

### Step 2: Verify Installation
Check that the new components and functions are working:

```bash
# Build the application to check for errors
cd savant-marketing-studio
npm run build
```

## Testing Guide

### Test 1: Delete Client with Preserve Option
1. Navigate to a client detail page that has:
   - At least 1 project
   - At least 1 content piece
   - At least 1 journal entry mentioning the client
2. Click the "Delete" button
3. Modal should appear showing counts of related items
4. Select "Preserve Journal Captures" option
5. Click "Delete client"
6. **Expected Results:**
   - Client is deleted
   - Projects and content are deleted
   - Journal entries are preserved but client mention is removed
   - Redirected to clients list

### Test 2: Delete Client with Delete All Option
1. Navigate to a client detail page with related items
2. Click "Delete" button
3. Select "Delete Everything" option
4. Click "Delete All"
5. **Expected Results:**
   - Client is deleted
   - All projects are deleted
   - All content is deleted
   - All journal entries mentioning the client are deleted
   - Redirected to clients list

### Test 3: Delete Content with Preserve Option
1. Navigate to a content detail page
2. Ensure at least one journal entry mentions this content (use @content-name)
3. Click the trash icon
4. Modal appears showing capture count
5. Select "Preserve Journal Captures"
6. Click "Delete content"
7. **Expected Results:**
   - Content is deleted
   - Journal entries preserved but content mention removed
   - Redirected to client page

### Test 4: Delete Content with Delete All Option
1. Navigate to a content detail page with journal mentions
2. Click trash icon
3. Select "Delete Everything"
4. Click "Delete All"
5. **Expected Results:**
   - Content is deleted
   - Journal entries mentioning the content are deleted
   - Redirected to client page

### Test 5: Delete Client with No Related Items
1. Create a new client with no projects, content, or mentions
2. Click "Delete" button
3. **Expected Results:**
   - Modal shows "No related items" or options section is hidden
   - Only shows Delete button (no "Delete All" option)
   - Client is deleted successfully

## Database Verification Queries

### Check Related Counts
```sql
-- Count items related to a specific client
SELECT 
  (SELECT COUNT(*) FROM projects WHERE client_id = 'CLIENT_ID') as projects,
  (SELECT COUNT(*) FROM content_assets WHERE client_id = 'CLIENT_ID') as content,
  (SELECT COUNT(*) FROM journal_entries WHERE 'CLIENT_ID' = ANY(mentioned_clients)) as captures;
```

### Verify Journal Entry Cleanup (Preserve Mode)
```sql
-- After preserve delete, check that client ID is removed from mentions
SELECT id, mentioned_clients 
FROM journal_entries 
WHERE 'DELETED_CLIENT_ID' = ANY(mentioned_clients);
-- Should return 0 rows
```

### Verify Cascade Delete (Delete All Mode)
```sql
-- After delete all, verify no entries mention the deleted client
SELECT COUNT(*) 
FROM journal_entries 
WHERE 'DELETED_CLIENT_ID' = ANY(mentioned_clients);
-- Should return 0
```

## Component Props Reference

### DeleteConfirmationModal
```typescript
interface Props {
  isOpen: boolean
  onClose: () => void
  item: {
    type: 'client' | 'content' | 'project'
    name: string
  }
  relatedCounts?: {
    projects?: number
    content?: number
    captures?: number
  } | null
  onConfirm: (deleteOption: 'all' | 'preserve') => Promise<void>
}
```

## Server Action Signatures

### Client Actions
```typescript
getRelatedCounts(clientId: string): Promise<{
  projects: number
  content: number
  captures: number
}>

deleteClient(
  id: string, 
  deleteOption: 'all' | 'preserve' = 'preserve',
  clientName?: string
): Promise<void | { error: string }>
```

### Content Actions
```typescript
getContentRelatedCounts(contentId: string): Promise<{
  captures: number
}>

deleteContentAsset(
  id: string,
  clientId: string,
  deleteOption: 'all' | 'preserve' = 'preserve',
  contentTitle?: string
): Promise<{ success: true } | { error: string }>
```

## Troubleshooting

### Modal doesn't show related counts
- Check browser console for errors
- Verify `getRelatedCounts` function is being called
- Check network tab for failed API calls

### Journal entries not preserved
- Verify the `deleteOption` parameter is being passed correctly
- Check that `mentioned_clients` or `mentioned_content` arrays exist in journal_entries table
- Run database verification queries

### Foreign key constraint errors
- Ensure the migration was run successfully
- Check that all foreign key constraints were updated
- Verify no orphaned records exist

### TypeScript errors
- Rebuild the project: `npm run build`
- Check that all imports are correct
- Verify type definitions match the implementation

## Future Enhancements

Potential improvements:
1. Add undo functionality with a grace period
2. Show preview of items that will be deleted
3. Add bulk deletion with cascade/preserve options
4. Export deleted data before deletion
5. Add soft delete option (archive instead of delete)
6. Add project cascade delete with similar options

## Related Documentation
- [Mention Autocomplete Test Guide](./MENTION_AUTOCOMPLETE_TEST_GUIDE.md)
- [Journal System](./PROJECT_CURRENT_STATE.md#journal-system)
- Supabase Foreign Key Documentation: https://supabase.com/docs/guides/database/tables#foreign-key-constraints

