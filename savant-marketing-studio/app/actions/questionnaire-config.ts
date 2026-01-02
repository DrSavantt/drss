'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ===== TYPES =====

export interface SectionConfig {
  id: number
  key: string
  title: string
  description: string | null
  estimated_minutes: number
  sort_order: number
  enabled: boolean
}

export interface QuestionConfig {
  id: string
  section_id: number
  question_key: string
  sort_order: number
  text: string
  type: 'long-text' | 'short-text' | 'multiple-choice' | 'checkbox' | 'file-upload'
  required: boolean
  enabled: boolean
  min_length: number | null
  max_length: number | null
  placeholder: string | null
  options: { value: string; label: string }[] | null
  conditional_on: { questionId: string; notEquals?: string; equals?: string } | null
  accepted_file_types: string[] | null
  max_file_size: number | null
  max_files: number | null
  file_description: string | null
}

export interface HelpConfig {
  id: number
  question_id: string
  title: string | null
  where_to_find: string[] | null
  how_to_extract: string[] | null
  good_example: string | null
  weak_example: string | null
  quick_tip: string | null
}

export type QuestionWithHelp = QuestionConfig & { help?: HelpConfig }

// ===== READ OPERATIONS =====

export async function getSections(): Promise<SectionConfig[]> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Supabase client not available')
  }
  
  const { data, error } = await supabase
    .from('questionnaire_sections')
    .select('*')
    .order('sort_order')
  
  if (error) {
    console.error('[getSections] Database error:', error.message)
    throw error
  }
  
  return data || []
}

export async function getEnabledSections(): Promise<SectionConfig[]> {
  const supabase = await createClient()
  
  if (!supabase) {
    console.error('Supabase client not available')
    throw new Error('Supabase client not available')
  }
  
  const { data, error } = await supabase
    .from('questionnaire_sections')
    .select('*')
    .eq('enabled', true)
    .order('sort_order')
  
  if (error) {
    console.error('Error fetching enabled sections:', error)
    throw error
  }
  return data || []
}

export async function getQuestions(): Promise<QuestionConfig[]> {
  const supabase = await createClient()
  
  if (!supabase) {
    console.error('Supabase client not available')
    throw new Error('Supabase client not available')
  }
  
  const { data, error } = await supabase
    .from('questionnaire_questions')
    .select('*')
    .order('section_id, sort_order')
  
  if (error) {
    console.error('Error fetching questions:', error)
    throw error
  }
  return data || []
}

export async function getQuestionsWithHelp(): Promise<QuestionWithHelp[]> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Supabase client not available')
  }
  
  const { data: questions, error: qError } = await supabase
    .from('questionnaire_questions')
    .select('*')
    .order('section_id, sort_order')
  
  if (qError) {
    console.error('[getQuestionsWithHelp] Questions error:', qError.message)
    throw qError
  }
  
  const { data: help, error: hError } = await supabase
    .from('questionnaire_help')
    .select('*')
  
  if (hError) {
    console.error('[getQuestionsWithHelp] Help error:', hError.message)
    throw hError
  }
  
  return (questions || []).map(q => ({
    ...q,
    help: help?.find(h => h.question_id === q.id)
  }))
}

export async function getQuestionsBySection(sectionId: number): Promise<QuestionConfig[]> {
  const supabase = await createClient()
  
  if (!supabase) {
    console.error('Supabase client not available')
    throw new Error('Supabase client not available')
  }
  
  const { data, error } = await supabase
    .from('questionnaire_questions')
    .select('*')
    .eq('section_id', sectionId)
    .order('sort_order')
  
  if (error) {
    console.error('Error fetching questions by section:', error)
    throw error
  }
  return data || []
}

export async function getHelp(questionId: string): Promise<HelpConfig | null> {
  const supabase = await createClient()
  
  if (!supabase) {
    console.error('Supabase client not available')
    throw new Error('Supabase client not available')
  }
  
  const { data, error } = await supabase
    .from('questionnaire_help')
    .select('*')
    .eq('question_id', questionId)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    console.error('Error fetching help:', error)
    throw error
  }
  return data
}

// ===== CLIENT-SPECIFIC CONFIG (WITH OVERRIDES) =====

/**
 * Get sections with client-specific overrides applied.
 * Used by public form and embedded form to show only what the client should see.
 */
export async function getSectionsForClient(clientId: string): Promise<SectionConfig[]> {
  const supabase = await createClient()
  
  if (!supabase) {
    console.error('[getSectionsForClient] Supabase client not available')
    throw new Error('Supabase client not available')
  }
  
  // Get global sections
  const { data: sections, error: sectionsError } = await supabase
    .from('questionnaire_sections')
    .select('*')
    .order('sort_order')
  
  if (sectionsError) {
    console.error('[getSectionsForClient] Error fetching sections:', sectionsError)
    throw sectionsError
  }
  
  // Get client-specific section overrides
  const { data: overrides, error: overridesError } = await supabase
    .from('client_questionnaire_overrides')
    .select('*')
    .eq('client_id', clientId)
    .eq('override_type', 'section')
  
  if (overridesError) {
    console.error('[getSectionsForClient] Error fetching overrides:', overridesError)
    // Don't throw - continue with global sections if overrides fail
  }
  
  // Merge overrides with sections
  return (sections || []).map(section => {
    const override = overrides?.find(o => o.section_id === section.id)
    if (!override) return section
    
    // Read description from custom_help.description if present
    const customDescription = override.custom_help && typeof override.custom_help === 'object'
      ? (override.custom_help as Record<string, unknown>).description as string | null
      : null
    
    return {
      ...section,
      // Override enabled status if override exists
      enabled: override.is_enabled,
      // Override title if custom_text provided
      title: override.custom_text || section.title,
      // Override description if custom_help.description provided
      description: customDescription || section.description,
    }
  })
}

/**
 * Get questions with help AND client-specific overrides applied.
 * Used by public form and embedded form to show only what the client should see.
 */
export async function getQuestionsForClient(clientId: string): Promise<QuestionWithHelp[]> {
  const supabase = await createClient()
  
  if (!supabase) {
    console.error('[getQuestionsForClient] Supabase client not available')
    throw new Error('Supabase client not available')
  }
  
  // Get global questions
  const { data: questions, error: questionsError } = await supabase
    .from('questionnaire_questions')
    .select('*')
    .order('section_id, sort_order')
  
  if (questionsError) {
    console.error('[getQuestionsForClient] Error fetching questions:', questionsError)
    throw questionsError
  }
  
  // Get help content
  const { data: help, error: helpError } = await supabase
    .from('questionnaire_help')
    .select('*')
  
  if (helpError) {
    console.error('[getQuestionsForClient] Error fetching help:', helpError)
    // Don't throw - continue without help if it fails
  }
  
  // Get client-specific question overrides
  const { data: overrides, error: overridesError } = await supabase
    .from('client_questionnaire_overrides')
    .select('*')
    .eq('client_id', clientId)
    .not('question_id', 'is', null) // Only question overrides
  
  if (overridesError) {
    console.error('[getQuestionsForClient] Error fetching overrides:', overridesError)
    // Don't throw - continue with global questions if overrides fail
  }
  
  // Merge overrides with questions
  return (questions || []).map(question => {
    const questionHelp = help?.find(h => h.question_id === question.id)
    const override = overrides?.find(o => o.question_id === question.id)
    
    // Merge custom_help if provided
    let mergedHelp = questionHelp
    if (override?.custom_help && typeof override.custom_help === 'object') {
      mergedHelp = questionHelp 
        ? { ...questionHelp, ...override.custom_help }
        : override.custom_help as HelpConfig
    }
    
    return {
      ...question,
      // Override enabled status if override exists
      enabled: override !== undefined ? override.is_enabled : question.enabled,
      // Override text if custom_text provided
      text: override?.custom_text || question.text,
      help: mergedHelp,
    }
  })
}

// ===== SECTION UPDATE OPERATIONS =====

export async function updateSection(id: number, updates: Partial<Omit<SectionConfig, 'id' | 'created_at' | 'updated_at'>>) {
  const supabase = await createClient()
  
  if (!supabase) {
    console.error('Supabase client not available')
    throw new Error('Supabase client not available')
  }
  
  const { error } = await supabase
    .from('questionnaire_sections')
    .update(updates)
    .eq('id', id)
  
  if (error) {
    console.error('Error updating section:', error)
    throw error
  }
  
  revalidatePath('/dashboard/settings/questionnaire')
}

export async function toggleSection(id: number, enabled: boolean) {
  return updateSection(id, { enabled })
}

export async function reorderSections(orderedIds: number[]) {
  const supabase = await createClient()
  
  if (!supabase) {
    console.error('Supabase client not available')
    throw new Error('Supabase client not available')
  }
  
  // Update all sections with new sort orders
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from('questionnaire_sections')
      .update({ sort_order: i + 1 })
      .eq('id', orderedIds[i])
    
    if (error) {
      console.error('Error reordering sections:', error)
      throw error
    }
  }
  
  revalidatePath('/dashboard/settings/questionnaire')
}

export async function addSection(section: Omit<SectionConfig, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = await createClient()
  
  if (!supabase) {
    console.error('Supabase client not available')
    throw new Error('Supabase client not available')
  }
  
  const { data, error } = await supabase
    .from('questionnaire_sections')
    .insert(section)
    .select()
    .single()
  
  if (error) {
    console.error('Error adding section:', error)
    throw error
  }
  
  revalidatePath('/dashboard/settings/questionnaire')
  return data.id
}

export async function deleteSection(id: number) {
  const supabase = await createClient()
  
  if (!supabase) {
    console.error('Supabase client not available')
    throw new Error('Supabase client not available')
  }
  
  // This will cascade delete questions in the section
  const { error } = await supabase
    .from('questionnaire_sections')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting section:', error)
    throw error
  }
  
  revalidatePath('/dashboard/settings/questionnaire')
}

// ===== QUESTION UPDATE OPERATIONS =====

export async function updateQuestion(id: string, updates: Partial<Omit<QuestionConfig, 'id' | 'created_at' | 'updated_at'>>) {
  const supabase = await createClient()
  
  if (!supabase) {
    console.error('Supabase client not available')
    throw new Error('Supabase client not available')
  }
  
  const { error } = await supabase
    .from('questionnaire_questions')
    .update(updates)
    .eq('id', id)
  
  if (error) {
    console.error('Error updating question:', error)
    throw error
  }
  
  revalidatePath('/dashboard/settings/questionnaire')
}

export async function toggleQuestion(id: string, enabled: boolean) {
  return updateQuestion(id, { enabled })
}

export async function reorderQuestions(sectionId: number, orderedIds: string[]) {
  const supabase = await createClient()
  
  if (!supabase) {
    console.error('Supabase client not available')
    throw new Error('Supabase client not available')
  }
  
  // Get the starting sort_order for this section
  const firstQuestion = await supabase
    .from('questionnaire_questions')
    .select('sort_order')
    .eq('section_id', sectionId)
    .order('sort_order')
    .limit(1)
    .single()
  
  const startOrder = firstQuestion.data?.sort_order || 1
  
  // Update all questions with new sort orders
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from('questionnaire_questions')
      .update({ sort_order: startOrder + i })
      .eq('id', orderedIds[i])
    
    if (error) {
      console.error('Error reordering questions:', error)
      throw error
    }
  }
  
  revalidatePath('/dashboard/settings/questionnaire')
}

export async function addQuestion(question: Omit<QuestionConfig, 'created_at' | 'updated_at'>) {
  const supabase = await createClient()
  
  if (!supabase) {
    console.error('Supabase client not available')
    throw new Error('Supabase client not available')
  }
  
  const { error } = await supabase
    .from('questionnaire_questions')
    .insert(question)
  
  if (error) {
    console.error('Error adding question:', error)
    throw error
  }
  
  revalidatePath('/dashboard/settings/questionnaire')
  revalidatePath('/dashboard/clients/onboarding')
  return question.id
}

export async function deleteQuestion(id: string) {
  const supabase = await createClient()
  
  if (!supabase) {
    console.error('Supabase client not available')
    throw new Error('Supabase client not available')
  }
  
  const { error } = await supabase
    .from('questionnaire_questions')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting question:', error)
    throw error
  }
  
  revalidatePath('/dashboard/settings/questionnaire')
}

// ===== HELP UPDATE OPERATIONS =====

export async function updateHelp(questionId: string, updates: Omit<Partial<HelpConfig>, 'id' | 'question_id' | 'created_at' | 'updated_at'>) {
  const supabase = await createClient()
  
  if (!supabase) {
    console.error('Supabase client not available')
    throw new Error('Supabase client not available')
  }
  
  // Check if help exists
  const existing = await getHelp(questionId)
  
  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('questionnaire_help')
      .update(updates)
      .eq('question_id', questionId)
    
    if (error) {
      console.error('Error updating help:', error)
      throw error
    }
  } else {
    // Insert new
    const { error } = await supabase
      .from('questionnaire_help')
      .insert({
        question_id: questionId,
        ...updates
      })
    
    if (error) {
      console.error('Error creating help:', error)
      throw error
    }
  }
  
  revalidatePath('/dashboard/settings/questionnaire')
}

export async function deleteHelp(questionId: string) {
  const supabase = await createClient()
  
  if (!supabase) {
    console.error('Supabase client not available')
    throw new Error('Supabase client not available')
  }
  
  const { error } = await supabase
    .from('questionnaire_help')
    .delete()
    .eq('question_id', questionId)
  
  if (error) {
    console.error('Error deleting help:', error)
    throw error
  }
  
  revalidatePath('/dashboard/settings/questionnaire')
}

// ===== BULK OPERATIONS =====

export async function bulkToggleQuestions(questionIds: string[], enabled: boolean) {
  const supabase = await createClient()
  
  if (!supabase) {
    console.error('Supabase client not available')
    throw new Error('Supabase client not available')
  }
  
  for (const id of questionIds) {
    const { error } = await supabase
      .from('questionnaire_questions')
      .update({ enabled })
      .eq('id', id)
    
    if (error) {
      console.error('Error bulk toggling questions:', error)
      throw error
    }
  }
  
  revalidatePath('/dashboard/settings/questionnaire')
}

export async function duplicateQuestion(id: string): Promise<string> {
  const supabase = await createClient()
  
  if (!supabase) {
    console.error('Supabase client not available')
    throw new Error('Supabase client not available')
  }
  
  // Get original question
  const { data: original, error: fetchError } = await supabase
    .from('questionnaire_questions')
    .select('*')
    .eq('id', id)
    .single()
  
  if (fetchError || !original) {
    console.error('Error fetching question to duplicate:', fetchError)
    throw fetchError || new Error('Question not found')
  }
  
  // Create new ID
  const newId = `${original.question_key}_copy_${Date.now()}`
  
  // Insert duplicate
  const { error: insertError } = await supabase
    .from('questionnaire_questions')
    .insert({
      ...original,
      id: newId,
      text: `${original.text} (Copy)`,
      sort_order: original.sort_order + 1,
      enabled: false // Start disabled
    })
  
  if (insertError) {
    console.error('Error duplicating question:', insertError)
    throw insertError
  }
  
  revalidatePath('/dashboard/settings/questionnaire')
  return newId
}

// ===== VALIDATION =====

export async function validateConfig(): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = []
  
  try {
    const sections = await getSections()
    const questions = await getQuestions()
    
    // Check for sections without questions
    for (const section of sections) {
      const sectionQuestions = questions.filter(q => q.section_id === section.id)
      if (sectionQuestions.length === 0 && section.enabled) {
        errors.push(`Section "${section.title}" has no questions`)
      }
    }
    
    // Check for orphaned questions
    const sectionIds = new Set(sections.map(s => s.id))
    for (const question of questions) {
      if (!sectionIds.has(question.section_id)) {
        errors.push(`Question "${question.text}" references non-existent section ${question.section_id}`)
      }
    }
    
    // Check for duplicate sort orders within sections
    const sortOrderMap = new Map<number, Set<number>>()
    for (const question of questions) {
      if (!sortOrderMap.has(question.section_id)) {
        sortOrderMap.set(question.section_id, new Set())
      }
      const orders = sortOrderMap.get(question.section_id)!
      if (orders.has(question.sort_order)) {
        errors.push(`Duplicate sort_order ${question.sort_order} in section ${question.section_id}`)
      }
      orders.add(question.sort_order)
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  } catch (error) {
    return {
      valid: false,
      errors: ['Failed to validate configuration: ' + (error as Error).message]
    }
  }
}

