'use server'

/**
 * Journal Tags Server Actions
 * 
 * QUICK CAPTURE MODAL INVESTIGATION (Feb 2026):
 * - File: components/journal/quick-capture-modal.tsx
 * - Imports from BOTH journal.ts (OLD) and journal-pages.ts (NEW)
 * - Uses createJournalEntry and getOrCreateInbox from journal.ts (OLD) to save captures
 * - Uses getPageTree from journal-pages.ts (NEW) for page mentions
 * - Migration needed separately - DO NOT FIX HERE
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ============================================================================
// GET ALL TAGS
// ============================================================================

/**
 * Get all unique tags across user's journal entries
 * Returns sorted string array
 */
export async function getAllTags(): Promise<string[]> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  // Query all unique tags using unnest
  const { data, error } = await supabase
    .from('journal_entries')
    .select('tags')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .not('tags', 'is', null)
  
  if (error) {
    console.error('Error fetching tags:', error)
    return []
  }
  
  // Extract unique tags from all entries
  const tagSet = new Set<string>()
  ;(data || []).forEach(entry => {
    if (entry.tags && Array.isArray(entry.tags)) {
      entry.tags.forEach((tag: string) => {
        if (tag && tag.trim()) {
          tagSet.add(tag.trim().toLowerCase())
        }
      })
    }
  })
  
  // Return sorted array
  return Array.from(tagSet).sort((a, b) => a.localeCompare(b))
}

// ============================================================================
// ADD TAG TO PAGE
// ============================================================================

/**
 * Add a tag to a page's tags array
 * Normalizes tag (lowercase, trim) and prevents duplicates
 */
export async function addTagToPage(pageId: string, tag: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  if (!supabase) {
    return { success: false, error: 'Database connection not configured' }
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }
  
  // Normalize tag
  const normalizedTag = tag.trim().toLowerCase()
  if (!normalizedTag) {
    return { success: false, error: 'Tag cannot be empty' }
  }
  
  // Get current page
  const { data: page, error: fetchError } = await supabase
    .from('journal_entries')
    .select('id, tags')
    .eq('id', pageId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()
  
  if (fetchError || !page) {
    return { success: false, error: 'Page not found' }
  }
  
  // Check for duplicate
  const currentTags = page.tags || []
  if (currentTags.includes(normalizedTag)) {
    return { success: true } // Already has tag, no-op success
  }
  
  // Add tag to array
  const newTags = [...currentTags, normalizedTag]
  
  const { error: updateError } = await supabase
    .from('journal_entries')
    .update({ 
      tags: newTags,
      updated_at: new Date().toISOString()
    })
    .eq('id', pageId)
    .eq('user_id', user.id)
  
  if (updateError) {
    console.error('Error adding tag:', updateError)
    return { success: false, error: 'Failed to add tag' }
  }
  
  revalidatePath('/dashboard/journal')
  return { success: true }
}

// ============================================================================
// REMOVE TAG FROM PAGE
// ============================================================================

/**
 * Remove a tag from a page's tags array
 */
export async function removeTagFromPage(pageId: string, tag: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  if (!supabase) {
    return { success: false, error: 'Database connection not configured' }
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }
  
  // Normalize tag for matching
  const normalizedTag = tag.trim().toLowerCase()
  
  // Get current page
  const { data: page, error: fetchError } = await supabase
    .from('journal_entries')
    .select('id, tags')
    .eq('id', pageId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()
  
  if (fetchError || !page) {
    return { success: false, error: 'Page not found' }
  }
  
  // Remove tag from array
  const currentTags = page.tags || []
  const newTags = currentTags.filter((t: string) => t.toLowerCase() !== normalizedTag)
  
  const { error: updateError } = await supabase
    .from('journal_entries')
    .update({ 
      tags: newTags,
      updated_at: new Date().toISOString()
    })
    .eq('id', pageId)
    .eq('user_id', user.id)
  
  if (updateError) {
    console.error('Error removing tag:', updateError)
    return { success: false, error: 'Failed to remove tag' }
  }
  
  revalidatePath('/dashboard/journal')
  return { success: true }
}

// ============================================================================
// GET PAGES BY TAG
// ============================================================================

/**
 * Get all page IDs that have a specific tag
 * Also returns parent chain IDs for proper tree display
 */
export async function getPagesByTag(tag: string): Promise<string[]> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  // Normalize tag
  const normalizedTag = tag.trim().toLowerCase()
  
  // Query pages that contain this tag
  // Using @> operator for array contains (tag = ANY(tags))
  const { data: pages, error } = await supabase
    .from('journal_entries')
    .select('id, parent_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .contains('tags', [normalizedTag])
  
  if (error) {
    console.error('Error fetching pages by tag:', error)
    return []
  }
  
  if (!pages || pages.length === 0) {
    return []
  }
  
  // Collect matching page IDs
  const matchingIds = new Set<string>(pages.map(p => p.id))
  
  // Also collect all parent IDs to ensure tree structure is maintained
  const parentIdsToFetch = new Set<string>()
  pages.forEach(p => {
    if (p.parent_id) {
      parentIdsToFetch.add(p.parent_id)
    }
  })
  
  // Recursively fetch parent chain
  while (parentIdsToFetch.size > 0) {
    const idsToQuery = Array.from(parentIdsToFetch)
    parentIdsToFetch.clear()
    
    const { data: parents } = await supabase
      .from('journal_entries')
      .select('id, parent_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .in('id', idsToQuery)
    
    if (parents) {
      parents.forEach(p => {
        matchingIds.add(p.id)
        if (p.parent_id && !matchingIds.has(p.parent_id)) {
          parentIdsToFetch.add(p.parent_id)
        }
      })
    }
  }
  
  return Array.from(matchingIds)
}

// ============================================================================
// UPDATE PAGE TAGS (BULK)
// ============================================================================

/**
 * Set all tags for a page (replaces existing tags)
 * Useful for the tag editor component
 */
export async function setPageTags(pageId: string, tags: string[]): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  if (!supabase) {
    return { success: false, error: 'Database connection not configured' }
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }
  
  // Normalize all tags
  const normalizedTags = tags
    .map(t => t.trim().toLowerCase())
    .filter(t => t.length > 0)
    .filter((t, i, arr) => arr.indexOf(t) === i) // Remove duplicates
  
  // Update page
  const { error: updateError } = await supabase
    .from('journal_entries')
    .update({ 
      tags: normalizedTags,
      updated_at: new Date().toISOString()
    })
    .eq('id', pageId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
  
  if (updateError) {
    console.error('Error setting tags:', updateError)
    return { success: false, error: 'Failed to update tags' }
  }
  
  revalidatePath('/dashboard/journal')
  return { success: true }
}
