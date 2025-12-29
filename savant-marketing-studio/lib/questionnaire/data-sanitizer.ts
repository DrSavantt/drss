/**
 * Data sanitizer to prevent corrupted questionnaire data from crashing the app
 */

/**
 * Check if a value is an empty object
 */
export function isEmptyObject(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value !== 'object') return false
  if (Array.isArray(value)) return false
  return Object.keys(value).length === 0
}

/**
 * Check if data contains nested empty objects
 */
export function hasNestedEmptyObjects(data: unknown): boolean {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false
  
  return Object.values(data).some(value => {
    if (isEmptyObject(value)) return true
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.values(value).some(v => isEmptyObject(v))
    }
    return false
  })
}

/**
 * Check if response data has valid structure
 */
export function hasValidResponseStructure(data: unknown): boolean {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false
  if (Object.keys(data).length === 0) return false
  
  // Check if at least one section has valid data
  return Object.values(data).some(section => {
    if (!section || typeof section !== 'object' || Array.isArray(section)) return false
    if (Object.keys(section).length === 0) return false
    
    // Check if at least one question has a non-empty answer
    return Object.values(section).some(answer => {
      if (answer === null || answer === undefined || answer === '') return false
      if (isEmptyObject(answer)) return false
      if (Array.isArray(answer)) return answer.length > 0
      return true
    })
  })
}

/**
 * Sanitize questionnaire response data
 * Returns null if data is invalid or corrupted
 */
export function sanitizeResponseData(data: unknown): Record<string, any> | null {
  if (!data) return null
  if (typeof data !== 'object' || Array.isArray(data)) return null
  if (isEmptyObject(data)) return null
  if (hasNestedEmptyObjects(data)) return null
  if (!hasValidResponseStructure(data)) return null
  
  return data as Record<string, any>
}

/**
 * Sanitize questionnaire progress data
 * Returns safe default if data is invalid
 */
export function sanitizeProgressData(progress: unknown): {
  current_section: number
  completed_questions: string[]
  total_questions: number
} | null {
  if (!progress) return null
  if (typeof progress !== 'object' || Array.isArray(progress)) return null
  if (isEmptyObject(progress)) return null
  
  const prog = progress as Record<string, any>
  
  // Validate and extract fields
  const current_section = typeof prog.current_section === 'number' && prog.current_section > 0
    ? prog.current_section
    : 1
  
  const completed_questions = Array.isArray(prog.completed_questions)
    ? prog.completed_questions.filter(q => typeof q === 'string')
    : []
  
  const total_questions = typeof prog.total_questions === 'number' && prog.total_questions > 0
    ? prog.total_questions
    : 0
  
  // Only return if we have meaningful data
  if (completed_questions.length === 0 && total_questions === 0) {
    return null
  }
  
  return {
    current_section,
    completed_questions,
    total_questions
  }
}

/**
 * Clean response data by removing empty sections and questions
 */
export function cleanResponseData(data: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {}
  
  for (const [sectionKey, sectionData] of Object.entries(data)) {
    if (!sectionData || typeof sectionData !== 'object' || Array.isArray(sectionData)) continue
    if (isEmptyObject(sectionData)) continue
    
    const cleanedSection: Record<string, any> = {}
    
    for (const [questionKey, answer] of Object.entries(sectionData)) {
      // Skip empty objects
      if (isEmptyObject(answer)) continue
      
      // Skip null, undefined, empty strings
      if (answer === null || answer === undefined || answer === '') continue
      
      // Skip empty arrays
      if (Array.isArray(answer) && answer.length === 0) continue
      
      cleanedSection[questionKey] = answer
    }
    
    // Only include section if it has answers
    if (Object.keys(cleanedSection).length > 0) {
      cleaned[sectionKey] = cleanedSection
    }
  }
  
  return cleaned
}

