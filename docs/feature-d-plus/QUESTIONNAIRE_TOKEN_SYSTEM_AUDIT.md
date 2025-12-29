# QUESTIONNAIRE SYSTEM AUDIT - Token & Response Storage

**Date:** December 28, 2025  
**Status:** ✅ Token system working correctly | ⚠️ Response storage needs integration

---

## Executive Summary

**GOOD NEWS:** The "Copy Questionnaire Link" buttons are already correctly implemented and using the token-based system. The internal form saves to the new `questionnaire_responses` table with version history.

**THE ACTUAL PROBLEM:** The public form (accessed via `/form/[token]`) saves to the OLD system (`clients.intake_responses`) instead of the NEW response storage system (`questionnaire_responses` table).

---

## Token System Audit

### ✅ Token Infrastructure

| Component | Status | Details |
|-----------|--------|---------|
| Database Column | ✅ Working | `clients.questionnaire_token` (TEXT, UNIQUE) |
| Token Generation | ✅ Working | Generated on client creation via `crypto.randomUUID()` |
| Token Index | ✅ Working | `idx_clients_questionnaire_token` for fast lookup |
| Public Access Policy | ✅ Working | RLS policy allows public reads by token |

**Migration:** `20251214000001_add_questionnaire_token.sql`

### ✅ Link Copy Buttons - All Using Token Correctly

#### 1. Overview Tab - QuestionnaireStatusCard Component
- **File:** `components/clients/questionnaire-status-card.tsx`
- **Line 54:** `${window.location.origin}/form/${questionnaireToken}`
- **Status:** ✅ **CORRECT** - Uses token, not clientId

#### 2. Questionnaire Tab - ClientQuestionnaire Component  
- **File:** `components/clients/client-questionnaire.tsx`
- **Line 99:** `${window.location.origin}/form/${questionnaireToken}`
- **Status:** ✅ **CORRECT** - Uses token, not clientId

#### 3. Data Flow - ClientDetail Component
- **File:** `components/clients/client-detail.tsx`
- **Lines 214, 471:** Correctly passes `questionnaireToken={client.questionnaire_token}`
- **Status:** ✅ **CORRECT** - Token properly passed to child components

### ✅ Public Form Route

- **Route:** `/form/[token]` (NOT `/questionnaire/[token]`)
- **File:** `app/form/[token]/page.tsx`
- **Function:** Looks up client by `questionnaire_token`, renders `PublicQuestionnaireForm`
- **Status:** ✅ Route works correctly

---

## Response Storage Audit

### ✅ Internal Form - USING NEW SYSTEM

**Route:** `/dashboard/clients/onboarding/[id]`  
**Component:** `app/dashboard/clients/onboarding/[id]/page.tsx`

#### Auto-Save Flow (NEW System)
1. **Hook:** `useQuestionnaireForm` → `lib/questionnaire/use-questionnaire-form.ts`
2. **API:** `POST /api/questionnaire-response`
   - Creates/updates record in `questionnaire_responses` table
   - Status: `draft`
   - Auto-saves every 5 seconds (debounced)
3. **Storage:** ✅ **NEW TABLE** (`questionnaire_responses`)

#### Submit Flow (NEW System + Backward Compatibility)
1. **API:** `PUT /api/questionnaire-response/[clientId]/submit`
   - Updates `questionnaire_responses` record: `status: 'submitted'`
   - ALSO syncs to `clients.intake_responses` (for backward compatibility)
   - Updates `clients.questionnaire_status = 'completed'`
2. **Result:** 
   - ✅ Stored in NEW system with version history
   - ✅ Backward compatible with OLD system

---

### ❌ Public Form - USING OLD SYSTEM

**Route:** `/form/[token]`  
**Component:** `components/questionnaire/public-questionnaire-form.tsx`

#### Current Flow (OLD System)
1. **Action:** `submitPublicQuestionnaire` → `app/actions/questionnaire.ts:390`
2. **Storage:** ❌ **ONLY saves to `clients.intake_responses`** (OLD system)
3. **No Integration:**
   - Does NOT use `questionnaire_responses` table
   - Does NOT create version history
   - Does NOT appear in ResponseHistory component

**Code Location:**
```typescript:386:466:app/actions/questionnaire.ts
export async function submitPublicQuestionnaire(
  token: string,
  data: QuestionnaireData
): Promise<{ success: boolean; error?: string }> {
  // ... validates token ...
  
  // ❌ PROBLEM: Only saves to OLD system
  const { error } = await supabase
    .from('clients')
    .update({
      intake_responses: intakeResponses,  // OLD system
      questionnaire_status: 'completed',
      questionnaire_completed_at: new Date().toISOString(),
    })
    .eq('id', client.id);
    
  // ❌ Does NOT create questionnaire_responses record
  return { success: true };
}
```

---

## The Gap: Public Form Not Integrated

### Current Behavior

| Entry Point | Storage Location | Version History | Auto-Save |
|-------------|------------------|-----------------|-----------|
| **Internal Form** (`/dashboard/clients/onboarding/[id]`) | ✅ `questionnaire_responses` | ✅ Yes | ✅ Yes |
| **Public Form** (`/form/[token]`) | ❌ `clients.intake_responses` only | ❌ No | ⚠️ LocalStorage only |

### Impact

When a client fills out the public form:
- ✅ Their response is saved to `clients.intake_responses`
- ❌ Their response does NOT appear in the Questionnaire tab's ResponseHistory
- ❌ No version tracking for public submissions
- ❌ If they resubmit, it overwrites (no history)

---

## Files That Need Updates

### 1. **CRITICAL:** Update Public Form Submit Action

**File:** `app/actions/questionnaire.ts`  
**Function:** `submitPublicQuestionnaire` (line 390)

**Change:** Instead of only saving to `clients.intake_responses`, also save to `questionnaire_responses` table:

```typescript
// After validating token and getting client...

// 1. Create/update response in NEW system
const { data: existingDraft } = await supabase
  .from('questionnaire_responses')
  .select('id, version')
  .eq('client_id', client.id)
  .eq('status', 'draft')
  .eq('is_latest', true)
  .single()

if (existingDraft) {
  // Mark old draft as submitted
  await supabase
    .from('questionnaire_responses')
    .update({
      response_data: intakeResponses.sections,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      submitted_by: 'client',
      updated_at: new Date().toISOString()
    })
    .eq('id', existingDraft.id)
} else {
  // Create new submitted response
  const { data: versionData } = await supabase
    .rpc('get_next_response_version', { p_client_id: client.id })
  
  await supabase
    .from('questionnaire_responses')
    .insert({
      client_id: client.id,
      user_id: client.user_id,
      version: versionData || 1,
      response_data: intakeResponses.sections,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      submitted_by: 'client',
      is_latest: true
    })
}

// 2. ALSO update OLD system for backward compatibility
await supabase
  .from('clients')
  .update({
    intake_responses: intakeResponses,
    questionnaire_status: 'completed',
    questionnaire_completed_at: new Date().toISOString(),
  })
  .eq('id', client.id);
```

---

### 2. **OPTIONAL:** Add Auto-Save for Public Form

**File:** `components/questionnaire/public-questionnaire-form.tsx`

Currently only saves to localStorage. Could add server auto-save using the same API endpoint:

```typescript
// Add auto-save to server (similar to internal form)
const saveToServer = async (data: QuestionnaireData) => {
  try {
    const response = await fetch(`/api/questionnaire-response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: client.id,
        response_data: data,
        submitted_by: 'client'
      })
    })
    // Handle response...
  } catch (error) {
    console.error('Auto-save failed:', error)
  }
}
```

**Issue:** Public form doesn't have authentication, so the existing API won't work (requires `user.id`).

**Solution Options:**
1. Create a separate public auto-save endpoint that uses token authentication
2. Keep localStorage-only for public forms (acceptable)

---

### 3. **ENHANCEMENT:** Update Progress Save

**File:** `app/actions/questionnaire.ts`  
**Function:** `savePublicQuestionnaireProgress` (line 467)

Similar to submit, this should save to `questionnaire_responses` as draft status.

---

## Verification Checklist

### Token System
- [x] `questionnaire_token` field exists on clients table
- [x] Token is generated when client is created
- [x] Public form route exists at `/form/[token]`
- [x] Token lookup works correctly
- [x] RLS policy allows public access by token

### Link Buttons  
- [x] Overview page "Copy Link" → Uses token ✅
- [x] Questionnaire tab "Copy Link" → Uses token ✅
- [x] Both buttons copy the SAME URL format ✅
- [x] All buttons use `/form/[token]` format ✅

### Response Storage
- [x] Internal form saves to `questionnaire_responses` table
- [ ] **Public form saves to `questionnaire_responses` table** ← MISSING
- [x] Internal form also syncs to `clients.intake_responses` (backward compatibility)
- [x] Version history shows internal form responses

### Integration
- [x] Auto-save working for internal form
- [x] Auto-save working for public form (localStorage only)
- [ ] **Public form responses appear in ResponseHistory component** ← MISSING
- [ ] **Public form creates version records** ← MISSING

---

## Recommended Fix Priority

### Priority 1: MUST FIX
✅ **Token system** - Already working correctly, no changes needed

### Priority 2: SHOULD FIX  
🔧 **Public form submit action** - Update to save to `questionnaire_responses` table
- This ensures all responses (internal + public) are tracked with version history
- Maintains backward compatibility by also updating `clients.intake_responses`

### Priority 3: NICE TO HAVE
💡 **Public form auto-save to server** - Would require new token-based API endpoint
- Currently relies on localStorage (acceptable for now)
- Low priority since public forms are typically one-time submissions

---

## Summary

### What's Working ✅
1. Token generation and storage
2. All "Copy Link" buttons use token correctly
3. Public form route resolves token correctly
4. Internal form uses new response storage system
5. Backward compatibility maintained

### What Needs Fixing 🔧
1. **Public form submit action** → Must save to `questionnaire_responses` table
2. **Response integration** → Public responses should appear in ResponseHistory

### False Alarm ✅
- ClientQuestionnaire component is already correct
- No changes needed to link copying functionality
- Token system is working as designed

---

## Next Steps

1. Update `submitPublicQuestionnaire` function to use new response storage
2. Test public form submission creates `questionnaire_responses` record
3. Verify public responses appear in Questionnaire tab's ResponseHistory
4. Confirm both internal and public responses show correct version history

