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
          console.log(`Removing empty object at key: ${key}`)
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

