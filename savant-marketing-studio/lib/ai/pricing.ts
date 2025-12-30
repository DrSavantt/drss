import { createClient } from '@/lib/supabase/server'

// Cost per 1K tokens (as of Dec 2024)
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
} as const

export type AIModelId = keyof typeof AI_PRICING

/**
 * Calculate the cost of an AI generation based on token usage
 * @param modelId - The model identifier
 * @param inputTokens - Number of input tokens used
 * @param outputTokens - Number of output tokens generated
 * @returns Cost in USD, rounded to 6 decimal places
 */
export function calculateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = AI_PRICING[modelId as AIModelId]
  
  if (!pricing) {
    console.warn(`Unknown model for pricing: ${modelId}`)
    return 0
  }
  
  const inputCost = (inputTokens / 1000) * pricing.input
  const outputCost = (outputTokens / 1000) * pricing.output
  
  // Round to 6 decimals to match database precision
  return Math.round((inputCost + outputCost) * 1000000) / 1000000
}

/**
 * Format cost for display
 * @param cost - Cost in USD
 * @returns Formatted string with appropriate precision
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`
  }
  if (cost < 1) {
    return `$${cost.toFixed(3)}`
  }
  return `$${cost.toFixed(2)}`
}

/**
 * Get human-readable model label
 * @param modelId - The model identifier
 * @returns Model label or the model ID if unknown
 */
export function getModelLabel(modelId: string): string {
  return AI_PRICING[modelId as AIModelId]?.label || modelId
}

/**
 * Get user's AI spend with optional filters
 * @param userId - User ID to query
 * @param options - Optional filters (clientId, startDate, endDate)
 * @returns Aggregated spend data
 */
export async function getUserAISpend(
  userId: string, 
  options?: {
    clientId?: string
    startDate?: Date
    endDate?: Date
  }
): Promise<{
  totalCost: number
  totalTokens: number
  executionCount: number
  byModel: Record<string, { cost: number; tokens: number; count: number }>
}> {
  const supabase = await createClient()
  
  if (!supabase) {
    return { totalCost: 0, totalTokens: 0, executionCount: 0, byModel: {} }
  }
  
  let query = supabase
    .from('ai_executions')
    .select('model_id, input_tokens, output_tokens, total_cost_usd')
    .eq('user_id', userId)
  
  if (options?.clientId) {
    query = query.eq('client_id', options.clientId)
  }
  
  if (options?.startDate) {
    query = query.gte('created_at', options.startDate.toISOString())
  }
  
  if (options?.endDate) {
    query = query.lte('created_at', options.endDate.toISOString())
  }
  
  const { data: executions, error } = await query
  
  if (error || !executions) {
    console.error('Error fetching AI spend:', error)
    return { totalCost: 0, totalTokens: 0, executionCount: 0, byModel: {} }
  }
  
  const byModel: Record<string, { cost: number; tokens: number; count: number }> = {}
  let totalCost = 0
  let totalTokens = 0
  
  executions.forEach(exec => {
    const cost = exec.total_cost_usd || 0
    const tokens = (exec.input_tokens || 0) + (exec.output_tokens || 0)
    
    totalCost += cost
    totalTokens += tokens
    
    const modelId = exec.model_id || 'unknown'
    if (!byModel[modelId]) {
      byModel[modelId] = { cost: 0, tokens: 0, count: 0 }
    }
    byModel[modelId].cost += cost
    byModel[modelId].tokens += tokens
    byModel[modelId].count += 1
  })
  
  return {
    totalCost: Math.round(totalCost * 1000000) / 1000000, // Round to 6 decimals
    totalTokens,
    executionCount: executions.length,
    byModel
  }
}

/**
 * Get AI spend for a specific client
 * @param clientId - Client ID to query
 * @returns Aggregated spend data for the client
 */
export async function getClientAISpend(clientId: string): Promise<{
  totalCost: number
  totalTokens: number
  executionCount: number
}> {
  const supabase = await createClient()
  
  if (!supabase) {
    return { totalCost: 0, totalTokens: 0, executionCount: 0 }
  }
  
  const { data, error } = await supabase
    .from('ai_executions')
    .select('input_tokens, output_tokens, total_cost_usd')
    .eq('client_id', clientId)
  
  if (error || !data) {
    console.error('Error fetching client AI spend:', error)
    return { totalCost: 0, totalTokens: 0, executionCount: 0 }
  }
  
  return {
    totalCost: data.reduce((sum, e) => sum + (e.total_cost_usd || 0), 0),
    totalTokens: data.reduce((sum, e) => sum + (e.input_tokens || 0) + (e.output_tokens || 0), 0),
    executionCount: data.length
  }
}

/**
 * Get recent AI spend summary (last 30 days)
 * @param userId - User ID to query
 * @returns Recent spend summary
 */
export async function getRecentAISpend(userId: string) {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  return getUserAISpend(userId, { startDate: thirtyDaysAgo })
}

/**
 * Estimate cost for a prompt before execution
 * @param modelId - Model to use
 * @param estimatedInputTokens - Estimated input tokens
 * @param estimatedOutputTokens - Estimated output tokens
 * @returns Estimated cost
 */
export function estimateCost(
  modelId: string,
  estimatedInputTokens: number,
  estimatedOutputTokens: number
): number {
  return calculateCost(modelId, estimatedInputTokens, estimatedOutputTokens)
}

