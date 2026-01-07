/**
 * Model Lookup Utility
 * 
 * Handles lookup of model_id from model names for ai_executions table.
 * Used during migration from legacy ai_generations to canonical ai_executions.
 */

import { createClient } from '@/lib/supabase/server';

// Cache to avoid repeated DB lookups
const modelCache = new Map<string, string>();

/**
 * Get model_id from model name string
 * Handles various formats:
 * - "claude-3-5-sonnet" → finds best match
 * - "gemini-1.5-pro (web-grounded)" → strips annotations
 * - Unknown models → returns null (graceful degradation)
 */
export async function getModelIdFromName(
  modelName: string
): Promise<string | null> {
  if (!modelName) return null;
  
  // Check cache first
  if (modelCache.has(modelName)) {
    return modelCache.get(modelName) || null;
  }
  
  const supabase = await createClient();
  if (!supabase) return null;
  
  // Clean up model name (remove annotations like "(web-grounded)", "(fallback)")
  const cleanName = modelName
    .replace(/\s*\(.*?\)\s*/g, '') // Remove anything in parentheses
    .trim()
    .toLowerCase();
  
  // Try exact match first
  let { data: model } = await supabase
    .from('ai_models')
    .select('id')
    .eq('model_name', cleanName)
    .single();
  
  // If exact match fails, try pattern matching for common variations
  if (!model) {
    const { data: models } = await supabase
      .from('ai_models')
      .select('id, model_name');
    
    if (models) {
      // Try to find a close match
      model = models.find(m => {
        const name = m.model_name.toLowerCase();
        // Handle variations like "claude-3-5-sonnet" → "claude-sonnet-4-20250514"
        if (cleanName.includes('claude') && name.includes('claude')) {
          if (cleanName.includes('opus') && name.includes('opus')) return true;
          if (cleanName.includes('sonnet') && name.includes('sonnet')) return true;
          if (cleanName.includes('haiku') && name.includes('haiku')) return true;
        }
        // Handle Gemini variations
        if (cleanName.includes('gemini') && name.includes('gemini')) {
          if (cleanName.includes('flash') && name.includes('flash')) return true;
          if (cleanName.includes('pro') && name.includes('pro')) return true;
        }
        return false;
      }) || null;
    }
  }
  
  const modelId = model?.id || null;
  
  // Cache result (including null results to avoid repeated lookups)
  modelCache.set(modelName, modelId || '');
  
  return modelId;
}

/**
 * Get default model ID (Claude Haiku - reliable fallback)
 */
export async function getDefaultModelId(): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  
  const { data: model } = await supabase
    .from('ai_models')
    .select('id')
    .eq('model_name', 'claude-haiku-4-20250514')
    .single();
  
  return model?.id || null;
}

/**
 * Clear the model cache (useful for testing)
 */
export function clearModelCache(): void {
  modelCache.clear();
}

