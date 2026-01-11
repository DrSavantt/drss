# Research Client Selection Bug Fix

**Date:** January 11, 2026  
**Status:** ✅ Complete

---

## Problem

When saving research without explicitly selecting a client, the system automatically saved it to the first client in the dropdown (e.g., "Gee").

### Root Cause

In `app/actions/research.ts`, the `saveResearchToContent()` function had fallback logic that automatically fetched the user's first client when `clientId` was not provided:

```typescript
// OLD CODE (lines 411-426)
let clientId = data.clientId;
if (!clientId) {
  // Get the user's first client to associate the research with
  const { data: firstClient } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .single();
  
  if (!firstClient) {
    throw new Error('You need at least one client to save research. Create a client first.');
  }
  clientId = firstClient.id;
}
```

### Why This Existed

The `content_assets.client_id` column is **NOT NULL** in the database schema, so the fallback was attempting to handle cases where no client was selected. However, this created unexpected behavior where research auto-saved to clients the user didn't intend.

---

## Solution

**Option A: Require Client Selection** (Implemented)

Since `client_id` is NOT NULL in the schema, we now require explicit client selection.

---

## Changes Made

### 1. Server Action (`app/actions/research.ts`)

**Removed Auto-Fallback Logic:**

```typescript
// NEW CODE
const clientId = data.clientId;
if (!clientId) {
  throw new Error('Please select a client to save this research to.');
}
```

Now throws a clear error if no client is selected, instead of auto-selecting the first one.

### 2. Frontend UI (`app/dashboard/research/page.tsx`)

**Reordered UI Elements:**
- Moved client selector **before** the save button (left to right flow)
- Shows client selector prominently when not yet saved

**Updated Client Selector:**
```tsx
<select
  value={selectedClientId}
  onChange={(e) => setSelectedClientId(e.target.value)}
  className={cn(
    "h-10 px-3 bg-background border rounded-xl text-sm ...",
    !selectedClientId 
      ? "border-orange-500/50 focus:ring-orange-500/20" 
      : "border-border"
  )}
>
  <option value="">Select a client (required)</option>
  {clients.map(client => (
    <option key={client.id} value={client.id}>
      {client.name}
    </option>
  ))}
</select>
```

**Changes:**
- Placeholder text changed from "No client" → **"Select a client (required)"**
- Orange border highlight when no client selected
- Client selector shown first (before save button)

**Updated Save Button:**
```tsx
<button
  onClick={onSaveToLibrary}
  disabled={saving || saved || !selectedClientId}
  className={cn(
    "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors",
    saved
      ? "bg-green-500/10 text-green-500 border border-green-500/20"
      : !selectedClientId
      ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
      : "bg-primary text-primary-foreground hover:bg-primary/90"
  )}
  title={!selectedClientId && !saved ? "Select a client first" : ""}
>
```

**Changes:**
- **Disabled** when `!selectedClientId`
- Gray/muted appearance when disabled
- Tooltip: "Select a client first" on hover
- Blue/primary appearance when client selected

---

## User Experience

### Before Fix
1. User completes research
2. User clicks "Save to Library" without selecting a client
3. ❌ Research auto-saves to "Gee" (first client) without warning
4. User confused why it saved to the wrong client

### After Fix
1. User completes research
2. Client selector shown first with orange border and "(required)" text
3. Save button is disabled and grayed out
4. User must select a client before save button becomes active
5. ✅ Research saves to **explicitly chosen** client only

---

## Visual Changes

**UI Flow (Left to Right):**
```
[Select a client (required) ▼] [💾 Save to Library]  |  [📄 Open in Google Docs] [➕ New Research]
     ↑ Orange border                   ↑ Grayed out when no client selected
     ↑ Must select first                ↑ Enables when client chosen
```

**States:**

| State | Client Selector | Save Button |
|-------|----------------|-------------|
| Initial | Orange border, "(required)" | Disabled, gray, "Select a client first" tooltip |
| Client Selected | Normal border | Active, blue/primary |
| Saving | Hidden (disabled) | Disabled, "Saving..." |
| Saved | Hidden | Green, "Saved ✓" |

---

## Testing Checklist

- [x] Server action throws error when no client selected
- [x] UI shows client selector with clear "required" messaging
- [x] Save button disabled until client selected
- [x] Save button shows tooltip when disabled
- [x] Orange border highlights required field
- [x] Selecting a client enables save button
- [x] Error message clear and actionable
- [x] No linting errors
- [ ] Manual test: Try to save without selecting client
- [ ] Manual test: Save with client selected
- [ ] Manual test: Verify saves to correct client in database

---

## Related Files

- `app/actions/research.ts` - Server action
- `app/dashboard/research/page.tsx` - UI component
- `_sql/schema/main_schema.sql` - Database schema (client_id NOT NULL)

---

## Notes

- The `selectedClientId` state was already correctly initialized to `""` (empty string)
- The bug was purely in the server-side fallback logic, not the frontend state
- This fix makes the requirement explicit in both frontend and backend
- Users with zero clients will get a clear error: "Please select a client to save this research to."
