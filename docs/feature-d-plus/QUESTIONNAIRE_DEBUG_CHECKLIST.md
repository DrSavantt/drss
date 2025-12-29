# Questionnaire Debug Checklist

## CHANGES MADE

### 1. Enhanced Logging in Context Provider
**File**: `lib/questionnaire/questionnaire-config-context.tsx`

Added detailed console logs at every step:
- `[Context] FETCH START` - When fetch begins
- `[Context] FETCH SUCCESS` - When server actions return
- `[Context] TRANSFORM COMPLETE` - After data transformation
- `[Context] STATE UPDATED` - After setState call
- `[Context] FETCH ERROR` - If fetch fails

### 2. Enhanced Logging in Page Component  
**File**: `app/dashboard/clients/onboarding/[id]/page.tsx`

Added logs to track:
- Config state on each render
- Enabled sections array
- Section matching logic
- Which render path is taken (loading/error/content)

### 3. Auto-Fix for Missing Section
**File**: `app/dashboard/clients/onboarding/[id]/page.tsx`

Changed behavior when `currentSectionConfig` is undefined:
- **BEFORE**: Showed "Section Not Found" error page
- **AFTER**: Auto-redirects to first enabled section

---

## TEST PROCEDURE

### Step 1: Clear Cache & Hard Refresh
```bash
# In browser:
# 1. Open DevTools (F12)
# 2. Right-click refresh button
# 3. Select "Empty Cache and Hard Reload"
```

### Step 2: Navigate to Questionnaire
1. Go to: `http://localhost:3000/dashboard/clients`
2. Click on any client
3. Click "Start Questionnaire" button
4. Watch the browser console

### Step 3: Expected Console Output

**SUCCESSFUL LOAD:**
```
[OnboardingLayout] Rendering layout
[Context] useEffect triggered: { isLoaded: false, isLoading: false, shouldFetch: true }
[Context] Triggering fetchConfig...
[Context] FETCH START
[Context] Calling server actions...
[Context] FETCH SUCCESS - Raw data: { sectionsCount: 8, questionsCount: 34, ... }
[Context] TRANSFORM COMPLETE: { sectionsCount: 8, enabledSections: 7, enabledSectionIds: [1,2,3,4,5,6,8] }
[Context] STATE UPDATED - isLoaded should be TRUE now
[QuestionnairePage] Config state: { isLoading: false, isLoaded: true, ... }
[QuestionnairePage] Enabled sections: 7 [...]
[Page] PASSED LOADING CHECK - isLoading: false, isLoaded: true
[QuestionnairePage] Section matching: { currentSection: 1, enabledSectionIds: [1,2,3,4,5,6,8], currentSectionConfig: {...} }
[Page] RENDERING MAIN CONTENT - currentSectionConfig: "Avatar Definition"
```

**IF SECTION MISMATCH (Auto-fixed):**
```
[QuestionnairePage] Section matching: { currentSection: 7, enabledSectionIds: [1,2,3,4,5,6,8], currentSectionConfig: "NOT FOUND" }
[QuestionnairePage] Current section not found, auto-redirecting to first enabled section
[useQuestionnaireForm] Current section not valid in DB config, switching to first enabled section: 1
```

**IF FETCH FAILS:**
```
[Context] FETCH START
[Context] Calling server actions...
[Context] FETCH ERROR: [error details]
[Context] Using static fallback data
```

---

## COMMON ISSUES & SOLUTIONS

### Issue A: Infinite Loading Spinner
**Symptoms**: Page shows "Loading questionnaire..." forever

**Console Shows**:
```
[Context] FETCH START
(no FETCH SUCCESS or FETCH ERROR)
```

**Cause**: Server action failing silently

**Fix**: Check Supabase connection
```bash
# Verify tables exist:
# Run in Supabase SQL editor or psql:
SELECT COUNT(*) FROM questionnaire_sections WHERE enabled = true;
SELECT COUNT(*) FROM questionnaire_questions WHERE enabled = true;

# Should return 7 sections, 34 questions
# If 0, run seed file:
psql <connection_string> < supabase/seed_questionnaire_config.sql
```

---

### Issue B: "Section Not Found" Loop
**Symptoms**: Page keeps showing "Loading section..." or blank page

**Console Shows**:
```
[QuestionnairePage] Section matching: { currentSection: X, currentSectionConfig: "NOT FOUND" }
[QuestionnairePage] Current section not found, auto-redirecting...
(repeats)
```

**Cause**: Section IDs don't match between static and database config

**Fix**: The auto-redirect should handle this, but if it loops:
1. Check localStorage for stale section ID:
   ```javascript
   // In browser console:
   localStorage.removeItem('questionnaire_section_31273051-d436-4ac2-bfb1-57b27d57554e')
   ```
2. Hard refresh

---

### Issue C: Context Re-renders Loop
**Symptoms**: Console floods with "[Context] useEffect triggered"

**Console Shows**:
```
[Context] useEffect triggered: { ... }
[Context] useEffect triggered: { ... }
[Context] useEffect triggered: { ... }
(repeats rapidly)
```

**Cause**: Dependencies in useEffect causing infinite loop

**Fix**: Already implemented - the useEffect only triggers when needed

---

### Issue D: No Sections Enabled
**Symptoms**: Page shows "No Questionnaire Sections Available"

**Console Shows**:
```
[QuestionnairePage] Enabled sections: 0
```

**Cause**: All sections disabled in database

**Fix**: Enable sections in settings or re-seed:
```bash
psql <connection_string> < supabase/seed_questionnaire_config.sql
```

---

## NEXT STEPS IF STILL BROKEN

If the questionnaire still doesn't load after these changes:

1. **Copy the FULL console output** and share it
2. **Take a screenshot** of what the page looks like
3. **Check the Network tab** in DevTools:
   - Look for failed requests (red)
   - Check the Response tab for errors
4. **Check server terminal** for any server-side errors

---

## CLEANUP (After Debugging)

Once the issue is fixed, you can remove the debug logs:

```bash
# Search for console.log statements added for debugging:
grep -r "console.log\('\[Context\]" savant-marketing-studio/lib/questionnaire/
grep -r "console.log\('\[Page\]" savant-marketing-studio/app/dashboard/clients/onboarding/
grep -r "console.log\('\[QuestionnairePage\]" savant-marketing-studio/app/dashboard/clients/onboarding/
```

Or keep them for future debugging - they're helpful!

---

## FILES MODIFIED

1. ✅ `lib/questionnaire/questionnaire-config-context.tsx`
   - Added fetch lifecycle logging
   - Added useEffect trigger logging

2. ✅ `app/dashboard/clients/onboarding/[id]/page.tsx`
   - Added render path logging
   - Added section matching logging
   - Changed "Section Not Found" to auto-redirect
   - Added main content render confirmation

3. ✅ `lib/questionnaire/use-questionnaire-form.ts`
   - Added sync effect to update currentSection when DB config loads

