'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { 
  JournalPageTreeNode, 
  PageBreadcrumb, 
  JournalPage,
  PageTreeResult,
  PagePathResult
} from '@/types/journal'

// ============================================================================
// TREE BUILDING HELPERS
// ============================================================================

/**
 * Build hierarchical tree from flat page list
 */
function buildPageTree(pages: PageTreeResult[]): JournalPageTreeNode[] {
  // Create a map for quick lookup
  const pageMap = new Map<string, JournalPageTreeNode>()
  
  // Initialize all pages as tree nodes
  pages.forEach(page => {
    pageMap.set(page.id, {
      id: page.id,
      title: page.title,
      icon: page.icon,
      parent_id: page.parent_id,
      sort_order: page.sort_order,
      has_children: page.has_children,
      child_count: page.child_count,
      created_at: page.created_at,
      updated_at: page.updated_at,
      children: [],
      depth: 0,
      isExpanded: false
    })
  })
  
  // Build tree by linking children to parents
  const rootPages: JournalPageTreeNode[] = []
  
  pages.forEach(page => {
    const node = pageMap.get(page.id)!
    
    if (page.parent_id && pageMap.has(page.parent_id)) {
      // Add to parent's children
      const parent = pageMap.get(page.parent_id)!
      node.depth = parent.depth + 1
      parent.children.push(node)
    } else {
      // Root page
      rootPages.push(node)
    }
  })
  
  // Sort children by sort_order within each parent
  const sortChildren = (nodes: JournalPageTreeNode[]) => {
    nodes.sort((a, b) => a.sort_order - b.sort_order)
    nodes.forEach(node => sortChildren(node.children))
  }
  sortChildren(rootPages)
  
  return rootPages
}

// ============================================================================
// PAGE TREE QUERIES
// ============================================================================

/**
 * Get full page tree for sidebar
 */
export async function getPageTree(): Promise<JournalPageTreeNode[]> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  const { data: pages, error } = await supabase
    .rpc('get_page_tree', { p_user_id: user.id }) as { data: PageTreeResult[] | null, error: any }
  
  if (error) {
    console.error('Error fetching page tree:', error)
    return []
  }
  
  return buildPageTree(pages || [])
}

/**
 * Get root pages only (parent_id IS NULL)
 */
export async function getRootPages(): Promise<JournalPageTreeNode[]> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  const { data: pages, error } = await supabase
    .rpc('get_root_pages', { p_user_id: user.id })
  
  if (error) {
    console.error('Error fetching root pages:', error)
    return []
  }
  
  // Root pages are already flat, just add tree node properties
  return (pages || []).map((page: any) => ({
    ...page,
    parent_id: null,
    children: [],
    depth: 0,
    isExpanded: false
  }))
}

// ============================================================================
// CONTENT PREVIEW HELPERS
// ============================================================================

/**
 * Strip HTML tags and truncate text for content preview
 */
function stripHtmlAndTruncate(html: string | null, maxLength: number = 150): string {
  if (!html) return ''
  // Remove HTML tags and decode common entities
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
  // Truncate with ellipsis
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

/**
 * Root page with content preview for library display
 */
export interface RootPageWithPreview {
  id: string
  title: string
  icon: string | null
  child_count: number
  updated_at: string | null
  content_preview: string
}

/**
 * Get root pages with content preview for the page library dashboard
 */
export async function getRootPagesWithPreview(): Promise<RootPageWithPreview[]> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  // Get root pages with content
  const { data: pages, error } = await supabase
    .from('journal_entries')
    .select('id, title, icon, content, updated_at')
    .eq('user_id', user.id)
    .is('parent_id', null)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
  
  if (error) {
    console.error('Error fetching root pages with preview:', error)
    return []
  }
  
  // Get child counts for each root page
  const pageIds = (pages || []).map(p => p.id)
  
  if (pageIds.length === 0) {
    return []
  }
  
  // Count children for each root page
  const { data: childCounts } = await supabase
    .from('journal_entries')
    .select('parent_id')
    .in('parent_id', pageIds)
    .is('deleted_at', null)
  
  // Build child count map
  const childCountMap = new Map<string, number>()
  ;(childCounts || []).forEach(row => {
    if (row.parent_id) {
      childCountMap.set(row.parent_id, (childCountMap.get(row.parent_id) || 0) + 1)
    }
  })
  
  // Map to result format with content preview
  return (pages || []).map(page => ({
    id: page.id,
    title: page.title || 'Untitled',
    icon: page.icon,
    child_count: childCountMap.get(page.id) || 0,
    updated_at: page.updated_at,
    content_preview: stripHtmlAndTruncate(page.content, 150)
  }))
}

/**
 * Get direct children of a page
 */
export async function getPageChildren(pageId: string): Promise<JournalPageTreeNode[]> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  const { data: children, error } = await supabase
    .rpc('get_page_children', { page_id: pageId })
  
  if (error) {
    console.error('Error fetching page children:', error)
    return []
  }
  
  return (children || []).map((child: any) => ({
    ...child,
    parent_id: pageId,
    children: [],
    depth: 0, // Will be set by parent component
    isExpanded: false
  }))
}

// ============================================================================
// SINGLE PAGE QUERIES
// ============================================================================

/**
 * Get a single page with content and direct children
 */
export async function getPage(pageId: string): Promise<JournalPage | null> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  // Get the page
  const { data: page, error: pageError } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('id', pageId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()
  
  if (pageError || !page) {
    console.error('Error fetching page:', pageError)
    return null
  }
  
  // Get direct children
  const children = await getPageChildren(pageId)
  
  // Get breadcrumbs
  const breadcrumbs = await getPageBreadcrumbs(pageId)
  
  return {
    id: page.id,
    user_id: page.user_id,
    title: page.title || 'Untitled',
    icon: page.icon,
    content: page.content,
    parent_id: page.parent_id,
    sort_order: page.sort_order || 0,
    tags: page.tags,
    mentioned_clients: page.mentioned_clients,
    mentioned_projects: page.mentioned_projects,
    mentioned_content: page.mentioned_content,
    mentioned_pages: page.mentioned_pages || null,
    is_pinned: page.is_pinned,
    is_converted: page.is_converted,
    converted_to_content_id: page.converted_to_content_id,
    created_at: page.created_at,
    updated_at: page.updated_at,
    children,
    breadcrumbs
  }
}

/**
 * Get breadcrumbs for a page (path from root to page)
 */
export async function getPageBreadcrumbs(pageId: string): Promise<PageBreadcrumb[]> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  const { data, error } = await supabase
    .rpc('get_page_path', { page_id: pageId }) as { data: PagePathResult[] | null, error: any }
  
  if (error) {
    console.error('Error fetching page path:', error)
    return []
  }
  
  return (data || []).map(item => ({
    id: item.id,
    title: item.title
  }))
}

// ============================================================================
// PAGE MUTATIONS
// ============================================================================

/**
 * Create a quick capture (fast note entry)
 * Extracts title from first line (up to 50 chars) or uses "Quick Capture"
 */
export async function createQuickCapture(content: string): Promise<{ id: string; title: string }> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  // Extract title from first line (up to 50 chars) or use "Quick Capture"
  const firstLine = content.split('\n')[0].trim()
  const title = firstLine.length > 0 
    ? firstLine.slice(0, 50) + (firstLine.length > 50 ? '...' : '')
    : 'Quick Capture'

  // Get next sort order for root pages
  const { data: lastPage } = await supabase
    .from('journal_entries')
    .select('sort_order')
    .eq('user_id', user.id)
    .is('parent_id', null)
    .is('deleted_at', null)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextSortOrder = (lastPage?.sort_order ?? -1) + 1

  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: user.id,
      title,
      content: `<p>${content.replace(/\n/g, '</p><p>')}</p>`,
      icon: '📝',
      parent_id: null,
      sort_order: nextSortOrder,
    })
    .select('id, title')
    .single()

  if (error) {
    console.error('Failed to create quick capture:', error)
    throw new Error('Failed to save capture')
  }

  revalidatePath('/dashboard/journal')
  return data
}

/**
 * Create a new page
 */
export async function createPage(
  title: string,
  parentId?: string | null,
  content?: string,
  icon?: string | null
): Promise<{ id: string }> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  // If parent specified, validate it exists and belongs to user
  if (parentId) {
    const { data: parent, error: parentError } = await supabase
      .from('journal_entries')
      .select('id, user_id')
      .eq('id', parentId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()
    
    if (parentError || !parent) {
      throw new Error('Parent page not found')
    }
    
    // Check depth limit using breadcrumbs
    const breadcrumbs = await getPageBreadcrumbs(parentId)
    if (breadcrumbs.length >= 10) {
      throw new Error('Maximum nesting depth reached (10 levels)')
    }
  }
  
  // Get max sort_order among siblings
  let sortOrderQuery = supabase
    .from('journal_entries')
    .select('sort_order')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('sort_order', { ascending: false })
    .limit(1)
  
  if (parentId) {
    sortOrderQuery = sortOrderQuery.eq('parent_id', parentId)
  } else {
    sortOrderQuery = sortOrderQuery.is('parent_id', null)
  }
  
  const { data: lastSibling } = await sortOrderQuery.single()
  const nextSortOrder = (lastSibling?.sort_order || 0) + 1
  
  // Create the page
  const { data: page, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: user.id,
      title: title || 'Untitled',
      content: content || '',
      icon: icon || null,
      parent_id: parentId || null,
      sort_order: nextSortOrder
    })
    .select('id')
    .single()
  
  if (error) {
    console.error('Error creating page:', error)
    throw new Error(error.message || 'Failed to create page')
  }
  
  revalidatePath('/dashboard/journal')
  return { id: page.id }
}

/**
 * Update page metadata (title, icon)
 */
export async function updatePageMeta(
  pageId: string,
  title: string,
  icon?: string | null
): Promise<void> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  const updates: { title: string; icon?: string | null; updated_at: string } = {
    title,
    updated_at: new Date().toISOString()
  }
  
  if (icon !== undefined) {
    updates.icon = icon
  }
  
  const { error } = await supabase
    .from('journal_entries')
    .update(updates)
    .eq('id', pageId)
    .eq('user_id', user.id)
  
  if (error) {
    console.error('Error updating page meta:', error)
    throw new Error('Failed to update page')
  }
  
  revalidatePath('/dashboard/journal')
}

/**
 * Update page content
 */
export async function updatePageContent(
  pageId: string,
  content: string
): Promise<void> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  const { error } = await supabase
    .from('journal_entries')
    .update({
      content,
      updated_at: new Date().toISOString()
    })
    .eq('id', pageId)
    .eq('user_id', user.id)
  
  if (error) {
    console.error('Error updating page content:', error)
    throw new Error('Failed to update page content')
  }
  
  revalidatePath('/dashboard/journal')
}

/**
 * Move a page to a new parent
 */
export async function movePage(
  pageId: string,
  newParentId: string | null
): Promise<void> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  // Get current page
  const { data: page, error: pageError } = await supabase
    .from('journal_entries')
    .select('id, parent_id')
    .eq('id', pageId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()
  
  if (pageError || !page) {
    throw new Error('Page not found')
  }
  
  // No change needed
  if (page.parent_id === newParentId) {
    return
  }
  
  // Validate new parent if specified
  if (newParentId) {
    const { data: newParent, error: parentError } = await supabase
      .from('journal_entries')
      .select('id')
      .eq('id', newParentId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()
    
    if (parentError || !newParent) {
      throw new Error('Target parent page not found')
    }
    
    // Check for circular reference (trigger will also catch this)
    const { data: isDescendant } = await supabase
      .rpc('is_page_descendant', {
        page_id: newParentId,
        potential_ancestor_id: pageId
      })
    
    if (isDescendant) {
      throw new Error('Cannot move page into its own descendant')
    }
    
    // Check depth limit
    const breadcrumbs = await getPageBreadcrumbs(newParentId)
    const { data: descendants } = await supabase
      .rpc('get_page_descendants', { page_id: pageId })
    
    const maxDescendantDepth = descendants?.reduce(
      (max: number, d: { depth: number }) => Math.max(max, d.depth),
      0
    ) || 0
    
    if (breadcrumbs.length + 1 + maxDescendantDepth > 10) {
      throw new Error('Move would exceed maximum nesting depth (10 levels)')
    }
  }
  
  // Get max sort_order in new location
  let sortOrderQuery = supabase
    .from('journal_entries')
    .select('sort_order')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('sort_order', { ascending: false })
    .limit(1)
  
  if (newParentId) {
    sortOrderQuery = sortOrderQuery.eq('parent_id', newParentId)
  } else {
    sortOrderQuery = sortOrderQuery.is('parent_id', null)
  }
  
  const { data: lastSibling } = await sortOrderQuery.single()
  const newSortOrder = (lastSibling?.sort_order || 0) + 1
  
  // Perform the move
  const { error: updateError } = await supabase
    .from('journal_entries')
    .update({
      parent_id: newParentId,
      sort_order: newSortOrder,
      updated_at: new Date().toISOString()
    })
    .eq('id', pageId)
    .eq('user_id', user.id)
  
  if (updateError) {
    console.error('Error moving page:', updateError)
    throw new Error(updateError.message || 'Failed to move page')
  }
  
  revalidatePath('/dashboard/journal')
}

/**
 * Reorder a page within its siblings
 */
export async function reorderPage(
  pageId: string,
  newSortOrder: number
): Promise<void> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  // Get current page
  const { data: page, error: pageError } = await supabase
    .from('journal_entries')
    .select('id, parent_id, sort_order')
    .eq('id', pageId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()
  
  if (pageError || !page) {
    throw new Error('Page not found')
  }
  
  // Get all siblings
  let siblingsQuery = supabase
    .from('journal_entries')
    .select('id, sort_order')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .neq('id', pageId)
    .order('sort_order', { ascending: true })
  
  if (page.parent_id) {
    siblingsQuery = siblingsQuery.eq('parent_id', page.parent_id)
  } else {
    siblingsQuery = siblingsQuery.is('parent_id', null)
  }
  
  const { data: siblings } = await siblingsQuery
  
  // Reorder siblings
  const updates: { id: string; sort_order: number }[] = []
  let pos = 0
  
  siblings?.forEach((sibling) => {
    if (pos === newSortOrder) {
      pos++ // Skip target position for moved page
    }
    if (sibling.sort_order !== pos) {
      updates.push({ id: sibling.id, sort_order: pos })
    }
    pos++
  })
  
  // Update sibling positions
  for (const update of updates) {
    await supabase
      .from('journal_entries')
      .update({ sort_order: update.sort_order })
      .eq('id', update.id)
  }
  
  // Update moved page
  await supabase
    .from('journal_entries')
    .update({
      sort_order: newSortOrder,
      updated_at: new Date().toISOString()
    })
    .eq('id', pageId)
  
  revalidatePath('/dashboard/journal')
}

/**
 * Delete a page (soft delete)
 * Note: Children will be cascade deleted by the database
 */
export async function deletePage(pageId: string): Promise<void> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  // Soft delete by setting deleted_at
  const { error } = await supabase
    .from('journal_entries')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', pageId)
    .eq('user_id', user.id)
  
  if (error) {
    console.error('Error deleting page:', error)
    throw new Error('Failed to delete page')
  }
  
  // Also soft delete all descendants
  const { data: descendants } = await supabase
    .rpc('get_page_descendants', { page_id: pageId })
  
  if (descendants && descendants.length > 0) {
    const descendantIds = descendants.map((d: { id: string }) => d.id)
    await supabase
      .from('journal_entries')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', descendantIds)
      .eq('user_id', user.id)
  }
  
  revalidatePath('/dashboard/journal')
}

/**
 * Duplicate a page (with optional children)
 */
export async function duplicatePage(
  pageId: string,
  includeChildren: boolean = false
): Promise<{ id: string }> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  // Get original page
  const { data: original, error: originalError } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('id', pageId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()
  
  if (originalError || !original) {
    throw new Error('Page not found')
  }
  
  // Create duplicate
  const { data: duplicate, error: duplicateError } = await supabase
    .from('journal_entries')
    .insert({
      user_id: user.id,
      title: `${original.title} (Copy)`,
      content: original.content,
      icon: original.icon,
      parent_id: original.parent_id,
      sort_order: original.sort_order + 1,
      tags: original.tags,
      mentioned_clients: original.mentioned_clients,
      mentioned_projects: original.mentioned_projects,
      mentioned_content: original.mentioned_content
    })
    .select('id')
    .single()
  
  if (duplicateError || !duplicate) {
    console.error('Error duplicating page:', duplicateError)
    throw new Error('Failed to duplicate page')
  }
  
  // Optionally duplicate children recursively
  if (includeChildren) {
    await duplicateChildrenRecursive(supabase, user.id, pageId, duplicate.id)
  }
  
  revalidatePath('/dashboard/journal')
  return { id: duplicate.id }
}

/**
 * Helper: Recursively duplicate children
 */
async function duplicateChildrenRecursive(
  supabase: any,
  userId: string,
  originalParentId: string,
  newParentId: string
): Promise<void> {
  // Get children of original
  const { data: children } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('parent_id', originalParentId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
  
  if (!children || children.length === 0) return
  
  for (const child of children) {
    // Create duplicate child
    const { data: duplicateChild } = await supabase
      .from('journal_entries')
      .insert({
        user_id: userId,
        title: child.title,
        content: child.content,
        icon: child.icon,
        parent_id: newParentId,
        sort_order: child.sort_order,
        tags: child.tags,
        mentioned_clients: child.mentioned_clients,
        mentioned_projects: child.mentioned_projects,
        mentioned_content: child.mentioned_content
      })
      .select('id')
      .single()
    
    if (duplicateChild) {
      // Recursively duplicate this child's children
      await duplicateChildrenRecursive(supabase, userId, child.id, duplicateChild.id)
    }
  }
}

// ============================================================================
// SEARCH & FILTER
// ============================================================================

/**
 * Search pages by title or content
 */
export async function searchPages(query: string): Promise<JournalPageTreeNode[]> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  if (!query.trim()) {
    return []
  }
  
  const searchTerm = `%${query.trim()}%`
  
  const { data: pages, error } = await supabase
    .from('journal_entries')
    .select('id, title, icon, parent_id, sort_order, created_at, updated_at')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
    .order('updated_at', { ascending: false })
    .limit(20)
  
  if (error) {
    console.error('Error searching pages:', error)
    return []
  }
  
  return (pages || []).map(page => ({
    id: page.id,
    title: page.title || 'Untitled',
    icon: page.icon,
    parent_id: page.parent_id,
    sort_order: page.sort_order || 0,
    has_children: false, // Not calculated in search
    child_count: 0,
    created_at: page.created_at,
    updated_at: page.updated_at,
    children: [],
    depth: 0,
    isExpanded: false
  }))
}

/**
 * Get recently updated pages
 */
export async function getRecentPages(limit: number = 10): Promise<JournalPageTreeNode[]> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  const { data: pages, error } = await supabase
    .from('journal_entries')
    .select('id, title, icon, parent_id, sort_order, created_at, updated_at')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching recent pages:', error)
    return []
  }
  
  return (pages || []).map(page => ({
    id: page.id,
    title: page.title || 'Untitled',
    icon: page.icon,
    parent_id: page.parent_id,
    sort_order: page.sort_order || 0,
    has_children: false,
    child_count: 0,
    created_at: page.created_at,
    updated_at: page.updated_at,
    children: [],
    depth: 0,
    isExpanded: false
  }))
}

/**
 * Get pinned pages
 */
export async function getPinnedPages(): Promise<JournalPageTreeNode[]> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  const { data: pages, error } = await supabase
    .from('journal_entries')
    .select('id, title, icon, parent_id, sort_order, created_at, updated_at')
    .eq('user_id', user.id)
    .eq('is_pinned', true)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching pinned pages:', error)
    return []
  }
  
  return (pages || []).map(page => ({
    id: page.id,
    title: page.title || 'Untitled',
    icon: page.icon,
    parent_id: page.parent_id,
    sort_order: page.sort_order || 0,
    has_children: false,
    child_count: 0,
    created_at: page.created_at,
    updated_at: page.updated_at,
    children: [],
    depth: 0,
    isExpanded: false
  }))
}
