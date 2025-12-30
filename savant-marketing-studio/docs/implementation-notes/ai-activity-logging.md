# AI Activity Logging

## Overview
AI generations are now automatically logged to the activity log system, making them visible in recent activity feeds across the dashboard.

## Implementation

### 1. Activity Log Types Updated

**`lib/activity-log.ts`**

Added new activity types:
```typescript
export type ActivityType = 
  // ... existing types ...
  | 'ai_generation';  // NEW

export type EntityType = 
  // ... existing types ...
  | 'ai_execution';  // NEW
```

### 2. Orchestrator Integration

**`lib/ai/orchestrator.ts`**

After each successful AI execution, the orchestrator now:

1. **Logs execution to database** with `.select('id').single()` to get the execution ID
2. **Logs activity** with detailed metadata:

```typescript
await logActivity({
  activityType: 'ai_generation',
  entityType: 'ai_execution',
  entityId: execution.id,
  entityName: `${taskTypeLabel} (${modelLabel})`,
  clientId: task.clientId,
  metadata: {
    model: selection.modelName,
    model_label: modelLabel,
    tokens: totalTokens,
    input_tokens: response.inputTokens,
    output_tokens: response.outputTokens,
    cost: cost,
    generation_type: task.type,
    complexity: task.complexity,
    duration_ms: Date.now() - startTime,
    used_fallback: usedFallback,
  },
});
```

### 3. Dashboard Display

**`app/dashboard/page.tsx`**

Updated helper functions to display AI generations:

#### `getActivityText()`
```typescript
case 'ai_generation':
  return `Generated ${name}`  // e.g., "Generated Inline Edit (Sonnet 4.5)"
```

#### `getActivityLink()`
```typescript
case 'ai_execution':
  // Link to client if available, otherwise no link
  return activity.client_id ? `/dashboard/clients/${activity.client_id}` : null
```

## Example Activity Entries

### Inline Edit
```
Activity: "Generated Inline Edit (Sonnet 4.5)"
Time: "2 minutes ago"
Link: /dashboard/clients/[client-id] (if client associated)
```

### Content Generation
```
Activity: "Generated Content Generation (Opus 4.5)"
Time: "5 minutes ago"
Link: /dashboard/clients/[client-id] (if client associated)
```

### General AI Task
```
Activity: "Generated Custom Task (Haiku 4.5)"
Time: "1 hour ago"
Link: None (if no client associated)
```

## Metadata Stored

Each AI activity log entry includes:

```typescript
{
  model: "claude-sonnet-4-20250514",
  model_label: "Claude Sonnet 4.5",
  tokens: 1500,
  input_tokens: 1000,
  output_tokens: 500,
  cost: 0.0105,
  generation_type: "inline_edit",
  complexity: "simple",
  duration_ms: 2500,
  used_fallback: false
}
```

## Query Examples

### Get AI generations for a user

```sql
SELECT *
FROM activity_log
WHERE activity_type = 'ai_generation'
  AND user_id = 'user-id'
ORDER BY created_at DESC
LIMIT 20
```

### Get AI generations for a client

```sql
SELECT *
FROM activity_log
WHERE activity_type = 'ai_generation'
  AND client_id = 'client-id'
ORDER BY created_at DESC
```

### Get AI spend summary from activity logs

```sql
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as generations,
  SUM((metadata->>'tokens')::integer) as total_tokens,
  SUM((metadata->>'cost')::decimal) as total_cost,
  metadata->>'model_label' as model
FROM activity_log
WHERE activity_type = 'ai_generation'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), metadata->>'model_label'
ORDER BY date DESC
```

## Integration Points

### Dashboard
- **Recent Activity Card**: Shows last 5 activities including AI generations
- **Clickable**: Links to client page if client is associated

### Client Detail Page
Could be enhanced to show client-specific AI activity:
```typescript
// Fetch client's AI generations
const activities = await fetch(`/api/activity-log?client_id=${clientId}&activity_type=ai_generation`)
```

### Analytics Dashboard
Could aggregate AI activity data:
- Total generations per day/week/month
- Most used models
- Cost per client
- Generation types breakdown

## Benefits

1. **Transparency**: Users see all AI usage in one place
2. **Audit Trail**: Complete record of AI generations
3. **Client Context**: Associate AI work with specific clients
4. **Cost Tracking**: Easy to see which clients drive AI costs
5. **Activity Feed**: Unified view of all platform actions

## Future Enhancements

### Planned
- [ ] Filter activity feed by type (show only AI generations)
- [ ] AI-specific activity page with detailed metrics
- [ ] Link directly to generated content (if saved)
- [ ] Show AI generation preview in activity card
- [ ] Bulk AI operation logging

### Ideas
- [ ] Activity timeline visualization
- [ ] AI usage heatmap by client
- [ ] Cost alerts based on activity patterns
- [ ] AI suggestion based on recent activity
- [ ] Export activity log with AI metadata

## Testing

### Manual Test

1. **Generate content** via AI prompt bar
2. **Navigate to dashboard** → Recent Activity
3. **Verify** AI generation appears with:
   - Correct format: "Generated [Type] ([Model])"
   - Relative time: "2 minutes ago"
   - Clickable link (if client associated)

### Test Cases

✅ **Inline Edit with Client**
```
Expected: "Generated Inline Edit (Sonnet 4.5)"
Link: /dashboard/clients/[client-id]
```

✅ **Content Generation without Client**
```
Expected: "Generated Content Generation (Haiku 4.5)"
Link: None
```

✅ **With Fallback Model**
```
Metadata: used_fallback: true
Expected: Shows correct model used (not original)
```

✅ **Activity Ordering**
```
Expected: Most recent at top
Time: Relative ("2 minutes ago")
```

## Troubleshooting

### Activity not appearing

**Check:**
1. AI execution succeeded (status: 'success')
2. Execution ID was returned from insert
3. logActivity() was called (check console)
4. User is authenticated
5. RLS policies allow insert/select

**Debug:**
```typescript
// In orchestrator.ts, check:
console.log('Execution ID:', execution?.id)
console.log('Logging activity for:', execution.id)
```

### Wrong format

**Check:**
1. `getActivityText()` has 'ai_generation' case
2. entity_name is formatted correctly
3. Activity data structure matches expected

**Debug:**
```sql
-- Check raw activity data
SELECT *
FROM activity_log
WHERE activity_type = 'ai_generation'
ORDER BY created_at DESC
LIMIT 5
```

### Metadata missing

**Check:**
1. All metadata fields are populated in orchestrator
2. JSON structure is correct
3. No database constraints violated

**Debug:**
```sql
-- Check metadata content
SELECT 
  entity_name,
  metadata,
  created_at
FROM activity_log
WHERE activity_type = 'ai_generation'
ORDER BY created_at DESC
LIMIT 5
```

## Database Schema

### activity_log Table

```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL,  -- 'ai_generation'
  entity_type TEXT NOT NULL,    -- 'ai_execution'
  entity_id UUID NOT NULL,      -- ID from ai_executions table
  entity_name TEXT,             -- "Inline Edit (Sonnet 4.5)"
  client_id UUID,               -- Optional client association
  metadata JSONB DEFAULT '{}',  -- Detailed AI info
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_type ON activity_log(activity_type);
CREATE INDEX idx_activity_log_client ON activity_log(client_id) WHERE client_id IS NOT NULL;
```

### RLS Policies

```sql
-- Users can only see their own activities
CREATE POLICY "Users can access their own activity"
ON activity_log FOR ALL
USING (auth.uid() = user_id);
```

## API Endpoint

### GET /api/activity-log

**Query Parameters:**
- `limit`: Number of activities to return (default: 10)
- `client_id`: Filter by client (optional)
- `activity_type`: Filter by type (optional)

**Example:**
```typescript
// Get AI generations for a client
const response = await fetch(
  `/api/activity-log?client_id=${clientId}&activity_type=ai_generation&limit=20`
)
const activities = await response.json()
```

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "activity_type": "ai_generation",
    "entity_type": "ai_execution",
    "entity_id": "execution-uuid",
    "entity_name": "Inline Edit (Sonnet 4.5)",
    "client_id": "client-uuid",
    "metadata": {
      "model": "claude-sonnet-4-20250514",
      "tokens": 1500,
      "cost": 0.0105,
      ...
    },
    "created_at": "2024-12-29T19:30:00Z"
  }
]
```

---

**Status**: ✅ Complete and Integrated
**Last Updated**: Dec 29, 2025
**Version**: 1.0.0
**Testing Status**: Ready for manual testing

