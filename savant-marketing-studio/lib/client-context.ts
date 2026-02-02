/**
 * Client Context Extraction
 * 
 * Extracts client data from intake_responses (deeply nested in sections.*)
 * and brand_data (simpler flat structure) for use in research personalization.
 * 
 * Data Structure:
 * - intake_responses.sections contains detailed questionnaire answers
 * - brand_data is a simpler fallback with basic client info
 */

/**
 * Client context interface for research personalization
 * This interface is what downstream code (rag.ts, web-research.ts) expects
 */
export interface ClientContext {
  name?: string;
  industry?: string;
  targetAudience?: string;
  demographics?: string;
  brandVoice?: string;
  goals?: string;
  problems?: string;
  solution?: string;
  uniqueValue?: string;
}

/**
 * Safely navigate nested objects using dot notation path
 * @param obj - The object to traverse
 * @param path - Dot-separated path like "sections.avatar_definition.q1_ideal_customer"
 * @returns The value at the path, or undefined if not found
 * 
 * @example
 * getNestedValue(intake, "sections.avatar_definition.q1_ideal_customer")
 */
function getNestedValue(obj: Record<string, any> | null, path: string): string | undefined {
  if (!obj || !path) return undefined;
  
  const keys = path.split('.');
  let current: any = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = current[key];
  }
  
  // Handle different value types
  if (current === null || current === undefined) {
    return undefined;
  }
  
  if (typeof current === 'string') {
    return current.trim() || undefined;
  }
  
  if (Array.isArray(current)) {
    // Join array elements with commas
    const joined = current
      .filter(item => item !== null && item !== undefined)
      .map(item => typeof item === 'string' ? item : JSON.stringify(item))
      .join(', ');
    return joined || undefined;
  }
  
  if (typeof current === 'object') {
    // Convert object to readable string (for complex nested data)
    try {
      return JSON.stringify(current);
    } catch {
      return undefined;
    }
  }
  
  // Numbers, booleans, etc.
  return String(current);
}

/**
 * Combine multiple fields into a single string
 * @param obj - The object to traverse
 * @param paths - Array of dot-separated paths to combine
 * @param separator - String to join values with (default: single space)
 * @returns Combined string or undefined if no values found
 * 
 * @example
 * combineFields(intake, [
 *   "sections.problems_obstacles.q11_external_problems",
 *   "sections.problems_obstacles.q12_internal_problems"
 * ], " ")
 */
function combineFields(
  obj: Record<string, any> | null,
  paths: string[],
  separator: string = ' '
): string | undefined {
  if (!obj || !paths.length) return undefined;
  
  const values = paths
    .map(path => getNestedValue(obj, path))
    .filter((v): v is string => v !== undefined && v.trim() !== '');
  
  if (values.length === 0) return undefined;
  
  return values.join(separator);
}

/**
 * Extract client context from intake_responses and brand_data
 * 
 * Priority:
 * 1. Try intake_responses.sections.* fields first (preferred, more detailed)
 * 2. Fall back to brand_data.* fields if intake not available
 * 3. Return undefined for field if neither exists (let placeholder filler handle defaults)
 * 
 * @param clientName - The client's name (passed directly)
 * @param intakeResponses - The client's intake_responses JSONB from database
 * @param brandData - The client's brand_data JSONB from database (fallback)
 * @returns ClientContext object with extracted/combined fields
 */
export function extractClientContext(
  clientName: string,
  intakeResponses: Record<string, any> | null,
  brandData: Record<string, any> | null
): ClientContext {
  const context: ClientContext = {
    name: clientName,
  };
  
  // === TARGET AUDIENCE ===
  // Primary: avatar_definition.q1_ideal_customer
  // Fallback: brand_data.target_audience
  context.targetAudience = 
    getNestedValue(intakeResponses, 'sections.avatar_definition.q1_ideal_customer') ||
    getNestedValue(brandData, 'target_audience');
  
  // === DEMOGRAPHICS ===
  // Primary: avatar_definition.q3_demographics
  // No fallback in brand_data
  context.demographics = 
    getNestedValue(intakeResponses, 'sections.avatar_definition.q3_demographics');
  
  // === BRAND VOICE ===
  // Primary: Combine brand_voice.q23_tone_words + brand_voice.q25_communication_style
  // Fallback: brand_data.voice
  context.brandVoice = 
    combineFields(intakeResponses, [
      'sections.brand_voice.q23_tone_words',
      'sections.brand_voice.q25_communication_style'
    ], ' | ') ||
    getNestedValue(brandData, 'voice');
  
  // === GOALS ===
  // Primary: dream_outcome.q6_dream_outcome
  // Fallback: brand_data.goals
  context.goals = 
    getNestedValue(intakeResponses, 'sections.dream_outcome.q6_dream_outcome') ||
    getNestedValue(brandData, 'goals');
  
  // === PROBLEMS ===
  // Primary: Combine problems_obstacles.q11_external_problems + q12_internal_problems
  // No fallback in brand_data
  context.problems = 
    combineFields(intakeResponses, [
      'sections.problems_obstacles.q11_external_problems',
      'sections.problems_obstacles.q12_internal_problems'
    ], ' ');
  
  // === SOLUTION ===
  // Primary: Combine solution_methodology.q16_solution_name + q17_solution_steps
  // No fallback in brand_data
  context.solution = 
    combineFields(intakeResponses, [
      'sections.solution_methodology.q16_solution_name',
      'sections.solution_methodology.q17_solution_steps'
    ], ': ');
  
  // === UNIQUE VALUE ===
  // Primary: solution_methodology.q18_why_different
  // Fallback: brand_data.positioning
  context.uniqueValue = 
    getNestedValue(intakeResponses, 'sections.solution_methodology.q18_why_different') ||
    getNestedValue(brandData, 'positioning');
  
  // === INDUSTRY ===
  // This is tricky - intake doesn't have a direct industry field
  // Try to infer from business_metrics context or fall back to brand_data
  // Primary: Check if there's industry in any expected location
  // Fallback: brand_data.industry
  context.industry = 
    getNestedValue(intakeResponses, 'sections.business_context.industry') ||
    getNestedValue(intakeResponses, 'sections.business_metrics.industry') ||
    getNestedValue(intakeResponses, 'industry') ||
    getNestedValue(brandData, 'industry');
  
  return context;
}

/**
 * Check if client has meaningful context data
 * Useful for deciding whether to personalize content
 */
export function hasClientContext(context: ClientContext): boolean {
  // Check if any field beyond name has a value
  const { name, ...otherFields } = context;
  return Object.values(otherFields).some(v => v !== undefined && v !== '');
}

/**
 * Get a summary of what context is available
 * Useful for debugging and logging
 */
export function getContextSummary(context: ClientContext): {
  hasName: boolean;
  hasIndustry: boolean;
  hasAudience: boolean;
  hasBrandVoice: boolean;
  hasGoals: boolean;
  hasProblems: boolean;
  hasSolution: boolean;
  totalFields: number;
} {
  return {
    hasName: !!context.name,
    hasIndustry: !!context.industry,
    hasAudience: !!context.targetAudience || !!context.demographics,
    hasBrandVoice: !!context.brandVoice,
    hasGoals: !!context.goals,
    hasProblems: !!context.problems,
    hasSolution: !!context.solution || !!context.uniqueValue,
    totalFields: Object.values(context).filter(v => v !== undefined).length,
  };
}
