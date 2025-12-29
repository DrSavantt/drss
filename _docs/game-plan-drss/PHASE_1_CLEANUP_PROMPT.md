# PHASE 1: PRODUCTION CLEANUP - CURSOR PROMPT

🎯 **MODEL RECOMMENDATION:** Cheap (Claude Haiku or GPT-3.5)
This is a find-and-replace task, doesn't need expensive model.

---

## [COPY THIS INTO CURSOR]

```
TASK: Production cleanup - Remove all console.logs and test routes

CONTEXT:
The audit identified 51+ console.log statements and test routes that must be removed before production.

REQUIREMENTS:

## 1. Remove ALL Console.Logs

Scan these files and remove ALL console.log, console.warn, console.error statements:

**Priority files (42 logs):**
- lib/questionnaire/use-questionnaire-form.ts
- components/questionnaire/navigation/rich-footer.tsx
- app/actions/journal.ts
- app/dashboard/content/[id]/file-preview-client.tsx

**Then scan ENTIRE codebase:**
- All files in app/
- All files in components/
- All files in lib/

**Rules:**
- Remove the entire console.log line
- Don't leave empty lines
- Keep the actual logic, just remove logging
- If console.log is the only line in a function, leave a comment: `// Logging removed`

**Example:**
```typescript
// BEFORE
const handleSubmit = async () => {
  console.log('Submitting form...');
  console.log('Data:', formData);
  const result = await submitForm(formData);
  console.log('Result:', result);
  return result;
};

// AFTER
const handleSubmit = async () => {
  const result = await submitForm(formData);
  return result;
};
```

## 2. Delete Test Routes

Remove these files completely:
- app/dashboard/test-metrics/page.tsx
- app/test-questions/page.tsx

Also check for any imports of these files and remove those imports.

## 3. Remove Debug Comments

Remove any comments like:
- // TODO: Remove this before production
- // DEBUG:
- // TESTING:
- // TEMP:

Keep legitimate TODO comments that describe actual features to build.

## 4. Verification

After cleanup, run:
```bash
# Search for any remaining console statements
grep -r "console\." app/ components/ lib/

# Should return zero results
```

OUTPUT:
Report how many console.logs were removed from each file.
List any files where you found patterns that need manual review.
Confirm test routes are deleted.
```

## [END CURSOR PROMPT]

---

📋 **AFTER CURSOR COMPLETES:**

1. **Verify:** Run `grep -r "console\." app/ components/ lib/` 
2. **Expected:** No results
3. **Commit:** `chore: remove all console.logs and test routes for production`
4. **Test:** Open each page, check browser console - should be silent

---

⚠️ **CRITICAL:** Don't move to Phase 1.2 until console is 100% clean.
