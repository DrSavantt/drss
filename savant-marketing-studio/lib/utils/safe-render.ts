/**
 * Safe rendering utilities to prevent "Objects are not valid as a React child" errors
 * These utilities handle null, undefined, empty objects, and other edge cases
 */

/**
 * Safely renders a value that might be an object, null, undefined, etc.
 * Prevents "Objects are not valid as a React child" errors.
 * 
 * @param value - Any value that needs to be rendered
 * @returns A string representation or null (never returns an object)
 */
export function safeRender(value: unknown): string | null {
  // Handle null/undefined
  if (value === null || value === undefined) return null
  
  // Handle primitives
  if (typeof value === 'string') return value.trim() || null
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return String(value)
  
  // Handle arrays
  if (Array.isArray(value)) {
    const filtered = value.filter(v => 
      v !== null && 
      v !== undefined && 
      v !== '' && 
      (typeof v === 'object' ? Object.keys(v).length > 0 : true)
    )
    return filtered.length > 0 ? filtered.join(', ') : null
  }
  
  // Handle objects (should not happen in normal rendering, but protect against it)
  if (typeof value === 'object') {
    // Empty object - return null instead of crashing
    if (Object.keys(value).length === 0) {
      console.warn('Empty object detected in safeRender:', value)
      return null
    }
    
    // Non-empty object - stringify it (shouldn't happen normally, but better than crashing)
    try {
      console.warn('Non-empty object detected in safeRender:', value)
      return JSON.stringify(value)
    } catch (error) {
      console.error('Failed to stringify object:', error)
      return null
    }
  }
  
  // Fallback for any other type
  return String(value)
}

/**
 * Checks if a value is "empty" (null, undefined, empty string, empty object, empty array)
 * 
 * @param value - Value to check
 * @returns true if value is considered empty
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * Checks if a value is an empty object {}
 * 
 * @param value - Value to check
 * @returns true if value is an empty object
 */
export function isEmptyObject(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value !== 'object') return false
  if (Array.isArray(value)) return false
  return Object.keys(value).length === 0
}

/**
 * Sanitizes questionnaire responses - removes empty objects and invalid data
 * 
 * @param data - Response data to sanitize
 * @returns Cleaned data or null if no valid data exists
 */
export function sanitizeResponses(data: unknown): Record<string, any> | null {
  if (!data) return null
  if (typeof data !== 'object') return null
  if (Array.isArray(data)) return null
  if (Object.keys(data).length === 0) return null
  
  // Deep clean - remove empty nested objects
  const clean = (obj: Record<string, any>): Record<string, any> => {
    const result: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(obj)) {
      // Skip null/undefined
      if (value === null || value === undefined) continue
      
      // Handle objects recursively
      if (typeof value === 'object' && !Array.isArray(value)) {
        // Skip empty objects
        if (Object.keys(value).length === 0) {
          continue
        }
        
        // Recursively clean nested objects
        const cleaned = clean(value)
        if (Object.keys(cleaned).length > 0) {
          result[key] = cleaned
        }
      } 
      // Handle arrays
      else if (Array.isArray(value)) {
        // Filter out null/undefined/empty strings
        const filtered = value.filter(item => {
          if (item === null || item === undefined || item === '') return false
          if (typeof item === 'object' && Object.keys(item).length === 0) return false
          return true
        })
        if (filtered.length > 0) {
          result[key] = filtered
        }
      }
      // Handle primitives
      else if (value !== '') {
        result[key] = value
      }
    }
    
    return result
  }
  
  const cleaned = clean(data as Record<string, any>)
  return Object.keys(cleaned).length > 0 ? cleaned : null
}

/**
 * Checks if response data has valid structure (at least one answer)
 * 
 * @param data - Response data to validate
 * @returns true if data has at least one valid answer
 */
export function hasValidResponseData(data: unknown): boolean {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false
  if (Object.keys(data).length === 0) return false
  
  // Check if at least one section has at least one answer
  return Object.values(data).some(section => {
    if (!section || typeof section !== 'object' || Array.isArray(section)) return false
    if (Object.keys(section).length === 0) return false
    
    // Check if at least one question has a non-empty answer
    return Object.values(section).some(answer => {
      if (answer === null || answer === undefined || answer === '') return false
      if (typeof answer === 'object' && Object.keys(answer).length === 0) return false
      if (Array.isArray(answer) && answer.length === 0) return false
      return true
    })
  })
}

/**
 * Formats a value for display with a fallback
 * 
 * @param value - Value to format
 * @param fallback - Fallback string if value is empty (default: '—')
 * @returns Formatted string
 */
export function formatDisplay(value: unknown, fallback: string = '—'): string {
  const rendered = safeRender(value)
  return rendered || fallback
}

/**
 * Safe wrapper for rendering any value in JSX
 * Use this when you're not sure what type a value might be
 * 
 * @example
 * <p>{renderSafe(someValue)}</p>
 * 
 * @param value - Value to render
 * @returns String or null (safe for JSX)
 */
export function renderSafe(value: unknown): string | null {
  return safeRender(value)
}

/**
 * Simple safe text conversion - always returns a string
 * Use in JSX where you need a guaranteed string output
 * 
 * @example
 * <p>{safeText(client.name)}</p>
 * <p>{safeText(client.email)}</p>
 * 
 * @param value - Value to convert to string
 * @returns String (never null, never an object)
 */
export function safeText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (isEmptyObject(value)) return ''
  if (typeof value === 'object') {
    console.warn('[safeText] Attempted to render object:', value)
    return ''
  }
  return ''
}

/**
 * Sanitize JSONB data - convert {} to null
 * Use when reading JSONB columns that might contain empty objects
 * 
 * @example
 * const cleanProgress = sanitizeJsonb(client.questionnaire_progress)
 * 
 * @param value - JSONB value to sanitize
 * @returns Value or null if empty
 */
export function sanitizeJsonb<T>(value: T): T | null {
  if (value === null || value === undefined) return null
  if (isEmptyObject(value)) return null
  
  // Check for deeply empty objects (all nested values are {})
  if (typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>
    const hasAnyData = Object.values(obj).some(v => {
      if (v === null || v === undefined) return false
      if (isEmptyObject(v)) return false
      if (typeof v === 'object' && !Array.isArray(v)) {
        return Object.values(v as Record<string, unknown>).some(
          nested => nested !== null && nested !== undefined && !isEmptyObject(nested)
        )
      }
      return true
    })
    if (!hasAnyData) return null
  }
  
  return value
}

/**
 * Safe object property access with fallback
 * Prevents crashes when accessing properties on potentially empty objects
 * 
 * @example
 * const name = safeGet(client, 'name', 'Unknown')
 * 
 * @param obj - Object to access
 * @param key - Property key
 * @param fallback - Fallback value if property is missing or invalid
 * @returns Property value or fallback
 */
export function safeGet<T>(obj: unknown, key: string, fallback: T): T {
  if (obj === null || obj === undefined) return fallback
  if (typeof obj !== 'object') return fallback
  if (isEmptyObject(obj)) return fallback
  
  const value = (obj as Record<string, unknown>)[key]
  if (value === null || value === undefined) return fallback
  if (isEmptyObject(value)) return fallback
  
  return value as T
}

/**
 * Sanitize data before saving to database JSONB columns
 * Converts {} to null and checks for meaningful content
 * 
 * USE THIS BEFORE ANY DATABASE WRITE to JSONB columns to prevent
 * saving {} which crashes the app when rendered.
 * 
 * @example
 * const updateData = {
 *   intake_responses: sanitizeForDb(data),
 *   questionnaire_progress: sanitizeForDb(progress),
 * }
 * 
 * @param value - Value to sanitize before DB write
 * @returns Sanitized value or null
 */
export function sanitizeForDb<T>(value: T): T | null {
  // Handle null/undefined
  if (value === null || value === undefined) return null
  
  // Handle empty object {} - convert to null
  if (typeof value === 'object' && !Array.isArray(value)) {
    const keys = Object.keys(value as object)
    if (keys.length === 0) return null
    
    // Check if object only contains empty nested objects
    const hasActualContent = Object.values(value as object).some(v => {
      if (v === null || v === undefined || v === '') return false
      if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) return false
      if (Array.isArray(v) && v.length === 0) return false
      
      // For nested objects, check if they have any non-empty values
      if (typeof v === 'object' && !Array.isArray(v)) {
        return Object.values(v).some(nested => 
          nested !== null && 
          nested !== undefined && 
          nested !== '' &&
          !(typeof nested === 'object' && !Array.isArray(nested) && Object.keys(nested).length === 0) &&
          !(Array.isArray(nested) && nested.length === 0)
        )
      }
      
      return true
    })
    
    if (!hasActualContent) return null
  }
  
  return value
}

/**
 * Check if questionnaire response data has any meaningful answers
 * Use before auto-saving to avoid saving empty forms
 * 
 * @param data - Questionnaire data to check
 * @returns true if there's at least one non-empty answer
 */
export function hasQuestionnaireContent(data: unknown): boolean {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false
  if (Object.keys(data).length === 0) return false
  
  // Check sections for any non-empty answers
  return Object.values(data).some(section => {
    if (!section || typeof section !== 'object' || Array.isArray(section)) return false
    if (Object.keys(section).length === 0) return false
    
    return Object.values(section).some(answer => {
      if (answer === null || answer === undefined || answer === '') return false
      if (typeof answer === 'object' && !Array.isArray(answer) && Object.keys(answer).length === 0) return false
      if (Array.isArray(answer) && answer.length === 0) return false
      return true
    })
  })
}

