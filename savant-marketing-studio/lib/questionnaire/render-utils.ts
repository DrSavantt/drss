/**
 * Utility functions for safely rendering questionnaire response values
 * Prevents "Objects are not valid as a React child" errors
 */

import type { UploadedFile } from './types'

/**
 * Safely render any value as a string for display in React
 * Handles all edge cases including objects, arrays, null, undefined
 */
export function renderValue(value: unknown): string {
  // Null or undefined
  if (value === null || value === undefined) {
    return ''
  }

  // String
  if (typeof value === 'string') {
    return value.trim()
  }

  // Number or boolean
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  // Array
  if (Array.isArray(value)) {
    // Check if it's file upload array
    if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null && 'name' in value[0]) {
      const files = value as UploadedFile[]
      return `${files.length} file(s): ${files.map(f => f.name).join(', ')}`
    }
    
    // Regular string array
    const validItems = value.filter(item => 
      item !== null && 
      item !== undefined && 
      item !== '' &&
      typeof item === 'string'
    )
    return validItems.join(', ')
  }

  // Object (should not happen in normal use)
  if (typeof value === 'object') {
    // Empty object
    if (Object.keys(value).length === 0) {
      console.warn('Empty object encountered in renderValue')
      return ''
    }
    
    // Non-empty object - stringify for debugging
    console.warn('Unexpected object encountered in renderValue:', value)
    return JSON.stringify(value)
  }

  // Fallback - convert to string
  return String(value)
}

/**
 * Format an answer for display with a fallback indicator
 */
export function formatAnswerDisplay(answer: unknown, fallback: string = '—'): string {
  const rendered = renderValue(answer)
  return rendered || fallback
}

/**
 * Check if a value is considered "answered" (has meaningful content)
 */
export function hasAnswer(value: unknown): boolean {
  if (value === null || value === undefined) return false
  
  if (typeof value === 'string') return value.trim() !== ''
  
  if (Array.isArray(value)) {
    return value.some(item => 
      item !== null && 
      item !== undefined && 
      (typeof item === 'string' ? item.trim() !== '' : true)
    )
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length > 0
  }
  
  return true // numbers, booleans, etc.
}

/**
 * Clean response data by removing empty objects and invalid values
 */
export function cleanResponseData(data: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {}
  
  for (const [sectionKey, sectionData] of Object.entries(data)) {
    if (typeof sectionData !== 'object' || sectionData === null) continue
    if (Array.isArray(sectionData)) continue // Skip arrays
    
    const cleanedSection: Record<string, any> = {}
    
    for (const [questionKey, answer] of Object.entries(sectionData)) {
      // Only include answers with actual content
      if (hasAnswer(answer)) {
        cleanedSection[questionKey] = answer
      }
    }
    
    // Only include section if it has answers
    if (Object.keys(cleanedSection).length > 0) {
      cleaned[sectionKey] = cleanedSection
    }
  }
  
  return cleaned
}

