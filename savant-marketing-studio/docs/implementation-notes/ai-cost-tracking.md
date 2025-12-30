# AI Cost Tracking - Complete Implementation

## Overview
Comprehensive AI cost tracking system that accurately calculates and logs costs for all AI generations based on actual token usage and current pricing.

## Architecture

### Pricing Configuration (`lib/ai/pricing.ts`)

Centralized pricing for all AI models with accurate rates as of December 2024:

```typescript
export const AI_PRICING = {
  // Anthropic Claude
  'claude-opus-4-20250514': { 
    input: 0.015,    // $15 per 1M input tokens
    output: 0.075,   // $75 per 1M output tokens
    label: 'Claude Opus 4.5'
  },
  'claude-sonnet-4-20250514': { 
    input: 0.003,    // $3 per 1M input tokens
    output: 0.015,   // $15 per 1M output tokens
    label: 'Claude Sonnet 4.5'
  },
  'claude-haiku-4-20250514': { 
    input: 0.00025,  // $0.25 per 1M input tokens
    output: 0.00125, // $1.25 per 1M output tokens
    label: 'Claude Haiku 4.5'
  },
  // Google Gemini
  'gemini-2.5-pro-002': { 
    input: 0.00125,  // $1.25 per 1M input tokens
    output: 0.005,   // $5 per 1M output tokens
    label: 'Gemini Pro'
  },
  'gemini-2.0-flash-exp': { 
    input: 0.000075, // $0.075 per 1M input tokens
    output: 0.0003,  // $0.30 per 1M output tokens
    label: 'Gemini Flash'
  },
}
```

### Cost Calculation

**Formula:**
```
Total Cost = (inputTokens / 1000 * inputPrice) + (outputTokens / 1000 * outputPrice)
```

**Implementation:**
```typescript
export function calculateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = AI_PRICING[modelId]
  
  if (!pricing) {
    console.warn(`Unknown model for pricing: ${modelId}`)
    return 0
  }
  
  const inputCost = (inputTokens / 1000) * pricing.input
  const outputCost = (outputTokens / 1000) * pricing.output
  
  // Round to 6 decimals to match database precision
  return Math.round((inputCost + outputCost) * 1000000) / 1000000
}
```

### Database Schema

**Table: `ai_executions`**
```sql
- user_id: UUID (references users)
- client_id: UUID (references clients, nullable)
- model_id: UUID (references ai_models)
- task_type: TEXT (inline_edit, content_generation, etc.)
- complexity: TEXT (simple, medium, complex)
- input_tokens: INTEGER
- output_tokens: INTEGER
- total_cost_usd: DECIMAL(10, 6)  -- Supports up to $9,999.999999
- duration_ms: INTEGER
- status: TEXT (success, error)
- created_at: TIMESTAMP
```

**Indexes for Performance:**
```sql
- idx_ai_executions_cost ON (total_cost_usd) WHERE total_cost_usd > 0
- idx_ai_executions_user_created ON (user_id, created_at DESC)
- idx_ai_executions_client_created ON (client_id, created_at DESC)
- idx_ai_executions_model_cost ON (model_id, total_cost_usd)
```

**View: `ai_cost_summary`**
```sql
-- Daily aggregated costs per user/client/model
SELECT 
  user_id,
  client_id,
  model_id,
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as execution_count,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens,
  SUM(total_cost_usd) as total_cost_usd,
  AVG(duration_ms) as avg_duration_ms
FROM ai_executions
WHERE status = 'success'
GROUP BY user_id, client_id, model_id, DATE_TRUNC('day', created_at)
```

## Integration Points

### 1. AI Orchestrator (`lib/ai/orchestrator.ts`)

The orchestrator automatically calculates and logs costs for all AI executions:

```typescript
import { calculateCost } from './pricing'

// After getting AI response
const cost = calculateCost(
  selection.modelName,
  response.inputTokens,
  response.outputTokens
)

// Log to database
await supabase.from('ai_executions').insert({
  user_id: user.id,
  client_id: task.clientId || null,
  model_id: selection.modelId,
  task_type: task.type,
  input_tokens: response.inputTokens,
  output_tokens: response.outputTokens,
  total_cost_usd: cost,
  duration_ms: Date.now() - startTime,
  status: 'success',
})
```

### 2. Server Actions (`app/actions/ai.ts`)

All AI actions expose cost tracking:

```typescript
// Get current user's AI spend
export async function getMyAISpend(options?: {
  clientId?: string
  startDate?: Date
  endDate?: Date
})

// Get client's AI spend
export async function getClientAICost(clientId: string)

// Get recent spend (last 30 days)
export async function getMyRecentAISpend()

// Format cost for display
export function formatAICost(cost: number): string

// Get human-readable model name
export function getAIModelLabel(modelId: string): string
```

## Usage Examples

### Get User's Total AI Spend

```typescript
import { getMyRecentAISpend } from '@/app/actions/ai'

const spend = await getMyRecentAISpend()
console.log(`Total cost: ${spend.totalCost}`)
console.log(`Total tokens: ${spend.totalTokens}`)
console.log(`Executions: ${spend.executionCount}`)

// By model breakdown
Object.entries(spend.byModel).forEach(([model, data]) => {
  console.log(`${model}: $${data.cost} (${data.count} executions)`)
})
```

**Example Output:**
```
Total cost: 2.47
Total tokens: 487320
Executions: 156

claude-sonnet-4-20250514: $1.85 (124 executions)
claude-opus-4-20250514: $0.42 (12 executions)
gemini-2.0-flash-exp: $0.20 (20 executions)
```

### Get Client-Specific AI Cost

```typescript
import { getClientAICost } from '@/app/actions/ai'

const clientSpend = await getClientAICost('client-uuid')
console.log(`Client AI spend: $${clientSpend.totalCost}`)
```

### Format Costs for Display

```typescript
import { formatAICost } from '@/app/actions/ai'

console.log(formatAICost(0.0012))   // "$0.0012"
console.log(formatAICost(0.15))     // "$0.150"
console.log(formatAICost(2.5))      // "$2.50"
console.log(formatAICost(125.00))   // "$125.00"
```

### Direct Database Query

```typescript
// Get cost summary for a date range
const { data } = await supabase
  .from('ai_cost_summary')
  .select('*')
  .eq('user_id', userId)
  .gte('date', '2024-12-01')
  .lte('date', '2024-12-31')
  .order('date', { ascending: false })
```

## Cost Estimates

### Typical Costs by Task

| Task | Model | Tokens | Est. Cost |
|------|-------|--------|-----------|
| Short rewrite (100 words) | Sonnet | ~500 | $0.002 |
| Medium content (500 words) | Sonnet | ~2000 | $0.009 |
| Long content (1500 words) | Sonnet | ~6000 | $0.027 |
| Complex article | Opus | ~4000 | $0.180 |
| Quick edit | Haiku | ~800 | $0.001 |
| Bulk operations (10x) | Flash | ~5000 | $0.002 |

### Model Comparison

| Model | Speed | Quality | Cost (per 1K tokens) |
|-------|-------|---------|---------------------|
| **Opus 4.5** | Slow | Highest | $0.015 - $0.075 |
| **Sonnet 4.5** | Fast | High | $0.003 - $0.015 |
| **Haiku 4.5** | Fastest | Good | $0.00025 - $0.00125 |
| **Gemini Pro** | Fast | High | $0.00125 - $0.005 |
| **Gemini Flash** | Very Fast | Good | $0.000075 - $0.0003 |

### Real-World Examples

**Example 1: Inline Edit**
```
User: "Make this more professional"
Selected Text: 75 words
Model: Sonnet 4.5
Input Tokens: 150
Output Tokens: 100
Cost: $0.0020
```

**Example 2: Content Generation**
```
User: "Write a blog post about X"
Context: 200 words
Model: Opus 4.5
Input Tokens: 500
Output Tokens: 2000
Cost: $0.1575
```

**Example 3: Quick Grammar Fix**
```
User: "Fix grammar"
Text: 50 words
Model: Haiku 4.5
Input Tokens: 100
Output Tokens: 80
Cost: $0.0001
```

## Monitoring & Analytics

### Query Total Spend by User

```sql
SELECT 
  u.email,
  COUNT(*) as executions,
  SUM(ae.input_tokens + ae.output_tokens) as total_tokens,
  SUM(ae.total_cost_usd) as total_cost
FROM ai_executions ae
JOIN users u ON ae.user_id = u.id
WHERE ae.created_at >= NOW() - INTERVAL '30 days'
  AND ae.status = 'success'
GROUP BY u.id, u.email
ORDER BY total_cost DESC
LIMIT 20
```

### Query Most Expensive Executions

```sql
SELECT 
  ae.created_at,
  u.email,
  c.name as client_name,
  ae.task_type,
  ae.input_tokens,
  ae.output_tokens,
  ae.total_cost_usd,
  ae.duration_ms
FROM ai_executions ae
JOIN users u ON ae.user_id = u.id
LEFT JOIN clients c ON ae.client_id = c.id
WHERE ae.total_cost_usd > 0.10  -- Over $0.10
ORDER BY ae.total_cost_usd DESC
LIMIT 50
```

### Query Cost Trends

```sql
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as executions,
  SUM(total_cost_usd) as daily_cost,
  AVG(total_cost_usd) as avg_cost_per_execution
FROM ai_executions
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND status = 'success'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC
```

### Query by Model Performance

```sql
SELECT 
  model_id,
  COUNT(*) as executions,
  AVG(duration_ms) as avg_duration_ms,
  SUM(total_cost_usd) as total_cost,
  AVG(total_cost_usd) as avg_cost_per_execution
FROM ai_executions
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND status = 'success'
GROUP BY model_id
ORDER BY total_cost DESC
```

## Cost Optimization Tips

### 1. Choose the Right Model

**Use Haiku for:**
- Grammar fixes
- Simple rewrites
- Formatting changes
- Bulk operations

**Use Sonnet for:**
- Most content generation
- Inline edits
- Standard rewrites
- Default choice

**Use Opus for:**
- High-value content
- Complex brand voice matching
- Important client work
- Quality-critical tasks

**Use Gemini Flash for:**
- Testing
- Development
- High-volume tasks
- Cost-sensitive operations

### 2. Optimize Context

**Bad:**
```typescript
// Sending entire 10,000 word document
generateInlineEdit("Fix this typo", {
  fullContent: entireDocument,  // 10,000 words = ~13,000 tokens
  selectedText: "teh"           // 1 word = ~1 token
})
// Cost: ~$0.20 (wasted on unnecessary context)
```

**Good:**
```typescript
// Only send relevant context
generateInlineEdit("Fix this typo", {
  fullContent: surroundingParagraph,  // 200 words = ~260 tokens
  selectedText: "teh"
})
// Cost: ~$0.001 (20x cheaper!)
```

### 3. Use Selection Wisely

Always use `[@selection]` mention when editing specific text to avoid processing entire documents.

### 4. Batch Operations

Instead of 10 separate calls, combine into one:
```typescript
// Bad: 10 separate calls = 10x cost overhead
for (const text of texts) {
  await generateInlineEdit(text, context)
}

// Good: 1 call with all texts
await generateInlineEdit(texts.join('\n\n'), context)
```

### 5. Cache Common Results

Cache frequently requested generations:
```typescript
const cacheKey = `ai_${modelId}_${hash(prompt)}`
const cached = await redis.get(cacheKey)
if (cached) return cached

const result = await generateInlineEdit(prompt, context)
await redis.set(cacheKey, result, 'EX', 3600) // 1 hour
```

## Cost Alerts & Limits

### Set Up User Spending Alerts

```typescript
// Check if user is approaching limit
const spend = await getMyRecentAISpend()

if (spend.totalCost > 100) {
  // Alert: High usage
  toast.warning('You have used $100 in AI credits this month')
}

if (spend.totalCost > 200) {
  // Block: Exceeded limit
  return { error: 'AI credit limit exceeded. Please contact support.' }
}
```

### Track Client Profitability

```typescript
// Calculate AI cost vs client revenue
const clientSpend = await getClientAICost(clientId)
const clientRevenue = client.monthly_fee

const aiCostPercentage = (clientSpend.totalCost / clientRevenue) * 100

if (aiCostPercentage > 20) {
  console.warn(`Client ${client.name} AI costs are ${aiCostPercentage}% of revenue`)
}
```

## Testing

### Verify Cost Calculation

```typescript
import { calculateCost, formatCost } from '@/lib/ai/pricing'

// Test Sonnet pricing
const cost = calculateCost('claude-sonnet-4-20250514', 1000, 500)
console.log(`Cost: ${formatCost(cost)}`) // Should be ~$0.0105

// Test Opus pricing
const opusCost = calculateCost('claude-opus-4-20250514', 1000, 500)
console.log(`Cost: ${formatCost(opusCost)}`) // Should be ~$0.0525
```

### Test Database Logging

1. Generate content via AI prompt bar
2. Check `ai_executions` table:
```sql
SELECT * FROM ai_executions 
ORDER BY created_at DESC 
LIMIT 1
```

3. Verify:
   - `total_cost_usd` is populated
   - `input_tokens` and `output_tokens` are correct
   - `model_id` matches selected model
   - Cost matches expected value

### Validate Cost Summary View

```sql
SELECT * FROM ai_cost_summary
WHERE user_id = 'your-user-id'
AND date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC
```

## Troubleshooting

### Cost is $0.00

**Possible causes:**
1. Model ID not in pricing config
2. Token counts are 0
3. Database field is NULL

**Fix:**
- Check model ID matches exactly
- Verify token counts in response
- Check database column type

### Cost seems too high/low

**Check:**
1. Token counts are accurate
2. Model pricing is up to date
3. Input/output token distinction

**Verify:**
```typescript
console.log('Model:', modelId)
console.log('Input tokens:', inputTokens)
console.log('Output tokens:', outputTokens)
console.log('Calculated cost:', calculateCost(modelId, inputTokens, outputTokens))
```

### Missing historical costs

**Backfill:**
```sql
-- Recalculate costs for existing records (if pricing data available)
UPDATE ai_executions
SET total_cost_usd = (
  CASE model_id
    WHEN 'claude-sonnet-4-20250514' THEN 
      (input_tokens::numeric / 1000 * 0.003) + (output_tokens::numeric / 1000 * 0.015)
    -- Add other models...
  END
)
WHERE total_cost_usd IS NULL OR total_cost_usd = 0
```

## Migration Checklist

- [x] Create `lib/ai/pricing.ts` with pricing config
- [x] Update orchestrator to use centralized pricing
- [x] Create database migration for cost column
- [x] Add indexes for performance
- [x] Create cost summary view
- [x] Add server actions for cost queries
- [x] Test cost calculation accuracy
- [x] Verify database logging
- [x] Document API and examples

## Future Enhancements

### Planned
- [ ] Real-time cost display before generation
- [ ] User spending dashboards
- [ ] Cost alerts and notifications
- [ ] Budget limits per user/client
- [ ] Cost optimization recommendations
- [ ] A/B testing cost tracking
- [ ] Invoice generation with AI costs

### Ideas
- [ ] Cost prediction based on prompt length
- [ ] Automatic model selection by budget
- [ ] Bulk operation cost estimates
- [ ] Cost comparison charts
- [ ] ROI tracking (cost vs value)

---

**Status**: ✅ Complete and Production Ready
**Last Updated**: Dec 29, 2025
**Database Migration**: `20250101000000_add_ai_cost_tracking.sql`
**Version**: 1.0.0

