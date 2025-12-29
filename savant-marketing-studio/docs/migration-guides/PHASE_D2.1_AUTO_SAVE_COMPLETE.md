# Phase D2.1 - Auto-Save to Server Complete ✅

## Overview
Successfully added server-side auto-save functionality to the questionnaire form hook, replacing localStorage-only saves with robust server-backed storage.

---

## What Was Added

### 1. Debounce Utility (`lib/utils.ts`)
Added a reusable debounce function for delaying function execution:

```typescript
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel: () => void }
```

**Features:**
- Generic typed for TypeScript safety
- Returns cancellable function
- Delays execution until after wait period
- Resets timer on each call

---

### 2. Enhanced Form Hook (`lib/questionnaire/use-questionnaire-form.ts`)

#### New State Variables
```typescript
const [lastSaved, setLastSaved] = useState<Date | null>(null)
const hasLoadedFromServerRef = useRef(false)
```

#### New Functions

**`saveToServer(data)`** - Save draft to server
- Posts to `/api/questionnaire-response`
- Updates save status ('saving' → 'saved' → 'idle')
- Tracks lastSaved timestamp
- Only runs in create mode (not edit mode)
- Fails gracefully (fallback to localStorage)

**`debouncedServerSave`** - Debounced version (5 seconds)
- Uses useMemo for stable reference
- Cancels on unmount
- Prevents excessive API calls

**`loadFromServer()`** - Resume from draft
- Fetches latest response on mount
- Only loads draft status responses
- Populates form data and completed questions
- Marks as loaded to prevent localStorage restore
- Fails silently if no draft exists

**`submitQuestionnaire()`** - Finalize submission
- Saves current state first
- Calls PUT `/api/questionnaire-response/[clientId]/submit`
- Clears localStorage on success
- Returns `{success, data?, error?}`

#### New Effects

**Load from server on mount:**
```typescript
useEffect(() => {
  loadFromServer();
}, [loadFromServer]);
```

**Auto-save on form data change:**
```typescript
useEffect(() => {
  if (Object.keys(formData).length > 0 && !isEditMode) {
    debouncedServerSave(formData);
  }
  return () => debouncedServerSave.cancel();
}, [formData, debouncedServerSave, isEditMode]);
```

#### Updated Return Interface
```typescript
{
  // Existing...
  formData,
  saveStatus,
  isDraft,
  // New additions:
  lastSaved,              // Date | null
  saveNow,                // () => Promise<void>
  submitQuestionnaire,    // () => Promise<{success, data?, error?}>
}
```

---

### 3. Enhanced UI (`app/dashboard/clients/onboarding/[id]/page.tsx`)

#### Auto-Save Status Indicator
Added real-time save status in header:

```tsx
<div className="flex items-center gap-2 text-sm">
  {saveStatus === 'saving' && (
    <span className="text-muted-foreground flex items-center gap-1.5">
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      Saving...
    </span>
  )}
  {saveStatus === 'saved' && (
    <span className="text-green-500 flex items-center gap-1.5">
      <Check className="h-3.5 w-3.5" />
      Saved
    </span>
  )}
  {saveStatus === 'error' && (
    <span className="text-red-500 flex items-center gap-1.5">
      <AlertCircle className="h-3.5 w-3.5" />
      Save failed
    </span>
  )}
  {lastSaved && saveStatus === 'idle' && (
    <span className="text-muted-foreground text-xs">
      Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}
    </span>
  )}
</div>
```

**Visual States:**
- 🔄 **Saving...** - Spinner animation during save
- ✅ **Saved** - Green checkmark for 2 seconds
- ❌ **Save failed** - Red alert icon if error
- 🕐 **Saved 3 minutes ago** - Relative timestamp when idle
- ⚠️ **Draft (not synced)** - Warning if only in localStorage

#### Updated Helper Text
Changed from:
> "Your progress is auto-saved as you type."

To:
> "Your progress is auto-saved to the server every 5 seconds."

---

## Data Flow

### Create Mode (New Questionnaire)

**1. Load Sequence:**
```
Component Mount
  ↓
Try load from server (/api/questionnaire-response/[clientId]/latest)
  ↓ Draft found?
  YES → Populate form with server data
  NO  → Try localStorage
    ↓ Found?
    YES → Populate from localStorage
    NO  → Start with empty form
```

**2. Save Sequence:**
```
User types
  ↓
updateQuestion() called
  ↓
Form data updates
  ↓
Trigger debounced save (5s delay)
  ↓
POST /api/questionnaire-response
  ↓
Show "Saving..." → "Saved ✓"
  ↓
Also save to localStorage (backup)
```

**3. Submit Sequence:**
```
User clicks "Submit"
  ↓
submitQuestionnaire() called
  ↓
Save current state to server
  ↓
PUT /api/questionnaire-response/[clientId]/submit
  ↓
Clear localStorage
  ↓
Redirect to client profile
```

### Edit Mode (Existing Responses)

- Server auto-save disabled
- Loads from `existingData` prop
- Manual save only (on submit)
- Prevents overwriting with drafts

---

## Timing & Performance

### Debounce Delay
**5 seconds** - Balance between:
- ✅ User experience (not too aggressive)
- ✅ Server load (not too frequent)
- ✅ Data safety (not too long)

### Save Status Display
- **"Saving..."** - During API call
- **"Saved ✓"** - For 2 seconds after success
- **"Idle"** - Shows relative timestamp
- **"Error"** - Persists until next save attempt

### Performance Impact
- Debouncing prevents excessive API calls
- LocalStorage backup continues (no regression)
- Failed server saves don't break UX
- Cancels pending saves on unmount

---

## Error Handling

### Graceful Degradation
```typescript
try {
  await saveToServer(formData);
  // Success
} catch (error) {
  console.error('Auto-save failed:', error);
  setSaveStatus('error');
  // localStorage backup still works
}
```

**If server save fails:**
1. Shows error status to user
2. localStorage continues working
3. User can retry by making changes
4. Can manually submit later

**If load from server fails:**
1. Falls back to localStorage
2. If localStorage empty, starts fresh
3. No blocking errors
4. Form always renders

---

## Backward Compatibility

### localStorage Preservation
- ✅ Still saves to localStorage
- ✅ Acts as backup if server fails
- ✅ Existing localStorage data still loads
- ✅ Cleared on successful submit

### Edit Mode Behavior
- ✅ Server auto-save disabled in edit mode
- ✅ Prevents draft conflicts
- ✅ Manual save only
- ✅ Existing edit flow unchanged

### API Integration
- ✅ Uses new API endpoints
- ✅ Falls back gracefully if APIs unavailable
- ✅ No breaking changes to existing code

---

## User Experience Improvements

### Before (localStorage only)
- ❌ Data lost if localStorage cleared
- ❌ No cross-device sync
- ❌ No version history
- ❌ No timestamp tracking
- ❌ No visual feedback during save

### After (Server + localStorage)
- ✅ Data persisted on server
- ✅ Resume on any device
- ✅ Version history tracked
- ✅ Last saved timestamp shown
- ✅ Real-time save status feedback
- ✅ Graceful error handling

---

## Testing Checklist

### Functional Tests
- [ ] Form loads existing draft from server
- [ ] Changes auto-save after 5 seconds
- [ ] "Saving..." appears during save
- [ ] "Saved ✓" appears after successful save
- [ ] Error state shows if API fails
- [ ] LocalStorage still works as backup
- [ ] Submit clears localStorage
- [ ] Edit mode doesn't trigger auto-save

### Edge Cases
- [ ] No draft on server → loads from localStorage
- [ ] Both empty → starts fresh form
- [ ] Server fails → localStorage backup works
- [ ] Rapid typing → debounce works (one save)
- [ ] Navigate away → unmount cancels pending save
- [ ] Edit mode → no auto-save interference

### Visual Tests
- [ ] Status indicator appears in header
- [ ] Spinner animates during save
- [ ] Green checkmark on success
- [ ] Red alert on error
- [ ] Timestamp updates correctly
- [ ] Draft warning shows appropriately

---

## Code Changes Summary

### Files Modified
1. ✅ `lib/utils.ts` - Added debounce utility
2. ✅ `lib/questionnaire/use-questionnaire-form.ts` - Added auto-save logic
3. ✅ `app/dashboard/clients/onboarding/[id]/page.tsx` - Added save status UI

### Lines Added
- ~150 lines in hook (auto-save functions + effects)
- ~20 lines in utils (debounce function)
- ~30 lines in page component (status indicator)
- **Total: ~200 lines**

### API Endpoints Used
- POST `/api/questionnaire-response` - Save/update draft
- GET `/api/questionnaire-response/[clientId]/latest` - Load draft
- PUT `/api/questionnaire-response/[clientId]/submit` - Finalize

---

## Configuration

### Adjustable Parameters

**Debounce Delay** (`lib/questionnaire/use-questionnaire-form.ts`):
```typescript
const debouncedServerSave = useMemo(
  () => debounce(saveToServer, 5000), // ← Change this (milliseconds)
  [saveToServer]
);
```

**Status Display Duration** (`lib/questionnaire/use-questionnaire-form.ts`):
```typescript
setSaveStatus('saved');
setLastSaved(new Date());
setTimeout(() => setSaveStatus('idle'), 2000); // ← Change this
```

**Submitted By** (`lib/questionnaire/use-questionnaire-form.ts`):
```typescript
body: JSON.stringify({ submitted_by: 'admin' }) // or 'client'
```

---

## Future Enhancements

### Potential Improvements
1. **Conflict Resolution** - Handle concurrent edits
2. **Offline Mode** - Queue saves when offline
3. **Save Progress Bar** - Show upload progress
4. **Manual Save Button** - Explicit save option
5. **Save Shortcuts** - Cmd+S to save now
6. **Auto-submit** - Submit when 100% complete

### Integration Points
- Real-time collaboration (WebSockets)
- Change history viewer
- Draft expiration (delete old drafts)
- Save analytics (track save frequency)

---

## Troubleshooting

### Issue: "Saved" never appears
**Cause:** API call failing
**Fix:** Check network tab, verify API endpoints work

### Issue: Old draft loads instead of current
**Cause:** Server returned wrong version
**Fix:** Check `is_latest` flag in database

### Issue: Duplicate saves happening
**Cause:** Debounce not working
**Fix:** Verify debounce function, check useMemo deps

### Issue: Edit mode shows save status
**Cause:** Condition check missing
**Fix:** Ensure `{!isEditMode &&` condition present

---

## Related Documentation
- Phase D1.3 - Response CRUD APIs
- Phase D1.4 - Override CRUD APIs
- API Routes Documentation

---

**Phase D2.1 Status:** ✅ COMPLETE  
**Next Phase:** D2.2 (UI Components for Response History)  
**Date:** December 28, 2025  
**Files Modified:** 3  
**Lines Added:** ~200

