# AI System

This directory contains the complete AI system for DRSS, including providers, orchestration, RAG, and cost tracking.

## Structure

```
lib/ai/
├── orchestrator.ts      # Main AI orchestrator (model selection, execution, logging)
├── pricing.ts           # Cost calculation and tracking utilities
├── rag.ts              # Retrieval-Augmented Generation for frameworks
├── embeddings.ts       # Vector embeddings for semantic search
├── index.ts            # Exports and utilities
└── providers/
    ├── base-provider.ts  # Base class for AI providers
    ├── claude.ts        # Anthropic Claude integration
    └── gemini.ts        # Google Gemini integration
```

## Quick Start

### Generate Content

```typescript
import { AIOrchestrator } from '@/lib/ai/orchestrator'

const orchestrator = new AIOrchestrator()

const result = await orchestrator.executeTask({
  type: 'content_generation',
  complexity: 'medium',
  clientId: 'client-uuid',
  request: {
    messages: [
      { role: 'user', content: 'Write a compelling headline' }
    ],
    maxTokens: 2048,
    temperature: 0.7,
  },
})

console.log(result.content)
console.log(`Cost: $${result.cost}`)
console.log(`Model: ${result.modelUsed}`)
```

### Calculate Cost

```typescript
import { calculateCost, formatCost } from '@/lib/ai/pricing'

const cost = calculateCost('claude-sonnet-4-20250514', 1000, 500)
console.log(`Cost: ${formatCost(cost)}`) // "$0.0105"
```

### Get User Spend

```typescript
import { getUserAISpend } from '@/lib/ai/pricing'

const spend = await getUserAISpend(userId)
console.log(`Total: $${spend.totalCost}`)
console.log(`Tokens: ${spend.totalTokens}`)
console.log(`Executions: ${spend.executionCount}`)
```

## Available Models

### Anthropic Claude

- **Opus 4.5** - Highest quality, highest cost
  - Best for: Complex content, important clients
  - Speed: Slow
  - Cost: $15/$75 per 1M tokens (in/out)

- **Sonnet 4.5** - Balanced (default)
  - Best for: Most tasks, everyday use
  - Speed: Fast
  - Cost: $3/$15 per 1M tokens (in/out)

- **Haiku 4.5** - Fastest, cheapest
  - Best for: Simple edits, bulk operations
  - Speed: Very fast
  - Cost: $0.25/$1.25 per 1M tokens (in/out)

### Google Gemini

- **Gemini Pro** - High quality alternative
  - Best for: Google ecosystem, specific features
  - Speed: Fast
  - Cost: $1.25/$5 per 1M tokens (in/out)

- **Gemini Flash** - Very fast, very cheap
  - Best for: Testing, development, high volume
  - Speed: Very fast
  - Cost: $0.075/$0.30 per 1M tokens (in/out)

## Cost Tracking

All AI executions are automatically logged to the `ai_executions` table with:

- Token usage (input/output)
- Accurate cost calculation
- Model used
- Duration
- User and client association
- Task type and complexity

### Query Your Spend

```sql
SELECT 
  SUM(total_cost_usd) as total_cost,
  SUM(input_tokens + output_tokens) as total_tokens,
  COUNT(*) as executions
FROM ai_executions
WHERE user_id = 'your-user-id'
  AND created_at >= NOW() - INTERVAL '30 days'
```

### Use the Helper View

```sql
SELECT * FROM ai_cost_summary
WHERE user_id = 'your-user-id'
  AND date >= CURRENT_DATE - 7
ORDER BY date DESC
```

## Server Actions

Use these from client components:

```typescript
import { 
  getMyAISpend, 
  getClientAICost,
  formatAICost 
} from '@/app/actions/ai'

// Get your spend
const mySpend = await getMyAISpend()

// Get client spend
const clientSpend = await getClientAICost(clientId)

// Format for display
const formatted = formatAICost(mySpend.totalCost)
```

## RAG (Retrieval-Augmented Generation)

Search framework database for relevant context:

```typescript
import { searchFrameworks } from '@/lib/ai/rag'

const chunks = await searchFrameworks(
  'How to write a compelling headline',
  0.7,  // similarity threshold
  5     // max results
)

chunks.forEach(chunk => {
  console.log(chunk.content)
  console.log(`Similarity: ${chunk.similarity}`)
})
```

## Testing

Run the test script:

```bash
npx ts-node scripts/test-ai-costs.ts
```

This will verify:
- Cost calculations are accurate
- Formatting works correctly
- Real-world scenarios match expectations
- Pricing table is up to date

## Configuration

### Update Pricing

Edit `lib/ai/pricing.ts`:

```typescript
export const AI_PRICING = {
  'your-model-id': {
    input: 0.003,   // per 1K tokens
    output: 0.015,  // per 1K tokens
    label: 'Your Model Name'
  },
}
```

### Add New Provider

1. Create `providers/your-provider.ts`:

```typescript
import { BaseAIProvider, AIRequest, AIResponse } from './base-provider'

export class YourProvider extends BaseAIProvider {
  name = 'your-provider'
  
  async generateText(request: AIRequest, modelName: string): Promise<AIResponse> {
    // Implementation
  }
}
```

2. Register in `orchestrator.ts`:

```typescript
this.providers = new Map([
  ['claude', new ClaudeProvider()],
  ['gemini', new GeminiProvider()],
  ['your-provider', new YourProvider()], // Add this
])
```

## Best Practices

### 1. Choose the Right Model

```typescript
// ❌ Bad: Using Opus for simple tasks
await orchestrator.executeTask({
  type: 'grammar_fix',
  complexity: 'complex',  // Selects Opus
  // ...
})

// ✅ Good: Use Haiku for simple tasks
await orchestrator.executeTask({
  type: 'grammar_fix',
  complexity: 'simple',  // Selects Haiku
  // ...
})
```

### 2. Minimize Context

```typescript
// ❌ Bad: Sending entire document
await generateInlineEdit(prompt, {
  fullContent: entire10KWordDocument,
  // ...
})

// ✅ Good: Send only relevant context
await generateInlineEdit(prompt, {
  fullContent: relevantParagraph,
  selectedText: targetText,
  // ...
})
```

### 3. Force Specific Models When Needed

```typescript
// High-value content: Force Opus
await orchestrator.executeTask({
  type: 'content_generation',
  complexity: 'complex',
  forceModel: 'claude-opus-4-20250514',
  // ...
})

// Testing: Force Flash
await orchestrator.executeTask({
  type: 'test_generation',
  complexity: 'simple',
  forceModel: 'gemini-2.0-flash-exp',
  // ...
})
```

## Monitoring

### Dashboard Queries

**Daily Spend:**
```sql
SELECT 
  DATE(created_at) as date,
  SUM(total_cost_usd) as daily_cost
FROM ai_executions
WHERE created_at >= CURRENT_DATE - 30
GROUP BY DATE(created_at)
ORDER BY date DESC
```

**Top Users:**
```sql
SELECT 
  u.email,
  COUNT(*) as executions,
  SUM(ae.total_cost_usd) as total_cost
FROM ai_executions ae
JOIN users u ON ae.user_id = u.id
GROUP BY u.id, u.email
ORDER BY total_cost DESC
LIMIT 10
```

**Model Performance:**
```sql
SELECT 
  model_id,
  COUNT(*) as uses,
  AVG(duration_ms) as avg_duration,
  SUM(total_cost_usd) as total_cost
FROM ai_executions
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY model_id
ORDER BY uses DESC
```

## Troubleshooting

### Cost is $0.00

Check:
1. Model ID matches pricing config exactly
2. Token counts are populated
3. `calculateCost()` function is being called

### Wrong costs

Check:
1. Pricing config is up to date
2. Model ID is correct (exact match required)
3. Token counts are accurate

### Missing executions

Check:
1. User is authenticated
2. Supabase client is initialized
3. RLS policies allow insert
4. Check logs for errors

## Further Reading

- [Complete Cost Tracking Documentation](../../docs/implementation-notes/ai-cost-tracking.md)
- [AI Orchestrator Documentation](../../docs/implementation-notes/ai-orchestrator.md)
- [RAG System Documentation](../../docs/implementation-notes/rag-system.md)

---

**Maintained by**: DRSS Engineering Team
**Last Updated**: Dec 29, 2025

