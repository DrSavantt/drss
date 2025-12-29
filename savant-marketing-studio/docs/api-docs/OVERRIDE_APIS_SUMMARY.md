# Client Questionnaire Override APIs - Quick Summary

## ✅ Phase D1.4 Complete!

### 4 API Routes Created

```
GET    /api/client-questionnaire/[clientId]                    → Merged config
GET    /api/client-questionnaire/[clientId]/overrides          → All overrides
PUT    /api/client-questionnaire/[clientId]/override           → Create/update
DELETE /api/client-questionnaire/[clientId]/override/[id]      → Delete
```

---

## What This Enables

### Per-Client Customization ✅
- Disable questions for specific clients
- Custom question text per client
- Custom help content per client
- Enable/disable sections per client

### Override Pattern ✅
- **Using Global** - No customization, uses default config
- **Customized** - Client-specific values override global

### Merge Logic ✅
1. Load global config (sections, questions, help)
2. Load client overrides
3. Merge overrides into global
4. Return customized config

---

## Quick Test

### 1. Update Test Script
```bash
# Edit TEST_OVERRIDE_APIS.sh
# Change: CLIENT_ID="YOUR_CLIENT_ID_HERE"
# To: CLIENT_ID="actual-uuid-from-database"
```

### 2. Run Tests
```bash
cd /Users/rocky/DRSS/savant-marketing-studio
./TEST_OVERRIDE_APIS.sh
```

---

## Usage Examples

### Get Customized Config
```typescript
const res = await fetch(`/api/client-questionnaire/${clientId}`)
const { data, overrideCount } = await res.json()
// data contains merged config with client customizations
```

### Disable Question for Client
```typescript
await fetch(`/api/client-questionnaire/${clientId}/override`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question_id: 'q1_ideal_customer',
    is_enabled: false
  })
})
```

### Custom Question Text
```typescript
await fetch(`/api/client-questionnaire/${clientId}/override`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question_id: 'q1_ideal_customer',
    custom_text: 'Who is your target enterprise segment?'
  })
})
```

### Reset to Global
```typescript
await fetch(
  `/api/client-questionnaire/${clientId}/override/${overrideId}`,
  { method: 'DELETE' }
)
```

---

## Use Cases

### 1. Faith-Based vs Secular
Disable faith section for secular clients:
```json
{
  "section_id": 7,
  "is_enabled": false
}
```

### 2. Industry-Specific Language
B2B vs B2C terminology:
```json
{
  "question_id": "q1_ideal_customer",
  "custom_text": "What is your target enterprise segment?"
}
```

### 3. Simplified Onboarding
Disable optional questions:
```json
{
  "question_id": "q13_philosophical_problems",
  "is_enabled": false
}
```

---

## Response Format

### Merged Config Response
```typescript
{
  data: [
    {
      id: 1,
      title: "Avatar Definition",
      questions: [
        {
          id: "q1_ideal_customer",
          text: "Custom question text",  // ← Overridden
          _hasOverride: true,
          _overrideId: "uuid",
          _usingGlobal: false
        }
      ]
    }
  ],
  overrideCount: 3
}
```

### Override Response
```typescript
{
  data: {
    id: "uuid",
    client_id: "uuid",
    question_id: "q1_ideal_customer",
    custom_text: "Custom text",
    is_enabled: true
  },
  action: "created" | "updated"
}
```

---

## Security

✅ **Authentication** - All endpoints require login  
✅ **Authorization** - Users can only customize their clients  
✅ **RLS** - Database-level security enforced  
✅ **Validation** - Input checked (question_id XOR section_id)  

---

## Files Created

✅ API Routes:
- `app/api/client-questionnaire/[clientId]/route.ts`
- `app/api/client-questionnaire/[clientId]/overrides/route.ts`
- `app/api/client-questionnaire/[clientId]/override/route.ts`
- `app/api/client-questionnaire/[clientId]/override/[overrideId]/route.ts`

✅ Documentation:
- `PHASE_D1.4_OVERRIDE_APIS_COMPLETE.md` - Full documentation
- `OVERRIDE_APIS_SUMMARY.md` - This quick reference
- `TEST_OVERRIDE_APIS.sh` - Automated test script

---

## Next Steps

### Phase D1.5 - UI Components

**Components to Build:**
1. **Override Editor Modal** - Edit question customizations
2. **Customizations Tab** - List all overrides for client
3. **Override Badge** - Show "Customized" vs "Global" status
4. **Quick Toggle** - Enable/disable questions inline

**Integration:**
- Update questionnaire form to load merged config
- Add "Customize" button to questions
- Add "Customizations" tab to client profile

---

**Status:** ✅ Phase D1.4 Complete  
**Next:** Phase D1.5 (UI Components)  
**Date:** December 28, 2025

