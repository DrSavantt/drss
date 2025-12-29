# Auto-Save to Server - Quick Summary

## ✅ Phase D2.1 Complete!

### What Changed

**3 Files Modified:**
1. `lib/utils.ts` - Added debounce utility
2. `lib/questionnaire/use-questionnaire-form.ts` - Added auto-save logic
3. `app/dashboard/clients/onboarding/[id]/page.tsx` - Added save status UI

---

## Key Features

### 1. Auto-Save Every 5 Seconds
- Debounced save to prevent excessive API calls
- User types → 5 second delay → saves to server
- Shows "Saving..." → "Saved ✓" feedback

### 2. Resume from Draft
- Loads latest draft from server on page load
- Falls back to localStorage if server unavailable
- Preserves progress across devices

### 3. Visual Feedback
Real-time save status in header:
- 🔄 **Saving...** with spinner
- ✅ **Saved** with green checkmark
- ❌ **Save failed** with red alert
- 🕐 **Saved 3 minutes ago** when idle

### 4. Submit Function
```typescript
const { submitQuestionnaire } = useQuestionnaireForm(clientId);

const handleSubmit = async () => {
  const result = await submitQuestionnaire();
  if (result.success) {
    router.push(`/dashboard/clients/${clientId}`);
  }
};
```

---

## Data Flow

```
User types
  ↓
5 second debounce
  ↓
POST /api/questionnaire-response (save draft)
  ↓
Show "Saved ✓"
  ↓
Also save to localStorage (backup)
```

---

## New Hook Returns

```typescript
const {
  // Existing...
  formData,
  saveStatus,     // 'idle' | 'saving' | 'saved' | 'error'
  isDraft,
  
  // New!
  lastSaved,              // Date | null
  saveNow,                // () => Promise<void> - Force immediate save
  submitQuestionnaire,    // () => Promise<{success, data?, error?}>
} = useQuestionnaireForm(clientId);
```

---

## Usage Example

### In Your Form Component
```typescript
import { useQuestionnaireForm } from '@/lib/questionnaire/use-questionnaire-form';

const MyForm = ({ clientId }) => {
  const { 
    formData, 
    saveStatus, 
    lastSaved,
    submitQuestionnaire 
  } = useQuestionnaireForm(clientId);
  
  const handleSubmit = async () => {
    const result = await submitQuestionnaire();
    if (result.success) {
      // Handle success
    } else {
      alert(result.error);
    }
  };
  
  return (
    <div>
      {/* Show save status */}
      <div>
        {saveStatus === 'saving' && '🔄 Saving...'}
        {saveStatus === 'saved' && '✅ Saved'}
        {lastSaved && `Last saved: ${formatDistanceToNow(lastSaved)}`}
      </div>
      
      {/* Your form fields */}
      <form onSubmit={handleSubmit}>
        {/* ... */}
      </form>
    </div>
  );
};
```

---

## Configuration

### Change Debounce Delay
In `lib/questionnaire/use-questionnaire-form.ts`:
```typescript
const debouncedServerSave = useMemo(
  () => debounce(saveToServer, 5000), // ← Change to 3000 for 3 seconds
  [saveToServer]
);
```

### Change "Saved" Display Duration
```typescript
setSaveStatus('saved');
setTimeout(() => setSaveStatus('idle'), 2000); // ← Change duration
```

---

## API Endpoints Used

- **POST** `/api/questionnaire-response` - Save/update draft
- **GET** `/api/questionnaire-response/[clientId]/latest` - Load draft  
- **PUT** `/api/questionnaire-response/[clientId]/submit` - Finalize

---

## Testing

### Test Auto-Save
1. Open questionnaire form
2. Fill in a field
3. Wait 5 seconds
4. See "Saving..." then "Saved ✓"
5. Check network tab for POST request

### Test Resume
1. Fill in some fields
2. Wait for auto-save
3. Close tab
4. Reopen same questionnaire
5. Should load your progress from server

### Test Submit
1. Complete questionnaire
2. Click submit
3. Should save, then submit, then redirect
4. Check database for submitted status

---

## Backward Compatibility

✅ **No Breaking Changes**
- localStorage still works as backup
- Edit mode unchanged (no auto-save)
- Existing form behavior preserved
- Graceful fallback if APIs fail

---

## Benefits

### Before
- ❌ Only localStorage
- ❌ Lost if cleared
- ❌ No cross-device
- ❌ No feedback

### After
- ✅ Server-backed
- ✅ Persistent
- ✅ Cross-device sync
- ✅ Real-time feedback
- ✅ Version history
- ✅ Timestamp tracking

---

## Next Steps

### Phase D2.2 - Response History UI
Build components to:
- View all versions
- Compare versions
- Revert to previous version
- Show submission timeline

---

**Status:** ✅ Complete & Ready for Use  
**Date:** December 28, 2025  
**See:** `PHASE_D2.1_AUTO_SAVE_COMPLETE.md` for full documentation

