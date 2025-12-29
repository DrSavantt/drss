# FIX BROKEN LINKS - IMMEDIATE ACTION CHECKLIST

**Priority:** 🔥 **URGENT** - These links will cause 404 errors  
**Time:** 15 minutes  
**Date:** December 28, 2025

---

## WHAT HAPPENED

✅ **DELETED:** `app/dashboard/clients/onboarding/[id]/page.tsx`

⚠️ **PROBLEM:** 5 files still link to the deleted route

---

## QUICK FIX - OPTION 1: Update Links to Client Profile

Change all references from:
```typescript
/dashboard/clients/onboarding/${clientId}
```

To:
```typescript
/dashboard/clients/${clientId}#questionnaire
```

This will navigate to the client profile page, where the questionnaire tab exists.

---

## QUICK FIX - OPTION 2: Create New Route

Create: `app/dashboard/clients/[id]/questionnaire/page.tsx`

Then update links to:
```typescript
/dashboard/clients/${clientId}/questionnaire
```

---

## FILES TO UPDATE (5 total)

### ✏️ File 1: `app/dashboard/clients/[id]/questionnaire-responses/reset-button.tsx`

**Line 40:**
```typescript
// BEFORE:
router.push(`/dashboard/clients/onboarding/${clientId}`);

// AFTER (Option 1):
router.push(`/dashboard/clients/${clientId}#questionnaire`);

// OR (Option 2):
router.push(`/dashboard/clients/${clientId}/questionnaire`);
```

---

### ✏️ File 2: `app/dashboard/clients/[id]/questionnaire-responses/page.tsx`

**Line 233:**
```typescript
// BEFORE:
href={`/dashboard/clients/onboarding/${client.id}?mode=edit`}

// AFTER (Option 1):
href={`/dashboard/clients/${client.id}?tab=questionnaire&mode=edit`}

// OR (Option 2):
href={`/dashboard/clients/${client.id}/questionnaire?mode=edit`}
```

---

### ✏️ File 3: `components/clients/questionnaire-status-card.tsx`

**Line 115:**
```typescript
// BEFORE:
<Link href={`/dashboard/clients/onboarding/${clientId}`}>

// AFTER (Option 1):
<Link href={`/dashboard/clients/${clientId}#questionnaire`}>

// OR (Option 2):
<Link href={`/dashboard/clients/${clientId}/questionnaire`}>
```

---

### ✏️ File 4: `components/clients/client-questionnaire.tsx`

**Line 117:**
```typescript
// BEFORE:
router.push(`/dashboard/clients/onboarding/${clientId}`)

// AFTER (Option 1):
router.push(`/dashboard/clients/${clientId}#questionnaire`)

// OR (Option 2):
router.push(`/dashboard/clients/${clientId}/questionnaire`)
```

**Line 122:**
```typescript
// BEFORE:
router.push(`/dashboard/clients/onboarding/${clientId}?mode=edit`)

// AFTER (Option 1):
router.push(`/dashboard/clients/${clientId}?tab=questionnaire&mode=edit`)

// OR (Option 2):
router.push(`/dashboard/clients/${clientId}/questionnaire?mode=edit`)
```

---

## RECOMMENDED APPROACH

### Step 1: Create New Route (5 min)

Create: `app/dashboard/clients/[id]/questionnaire/page.tsx`

```typescript
import { ClientQuestionnaire } from '@/components/clients/client-questionnaire'
import { getClient } from '@/app/actions/clients'
import { notFound } from 'next/navigation'

export default async function ClientQuestionnairePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const client = await getClient(id)
  
  if (!client) {
    return notFound()
  }

  return (
    <div className="p-6">
      <ClientQuestionnaire
        clientId={client.id}
        clientName={client.name}
        questionnaireStatus={client.questionnaire_status}
        questionnaireCompletedAt={client.questionnaire_completed_at}
        questionnaireToken={client.questionnaire_token}
      />
    </div>
  )
}
```

### Step 2: Update All 5 Files (10 min)

Use **Option 2** (new route) for all files:

1. ✏️ `reset-button.tsx` line 40 → `/dashboard/clients/${clientId}/questionnaire`
2. ✏️ `page.tsx` line 233 → `/dashboard/clients/${client.id}/questionnaire?mode=edit`
3. ✏️ `questionnaire-status-card.tsx` line 115 → `/dashboard/clients/${clientId}/questionnaire`
4. ✏️ `client-questionnaire.tsx` line 117 → `/dashboard/clients/${clientId}/questionnaire`
5. ✏️ `client-questionnaire.tsx` line 122 → `/dashboard/clients/${clientId}/questionnaire?mode=edit`

### Step 3: Test (5 min)

- ✅ Click "Start Questionnaire" from client profile
- ✅ Click "Edit Responses" from responses page
- ✅ Click "Reset" button from responses page
- ✅ Verify all navigate to new route

---

## SEARCH & REPLACE COMMANDS

```bash
cd /Users/rocky/DRSS/savant-marketing-studio

# Update reset-button.tsx
sed -i '' 's|/dashboard/clients/onboarding/|/dashboard/clients/|g' app/dashboard/clients/[id]/questionnaire-responses/reset-button.tsx
sed -i '' 's|/dashboard/clients/\${clientId}|/dashboard/clients/\${clientId}/questionnaire|g' app/dashboard/clients/[id]/questionnaire-responses/reset-button.tsx

# Update page.tsx
sed -i '' 's|/dashboard/clients/onboarding/|/dashboard/clients/|g' app/dashboard/clients/[id]/questionnaire-responses/page.tsx
sed -i '' 's|/dashboard/clients/\${client.id}|/dashboard/clients/\${client.id}/questionnaire|g' app/dashboard/clients/[id]/questionnaire-responses/page.tsx

# Update questionnaire-status-card.tsx
sed -i '' 's|/dashboard/clients/onboarding/|/dashboard/clients/|g' components/clients/questionnaire-status-card.tsx
sed -i '' 's|/dashboard/clients/\${clientId}|/dashboard/clients/\${clientId}/questionnaire|g' components/clients/questionnaire-status-card.tsx

# Update client-questionnaire.tsx
sed -i '' 's|/dashboard/clients/onboarding/|/dashboard/clients/|g' components/clients/client-questionnaire.tsx
sed -i '' 's|/dashboard/clients/\${clientId}|/dashboard/clients/\${clientId}/questionnaire|g' components/clients/client-questionnaire.tsx
```

**⚠️ WARNING:** Test these commands on a backup first! The sed syntax might need adjustment.

---

## VERIFICATION

After making changes, search for any remaining references:

```bash
cd /Users/rocky/DRSS/savant-marketing-studio
grep -rn "/dashboard/clients/onboarding" --include="*.tsx" --include="*.ts" app/ components/
```

Should return: **0 results** (or only comments/revalidatePath calls)

---

## CHECKLIST

- [ ] Create new route: `app/dashboard/clients/[id]/questionnaire/page.tsx`
- [ ] Update `reset-button.tsx` line 40
- [ ] Update `page.tsx` line 233
- [ ] Update `questionnaire-status-card.tsx` line 115
- [ ] Update `client-questionnaire.tsx` line 117
- [ ] Update `client-questionnaire.tsx` line 122
- [ ] Test all navigation paths
- [ ] Verify no broken links remain

---

**Status:** ⚠️ **PENDING** - Links are currently broken!

**Next:** Fix these 5 files, then proceed with the 3-phase refactor plan in `DELETE_OLD_FORM_AUDIT_REPORT.md`

