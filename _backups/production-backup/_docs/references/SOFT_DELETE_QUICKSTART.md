# Soft Delete System - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Run Migration (1 min)
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy contents of `supabase/migrations/20251223000003_add_soft_delete.sql`
4. Paste and run
5. Verify: "Success. No rows returned"

### Step 2: Test Archive (2 min)
1. Go to Clients page
2. Click delete on any client
3. Notice dialog says "Archive" not "Delete"
4. Select "Archive everything"
5. Click "Archive Client"
6. Client disappears from list

### Step 3: Test Restore (1 min)
1. Click "Archive" in sidebar (new link)
2. See your archived client
3. Click "Restore" button
4. Client reappears in Clients list
5. ✅ All data restored!

### Step 4: Test Mentions (1 min)
1. Create client "Test Company Inc"
2. Go to Journal
3. Type: "Meeting with @Test Company Inc"
4. Submit entry
5. Verify ENTIRE name is highlighted (not just "@Test")
6. ✅ Multi-word mentions work!

## 📋 What's New

### New Features
- ✅ **Archive Page** - View and restore deleted clients
- ✅ **Soft Delete** - Items can be recovered
- ✅ **Multi-Word Mentions** - Full client names highlighted
- ✅ **Permanent Delete** - Only from Archive page

### Changed Behavior
- **Delete → Archive** - Clients aren't permanently deleted
- **Mentions** - Now match full names like "@Big Company LLC"
- **Related Data** - Projects/content/journal handled properly

## 🎯 Key Files

### Created
```
supabase/migrations/20251223000003_add_soft_delete.sql
app/dashboard/archive/page.tsx
components/archive/archive-list.tsx
```

### Modified
```
app/actions/clients.ts (major changes)
app/actions/projects.ts
app/actions/content.ts
app/actions/journal.ts
components/journal/journal.tsx
components/layout/sidebar.tsx
components/clients/delete-client-dialog.tsx
```

## 🔧 How It Works

### Soft Delete
```
Normal Delete:  DELETE FROM clients WHERE id = 'xxx'
Soft Delete:    UPDATE clients SET deleted_at = NOW() WHERE id = 'xxx'
```

### Queries
```
Before: SELECT * FROM clients
After:  SELECT * FROM clients WHERE deleted_at IS NULL
```

### Restore
```
UPDATE clients SET deleted_at = NULL WHERE id = 'xxx'
```

## 📊 Database Changes

```sql
-- New columns added to:
clients.deleted_at       (TIMESTAMPTZ)
clients.deleted_by       (UUID)
projects.deleted_at      (TIMESTAMPTZ)
content_assets.deleted_at (TIMESTAMPTZ)
journal_entries.deleted_at (TIMESTAMPTZ)
journal_chats.deleted_at  (TIMESTAMPTZ)

-- New indexes for performance:
idx_clients_deleted_at
idx_projects_deleted_at
idx_content_assets_deleted_at
idx_journal_entries_deleted_at
idx_journal_chats_deleted_at
```

## 🎨 UI Changes

### Sidebar
```
Before: No Archive link
After:  Archive link added (between Journal and Settings)
```

### Delete Dialog
```
Before: "Delete Client" / "This action cannot be undone"
After:  "Archive Client" / "Can be restored from Archive"
```

### New Archive Page
```
Route: /dashboard/archive
Shows: Deleted clients with restore/delete options
```

## 🧪 Testing Checklist

### Basic Flow
- [ ] Run migration successfully
- [ ] Archive a client
- [ ] See client in Archive page
- [ ] Restore client
- [ ] Client reappears

### With Related Data
- [ ] Create client with projects
- [ ] Archive with "delete_all"
- [ ] Verify projects archived
- [ ] Restore client
- [ ] Verify projects restored

### Mentions
- [ ] Create "Multi Word Client"
- [ ] Type "@Multi Word Client" in journal
- [ ] Verify full name highlighted
- [ ] Archive client
- [ ] Verify journal entry archived
- [ ] Restore and verify

### Permanent Delete
- [ ] Archive a client
- [ ] Click "Delete Forever" in Archive
- [ ] Confirm deletion
- [ ] Verify cannot be restored

## 🐛 Troubleshooting

### Migration Fails
```
Error: column "deleted_at" already exists
Solution: Column already added, safe to ignore
```

### Client Still Shows After Archive
```
Problem: Cache not cleared
Solution: Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+F5)
```

### Mentions Not Highlighting
```
Problem: Old regex cached
Solution: Clear browser cache and reload
```

### Archive Page 404
```
Problem: Route not registered
Solution: Restart dev server
```

## 📚 Documentation

Full docs available in:
- `docs/SOFT_DELETE_IMPLEMENTATION.md` - Technical details
- `docs/SOFT_DELETE_VISUAL_GUIDE.md` - Visual examples
- `docs/IMPLEMENTATION_SUMMARY.md` - Complete summary

## 🎉 Success!

If you can:
1. ✅ Archive a client
2. ✅ See it in Archive page
3. ✅ Restore it successfully
4. ✅ See multi-word mentions highlighted

Then the system is working perfectly! 🎊

## 🔮 Future Enhancements

- Auto-purge after 30 days
- Bulk archive/restore
- Archive search/filter
- Mention autocomplete
- Archive statistics

## 💡 Tips

1. **Archive vs Delete**: Use "Archive everything" to keep data together
2. **Restore**: Restores ALL related data automatically
3. **Permanent Delete**: Only use when absolutely sure
4. **Mentions**: Type @ followed by full client name (spaces OK)
5. **Archive Page**: Check regularly for items to restore or purge

## ⚡ Quick Commands

```bash
# Restart dev server
npm run dev

# Check for errors
npm run lint

# Build for production
npm run build
```

## 🆘 Need Help?

Check the detailed documentation:
1. `SOFT_DELETE_IMPLEMENTATION.md` - How it works
2. `SOFT_DELETE_VISUAL_GUIDE.md` - Visual examples
3. `IMPLEMENTATION_SUMMARY.md` - What changed

---

**Status**: ✅ Ready for production
**Version**: 1.0.0
**Date**: December 23, 2025

