// Cost per 1K tokens (as of Dec 2024)
// NOTE: This file contains ONLY client-safe utilities
// Server-side functions (getUserAISpend, etc.) are in app/actions/ai.ts
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
 * Estimate cost for a prompt before execution (client-safe)
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

