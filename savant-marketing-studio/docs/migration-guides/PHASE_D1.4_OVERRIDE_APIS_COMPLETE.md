# Phase D1.4 - Override CRUD APIs Complete ✅

## API Routes Created

### File Structure
```
app/api/client-questionnaire/
└── [clientId]/
    ├── route.ts                      # GET - Merged config (global + overrides)
    ├── overrides/
    │   └── route.ts                  # GET - All overrides for client
    └── override/
        ├── route.ts                  # PUT - Create/update override
        └── [overrideId]/
            └── route.ts              # DELETE - Remove override
```

---

## 1. GET /api/client-questionnaire/[clientId]

**Purpose:** Get merged questionnaire config (global + client-specific overrides)

**URL Parameters:**
- `clientId` - UUID of the client

**Response:**
```typescript
{
  data: [
    {
      // Section with potential overrides
      id: number,
      key: string,
      title: string,
      description: string,
      enabled: boolean,
      _hasOverride: boolean,      // TRUE if customized for this client
      _overrideId: string,        // Override ID if customized
      questions: [
        {
          // Question with potential overrides
          id: string,
          text: string,
          type: string,
          enabled: boolean,
          help: {...},
          _hasOverride: boolean,  // TRUE if customized
          _overrideId: string,    // Override ID if customized
          _usingGlobal: boolean   // TRUE if using global config
        }
      ]
    }
  ],
  client: {
    id: string,
    name: string
  },
  overrideCount: number
}
```

**Behavior:**
1. Fetches global questionnaire config (sections, questions, help)
2. Fetches client-specific overrides
3. Merges overrides into global config
4. Applies customizations:
   - Custom text replaces global text
   - Custom help merges with global help
   - is_enabled overrides global enabled flag
5. Filters out disabled sections/questions
6. Groups questions by section
7. Returns merged config ready for form rendering

**Use Cases:**
- Render questionnaire form for specific client
- Show customized questions in client onboarding
- Preview how questionnaire looks for this client

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `404` - Client not found
- `500` - Server error

---

## 2. GET /api/client-questionnaire/[clientId]/overrides

**Purpose:** Get all overrides for a client (for override editor UI)

**URL Parameters:**
- `clientId` - UUID of the client

**Response:**
```typescript
{
  data: [
    {
      id: string,
      client_id: string,
      question_id: string | null,
      section_id: number | null,
      override_type: 'question' | 'section' | 'help',
      is_enabled: boolean,
      custom_text: string | null,
      custom_help: object | null,
      created_at: string,
      updated_at: string
    }
  ],
  questionOverrides: [...],  // Only question overrides
  sectionOverrides: [...],   // Only section overrides
  count: number,
  client: {
    id: string,
    name: string
  }
}
```

**Behavior:**
- Fetches all overrides for the client
- Separates question and section overrides
- Returns organized data for UI rendering

**Use Cases:**
- Display "Customizations" tab in client profile
- Show what's been overridden
- Edit existing overrides
- Show override count badge

**Status Codes:**
- `200` - Success (empty array if no overrides)
- `401` - Unauthorized
- `404` - Client not found
- `500` - Server error

---

## 3. PUT /api/client-questionnaire/[clientId]/override

**Purpose:** Create or update an override for a question or section

**URL Parameters:**
- `clientId` - UUID of the client

**Request Body:**
```typescript
{
  // Option A: Question override
  question_id: string,
  override_type?: 'question',
  is_enabled?: boolean,        // Default: true
  custom_text?: string,
  custom_help?: {
    title?: string,
    quick_tip?: string,
    good_example?: string,
    weak_example?: string
  }
}

// OR

{
  // Option B: Section override
  section_id: number,
  override_type?: 'section',
  is_enabled?: boolean,        // Default: true
  custom_text?: string         // Custom section title
}
```

**Response:**
```typescript
{
  data: {
    id: string,
    client_id: string,
    question_id: string | null,
    section_id: number | null,
    override_type: string,
    is_enabled: boolean,
    custom_text: string | null,
    custom_help: object | null,
    created_at: string,
    updated_at: string
  },
  action: 'created' | 'updated',
  message: string
}
```

**Behavior:**
- Validates input (must have question_id OR section_id, not both)
- Checks if override already exists
- If exists → Updates existing override
- If not exists → Creates new override
- Verifies user owns the client

**Use Cases:**
- Disable a question for specific client
- Customize question text for specific client
- Customize help content for specific client
- Enable/disable sections per client

**Examples:**

### Example 1: Disable a question
```json
{
  "question_id": "q1_ideal_customer",
  "is_enabled": false
}
```

### Example 2: Custom question text
```json
{
  "question_id": "q1_ideal_customer",
  "custom_text": "Who is your primary customer segment?"
}
```

### Example 3: Custom help content
```json
{
  "question_id": "q1_ideal_customer",
  "custom_help": {
    "title": "Custom Help Title",
    "quick_tip": "This client should focus on B2B customers"
  }
}
```

### Example 4: Disable a section
```json
{
  "section_id": 7,
  "is_enabled": false
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad request (validation error)
- `401` - Unauthorized
- `404` - Client not found
- `500` - Server error

---

## 4. DELETE /api/client-questionnaire/[clientId]/override/[overrideId]

**Purpose:** Delete an override (reset to global config)

**URL Parameters:**
- `clientId` - UUID of the client
- `overrideId` - UUID of the override to delete

**Response:**
```typescript
{
  success: true,
  message: 'Override deleted, using global config',
  deleted: {
    id: string,
    question_id: string | null,
    section_id: number | null
  }
}
```

**Behavior:**
- Verifies override exists and belongs to client
- Deletes the override
- Question/section reverts to global config

**Use Cases:**
- Reset question to global text
- Remove customization
- "Use Global" button action
- Undo client-specific changes

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `404` - Override or client not found
- `500` - Server error

---

## Override Pattern Explained

### Global vs Custom
Every question/section can be in one of two states:

**Using Global (Default):**
- No override exists
- Uses config from `questionnaire_questions` table
- `_usingGlobal: true`
- `_hasOverride: false`

**Customized:**
- Override exists in `client_questionnaire_overrides`
- Uses custom values instead of global
- `_usingGlobal: false`
- `_hasOverride: true`
- `_overrideId: "uuid"`

### Override Hierarchy
```
1. Check if client has override
   ↓ YES → Use override values
   ↓ NO  → Use global values
2. Apply is_enabled (can disable globally-enabled items)
3. Merge custom_help with global help (custom takes precedence)
4. Return merged config
```

### Example Merge Logic

**Global Config:**
```json
{
  "id": "q1_ideal_customer",
  "text": "Who is your ideal customer?",
  "enabled": true,
  "help": {
    "title": "Ideal Customer",
    "quick_tip": "Be specific"
  }
}
```

**Client Override:**
```json
{
  "question_id": "q1_ideal_customer",
  "custom_text": "Who is your primary target audience?",
  "custom_help": {
    "quick_tip": "Focus on enterprise customers"
  }
}
```

**Merged Result:**
```json
{
  "id": "q1_ideal_customer",
  "text": "Who is your primary target audience?",  // ← Custom
  "enabled": true,
  "help": {
    "title": "Ideal Customer",  // ← Global (not overridden)
    "quick_tip": "Focus on enterprise customers"  // ← Custom
  },
  "_hasOverride": true,
  "_overrideId": "override-uuid",
  "_usingGlobal": false
}
```

---

## Integration Examples

### Example 1: Load Customized Config for Client
```typescript
const loadClientConfig = async (clientId: string) => {
  const res = await fetch(`/api/client-questionnaire/${clientId}`)
  const { data, overrideCount } = await res.json()
  
  console.log(`Loaded config with ${overrideCount} customizations`)
  return data
}
```

### Example 2: Customize Question Text
```typescript
const customizeQuestion = async (clientId: string, questionId: string) => {
  const res = await fetch(`/api/client-questionnaire/${clientId}/override`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question_id: questionId,
      custom_text: 'Customized question for this client'
    })
  })
  
  const { data, action } = await res.json()
  console.log(`Override ${action}`)
}
```

### Example 3: Disable Question for Client
```typescript
const disableQuestion = async (clientId: string, questionId: string) => {
  await fetch(`/api/client-questionnaire/${clientId}/override`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question_id: questionId,
      is_enabled: false
    })
  })
}
```

### Example 4: Reset to Global (Delete Override)
```typescript
const resetToGlobal = async (clientId: string, overrideId: string) => {
  const res = await fetch(
    `/api/client-questionnaire/${clientId}/override/${overrideId}`,
    { method: 'DELETE' }
  )
  
  const { success, message } = await res.json()
  console.log(message) // "Override deleted, using global config"
}
```

### Example 5: Show Override Badge
```typescript
const QuestionRow = ({ question }) => (
  <div>
    <span>{question.text}</span>
    {question._hasOverride && (
      <Badge variant="secondary">Customized</Badge>
    )}
    {question._usingGlobal && (
      <Badge variant="outline">Global</Badge>
    )}
  </div>
)
```

---

## Security Features

### Authentication
✅ All endpoints require authentication
- Returns 401 if not logged in

### Authorization
✅ All endpoints verify client ownership
- Checks `clients.user_id = auth.uid()`
- Ensures users can only customize their own clients

### Row Level Security
✅ Database RLS policies active
- `client_questionnaire_overrides` has RLS enabled
- Double protection: API + Database level

### Input Validation
✅ Request validation
- Must provide either question_id OR section_id
- Cannot provide both
- Type checking on all fields

---

## UI Components to Build (Next Phase)

### 1. Override Editor Modal
**Location:** Client Profile → Questionnaire Tab
```typescript
<OverrideEditorModal
  clientId={clientId}
  question={question}
  currentOverride={override}
  onSave={handleSave}
  onReset={handleReset}
/>
```

**Features:**
- Toggle: "Use Global" vs "Custom"
- Text input for custom question text
- Rich editor for custom help content
- "Save" and "Reset to Global" buttons

### 2. Override Badge
**Shows customization status:**
```typescript
<OverrideBadge hasOverride={question._hasOverride} />
// Displays: "✓ Customized" or "Using Global"
```

### 3. Customizations List
**Shows all overrides for a client:**
```typescript
<CustomizationsList clientId={clientId} />
// Lists all questions/sections with overrides
// Allows bulk editing/resetting
```

---

## Testing the APIs

### Test 1: Get Merged Config
```bash
curl http://localhost:3000/api/client-questionnaire/YOUR_CLIENT_ID \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

**Expected:** Merged config with `_hasOverride` flags

### Test 2: Create Override (Disable Question)
```bash
curl -X PUT http://localhost:3000/api/client-questionnaire/YOUR_CLIENT_ID/override \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{
    "question_id": "q1_ideal_customer",
    "is_enabled": false
  }'
```

**Expected:** action: 'created', override saved

### Test 3: Update Override (Custom Text)
```bash
curl -X PUT http://localhost:3000/api/client-questionnaire/YOUR_CLIENT_ID/override \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{
    "question_id": "q1_ideal_customer",
    "custom_text": "Who is your target market?"
  }'
```

**Expected:** action: 'updated', override modified

### Test 4: Get All Overrides
```bash
curl http://localhost:3000/api/client-questionnaire/YOUR_CLIENT_ID/overrides \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

**Expected:** List of all overrides with count

### Test 5: Delete Override
```bash
curl -X DELETE http://localhost:3000/api/client-questionnaire/YOUR_CLIENT_ID/override/OVERRIDE_ID \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

**Expected:** success: true, reset to global

### Test 6: Verify Reset
```bash
# After deleting, get config again to verify question is back to global
curl http://localhost:3000/api/client-questionnaire/YOUR_CLIENT_ID \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

**Expected:** Question shows `_hasOverride: false`

---

## Use Case Scenarios

### Scenario 1: Faith-Based vs Secular Clients
**Problem:** Some clients want faith-integrated questions, others don't

**Solution:**
```typescript
// For secular clients, disable faith section
await fetch(`/api/client-questionnaire/${clientId}/override`, {
  method: 'PUT',
  body: JSON.stringify({
    section_id: 7,  // Faith Integration section
    is_enabled: false
  })
})
```

### Scenario 2: Industry-Specific Language
**Problem:** B2B client needs different terminology than B2C

**Solution:**
```typescript
// Customize question text for B2B
await fetch(`/api/client-questionnaire/${clientId}/override`, {
  method: 'PUT',
  body: JSON.stringify({
    question_id: 'q1_ideal_customer',
    custom_text: 'What is your target enterprise segment?'
  })
})
```

### Scenario 3: Client Doesn't Need Certain Questions
**Problem:** Client already provided some information

**Solution:**
```typescript
// Disable questions they've already answered
const questionsToDisable = ['q3_demographics', 'q4_psychographics']
for (const qId of questionsToDisable) {
  await fetch(`/api/client-questionnaire/${clientId}/override`, {
    method: 'PUT',
    body: JSON.stringify({
      question_id: qId,
      is_enabled: false
    })
  })
}
```

### Scenario 4: Simplified Onboarding
**Problem:** New client needs shorter questionnaire

**Solution:**
```typescript
// Create "lite" version with only essential questions
const lite Config = {
  enabledSections: [1, 2, 4],  // Only avatar, dream outcome, solution
  disabledQuestions: ['q13', 'q26', 'q27']  // Optional questions
}

// Apply overrides to create lite version for this client
```

---

## Performance Considerations

### Query Optimization
- Single query for sections
- Single query for questions + help (JOIN)
- Single query for overrides
- Merging done in-memory (fast)

### Caching Strategy (Future)
```typescript
// Cache merged config per client
const cacheKey = `client_config_${clientId}`
const cached = await redis.get(cacheKey)
if (cached) return cached

// Invalidate cache when override changes
await redis.del(`client_config_${clientId}`)
```

### Indexes Used
- `idx_client_overrides_client_id` - Fast client lookup
- `idx_client_overrides_question` - Question override lookup
- `idx_client_overrides_section` - Section override lookup

---

## Error Handling

### Common Errors

**400 Bad Request - Must provide either question_id or section_id**
- Forgot to include target ID
- Solution: Include either question_id or section_id

**400 Bad Request - Cannot provide both**
- Included both question_id and section_id
- Solution: Choose one or the other

**404 Not Found - Client not found**
- Invalid client ID or not owned by user
- Solution: Verify client ID and ownership

**404 Not Found - Override not found**
- Trying to delete non-existent override
- Solution: Check override ID is correct

---

## Next Steps

### Phase D1.5 - UI Components
Build the interface for managing overrides:

1. **Override Editor Modal**
   - Toggle global/custom
   - Edit custom text
   - Edit custom help
   - Save/reset buttons

2. **Customizations Tab**
   - List all overrides
   - Quick edit/delete
   - Bulk actions

3. **Question Card Enhancement**
   - Show "Customized" badge
   - Inline edit button
   - Quick toggle enabled/disabled

4. **Client Onboarding Integration**
   - Load merged config instead of global
   - Render customized questionnaire
   - Show customization indicators

---

## Files Created

✅ **API Routes (4 files):**
- `app/api/client-questionnaire/[clientId]/route.ts`
- `app/api/client-questionnaire/[clientId]/overrides/route.ts`
- `app/api/client-questionnaire/[clientId]/override/route.ts`
- `app/api/client-questionnaire/[clientId]/override/[overrideId]/route.ts`

✅ **Documentation:**
- `PHASE_D1.4_OVERRIDE_APIS_COMPLETE.md` (this file)

---

**Phase D1.4 Status:** ✅ COMPLETE  
**Ready for:** Phase D1.5 (UI Components)  
**Date:** December 28, 2025

