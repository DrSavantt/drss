# Phase D1.3 - Response CRUD APIs Complete ✅

## API Routes Created

### File Structure
```
app/api/questionnaire-response/
├── route.ts                          # POST - Save/update draft
└── [clientId]/
    ├── route.ts                      # GET - All versions
    ├── latest/
    │   └── route.ts                  # GET - Latest response
    └── submit/
        └── route.ts                  # PUT - Finalize submission
```

---

## 1. POST /api/questionnaire-response

**Purpose:** Create or update a draft response (auto-save functionality)

**Request Body:**
```typescript
{
  client_id: string,          // UUID of the client
  response_data: object       // JSONB data (questionnaire sections)
}
```

**Response:**
```typescript
{
  data: {
    id: string,
    client_id: string,
    user_id: string,
    version: number,
    response_data: object,
    status: 'draft',
    is_latest: true,
    created_at: string,
    updated_at: string
  },
  action: 'created' | 'updated'
}
```

**Behavior:**
- If draft exists → Updates existing draft
- If no draft → Creates new draft with next version number
- Uses `get_next_response_version()` RPC function
- Verifies user owns the client (RLS + explicit check)
- Only one draft per client (is_latest = true)

**Status Codes:**
- `200` - Success
- `400` - Missing client_id or response_data
- `401` - Unauthorized (not logged in)
- `404` - Client not found or unauthorized
- `500` - Server error

---

## 2. GET /api/questionnaire-response/[clientId]

**Purpose:** Get all response versions for a client (history)

**URL Parameters:**
- `clientId` - UUID of the client

**Response:**
```typescript
{
  data: [
    {
      id: string,
      client_id: string,
      user_id: string,
      version: number,
      response_data: object,
      status: 'draft' | 'submitted',
      is_latest: boolean,
      submitted_at: string | null,
      submitted_by: 'client' | 'admin' | null,
      created_at: string,
      updated_at: string
    },
    // ... more versions
  ],
  count: number
}
```

**Behavior:**
- Returns all versions ordered by version DESC (newest first)
- Verifies user owns the client
- Includes both drafts and submitted responses
- Empty array if no responses exist

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `404` - Client not found
- `500` - Server error

---

## 3. GET /api/questionnaire-response/[clientId]/latest

**Purpose:** Get the latest response (either draft or submitted)

**URL Parameters:**
- `clientId` - UUID of the client

**Response:**
```typescript
{
  data: {
    id: string,
    client_id: string,
    user_id: string,
    version: number,
    response_data: object,
    status: 'draft' | 'submitted',
    is_latest: true,
    submitted_at: string | null,
    submitted_by: 'client' | 'admin' | null,
    created_at: string,
    updated_at: string
  } | null,
  has_response: boolean
}
```

**Behavior:**
- Returns only the response where `is_latest = true`
- Returns `null` if no responses exist
- Uses optimized partial index for fast queries
- Verifies user owns the client

**Status Codes:**
- `200` - Success (even if no response found)
- `401` - Unauthorized
- `404` - Client not found
- `500` - Server error

---

## 4. PUT /api/questionnaire-response/[clientId]/submit

**Purpose:** Finalize a draft as submitted

**URL Parameters:**
- `clientId` - UUID of the client

**Request Body:**
```typescript
{
  submitted_by?: 'admin' | 'client'  // Default: 'admin'
}
```

**Response:**
```typescript
{
  data: {
    id: string,
    client_id: string,
    user_id: string,
    version: number,
    response_data: object,
    status: 'submitted',
    is_latest: true,
    submitted_at: string,
    submitted_by: 'client' | 'admin',
    created_at: string,
    updated_at: string
  },
  message: 'Questionnaire submitted successfully'
}
```

**Behavior:**
1. Finds current draft (status='draft', is_latest=true)
2. Updates status to 'submitted'
3. Sets submitted_at and submitted_by
4. Updates client's questionnaire_status to 'completed'
5. Syncs to `clients.intake_responses` for backward compatibility
6. Only one submission per client at a time (is_latest flag)

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `404` - Client not found OR no draft to submit
- `500` - Server error

---

## Security Features

### Authentication
✅ All endpoints require authentication via `supabase.auth.getUser()`
- Returns 401 if not logged in

### Authorization
✅ All endpoints verify user owns the client
- Explicit check: `clients.user_id = auth.uid()`
- RLS policies enforce at database level (defense in depth)

### Row Level Security
✅ Database RLS policies active on `questionnaire_responses`
- Users can only access responses for their clients
- Double protection: API + Database level

---

## Integration Examples

### Example 1: Auto-Save (Every 30 seconds)
```typescript
// In your form component
useEffect(() => {
  const interval = setInterval(async () => {
    if (hasUnsavedChanges) {
      await fetch('/api/questionnaire-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          response_data: formData
        })
      })
    }
  }, 30000) // 30 seconds

  return () => clearInterval(interval)
}, [formData, clientId, hasUnsavedChanges])
```

### Example 2: Load Latest Response
```typescript
// On component mount
const loadLatestResponse = async () => {
  const res = await fetch(`/api/questionnaire-response/${clientId}/latest`)
  const { data } = await res.json()
  
  if (data && data.response_data) {
    setFormData(data.response_data)
    setIsDraft(data.status === 'draft')
  }
}
```

### Example 3: Submit Questionnaire
```typescript
const handleSubmit = async () => {
  const res = await fetch(`/api/questionnaire-response/${clientId}/submit`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      submitted_by: 'admin' // or 'client'
    })
  })
  
  if (res.ok) {
    router.push(`/dashboard/clients/${clientId}`)
  }
}
```

### Example 4: View History
```typescript
const loadHistory = async () => {
  const res = await fetch(`/api/questionnaire-response/${clientId}`)
  const { data, count } = await res.json()
  
  setVersions(data)
  console.log(`Found ${count} versions`)
}
```

---

## Testing the APIs

### Prerequisites
1. Have a valid client ID
2. Be logged in to the application
3. Server running on localhost:3000 (or your dev URL)

### Test 1: Create Draft (POST)
```bash
curl -X POST http://localhost:3000/api/questionnaire-response \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{
    "client_id": "YOUR_CLIENT_ID",
    "response_data": {
      "avatar_definition": {
        "q1_ideal_customer": "Test customer"
      }
    }
  }'
```

**Expected Response:** Status 200 with action: 'created'

### Test 2: Update Draft (POST again)
```bash
# Same curl as above but with updated data
curl -X POST http://localhost:3000/api/questionnaire-response \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{
    "client_id": "YOUR_CLIENT_ID",
    "response_data": {
      "avatar_definition": {
        "q1_ideal_customer": "Updated customer"
      }
    }
  }'
```

**Expected Response:** Status 200 with action: 'updated'

### Test 3: Get Latest (GET)
```bash
curl http://localhost:3000/api/questionnaire-response/YOUR_CLIENT_ID/latest \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

**Expected Response:** Status 200 with data object (draft)

### Test 4: Submit (PUT)
```bash
curl -X PUT http://localhost:3000/api/questionnaire-response/YOUR_CLIENT_ID/submit \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{"submitted_by": "admin"}'
```

**Expected Response:** Status 200 with status: 'submitted'

### Test 5: Get History (GET)
```bash
curl http://localhost:3000/api/questionnaire-response/YOUR_CLIENT_ID \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

**Expected Response:** Status 200 with array of versions

---

## Error Handling

### Common Errors

**401 Unauthorized**
- Cause: Not logged in
- Solution: Ensure user is authenticated

**404 Not Found**
- Cause: Client doesn't exist or user doesn't own it
- Solution: Verify client ID and ownership

**400 Bad Request**
- Cause: Missing required fields
- Solution: Check request body includes all required fields

**500 Server Error**
- Cause: Database error or unexpected issue
- Solution: Check server logs for details

### Error Response Format
```typescript
{
  error: string,           // Human-readable error message
  details?: string         // Technical details (in dev mode)
}
```

---

## Backward Compatibility

### clients.intake_responses Field
✅ **Still Supported** - Not breaking existing code

**What happens on submit:**
1. New data saved to `questionnaire_responses` table (versioned)
2. Latest response ALSO synced to `clients.intake_responses` (legacy field)
3. Existing code reading from `intake_responses` continues to work

**Migration Strategy:**
- New features use `questionnaire_responses` table
- Old features continue using `clients.intake_responses`
- Gradually migrate components to use new APIs

---

## Performance Considerations

### Indexes Used
All endpoints leverage optimized indexes:
- `idx_questionnaire_responses_client_id` - Client lookups
- `idx_questionnaire_responses_latest` - Latest response queries (partial index)
- `idx_questionnaire_responses_client_version` - Version ordering

### Query Optimization
- Latest response uses partial index WHERE is_latest = true
- History ordered by version DESC (uses index)
- RLS policies use indexed client_id lookups

---

## Next Steps

### Phase D1.4 - UI Components
Now that APIs are ready, build:
1. **Auto-Save Hook** - `useAutoSave()` hook for forms
2. **Response History Viewer** - Component to show all versions
3. **Version Comparison** - Side-by-side diff view
4. **Draft Indicator** - Show "Draft saved at..." status

### Integration Points
These APIs will be used by:
- `components/questionnaire/public-questionnaire-form.tsx` - Auto-save
- `app/dashboard/clients/[id]/questionnaire-responses/page.tsx` - History viewer
- New comparison component
- Form auto-save hook

---

## Files Created

✅ **API Routes (4 files):**
- `app/api/questionnaire-response/route.ts`
- `app/api/questionnaire-response/[clientId]/route.ts`
- `app/api/questionnaire-response/[clientId]/latest/route.ts`
- `app/api/questionnaire-response/[clientId]/submit/route.ts`

✅ **Documentation:**
- `PHASE_D1.3_API_ROUTES_COMPLETE.md` (this file)

---

**Phase D1.3 Status:** ✅ COMPLETE
**Ready for:** Phase D1.4 (UI Components)
**Date:** December 28, 2025

