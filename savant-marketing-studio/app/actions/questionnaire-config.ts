'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// ===== SERVICE ROLE CLIENT (Bypasses RLS for admin operations) =====
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables for service client')
  }
  
  return createServiceClient(supabaseUrl, supabaseServiceKey)
}

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

export interface HelpContent {
  title: string | null
  where_to_find: string[] | null
  how_to_extract: string[] | null
  good_example: string | null
  weak_example: string | null
  quick_tip: string | null
}

// Legacy interface for backwards compatibility (deprecated)
export interface HelpConfig extends HelpContent {
  id: number
  question_id: string
}

export type QuestionWithHelp = QuestionConfig & { 
  help_content?: HelpContent | null
  help?: HelpContent | null  // Alias for backwards compatibility
}

// ===== READ OPERATIONS =====

export async function getSections(): Promise<SectionConfig[]> {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/de6f83dd-b5e0-4c9a-99d4-d76568bc937c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'questionnaire-config.ts:getSections:entry',message:'getSections called',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H6'})}).catch(()=>{});
  // #endregion
  
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Supabase client not available')
  }
  
  const { data, error } = await supabase
    .from('questionnaire_sections')
    .select('*')
    .order('sort_order')
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/de6f83dd-b5e0-4c9a-99d4-d76568bc937c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'questionnaire-config.ts:getSections:result',message:'getSections data received',data:{sectionOrder:data?.map(s=>({id:s.id,sort_order:s.sort_order}))||[],error:error?.message||null},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H6'})}).catch(()=>{});
  // #endregion
  
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
  
  // Help content is now embedded in questions via help_content column
  const { data: questions, error: qError } = await supabase
    .from('questionnaire_questions')
    .select('*')
    .order('section_id, sort_order')
  
  if (qError) {
    console.error('[getQuestionsWithHelp] Questions error:', qError.message)
    throw qError
  }
  
  // Map help_content to help for backwards compatibility
  return (questions || []).map(q => ({
    ...q,
    help: q.help_content as HelpContent | null
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

export async function getHelp(questionId: string): Promise<HelpContent | null> {
  const supabase = await createClient()
  
  if (!supabase) {
    console.error('Supabase client not available')
    throw new Error('Supabase client not available')
  }
  
  // Help content is now embedded in questions via help_content column
  const { data, error } = await supabase
    .from('questionnaire_questions')
    .select('help_content')
    .eq('id', questionId)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    console.error('Error fetching help:', error)
    throw error
  }
  return data?.help_content as HelpContent | null
}

// ===== CLIENT-SPECIFIC CONFIG =====

/**
 * Get sections for a client.
 * Returns global configuration (per-client overrides feature removed).
 */
export async function getSectionsForClient(clientId: string): Promise<SectionConfig[]> {
  console.log('=== getSectionsForClient CALLED ===')
  console.log('clientId:', clientId)
  console.log('timestamp:', new Date().toISOString())
  
  const supabase = await createClient()
  
  if (!supabase) {
    console.error('[getSectionsForClient] Supabase client not available')
    throw new Error('Supabase client not available')
  }
  
  // Get global sections (client parameter kept for API compatibility)
  const { data: sections, error: sectionsError } = await supabase
    .from('questionnaire_sections')
    .select('*')
    .order('sort_order')
  
  if (sectionsError) {
    console.error('[getSectionsForClient] Error fetching sections:', sectionsError)
    throw sectionsError
  }
  
  console.log('=== getSectionsForClient RESULT ===')
  console.log('Sections received:', sections?.map(s => ({ 
    id: s.id, 
    title: s.title, 
    sort_order: s.sort_order 
  })))
  
  return sections || []
}

/**
 * Get questions with help for a client.
 * Returns global configuration (per-client overrides feature removed).
 */
export async function getQuestionsForClient(clientId: string): Promise<QuestionWithHelp[]> {
  const supabase = await createClient()
  
  if (!supabase) {
    console.error('[getQuestionsForClient] Supabase client not available')
    throw new Error('Supabase client not available')
  }
  
  // Get global questions with embedded help content (client parameter kept for API compatibility)
  const { data: questions, error: questionsError } = await supabase
    .from('questionnaire_questions')
    .select('*')
    .order('section_id, sort_order')
  
  if (questionsError) {
    console.error('[getQuestionsForClient] Error fetching questions:', questionsError)
    throw questionsError
  }
  
  // Help content is now embedded via help_content column
  return (questions || []).map(question => ({
    ...question,
    help: question.help_content as HelpContent | null
  }))
}

// ===== SECTION UPDATE OPERATIONS =====

export async function updateSection(id: number, updates: Partial<Omit<SectionConfig, 'id' | 'created_at' | 'updated_at'>>) {
  // Use service role client to bypass RLS for admin operations
  const supabase = getServiceClient()
  
  const { error } = await supabase
    .from('questionnaire_sections')
    .update(updates)
    .eq('id', id)
  
  if (error) {
    console.error('Error updating section:', error)
    throw error
  }
  
  revalidatePath('/dashboard/settings/questionnaire')
  revalidatePath('/form', 'layout') // Revalidate all form pages to reflect changes
}

export async function toggleSection(id: number, enabled: boolean) {
  return updateSection(id, { enabled })
}

export async function reorderSections(orderedIds: number[]) {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/de6f83dd-b5e0-4c9a-99d4-d76568bc937c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'questionnaire-config.ts:reorderSections:entry',message:'Server action called',data:{orderedIds,orderedIdsTypes:orderedIds.map(id=>typeof id)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
  // #endregion
  
  // Use service role client to bypass RLS for admin operations
  const supabase = getServiceClient()
  
  // Update all sections with new sort orders
  for (let i = 0; i < orderedIds.length; i++) {
    const { error, data } = await supabase
      .from('questionnaire_sections')
      .update({ sort_order: i + 1 })
      .eq('id', orderedIds[i])
      .select()
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/de6f83dd-b5e0-4c9a-99d4-d76568bc937c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'questionnaire-config.ts:reorderSections:update',message:`Update section ${orderedIds[i]}`,data:{sectionId:orderedIds[i],newSortOrder:i+1,error:error?.message||null,dataReturned:data},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
    
    if (error) {
      console.error('Error reordering sections:', error)
      throw error
    }
  }
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/de6f83dd-b5e0-4c9a-99d4-d76568bc937c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'questionnaire-config.ts:reorderSections:complete',message:'All updates complete',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
  // #endregion
  
  console.log('=== reorderSections: Calling revalidatePath ===')
  console.log('Revalidating: /dashboard/settings/questionnaire')
  revalidatePath('/dashboard/settings/questionnaire')
  console.log('Revalidating: /form (layout)')
  revalidatePath('/form', 'layout') // Revalidate all form pages to reflect new order
  console.log('=== reorderSections: Complete ===')
}

export async function addSection(section: Omit<SectionConfig, 'id' | 'sort_order' | 'created_at' | 'updated_at'>) {
  const supabase = getServiceClient()
  
  // Get the max sort_order from database to avoid conflicts
  const { data: maxData } = await supabase
    .from('questionnaire_sections')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()
  
  const nextSortOrder = (maxData?.sort_order ?? 0) + 1
  
  const { data, error } = await supabase
    .from('questionnaire_sections')
    .insert({
      ...section,
      sort_order: nextSortOrder
    })
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
  console.log('deleteSection called:', id)
  const supabase = getServiceClient()
  
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
  revalidatePath('/form', 'layout') // Revalidate all form pages to reflect changes
}

// ===== QUESTION UPDATE OPERATIONS =====

export async function updateQuestion(id: string, updates: Partial<Omit<QuestionConfig, 'id' | 'created_at' | 'updated_at'>>) {
  // Use service role client to bypass RLS for admin operations
  const supabase = getServiceClient()
  
  const { data, error } = await supabase
    .from('questionnaire_questions')
    .update(updates)
    .eq('id', id)
    .select()
  
  if (error) {
    console.error('Error updating question:', error)
    throw error
  }
  
  revalidatePath('/dashboard/settings/questionnaire')
  return { success: true, data }
}

export async function toggleQuestion(id: string, enabled: boolean) {
  return updateQuestion(id, { enabled })
}

export async function reorderQuestions(sectionId: number, orderedIds: string[]) {
  // Use service role client to bypass RLS for admin operations
  const supabase = getServiceClient()
  
  // Update all questions with new sort orders (1-based sequential)
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from('questionnaire_questions')
      .update({ sort_order: i + 1 })
      .eq('id', orderedIds[i])
    
    if (error) {
      console.error('Error reordering questions:', error)
      throw error
    }
  }
  
  revalidatePath('/dashboard/settings/questionnaire')
  revalidatePath('/form', 'layout') // Revalidate all form pages to reflect new order
}

export async function addQuestion(question: Omit<QuestionConfig, 'sort_order' | 'created_at' | 'updated_at'>) {
  const supabase = getServiceClient()
  
  // Get the max sort_order for this section from database to avoid conflicts
  const { data: maxData } = await supabase
    .from('questionnaire_questions')
    .select('sort_order')
    .eq('section_id', question.section_id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()
  
  const nextSortOrder = (maxData?.sort_order ?? 0) + 1
  
  const { error } = await supabase
    .from('questionnaire_questions')
    .insert({
      ...question,
      sort_order: nextSortOrder
    })
  
  if (error) {
    console.error('Error adding question:', error)
    throw error
  }
  
  revalidatePath('/dashboard/settings/questionnaire')
  revalidatePath('/dashboard/clients/onboarding')
  revalidatePath('/form', 'layout') // Revalidate all form pages to reflect changes
  return question.id
}

export async function deleteQuestion(id: string) {
  const supabase = getServiceClient()
  
  const { error } = await supabase
    .from('questionnaire_questions')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting question:', error)
    throw error
  }
  
  revalidatePath('/dashboard/settings/questionnaire')
  revalidatePath('/form', 'layout') // Revalidate all form pages to reflect changes
}

// ===== HELP UPDATE OPERATIONS =====

export async function updateHelp(questionId: string, updates: Partial<HelpContent>) {
  // Use service role client to bypass RLS for admin operations
  const supabase = getServiceClient()
  
  // Get existing help_content to merge with updates
  const existing = await getHelp(questionId)
  
  const newHelpContent = existing 
    ? { ...existing, ...updates }
    : updates
  
  const { data, error } = await supabase
    .from('questionnaire_questions')
    .update({ help_content: newHelpContent })
    .eq('id', questionId)
    .select()
  
  if (error) {
    console.error('Error updating help:', error)
    throw error
  }
  
  revalidatePath('/dashboard/settings/questionnaire')
  revalidatePath('/form', 'layout') // Revalidate all form pages to reflect changes
  return { success: true, data }
}

export async function deleteHelp(questionId: string) {
  const supabase = await createClient()
  
  if (!supabase) {
    console.error('Supabase client not available')
    throw new Error('Supabase client not available')
  }
  
  const { error } = await supabase
    .from('questionnaire_questions')
    .update({ help_content: null })
    .eq('id', questionId)
  
  if (error) {
    console.error('Error deleting help:', error)
    throw error
  }
  
  revalidatePath('/dashboard/settings/questionnaire')
  revalidatePath('/form', 'layout') // Revalidate all form pages to reflect changes
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
  revalidatePath('/form', 'layout') // Revalidate all form pages to reflect changes
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
  revalidatePath('/form', 'layout') // Revalidate all form pages to reflect changes
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

