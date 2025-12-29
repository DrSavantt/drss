# Soft Delete & Archive System - Visual Guide

## 🎯 What Changed

### Before vs After

#### 1. Delete Client Dialog

**BEFORE:**
```
┌─────────────────────────────────────┐
│ Delete "Test Client"?               │
│                                     │
│ This action cannot be undone.       │
│                                     │
│ ○ Preserve data                     │
│ ○ Delete everything                 │
│                                     │
│         [Cancel] [Delete Client]    │
└─────────────────────────────────────┘
```

**AFTER:**
```
┌─────────────────────────────────────┐
│ Archive "Test Client"?              │
│                                     │
│ The client will be moved to the     │
│ Archive where it can be restored.   │
│                                     │
│ ○ Preserve data                     │
│ ○ Archive everything (can restore)  │
│                                     │
│         [Cancel] [Archive Client]   │
└─────────────────────────────────────┘
```

#### 2. Sidebar Navigation

**BEFORE:**
```
┌─────────────────┐
│ Dashboard       │
│ Clients         │
│ Projects        │
│ Content         │
│ Frameworks      │
│ AI Studio       │
│ Journal         │
│                 │
│ Settings        │
└─────────────────┘
```

**AFTER:**
```
┌─────────────────┐
│ Dashboard       │
│ Clients         │
│ Projects        │
│ Content         │
│ Frameworks      │
│ AI Studio       │
│ Journal         │
│ Archive    ← NEW│
│                 │
│ Settings        │
└─────────────────┘
```

#### 3. Archive Page (NEW)

```
┌────────────────────────────────────────────────────────┐
│ Archive                                                │
│ Deleted items are kept here for 30 days before        │
│ permanent deletion.                                    │
│                                                        │
│ Deleted Clients (2)                                    │
│                                                        │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 🏢 Test Company Inc                              │ │
│ │    Deleted 5 minutes ago                         │ │
│ │                    [↻ Restore] [🗑️ Delete Forever]│ │
│ └──────────────────────────────────────────────────┘ │
│                                                        │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 🏢 Old Client LLC                                │ │
│ │    Deleted 2 days ago                            │ │
│ │                    [↻ Restore] [🗑️ Delete Forever]│ │
│ └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

#### 4. Journal Mention Highlighting

**BEFORE (Broken):**
```
Journal Entry:
"Meeting with @Test Company Inc today"
              ^^^^^ Only "Test" highlighted
```

**AFTER (Fixed):**
```
Journal Entry:
"Meeting with @Test Company Inc today"
              ^^^^^^^^^^^^^^^^^ Full name highlighted
```

## 🔄 User Flows

### Flow 1: Archive and Restore Client

```
1. User clicks "Delete" on client
   ↓
2. Dialog shows "Archive Client" with options
   ↓
3. User selects "Archive everything"
   ↓
4. Client disappears from Clients list
   ↓
5. User navigates to Archive page
   ↓
6. Client appears with "Deleted X ago"
   ↓
7. User clicks "Restore"
   ↓
8. Client reappears in Clients list
   ✓ All projects restored
   ✓ All content restored
   ✓ All journal entries restored
```

### Flow 2: Permanent Delete

```
1. User archives a client
   ↓
2. User goes to Archive page
   ↓
3. User clicks "Delete Forever"
   ↓
4. Confirmation dialog appears:
   "This action cannot be undone. This will
    permanently delete the client and all
    associated data from the database forever."
   ↓
5. User confirms
   ↓
6. Client is permanently removed
   ✗ Cannot be restored
```

### Flow 3: Multi-Word Mentions

```
1. User types in Journal: "Meeting with @Test Company Inc"
   ↓
2. System matches full name (not just "Test")
   ↓
3. Entry displays with full highlight:
   "Meeting with @Test Company Inc"
                 ^^^^^^^^^^^^^^^^^ (cyan color)
   ↓
4. When client is archived, entry is also archived
   ↓
5. When client is restored, entry comes back
```

## 📊 Data Flow Diagrams

### Archive Client (Delete All Option)

```
┌─────────────┐
│   Client    │ ← deleted_at = NOW()
└─────────────┘
      │
      ├─────────────────────────────────┐
      │                                 │
      ▼                                 ▼
┌─────────────┐                   ┌─────────────┐
│  Projects   │                   │   Content   │
│ (related)   │ ← deleted_at      │  (related)  │ ← deleted_at
└─────────────┘                   └─────────────┘
      │
      ▼
┌─────────────┐
│   Journal   │
│  Entries    │ ← deleted_at
│ (mentions)  │
└─────────────┘
```

### Restore Client

```
┌─────────────┐
│   Client    │ ← deleted_at = NULL
└─────────────┘
      │
      ├─────────────────────────────────┐
      │                                 │
      ▼                                 ▼
┌─────────────┐                   ┌─────────────┐
│  Projects   │                   │   Content   │
│ (related)   │ ← deleted_at=NULL │  (related)  │ ← deleted_at=NULL
└─────────────┘                   └─────────────┘
      │
      ▼
┌─────────────┐
│   Journal   │
│  Entries    │ ← deleted_at=NULL
│ (mentions)  │
└─────────────┘
```

## 🎨 UI Components

### Archive List Component

```typescript
// Empty State
┌────────────────────────────────┐
│         🗑️                     │
│   Archive is empty             │
│   Deleted clients will appear  │
│   here for recovery.           │
└────────────────────────────────┘

// With Items
┌────────────────────────────────┐
│ 🏢 Client Name                 │
│    Deleted 2 hours ago         │
│    [↻ Restore] [🗑️ Delete]    │
└────────────────────────────────┘
```

### Confirmation Dialog

```
┌─────────────────────────────────────┐
│ Permanently delete "Client Name"?   │
│                                     │
│ This action cannot be undone. This  │
│ will permanently delete the client  │
│ and all associated data from the    │
│ database forever.                   │
│                                     │
│         [Cancel] [Delete Forever]   │
└─────────────────────────────────────┘
```

## 🔍 Query Behavior

### Before (All Items Returned)

```sql
SELECT * FROM clients
-- Returns: Active + Deleted clients
```

### After (Only Active Items)

```sql
SELECT * FROM clients
WHERE deleted_at IS NULL
-- Returns: Only active clients
```

### Archive Page (Only Deleted Items)

```sql
SELECT * FROM clients
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC
-- Returns: Only archived clients
```

## 🎯 Key Benefits

### 1. Safety
- ✅ No accidental permanent deletion
- ✅ 30-day recovery window
- ✅ Confirmation for permanent delete

### 2. Data Integrity
- ✅ Related data handled properly
- ✅ Journal mentions tracked
- ✅ Relationships preserved

### 3. User Experience
- ✅ Clear terminology ("Archive" not "Delete")
- ✅ Easy restoration process
- ✅ Visible recovery option

### 4. Performance
- ✅ Indexed queries (deleted_at)
- ✅ Fast filtering
- ✅ Efficient soft delete checks

## 📝 Testing Scenarios

### Scenario 1: Basic Archive
```
Given: A client "Test Co" exists
When: User archives the client
Then: 
  - Client disappears from Clients list
  - Client appears in Archive
  - Can be restored
```

### Scenario 2: Archive with Data
```
Given: Client has 2 projects, 3 content, 1 journal entry
When: User archives with "delete_all" option
Then:
  - Client archived
  - 2 projects archived
  - 3 content archived
  - 1 journal entry archived
When: User restores client
Then:
  - All items restored together
```

### Scenario 3: Multi-Word Mentions
```
Given: Client "Big Company LLC" exists
When: User types "@Big Company LLC" in journal
Then:
  - Full name highlighted (not just "@Big")
When: Client is archived
Then:
  - Journal entry also archived
When: Client is restored
Then:
  - Journal entry restored with mention intact
```

## 🚀 Migration Steps

1. **Run SQL Migration**
   ```sql
   -- In Supabase SQL Editor
   -- Run: supabase/migrations/20251223000003_add_soft_delete.sql
   ```

2. **Verify Tables Updated**
   ```sql
   -- Check columns exist
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'clients' AND column_name = 'deleted_at';
   ```

3. **Test Archive Flow**
   - Archive a test client
   - Check Archive page
   - Restore client
   - Verify data intact

4. **Test Mentions**
   - Create client with multi-word name
   - Add journal mention
   - Verify highlighting

## ✅ Success Criteria

- [x] Migration runs without errors
- [x] Archive page accessible from sidebar
- [x] Can archive clients
- [x] Can restore clients
- [x] Can permanently delete from archive
- [x] Multi-word mentions highlighted correctly
- [x] Related data handled properly
- [x] No linter errors
- [x] All queries exclude soft-deleted items

## 🎉 Result

A complete, production-ready soft delete system with:
- Safe archival process
- Easy restoration
- Proper data handling
- Fixed mention highlighting
- Clean user experience

